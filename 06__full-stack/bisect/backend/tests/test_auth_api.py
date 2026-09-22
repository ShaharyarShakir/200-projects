from urllib.parse import parse_qs, urlparse
import httpx
import pytest
import respx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import create_access_token, decrypt_token
from app.models.user import User


@pytest.mark.asyncio
async def test_github_login_redirect(client: httpx.AsyncClient):
    """Verify GET /api/v1/auth/github/login redirects to GitHub and sets state cookie."""
    response = await client.get("/api/v1/auth/github/login", follow_redirects=False)

    assert response.status_code == 307
    location = response.headers.get("location")
    assert location is not None
    assert location.startswith("https://github.com/login/oauth/authorize")

    parsed_url = urlparse(location)
    query_params = parse_qs(parsed_url.query)

    assert "client_id" in query_params
    assert "redirect_uri" in query_params
    assert "scope" in query_params
    assert "state" in query_params
    assert query_params["scope"] == ["read:user,repo"]

    state_val = query_params["state"][0]
    # Check cookie
    assert "github_oauth_state" in response.cookies
    assert response.cookies["github_oauth_state"] == state_val


@pytest.mark.asyncio
@respx.mock
async def test_github_callback_success(client: httpx.AsyncClient, db_session: AsyncSession):
    """Verify successful OAuth callback provisions user and issues JWT."""
    # Mock token exchange
    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200,
        json={"access_token": "gho_test_user_token_123", "token_type": "bearer"},
    )
    # Mock user profile
    respx.get("https://api.github.com/user").respond(
        status_code=200,
        json={
            "id": 554433,
            "login": "dev-user",
            "avatar_url": "https://avatars.githubusercontent.com/u/554433",
            "email": "dev@example.com",
        },
    )

    state = "secure_random_state_123"
    client.cookies.set("github_oauth_state", state)

    response = await client.get(
        "/api/v1/auth/github/callback",
        params={"code": "valid_oauth_code", "state": state},
    )

    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["github_user_id"] == 554433
    assert data["user"]["github_username"] == "dev-user"
    assert "encrypted_token" not in data["user"]

    # Verify user saved in database with encrypted token
    stmt = select(User).where(User.github_user_id == 554433)
    res = await db_session.execute(stmt)
    user = res.scalars().first()
    assert user is not None
    assert user.github_username == "dev-user"
    assert user.encrypted_token is not None
    assert decrypt_token(user.encrypted_token) == "gho_test_user_token_123"


@pytest.mark.asyncio
async def test_github_callback_state_mismatch(client: httpx.AsyncClient):
    """Verify callback rejects request when state cookie does not match query state."""
    client.cookies.set("github_oauth_state", "original_state_value")

    response = await client.get(
        "/api/v1/auth/github/callback",
        params={"code": "some_code", "state": "tampered_state_value"},
    )
    assert response.status_code == 400
    assert "Invalid or missing OAuth state" in response.json()["detail"]


@pytest.mark.asyncio
async def test_github_callback_missing_state_cookie(client: httpx.AsyncClient):
    """Verify callback rejects request when state cookie is missing."""
    response = await client.get(
        "/api/v1/auth/github/callback",
        params={"code": "some_code", "state": "some_state"},
    )
    assert response.status_code == 400
    assert "Invalid or missing OAuth state" in response.json()["detail"]


@pytest.mark.asyncio
@respx.mock
async def test_github_callback_token_exchange_error(client: httpx.AsyncClient):
    """Verify callback handles error response from GitHub token endpoint."""
    respx.post("https://github.com/login/oauth/access_token").respond(
        status_code=200,
        json={"error": "bad_verification_code", "error_description": "The code passed is incorrect or expired."},
    )

    state = "test_state"
    client.cookies.set("github_oauth_state", state)

    response = await client.get(
        "/api/v1/auth/github/callback",
        params={"code": "expired_code", "state": state},
    )
    assert response.status_code == 400
    assert "GitHub OAuth error" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_me_authenticated(client: httpx.AsyncClient, db_session: AsyncSession):
    """Verify GET /api/v1/auth/me returns profile for authenticated user."""
    # Create test user in DB
    user = User(
        github_user_id=98765,
        github_username="me_user",
        avatar_url="https://avatar.com/me.png",
        encrypted_token="dummy_token",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    jwt_token = create_access_token(subject=user.id)

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {jwt_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(user.id)
    assert data["github_user_id"] == 98765
    assert data["github_username"] == "me_user"
    assert "encrypted_token" not in data


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: httpx.AsyncClient):
    """Verify GET /api/v1/auth/me returns 401 when no token is provided."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: httpx.AsyncClient):
    """Verify GET /api/v1/auth/me returns 401 when token is invalid."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401
