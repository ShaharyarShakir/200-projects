from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.scene import TransitionType


class SceneCreate(BaseModel):
    title: str | None = None
    description: str | None = None
    narration: str | None = None
    visual_prompt: str | None = None
    dialogue: str | None = None
    duration_ms: int = Field(default=4000, ge=100)
    duration_seconds: float | None = Field(default=None, ge=0)
    transition_in: TransitionType = TransitionType.CUT


class SceneUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    narration: str | None = None
    visual_prompt: str | None = None
    dialogue: str | None = None
    order: int | None = None
    start_ms: int | None = Field(default=None, ge=0)
    duration_ms: int | None = Field(default=None, ge=100)
    duration_seconds: float | None = Field(default=None, ge=0)
    transition_in: TransitionType | None = None


class SceneRead(BaseModel):
    id: UUID
    video_id: UUID
    order: int
    position: int
    start_ms: int
    duration_ms: int
    title: str | None
    description: str | None
    narration: str | None
    visual_prompt: str | None
    dialogue: str | None
    transition_in: TransitionType
    duration_seconds: float | None
    asset_url: str | None
    created_at: datetime
    updated_at: datetime
