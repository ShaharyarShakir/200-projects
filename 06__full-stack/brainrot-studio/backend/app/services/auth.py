from sqlmodel import Session, select

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest


def get_user_by_email(
    session: Session,
    email: str,
) -> User | None:
    statement = select(User).where(
        User.email == email
    )

    return session.exec(statement).first()


def register_user(
    session: Session,
    data: RegisterRequest,
) -> User:
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


def authenticate_user(
    session: Session,
    email: str,
    password: str,
) -> User | None:
    user = get_user_by_email(session, email)

    if user is None:
        return None

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    return user


def create_user_token(user: User) -> str:
    return create_access_token(str(user.id))
