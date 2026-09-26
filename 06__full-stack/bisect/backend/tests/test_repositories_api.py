import uuid
import httpx
import pytest
import respx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import create_access_token, encrypt_token
from app.models.repository import Repository
from app.models.user import User


@pytest.mark.asyncio
@respx.mock
async def test_sync_repositories_success(client: httpx.AsyncClient, db_session: AsyncSession):
    """Verify POST /api/v1/repositories/sync synchronizes repos from GitHub into DB."""
    # Seed user with encrypted token
    user = User(
        github_user_id=11111,
        github_username="sync_user",
        avatar_url="https://avatar.com/sync.png",
        encrypted_token=encrypt_token("gho_valid_token_abc"),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Mock GitHub repos endpoint
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200,
        json=[
            {
                "id": 901,
                "name": "project-alpha",
                "full_name": "sync_user/project-alpha",
                "private": False,
                "default_branch": "main",
                "clone_url": "https://github.com/sync_user/project-alpha.git",
                "description": "Alpha project",
            },
            {
                "id": 902,
                "name": "project-beta",
                "full_name": "sync_user/project-beta",
                "private": True,
                "default_branch": "develop",
                "clone_url": "https://github.com/sync_user/project-beta.git",
                "description": "Beta project",
            },
        ],
    )

    token = create_access_token(subject=user.id)
    response = await client.post(
        "/api/v1/repositories/sync",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["synced_count"] == 2
    assert len(data["repositories"]) == 2
    assert data["repositories"][0]["full_name"] == "sync_user/project-alpha"
    assert data["repositories"][1]["full_name"] == "sync_user/project-beta"
    assert data["repositories"][1]["is_private"] is True


@pytest.mark.asyncio
async def test_sync_repositories_missing_token(client: httpx.AsyncClient, db_session: AsyncSession):
    """Verify POST /api/v1/repositories/sync returns 400 when user has no stored token."""
    user = User(
        github_user_id=22222,
        github_username="no_token_user",
        encrypted_token=None,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(subject=user.id)
    response = await client.post(
        "/api/v1/repositories/sync",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "GitHub account is not connected" in response.json()["detail"]


@pytest.mark.asyncio
async def test_list_repositories_pagination_and_isolation(
    client: httpx.AsyncClient,
    db_session: AsyncSession,
):
    """Verify GET /api/v1/repositories lists user repos with pagination and tenant isolation."""
    # User 1
    user1 = User(github_user_id=301, github_username="user1")
    # User 2 (different owner)
    user2 = User(github_user_id=302, github_username="user2")
    db_session.add_all([user1, user2])
    await db_session.commit()
    await db_session.refresh(user1)
    await db_session.refresh(user2)

    # 3 repos for user1
    for i in range(1, 4):
        repo = Repository(
            github_repo_id=1000 + i,
            full_name=f"user1/repo-{i}",
            default_branch="main",
            clone_url=f"https://github.com/user1/repo-{i}.git",
            is_private=False,
            owner_id=user1.id,
        )
        db_session.add(repo)

    # 1 repo for user2
    foreign_repo = Repository(
        github_repo_id=2001,
        full_name="user2/foreign-repo",
        default_branch="main",
        clone_url="https://github.com/user2/foreign-repo.git",
        is_private=False,
        owner_id=user2.id,
    )
    db_session.add(foreign_repo)
    await db_session.commit()

    token1 = create_access_token(subject=user1.id)

    # Query with limit=2, offset=0
    res = await client.get(
        "/api/v1/repositories?limit=2&offset=0",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["limit"] == 2
    assert data["offset"] == 0
    # Foreign repo should not be visible
    assert all("user1" in item["full_name"] for item in data["items"])

    # Query page 2: limit=2, offset=2
    res_page2 = await client.get(
        "/api/v1/repositories?limit=2&offset=2",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res_page2.status_code == 200
    data2 = res_page2.json()
    assert data2["total"] == 3
    assert len(data2["items"]) == 1


@pytest.mark.asyncio
async def test_get_repository_by_id(client: httpx.AsyncClient, db_session: AsyncSession):
    """Verify GET /api/v1/repositories/{id} retrieves details and enforces ownership."""
    user = User(github_user_id=401, github_username="owner_user")
    other_user = User(github_user_id=402, github_username="other_user")
    db_session.add_all([user, other_user])
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(other_user)

    repo = Repository(
        github_repo_id=4001,
        full_name="owner_user/my-repo",
        default_branch="main",
        clone_url="https://github.com/owner_user/my-repo.git",
        is_private=False,
        owner_id=user.id,
    )
    db_session.add(repo)
    await db_session.commit()
    await db_session.refresh(repo)

    token = create_access_token(subject=user.id)
    other_token = create_access_token(subject=other_user.id)

    # Happy path
    res = await client.get(
        f"/api/v1/repositories/{repo.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == str(repo.id)
    assert res.json()["full_name"] == "owner_user/my-repo"

    # Foreign user isolation: 404
    res_foreign = await client.get(
        f"/api/v1/repositories/{repo.id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert res_foreign.status_code == 404

    # Non-existent UUID: 404
    random_id = uuid.uuid4()
    res_missing = await client.get(
        f"/api/v1/repositories/{random_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res_missing.status_code == 404


# --- sync correctness and atomicity (OpenSpec group 6) ---


def _gh_repo(repo_id: int, name: str, **overrides) -> dict:
    """A minimal GitHub API repository payload."""
    payload = {
        "id": repo_id,
        "name": name,
        "full_name": f"shared/{name}",
        "private": False,
        "default_branch": "main",
        "clone_url": f"https://github.com/shared/{name}.git",
    }
    payload.update(overrides)
    return payload


async def _make_user(db_session: AsyncSession, github_user_id: int, username: str) -> User:
    user = User(
        github_user_id=github_user_id,
        github_username=username,
        encrypted_token=encrypt_token(f"gho_token_{github_user_id}"),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
@respx.mock
async def test_repeated_sync_updates_in_place_without_duplicating(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A second sync by the same user must update, not insert a duplicate row."""
    user = await _make_user(db_session, 11111, "repeat_user")
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(555, "alpha")]
    )
    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}

    first = await client.post("/api/v1/repositories/sync", headers=headers)
    assert first.status_code == 200
    assert first.json()["synced_count"] == 1

    # GitHub reports a renamed project on the next sync.
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(555, "alpha", full_name="shared/alpha-renamed")]
    )
    second = await client.post("/api/v1/repositories/sync", headers=headers)
    assert second.status_code == 200
    assert second.json()["synced_count"] == 1
    assert second.json()["repositories"][0]["full_name"] == "shared/alpha-renamed"

    listed = await client.get("/api/v1/repositories", headers=headers)
    assert listed.json()["total"] == 1, "the same repo must not be duplicated"


@pytest.mark.asyncio
@respx.mock
async def test_two_users_syncing_the_same_repo_get_separate_rows(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """Cross-user isolation: shared access, separate rows, no ownership transfer."""
    user_a = await _make_user(db_session, 20001, "user_a")
    user_b = await _make_user(db_session, 20002, "user_b")

    respx.get("https://api.github.com/user/repos").respond(
        status_code=200, json=[_gh_repo(777, "shared-project")]
    )

    headers_a = {"Authorization": f"Bearer {create_access_token(subject=user_a.id)}"}
    headers_b = {"Authorization": f"Bearer {create_access_token(subject=user_b.id)}"}

    res_a = await client.post("/api/v1/repositories/sync", headers=headers_a)
    assert res_a.status_code == 200
    original_id = res_a.json()["repositories"][0]["id"]

    res_b = await client.post("/api/v1/repositories/sync", headers=headers_b)
    assert res_b.status_code == 200
    new_id = res_b.json()["repositories"][0]["id"]

    assert original_id != new_id, "user B must get its own row, not user A's"

    # Two rows exist in total.
    rows = (
        await db_session.execute(
            select(Repository).where(Repository.github_repo_id == 777)
        )
    ).scalars().all()
    assert len(rows) == 2
    assert {str(r.owner_id) for r in rows} == {str(user_a.id), str(user_b.id)}

    # Each user sees only their own row.
    for headers, user in ((headers_a, user_a), (headers_b, user_b)):
        listed = await client.get("/api/v1/repositories", headers=headers)
        body = listed.json()
        assert body["total"] == 1
        assert body["items"][0]["github_repo_id"] == 777

    # User A's row is untouched by user B's sync.
    listed_a = await client.get("/api/v1/repositories", headers=headers_a)
    assert listed_a.json()["items"][0]["id"] == original_id
    assert listed_a.json()["items"][0]["full_name"] == "shared/shared-project"


@pytest.mark.asyncio
@respx.mock
async def test_sync_of_a_user_with_no_repos_commits_nothing(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """An empty GitHub list is a valid, no-op sync."""
    user = await _make_user(db_session, 30001, "empty_user")
    respx.get("https://api.github.com/user/repos").respond(status_code=200, json=[])

    token = create_access_token(subject=user.id)
    response = await client.post(
        "/api/v1/repositories/sync", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["synced_count"] == 0
    assert body["repositories"] == []

    rows = (await db_session.execute(select(Repository))).scalars().all()
    assert rows == []


@pytest.mark.asyncio
@respx.mock
async def test_exhausted_rate_limit_surfaces_as_429(
    client: httpx.AsyncClient, db_session: AsyncSession, monkeypatch
):
    """A rate limit during sync must reach the client as 429, not 400 or 502."""
    import app.services.github as github_module

    async def no_sleep(delay: float) -> None:
        return None

    monkeypatch.setattr(github_module.asyncio, "sleep", no_sleep)

    user = await _make_user(db_session, 40001, "rate_limited_user")
    route = respx.get("https://api.github.com/user/repos").respond(
        status_code=403,
        json={"message": "API rate limit exceeded"},
        headers={"X-RateLimit-Remaining": "0"},
    )

    token = create_access_token(subject=user.id)
    response = await client.post(
        "/api/v1/repositories/sync", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 429
    assert route.call_count > 1, "the rate limit should have been retried"

    body = response.json()
    assert "rate limit" in body["detail"].lower()
    assert body["code"] == "GitHubRateLimitError"


@pytest.mark.asyncio
@respx.mock
async def test_permission_error_surfaces_as_502(
    client: httpx.AsyncClient, db_session: AsyncSession
):
    """A permission denial is a gateway problem, not a client-side 4xx."""
    user = await _make_user(db_session, 50001, "forbidden_user")
    route = respx.get("https://api.github.com/user/repos").respond(
        status_code=403, json={"message": "Resource not accessible"}
    )

    token = create_access_token(subject=user.id)
    response = await client.post(
        "/api/v1/repositories/sync", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 502
    assert route.call_count == 1, "a permission denial must not be retried"
    assert response.json()["code"] == "GitHubPermissionError"
