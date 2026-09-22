from typing import Tuple
from urllib.parse import urlencode
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.core.errors import OAuthError
from app.core.logging import logger
from app.core.security import create_access_token, encrypt_token
from app.models.user import User, utc_now
from app.services.github import GitHubClient


class OAuthService:
    """Service handling GitHub OAuth 2.0 authorization and user provisioning."""

    GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"

    @classmethod
    def get_authorization_url(cls, state: str) -> str:
        """Construct the GitHub OAuth 2.0 redirect URL with requested scopes and state."""
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
            "scope": "read:user,repo",
            "state": state,
        }
        return f"{cls.GITHUB_AUTHORIZE_URL}?{urlencode(params)}"

    @classmethod
    async def exchange_code_for_token(cls, code: str) -> str:
        """Exchange an OAuth authorization code for a GitHub personal access token."""
        payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        }
        headers = {
            "Accept": "application/json",
            "User-Agent": "Bisect-AI-Agent",
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(cls.GITHUB_TOKEN_URL, json=payload, headers=headers)
        except httpx.RequestError as exc:
            logger.error(f"Network error exchanging OAuth code: {exc}")
            raise OAuthError(f"Network error contacting GitHub token endpoint: {exc}") from exc

        if response.is_error:
            logger.error(f"GitHub token endpoint returned HTTP {response.status_code}: {response.text}")
            raise OAuthError(f"GitHub OAuth token exchange failed with status {response.status_code}")

        data = response.json()
        if "error" in data:
            error_desc = data.get("error_description", data["error"])
            logger.error(f"GitHub OAuth error response: {error_desc}")
            raise OAuthError(f"GitHub OAuth error: {error_desc}")

        access_token = data.get("access_token")
        if not access_token:
            logger.error("GitHub token response missing access_token key")
            raise OAuthError("GitHub OAuth response missing access_token")

        return access_token

    @classmethod
    async def authenticate_github_user(
        cls,
        session: AsyncSession,
        code: str,
    ) -> Tuple[User, str]:
        """Authenticate user via OAuth code, upsert User record, and issue JWT token."""
        raw_token = await cls.exchange_code_for_token(code)
        github_client = GitHubClient(access_token=raw_token)
        github_user = await github_client.get_authenticated_user()

        encrypted_token = encrypt_token(raw_token)

        statement = select(User).where(User.github_user_id == github_user.id)
        result = await session.execute(statement)
        user = result.scalars().first()

        if user:
            user.github_username = github_user.login
            user.avatar_url = github_user.avatar_url
            user.encrypted_token = encrypted_token
            user.updated_at = utc_now()
            session.add(user)
        else:
            user = User(
                github_user_id=github_user.id,
                github_username=github_user.login,
                avatar_url=github_user.avatar_url,
                encrypted_token=encrypted_token,
            )
            session.add(user)

        await session.commit()
        await session.refresh(user)

        jwt_token = create_access_token(subject=str(user.id))
        return user, jwt_token
