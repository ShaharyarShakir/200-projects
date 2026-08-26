from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserRead,
)
from app.services.auth import (
    authenticate_user,
    create_user_token,
    get_user_by_email,
    register_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    session: Session = Depends(get_db),
):
    existing_user = get_user_by_email(
        session,
        data.email,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    return register_user(
        session,
        data,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    session: Session = Depends(get_db),
):
    user = authenticate_user(
        session,
        data.email,
        data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return TokenResponse(
        access_token=create_user_token(user),
    )


@router.get(
    "/me",
    response_model=UserRead,
)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user
