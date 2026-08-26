from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class TransitionType(str, Enum):
    CUT = "cut"
    FADE = "fade"
    SLIDE = "slide"
    ZOOM = "zoom"


class Scene(SQLModel, table=True):
    __tablename__ = "scenes"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    video_id: UUID = Field(
        foreign_key="videos.id",
        index=True,
    )

    order: int = Field(
        default=0,
        index=True,
    )

    position: int = Field(
        default=0,
        index=True,
    )

    start_ms: int = Field(
        default=0,
    )

    duration_ms: int = Field(
        default=4000,
    )

    title: str | None = None
    description: str | None = None

    narration: str | None = None
    visual_prompt: str | None = None
    dialogue: str | None = None

    transition_in: TransitionType = Field(
        default=TransitionType.CUT,
    )

    duration_seconds: float | None = None
    asset_url: str | None = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
