from uuid import UUID

from pydantic import BaseModel, Field

from app.models.scene import TransitionType
from app.models.scene_asset import SceneAssetRole
from app.models.track import TrackType


class CompositionRead(BaseModel):
    id: UUID
    video_id: UUID
    width: int
    height: int
    fps: int
    duration_ms: int


class CompositionUpdate(BaseModel):
    width: int | None = Field(default=None, ge=100)
    height: int | None = Field(default=None, ge=100)
    fps: int | None = Field(default=None, ge=1)


class SceneAssetCreate(BaseModel):
    asset_id: UUID
    role: SceneAssetRole
    start_ms: int = 0
    duration_ms: int | None = None
    z_index: int = 0
    x: float = 0.5
    y: float = 0.5
    scale: float = 1.0
    rotation: float = 0.0
    opacity: float = 1.0


class SceneAssetUpdate(BaseModel):
    role: SceneAssetRole | None = None
    start_ms: int | None = None
    duration_ms: int | None = None
    z_index: int | None = None
    x: float | None = None
    y: float | None = None
    scale: float | None = None
    rotation: float | None = None
    opacity: float | None = None


class SceneAssetRead(BaseModel):
    id: UUID
    scene_id: UUID
    asset_id: UUID
    role: SceneAssetRole
    start_ms: int
    duration_ms: int | None
    z_index: int
    x: float
    y: float
    scale: float
    rotation: float
    opacity: float


class SceneReadWithAssets(BaseModel):
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
    assets: list[SceneAssetRead] = []


class TrackItemRead(BaseModel):
    id: UUID
    track_id: UUID
    asset_id: UUID | None
    start_ms: int
    duration_ms: int
    offset_ms: int


class TrackItemCreate(BaseModel):
    asset_id: UUID | None = None
    start_ms: int
    duration_ms: int
    offset_ms: int = 0


class TrackRead(BaseModel):
    id: UUID
    video_id: UUID
    name: str
    track_type: TrackType
    order: int
    muted: bool
    items: list[TrackItemRead] = []


class TrackCreate(BaseModel):
    name: str
    track_type: TrackType
    order: int = 0
    muted: bool = False


class CaptionRead(BaseModel):
    id: UUID
    video_id: UUID
    text: str
    start_ms: int
    end_ms: int
    style: str


class CaptionCreate(BaseModel):
    text: str
    start_ms: int
    end_ms: int
    style: str = "default"


class TimelineRead(BaseModel):
    composition: CompositionRead
    scenes: list[SceneReadWithAssets]
    tracks: list[TrackRead]
    captions: list[CaptionRead]


class SceneReorderRequest(BaseModel):
    scene_ids: list[UUID]
