from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.asset import (
    AssetProcessingStatus,
    AssetPurpose,
    AssetStatus,
    AssetType,
)


class AssetRead(BaseModel):
    id: UUID

    video_id: UUID

    scene_id: UUID | None

    filename: str

    content_type: str

    asset_type: AssetType

    size_bytes: int

    status: AssetStatus

    processing_status: AssetProcessingStatus

    processing_error: str | None = None

    purpose: AssetPurpose

    parent_asset_id: UUID | None = None

    source: str | None = None

    width: int | None = None
    height: int | None = None
    duration_seconds: float | None = None

    thumbnail_url: str | None = None

    created_at: datetime
    updated_at: datetime


class AssetUpdate(BaseModel):
    scene_id: UUID | None = None


class AssetUrlResponse(BaseModel):
    url: str
