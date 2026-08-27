from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class TrackType(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    CAPTION = "caption"


class Track(SQLModel, table=True):
    __tablename__ = "tracks"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        index=True,
    )

    name: str

    track_type: TrackType

    order: int = 0

    muted: bool = False


class TrackItem(SQLModel, table=True):
    __tablename__ = "track_items"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    track_id: UUID = Field(
        foreign_key="tracks.id",
        index=True,
    )

    asset_id: UUID | None = Field(
        default=None,
        foreign_key="assets.id",
    )

    start_ms: int

    duration_ms: int

    offset_ms: int = 0
