import uuid
import httpx
import pytest
import respx
from sqlalchemy.ext.asyncio import AsyncSession

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
