from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class VideoStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    RENDERING = "rendering"
    READY = "ready"
    PUBLISHED = "published"
    FAILED = "failed"


class VideoAspectRatio(str, Enum):
    PORTRAIT = "9:16"
    LANDSCAPE = "16:9"
    SQUARE = "1:1"


class Video(SQLModel, table=True):
    __tablename__ = "videos"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    project_id: UUID = Field(
        foreign_key="projects.id",
        index=True,
    )

    title: str = Field(
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    script: str | None = None

    status: VideoStatus = Field(
        default=VideoStatus.DRAFT,
        index=True,
    )

    aspect_ratio: VideoAspectRatio = Field(
        default=VideoAspectRatio.PORTRAIT,
    )

    width: int = Field(
        default=1080,
    )

    height: int = Field(
        default=1920,
    )

    fps: int = Field(
        default=30,
    )

    duration_seconds: float | None = None

    output_url: str | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
