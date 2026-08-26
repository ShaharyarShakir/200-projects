from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class MediaJobType(str, Enum):
    PROBE = "probe"
    THUMBNAIL = "thumbnail"
    PREVIEW = "preview"
    WAVEFORM = "waveform"


class MediaJobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MediaJob(SQLModel, table=True):
    __tablename__ = "media_jobs"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    asset_id: UUID = Field(
        foreign_key="assets.id",
        index=True,
    )

    job_type: MediaJobType

    status: MediaJobStatus = Field(
        default=MediaJobStatus.PENDING,
        index=True,
    )

    attempts: int = Field(
        default=0
    )

    error: str | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc
        ),
        nullable=False,
    )

    started_at: datetime | None = None

    completed_at: datetime | None = None
