from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Story(SQLModel, table=True):
    __tablename__ = "stories"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        unique=True,
        index=True,
    )

    title: str

    premise: str

    tone: str = Field(
        default="chaotic",
    )

    target_duration_ms: int

    language: str = Field(
        default="en",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class StoryVersion(SQLModel, table=True):
    __tablename__ = "story_versions"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    story_id: UUID = Field(
        foreign_key="stories.id",
        index=True,
    )

    version: int = Field(
        default=1,
    )

    content_json: dict = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
