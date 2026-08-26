from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    owner_id: UUID = Field(
        foreign_key="users.id",
        index=True,
    )

    name: str = Field(
        index=True,
        max_length=120,
    )

    description: str | None = Field(
        default=None,
        max_length=500,
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
