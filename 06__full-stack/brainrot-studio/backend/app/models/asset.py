from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class AssetType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FONT = "font"
    OTHER = "other"


class AssetStatus(str, Enum):
    UPLOADING = "uploading"
    READY = "ready"
    FAILED = "failed"
    DELETED = "deleted"


class AssetProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class AssetPurpose(str, Enum):
    ORIGINAL = "original"
    THUMBNAIL = "thumbnail"
    PREVIEW = "preview"
    PROXY = "proxy"
    WAVEFORM = "waveform"
    RENDER = "render"
    VOICE = "voice"



class Asset(SQLModel, table=True):
    __tablename__ = "assets"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        index=True,
    )

    scene_id: UUID | None = Field(
        default=None,
        foreign_key="scenes.id",
        index=True,
    )

    filename: str = Field(
        max_length=255,
    )

    object_key: str = Field(
        unique=True,
        index=True,
    )

    content_type: str = Field(
        max_length=100,
    )

    asset_type: AssetType = Field(
        index=True,
    )

    size_bytes: int

    status: AssetStatus = Field(
        default=AssetStatus.READY,
        index=True,
    )

    processing_status: AssetProcessingStatus = Field(
        default=AssetProcessingStatus.PENDING,
        index=True,
    )

    processing_error: str | None = None

    purpose: AssetPurpose = Field(
        default=AssetPurpose.ORIGINAL,
        index=True,
    )

    parent_asset_id: UUID | None = Field(
        default=None,
        foreign_key="assets.id",
        index=True,
    )

    source: str | None = Field(
        default="upload",
        max_length=50,
    )

    width: int | None = None

    height: int | None = None

    duration_seconds: float | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc
        ),
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(
            timezone.utc
        ),
        nullable=False,
    )
