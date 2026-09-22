from typing import Annotated, Optional
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_session
from app.core.errors import BisectError
from app.core.logging import logger
from app.core.security import generate_oauth_state, verify_oauth_state
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.schemas.user import UserRead
from app.services.auth import OAuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get(
    "/github/login",
    summary="Initiate GitHub OAuth 2.0 login",
    response_class=RedirectResponse,
    status_code=status.HTTP_307_TEMPORARY_REDIRECT,
)
async def github_login() -> RedirectResponse:
    """Generate CSRF state, set HTTP-only cookie, and redirect to GitHub authorization URL."""
    state = generate_oauth_state()
    auth_url = OAuthService.get_authorization_url(state=state)

    response = RedirectResponse(
        url=auth_url,
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )
    # Set state cookie for stateless CSRF verification
    response.set_cookie(
        key="github_oauth_state",
        value=state,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=600,  # 10 minutes
        path="/",
    )
    return response


@router.get(
    "/github/callback",
    summary="Handle GitHub OAuth callback",
    response_model=TokenResponse,
)
async def github_callback(
    code: Annotated[str, Query(description="OAuth authorization code returned by GitHub")],
    state: Annotated[str, Query(description="OAuth state parameter returned by GitHub")],
    session: Annotated[AsyncSession, Depends(get_session)],
    github_oauth_state: Annotated[Optional[str], Cookie(description="CSRF state cookie")] = None,
) -> JSONResponse:
    """Verify CSRF state cookie, exchange code for access token, and return JWT session token."""
    if not verify_oauth_state(state, github_oauth_state):
        logger.warning(f"OAuth state mismatch: query state={state}, cookie state={github_oauth_state}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or missing OAuth state parameter",
        )

    try:
        user, jwt_token = await OAuthService.authenticate_github_user(session=session, code=code)
    except BisectError as exc:
        logger.error(f"GitHub authentication error: {exc.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        )
    except Exception as exc:
        logger.error(f"Unexpected error during GitHub OAuth callback: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate with GitHub",
        )

    user_read = UserRead.model_validate(user)
    token_response = TokenResponse(
        access_token=jwt_token,
        token_type="bearer",
        user=user_read,
    )

    response = JSONResponse(content=token_response.model_dump(mode="json"))
    # Clear the OAuth state cookie
    response.delete_cookie(key="github_oauth_state", path="/")
    return response


@router.get(
    "/me",
    summary="Get current user profile",
    response_model=UserRead,
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserRead:
    """Return profile attributes of the authenticated user without exposing credentials."""
    return UserRead.model_validate(current_user)
