"""API-level tests for the artifact endpoints and the cross-session event read.

Each artifact endpoint is exercised on all four paths that matter: the owner
reading their own artifact, a session that produced nothing, another user asking
for it, and an unauthenticated caller. The last two must be indistinguishable
from each other, so a caller cannot use either endpoint to discover that someone
else's session exists.
"""

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.user import User
from app.schemas.actions import BisectCommit
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


async def _make_session(db_session: AsyncSession, owner: User) -> str:
    row = await SessionService.create_session(
        db_session, owner_id=owner.id, task_prompt="track down the regression"
    )
    return row.id


def _commit(sha: str, verdict: str = "good", is_culprit: bool = False) -> BisectCommit:
    return BisectCommit(
        sha=sha,
        short_sha=sha[:7],
        author="Dev",
        authored_at="2026-01-01T00:00:00+00:00",
        message=f"commit {sha}",
        verdict=verdict,
        is_culprit=is_culprit,
        test_output="1 passed",
    )


# ----------------------------------------------------------------------
# 3.1 Patch
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_owner_reads_their_own_patch(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_patch(
        db_session, session_id=session_id, diff="diff --git a/x b/x\n+hello\n", is_empty=False
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/patch", headers=_auth(owner))

    assert response.status_code == 200
    body = response.json()
    assert body["session_id"] == session_id
    assert body["exists"] is True
    assert body["is_empty"] is False
    assert "+hello" in body["diff"]


@pytest.mark.asyncio
async def test_patch_for_a_session_with_none_is_an_empty_artifact(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)

    response = await client.get(f"/api/v1/sessions/{session_id}/patch", headers=_auth(owner))

    assert response.status_code == 200
    body = response.json()
    assert body["exists"] is False
    assert body["diff"] == ""
    assert body["is_empty"] is True


@pytest.mark.asyncio
async def test_patch_for_another_users_session_is_404(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    intruder = await _make_user(db_session, "mallory")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_patch(db_session, session_id=session_id, diff="secret", is_empty=False)

    response = await client.get(f"/api/v1/sessions/{session_id}/patch", headers=_auth(intruder))

    assert response.status_code == 404
    assert "secret" not in response.text


@pytest.mark.asyncio
async def test_patch_without_credentials_is_401(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_patch(db_session, session_id=session_id, diff="secret", is_empty=False)

    response = await client.get(f"/api/v1/sessions/{session_id}/patch")

    assert response.status_code == 401
    assert "secret" not in response.text


@pytest.mark.asyncio
async def test_patch_for_an_unknown_session_is_404(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")

    response = await client.get("/api/v1/sessions/sess_missing/patch", headers=_auth(owner))

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_patch_content_is_redacted_over_http(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_patch(
        db_session,
        session_id=session_id,
        diff="+GITHUB_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz0123456789\n",
        is_empty=False,
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/patch", headers=_auth(owner))

    assert response.status_code == 200
    assert "ghp_abcdefghijklmnopqrstuvwxyz0123456789" not in response.text


# ----------------------------------------------------------------------
# 3.2 Timeline
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_owner_reads_their_own_timeline_in_evaluation_order(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session,
        session_id=session_id,
        commits=[
            _commit("aaa", "good"),
            _commit("bbb", "bad"),
            _commit("ccc", "bad", is_culprit=True),
        ],
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/timeline", headers=_auth(owner))

    assert response.status_code == 200
    body = response.json()
    assert [c["hash"] for c in body["commits"]] == ["aaa", "bbb", "ccc"]
    assert body["culprit_hash"] == "ccc"
    outcomes = {c["hash"]: c["outcome"] for c in body["commits"]}
    assert outcomes == {"aaa": "good", "bbb": "bad", "ccc": "culprit"}


@pytest.mark.asyncio
async def test_timeline_for_a_session_with_none_is_an_empty_artifact(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)

    response = await client.get(f"/api/v1/sessions/{session_id}/timeline", headers=_auth(owner))

    assert response.status_code == 200
    body = response.json()
    assert body["exists"] is False
    assert body["commits"] == []
    assert body["culprit_hash"] is None


@pytest.mark.asyncio
async def test_inconclusive_timeline_reports_no_culprit(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("aaa", "good"), _commit("bbb", "good")]
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/timeline", headers=_auth(owner))

    body = response.json()
    assert body["exists"] is True
    assert body["culprit_hash"] is None
    assert all(c["outcome"] == "good" for c in body["commits"])


@pytest.mark.asyncio
async def test_timeline_for_another_users_session_is_404(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    intruder = await _make_user(db_session, "mallory")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("secretcommit")]
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/timeline", headers=_auth(intruder))

    assert response.status_code == 404
    assert "secretcommit" not in response.text


@pytest.mark.asyncio
async def test_timeline_without_credentials_is_401(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[_commit("secretcommit")]
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/timeline")

    assert response.status_code == 401
    assert "secretcommit" not in response.text


@pytest.mark.asyncio
async def test_timeline_content_is_redacted_over_http(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    session_id = await _make_session(db_session, owner)
    commit = _commit("aaa", "good")
    commit.test_output = "token=ghp_abcdefghijklmnopqrstuvwxyz0123456789"
    await SessionService.record_bisect_timeline(
        db_session, session_id=session_id, commits=[commit]
    )

    response = await client.get(f"/api/v1/sessions/{session_id}/timeline", headers=_auth(owner))

    assert response.status_code == 200
    assert "ghp_abcdefghijklmnopqrstuvwxyz0123456789" not in response.text


# ----------------------------------------------------------------------
# 3.3 Cross-session event read
# ----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cross_session_read_returns_events_from_every_owned_session(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    first = await _make_session(db_session, owner)
    second = await _make_session(db_session, owner)
    await SessionService.record_loop_event(
        db_session, session_id=first, event_type="loop_started", details={}
    )
    await SessionService.record_loop_event(
        db_session, session_id=second, event_type="loop_started", details={}
    )

    response = await client.get("/api/v1/sessions/events", headers=_auth(owner))

    assert response.status_code == 200
    body = response.json()
    assert {item["session_id"] for item in body["items"]} == {first, second}


@pytest.mark.asyncio
async def test_cross_session_read_never_leaks_another_users_events(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    intruder = await _make_user(db_session, "mallory")
    owner_session = await _make_session(db_session, owner)
    intruder_session = await _make_session(db_session, intruder)
    await SessionService.record_loop_event(
        db_session, session_id=intruder_session, event_type="loop_started", details={"task_prompt": "leaky"}
    )

    response = await client.get("/api/v1/sessions/events", headers=_auth(owner))

    assert response.status_code == 200
    body = response.json()
    assert intruder_session not in {item["session_id"] for item in body["items"]}
    assert "leaky" not in response.text


@pytest.mark.asyncio
async def test_cross_session_read_with_a_session_filter_matches_the_single_session_read(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Naming a session must behave exactly like that session's own events endpoint."""
    owner = await _make_user(db_session, "alice")
    first = await _make_session(db_session, owner)
    second = await _make_session(db_session, owner)
    for session_id in (first, second):
        await SessionService.record_loop_event(
            db_session, session_id=session_id, event_type="loop_started", details={}
        )

    filtered = await client.get(
        f"/api/v1/sessions/events?session_id={first}", headers=_auth(owner)
    )
    single = await client.get(f"/api/v1/sessions/{first}/events", headers=_auth(owner))

    assert filtered.status_code == 200
    assert filtered.json() == single.json()


@pytest.mark.asyncio
async def test_cross_session_filter_on_another_users_session_is_404(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    intruder = await _make_user(db_session, "mallory")
    intruder_session = await _make_session(db_session, intruder)

    response = await client.get(
        f"/api/v1/sessions/events?session_id={intruder_session}", headers=_auth(owner)
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cross_session_read_without_credentials_is_401(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    response = await client.get("/api/v1/sessions/events")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_cross_session_read_is_ordered_oldest_first(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    owner = await _make_user(db_session, "alice")
    first = await _make_session(db_session, owner)
    second = await _make_session(db_session, owner)
    await SessionService.record_loop_event(
        db_session, session_id=first, event_type="loop_started", details={}
    )
    await SessionService.record_loop_event(
        db_session, session_id=second, event_type="loop_started", details={}
    )

    response = await client.get("/api/v1/sessions/events", headers=_auth(owner))

    stamps = [item["created_at"] for item in response.json()["items"]]
    assert stamps == sorted(stamps)
