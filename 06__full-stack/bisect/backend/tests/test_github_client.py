import pytest
import respx

from app.core.errors import (
    GitHubAPIError,
    GitHubAuthError,
    GitHubNotFoundError,
    GitHubRateLimitError,
)
from app.services.github import GitHubClient


@pytest.mark.asyncio
@respx.mock
async def test_get_authenticated_user_success():
    """Verify get_authenticated_user parses user profile on HTTP 200."""
    respx.get("https://api.github.com/user").respond(
        status_code=200,
        json={
            "id": 123456,
            "login": "octocat",
            "avatar_url": "https://github.com/images/error/octocat_happy.gif",
            "email": "octocat@github.com",
            "name": "monalisa octocat",
        },
    )

    client = GitHubClient(access_token="gho_test_token")
    user = await client.get_authenticated_user()

    assert user.id == 123456
    assert user.login == "octocat"
    assert user.avatar_url == "https://github.com/images/error/octocat_happy.gif"
    assert user.email == "octocat@github.com"


@pytest.mark.asyncio
@respx.mock
async def test_get_authenticated_user_unauthorized():
    """Verify HTTP 401 raises GitHubAuthError."""
    respx.get("https://api.github.com/user").respond(
        status_code=401,
        json={"message": "Bad credentials"},
    )

    client = GitHubClient(access_token="invalid_token")
    with pytest.raises(GitHubAuthError) as exc_info:
        await client.get_authenticated_user()

    assert exc_info.value.status_code == 401
    assert "Bad credentials" in str(exc_info.value)


@pytest.mark.asyncio
@respx.mock
async def test_get_authenticated_user_rate_limit():
    """Verify HTTP 403 with Retry-After raises GitHubRateLimitError."""
    respx.get("https://api.github.com/user").respond(
        status_code=403,
        headers={"Retry-After": "60"},
        json={"message": "API rate limit exceeded"},
    )

    client = GitHubClient(access_token="gho_test_token")
    with pytest.raises(GitHubRateLimitError) as exc_info:
        await client.get_authenticated_user()

    assert exc_info.value.status_code == 403
    assert exc_info.value.retry_after == 60
    assert "rate limit exceeded" in str(exc_info.value)


@pytest.mark.asyncio
@respx.mock
async def test_list_repositories():
    """Verify list_repositories fetches and parses repositories list."""
    respx.get("https://api.github.com/user/repos").respond(
        status_code=200,
        json=[
            {
                "id": 101,
                "name": "repo-one",
                "full_name": "octocat/repo-one",
                "private": False,
                "default_branch": "main",
                "clone_url": "https://github.com/octocat/repo-one.git",
                "description": "First test repo",
                "owner": {"id": 123456, "login": "octocat"},
            },
            {
                "id": 102,
                "name": "repo-two",
                "full_name": "octocat/repo-two",
                "private": True,
                "default_branch": "master",
                "clone_url": "https://github.com/octocat/repo-two.git",
                "description": "Second test repo",
                "owner": {"id": 123456, "login": "octocat"},
            },
        ],
    )

    client = GitHubClient(access_token="gho_test_token")
    repos = await client.list_repositories(page=1, per_page=10)

    assert len(repos) == 2
    assert repos[0].id == 101
    assert repos[0].full_name == "octocat/repo-one"
    assert repos[0].is_private is False
    assert repos[1].id == 102
    assert repos[1].is_private is True


@pytest.mark.asyncio
@respx.mock
async def test_list_all_repositories_pagination():
    """Verify list_all_repositories paginates until results are exhausted."""
    # Page 1: full page of 100 items (mock with 100)
    page1 = [
        {
            "id": i,
            "name": f"repo-{i}",
            "full_name": f"octocat/repo-{i}",
            "private": False,
            "default_branch": "main",
            "clone_url": f"https://github.com/octocat/repo-{i}.git",
        }
        for i in range(1, 101)
    ]
    # Page 2: partial page with 1 item
    page2 = [
        {
            "id": 101,
            "name": "repo-101",
            "full_name": "octocat/repo-101",
            "private": False,
            "default_branch": "main",
            "clone_url": "https://github.com/octocat/repo-101.git",
        }
    ]

    respx.get("https://api.github.com/user/repos", params__contains={"page": "1"}).respond(
        status_code=200, json=page1
    )
    respx.get("https://api.github.com/user/repos", params__contains={"page": "2"}).respond(
        status_code=200, json=page2
    )

    client = GitHubClient(access_token="gho_test_token")
    all_repos = await client.list_all_repositories()

    assert len(all_repos) == 101
    assert all_repos[0].id == 1
    assert all_repos[-1].id == 101


@pytest.mark.asyncio
@respx.mock
async def test_get_repository_success():
    """Verify get_repository fetches details for a specific repository."""
    respx.get("https://api.github.com/repos/octocat/hello-world").respond(
        status_code=200,
        json={
            "id": 999,
            "name": "hello-world",
            "full_name": "octocat/hello-world",
            "private": False,
            "default_branch": "main",
            "clone_url": "https://github.com/octocat/hello-world.git",
            "description": "Hello World demo",
            "owner": {"id": 123456, "login": "octocat"},
        },
    )

    client = GitHubClient(access_token="gho_test_token")
    repo = await client.get_repository("octocat", "hello-world")

    assert repo.id == 999
    assert repo.full_name == "octocat/hello-world"
    assert repo.default_branch == "main"


@pytest.mark.asyncio
@respx.mock
async def test_get_repository_not_found():
    """Verify HTTP 404 raises GitHubNotFoundError."""
    respx.get("https://api.github.com/repos/octocat/missing-repo").respond(
        status_code=404,
        json={"message": "Not Found"},
    )

    client = GitHubClient(access_token="gho_test_token")
    with pytest.raises(GitHubNotFoundError):
        await client.get_repository("octocat", "missing-repo")
