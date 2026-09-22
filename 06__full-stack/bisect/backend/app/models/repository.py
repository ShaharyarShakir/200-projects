from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
import uuid
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import utc_now

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.run import Run


class RepositoryBase(SQLModel):
    """Base schema attributes for Repository."""

    github_repo_id: int = Field(unique=True, index=True, nullable=False)
    full_name: str = Field(index=True, nullable=False)
    default_branch: str = Field(default="main", nullable=False)
    clone_url: str = Field(nullable=False)
    is_private: bool = Field(default=False, nullable=False)


class Repository(RepositoryBase, table=True):
    """Repository table storing connected GitHub repository metadata."""

    __tablename__ = "repositories"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    owner_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
    )
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(
        default_factory=utc_now,
        nullable=False,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Relationships
    owner: Optional["User"] = Relationship(back_populates="repositories")
    runs: List["Run"] = Relationship(
        back_populates="repository",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
