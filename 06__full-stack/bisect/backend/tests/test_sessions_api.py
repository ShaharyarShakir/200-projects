"""API-level tests for the session endpoints: auth, validation, scoping, feed."""

import logging
import uuid

import httpx
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import create_access_token
from app.main import app
from app.models.repository import Repository
from app.models.user import User
from app.services.session import SessionService


async def _make_user(db_session: AsyncSession, username: str) -> User:
    user = User(
        github_user_id=abs(hash(username)) % 100000,
        github_username=username,
        avatar_url=f"https://avatar.com/{username}.png",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


def _auth(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(subject=user.id)}"}


async def _owned_repo(db_session: AsyncSession, user: User, github_repo_id: int) -> Repository:
    repo = Repository(
        github_repo_id=github_repo_id,
        full_name=f"{user.github_username}/repo-{github_repo_id}",
        default_branch="main",
        clone_url=f"https://github.com/{user.github_username}/repo-{github_repo_id}.git",
        is_private=False,
        owner_id=user.id,
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)
    return repo


# ----------------------------------------------------------------------
# 3.1 Create
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_session_returns_201_and_created_status(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """An authenticated create stores the session and reports status created."""
    user = await _make_user(db_session, "alice")

    response = await client.post(
        "/api/v1/sessions",
        json={"task_prompt": "fix the failing test"},
        headers=_auth(user),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "created"
    assert body["task_prompt"] == "fix the failing test"
    assert body["owner_id"] == str(user.id)
    assert body["repository_id"] is None
    assert body["steps"] == []


@pytest.mark.asyncio
async def test_create_session_persists_the_row(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """The created session is readable by a later request."""
    user = await _make_user(db_session, "alice")

    created = await client.post(
        "/api/v1/sessions",
        json={"task_prompt": "survive the request"},
        headers=_auth(user),
    )
    session_id = created.json()["id"]

    reread = await client.get(f"/api/v1/sessions/{session_id}", headers=_auth(user))

    assert reread.status_code == 200
    assert reread.json()["id"] == session_id
    assert reread.json()["task_prompt"] == "survive the request"


@pytest.mark.asyncio
async def test_create_session_records_a_creation_event(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A new session's feed already contains its creation event."""
    user = await _make_user(db_session, "alice")

    created = await client.post(
        "/api/v1/sessions",
        json={"task_prompt": "record my arrival"},
        headers=_auth(user),
    )
    session_id = created.json()["id"]

    feed = await client.get(f"/api/v1/sessions/{session_id}/events", headers=_auth(user))

    assert feed.status_code == 200
    assert [item["event_type"] for item in feed.json()["items"]] == ["session_created"]
    assert feed.json()["items"][0]["category"] == "system"


@pytest.mark.asyncio
async def test_create_session_attaches_an_owned_repository(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A repository the caller owns is accepted and recorded on the session."""
    user = await _make_user(db_session, "alice")
    repo = await _owned_repo(db_session, user, 9001)

    response = await client.post(
        "/api/v1/sessions",
        json={"task_prompt": "work on this repo", "repository_id": str(repo.id)},
        headers=_auth(user),
    )

    assert response.status_code == 201
    assert response.json()["repository_id"] == str(repo.id)


@pytest.mark.asyncio
async def test_create_session_rejects_empty_prompt(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """An empty prompt is a validation failure and stores nothing."""
    user = await _make_user(db_session, "alice")

    response = await client.post(
        "/api/v1/sessions", json={"task_prompt": ""}, headers=_auth(user)
    )

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "ValidationError"
    assert "task_prompt" in body["detail"]
    assert await SessionService.list_sessions(db_session, owner_id=user.id) == ([], 0)


@pytest.mark.asyncio
async def test_create_session_rejects_whitespace_only_prompt(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A prompt of only spaces is rejected, not silently accepted."""
    user = await _make_user(db_session, "alice")

    response = await client.post(
        "/api/v1/sessions", json={"task_prompt": "    \t  "}, headers=_auth(user)
    )

    assert response.status_code == 422
    assert response.json()["code"] == "ValidationError"


@pytest.mark.asyncio
async def test_create_session_rejects_unowned_repository(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Another user's repository_id is an invalid field, not a 404."""
    alice = await _make_user(db_session, "alice")
    mallory = await _make_user(db_session, "mallory")
    mallory_repo = await _owned_repo(db_session, mallory, 4242)

    response = await client.post(
        "/api/v1/sessions",
        json={"task_prompt": "not my repo", "repository_id": str(mallory_repo.id)},
        headers=_auth(alice),
    )

    assert response.status_code == 422
    assert response.json()["code"] == "InvalidRequestError"
    assert "repository_id" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_session_rejects_unknown_repository(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A repository id that resolves to nothing is rejected the same way."""
    user = await _make_user(db_session, "alice")

    response = await client.post(
        "/api/v1/sessions",
        json={"task_prompt": "ghost repo", "repository_id": str(uuid.uuid4())},
        headers=_auth(user),
    )

    assert response.status_code == 422
    assert response.json()["code"] == "InvalidRequestError"


@pytest.mark.asyncio
async def test_create_session_rejects_unauthenticated(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """An unauthenticated create is rejected and stores nothing."""
    user = await _make_user(db_session, "alice")

    response = await client.post("/api/v1/sessions", json={"task_prompt": "anonymous"})

    assert response.status_code == 401
    rows, total = await SessionService.list_sessions(db_session, owner_id=user.id)
    assert total == 0


# ----------------------------------------------------------------------
# 3.2 List and get
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_sessions_returns_only_caller_sessions(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Listing is owner scoped."""
    alice = await _make_user(db_session, "alice")
    mallory = await _make_user(db_session, "mallory")
    for prompt in ("one", "two"):
        await client.post("/api/v1/sessions", json={"task_prompt": prompt}, headers=_auth(alice))
    await client.post("/api/v1/sessions", json={"task_prompt": "theirs"}, headers=_auth(mallory))

    response = await client.get("/api/v1/sessions", headers=_auth(alice))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert {item["task_prompt"] for item in body["items"]} == {"one", "two"}


@pytest.mark.asyncio
async def test_list_sessions_empty_for_new_user(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A user with no sessions gets an empty page, not an error."""
    user = await _make_user(db_session, "newcomer")

    response = await client.get("/api/v1/sessions", headers=_auth(user))

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "limit": 20, "offset": 0}


@pytest.mark.asyncio
async def test_list_sessions_paginates(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Limit and offset page the caller's sessions and report the total."""
    user = await _make_user(db_session, "alice")
    for index in range(5):
        await client.post(
            "/api/v1/sessions", json={"task_prompt": f"task {index}"}, headers=_auth(user)
        )

    first = await client.get("/api/v1/sessions?limit=2&offset=0", headers=_auth(user))
    second = await client.get("/api/v1/sessions?limit=2&offset=2", headers=_auth(user))

    assert first.json()["total"] == 5
    assert len(first.json()["items"]) == 2
    assert second.json()["limit"] == 2
    assert second.json()["offset"] == 2
    assert not {i["id"] for i in first.json()["items"]} & {i["id"] for i in second.json()["items"]}


@pytest.mark.asyncio
async def test_list_sessions_filters_by_status(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """The status query parameter narrows the list."""
    user = await _make_user(db_session, "alice")
    created = await client.post(
        "/api/v1/sessions", json={"task_prompt": "pending"}, headers=_auth(user)
    )
    session_id = created.json()["id"]
    agent_session_row = await SessionService.get_session(db_session, session_id, user.id)
    agent_session_row.status = "completed"
    await db_session.commit()

    response = await client.get("/api/v1/sessions?status=completed", headers=_auth(user))

    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == session_id


@pytest.mark.asyncio
async def test_list_sessions_rejects_unauthenticated(client: httpx.AsyncClient):
    """Listing requires authentication."""
    response = await client.get("/api/v1/sessions")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_session_unknown_id_returns_not_found(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """An unknown id is a 404 with the standard envelope."""
    user = await _make_user(db_session, "alice")

    response = await client.get(f"/api/v1/sessions/{uuid.uuid4().hex}", headers=_auth(user))

    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "NotFoundError"
    assert body["detail"] == "Session not found"


@pytest.mark.asyncio
async def test_get_session_of_another_user_returns_not_found(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Another user's session is reported identically to a missing one."""
    alice = await _make_user(db_session, "alice")
    mallory = await _make_user(db_session, "mallory")
    created = await client.post(
        "/api/v1/sessions", json={"task_prompt": "alice's work"}, headers=_auth(alice)
    )
    session_id = created.json()["id"]

    unowned = await client.get(f"/api/v1/sessions/{session_id}", headers=_auth(mallory))
    missing = await client.get(f"/api/v1/sessions/{uuid.uuid4().hex}", headers=_auth(mallory))

    assert unowned.status_code == 404
    # Byte-identical bodies, so the endpoint discloses nothing.
    assert unowned.json() == missing.json()


@pytest.mark.asyncio
async def test_get_session_rejects_unauthenticated(client: httpx.AsyncClient):
    """Reading a session requires authentication."""
    response = await client.get(f"/api/v1/sessions/{uuid.uuid4().hex}")

    assert response.status_code == 401


# ----------------------------------------------------------------------
# 3.3 Events
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_events_empty_for_session_with_no_events(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A session with no events returns an empty collection, not a 404."""
    user = await _make_user(db_session, "alice")
    row = await SessionService.create_session(
        db_session, owner_id=user.id, task_prompt="no events yet"
    )

    response = await client.get(f"/api/v1/sessions/{row.id}/events", headers=_auth(user))

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["last_sequence"] is None


@pytest.mark.asyncio
async def test_events_are_returned_in_ascending_sequence(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """The feed reads oldest first."""
    user = await _make_user(db_session, "alice")
    row = await SessionService.create_session(db_session, owner_id=user.id, task_prompt="ordered")
    for iteration in range(1, 4):
        await SessionService.record_loop_event(
            db_session, session_id=row.id, event_type="iteration_started",
            details={"iteration": iteration},
        )

    response = await client.get(f"/api/v1/sessions/{row.id}/events", headers=_auth(user))

    items = response.json()["items"]
    assert [item["sequence"] for item in items] == [1, 2, 3]
    assert [item["payload"]["iteration"] for item in items] == [1, 2, 3]


@pytest.mark.asyncio
async def test_events_after_sequence_excludes_seen_events(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """after_sequence is exclusive so a poller can resume incrementally."""
    user = await _make_user(db_session, "alice")
    row = await SessionService.create_session(db_session, owner_id=user.id, task_prompt="polled")
    for _ in range(4):
        await SessionService.record_event(db_session, session_id=row.id, event_type="iteration_started")

    response = await client.get(
        f"/api/v1/sessions/{row.id}/events?after_sequence=2", headers=_auth(user)
    )

    body = response.json()
    assert [item["sequence"] for item in body["items"]] == [3, 4]
    assert body["after_sequence"] == 2
    assert body["last_sequence"] == 4


@pytest.mark.asyncio
async def test_events_paginate(client: httpx.AsyncClient, db_session: AsyncSession):
    """limit bounds the page and total reports how many remain unread."""
    user = await _make_user(db_session, "alice")
    row = await SessionService.create_session(db_session, owner_id=user.id, task_prompt="paged feed")
    for _ in range(5):
        await SessionService.record_event(db_session, session_id=row.id, event_type="iteration_started")

    response = await client.get(
        f"/api/v1/sessions/{row.id}/events?limit=2", headers=_auth(user)
    )

    body = response.json()
    assert len(body["items"]) == 2
    assert body["total"] == 5
    assert body["limit"] == 2


@pytest.mark.asyncio
async def test_events_of_unknown_session_returns_not_found(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """The events endpoint applies the same ownership check as the session."""
    user = await _make_user(db_session, "alice")

    response = await client.get(
        f"/api/v1/sessions/{uuid.uuid4().hex}/events", headers=_auth(user)
    )

    assert response.status_code == 404
    assert response.json()["code"] == "NotFoundError"


@pytest.mark.asyncio
async def test_events_of_another_user_returns_not_found(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Another user's feed is not readable."""
    alice = await _make_user(db_session, "alice")
    mallory = await _make_user(db_session, "mallory")
    created = await client.post(
        "/api/v1/sessions", json={"task_prompt": "alice's feed"}, headers=_auth(alice)
    )

    response = await client.get(
        f"/api/v1/sessions/{created.json()['id']}/events", headers=_auth(mallory)
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_events_reject_unauthenticated(client: httpx.AsyncClient):
    """Reading a feed requires authentication."""
    response = await client.get(f"/api/v1/sessions/{uuid.uuid4().hex}/events")

    assert response.status_code == 401


# ----------------------------------------------------------------------
# 3.4 Failure envelope
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_error_responses_carry_detail_and_code_only(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Failure bodies hold exactly detail and code, never a traceback."""
    user = await _make_user(db_session, "alice")

    not_found = await client.get(f"/api/v1/sessions/{uuid.uuid4().hex}", headers=_auth(user))
    validation = await client.post(
        "/api/v1/sessions", json={"task_prompt": ""}, headers=_auth(user)
    )

    for response in (not_found, validation):
        assert set(response.json()) == {"detail", "code"}
        assert "Traceback" not in response.text
        assert "File \"" not in response.text


@pytest.mark.asyncio
async def test_injected_internal_fault_returns_generic_detail(
    db_session: AsyncSession, monkeypatch, caplog
):
    """An unexpected fault surfaces as a fixed body with no internal detail."""
    user = await _make_user(db_session, "alice")

    async def boom(*args, **kwargs):
        raise RuntimeError("connection string postgres://user:hunter2@db/prod")

    monkeypatch.setattr(SessionService, "load_sessions_read", boom)

    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    # raise_app_exceptions=False because Starlette's ServerErrorMiddleware sends
    # the handler's response and then re-raises so the server can log it; that
    # re-raise is what a real client would never see.
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as raw:
            with caplog.at_level(logging.ERROR, logger="bisect"):
                response = await raw.get("/api/v1/sessions", headers=_auth(user))
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.json() == {
        "detail": "An internal server error occurred",
        "code": "InternalServerError",
    }
    # The fault's own message, including the credential, must not leak to the client.
    assert "hunter2" not in response.text
    assert "Traceback" not in response.text
    # ...but the fault is recorded in the log, with its traceback.
    assert "Traceback" in caplog.text
    assert "RuntimeError" in caplog.text
    assert "hunter2" in caplog.text


@pytest.mark.asyncio
async def test_unauthenticated_error_responses_use_the_envelope(
    client: httpx.AsyncClient,
):
    """Auth failures are domain errors and use the same envelope shape."""
    response = await client.get("/api/v1/sessions")

    assert response.status_code == 401
    assert "code" in response.json()
    assert "detail" in response.json()
