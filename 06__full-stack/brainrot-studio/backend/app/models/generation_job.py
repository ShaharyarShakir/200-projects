from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class GenerationStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationJob(SQLModel, table=True):
    __tablename__ = "generation_jobs"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        index=True,
    )

    prompt: str

    status: GenerationStatus = Field(
        default=GenerationStatus.QUEUED,
        index=True,
    )

    progress: float = Field(
        default=0.0,
    )

    error_message: str | None = None

    story_version_id: UUID | None = Field(
        default=None,
        foreign_key="story_versions.id",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    completed_at: datetime | None = None
