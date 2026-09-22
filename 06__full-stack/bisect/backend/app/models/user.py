from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
import uuid
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.repository import Repository


def utc_now() -> datetime:
    """Return timezone-aware current UTC timestamp."""
    return datetime.now(timezone.utc)


class UserBase(SQLModel):
    """Base schema attributes for User."""

    github_user_id: int = Field(unique=True, index=True, nullable=False)
    github_username: str = Field(index=True, nullable=False)
    avatar_url: Optional[str] = Field(default=None, nullable=True)


class User(UserBase, table=True):
    """User table holding identity and repository associations."""

    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    encrypted_token: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(
        default_factory=utc_now,
        nullable=False,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Relationships
    repositories: List["Repository"] = Relationship(
        back_populates="owner",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
