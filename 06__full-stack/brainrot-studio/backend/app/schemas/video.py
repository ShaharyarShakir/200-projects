from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.video import (
    VideoAspectRatio,
    VideoStatus,
)


class VideoCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )


class VideoUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    script: str | None = None

    aspect_ratio: VideoAspectRatio | None = None

    width: int | None = Field(
        default=None,
        ge=320,
        le=4096,
    )

    height: int | None = Field(
        default=None,
        ge=320,
        le=4096,
    )

    fps: int | None = Field(
        default=None,
        ge=1,
        le=120,
    )


class VideoRead(BaseModel):
    id: UUID
    project_id: UUID

    title: str
    description: str | None
    script: str | None

    status: VideoStatus

    aspect_ratio: VideoAspectRatio

    width: int
    height: int
    fps: int

    duration_seconds: float | None
    output_url: str | None

    created_at: datetime
    updated_at: datetime
