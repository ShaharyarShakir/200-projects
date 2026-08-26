from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class SceneAssetRole(str, Enum):
    BACKGROUND = "background"
    CHARACTER = "character"
    PROP = "prop"
    AUDIO = "audio"
    MUSIC = "music"
    VOICE = "voice"
    OVERLAY = "overlay"


class SceneAsset(SQLModel, table=True):
    __tablename__ = "scene_assets"

    id: UUID = Field(
        default_factory=uuid4,
        primary_key=True,
    )

    scene_id: UUID = Field(
        foreign_key="scenes.id",
        index=True,
    )

    asset_id: UUID = Field(
        foreign_key="assets.id",
        index=True,
    )

    role: SceneAssetRole

    start_ms: int = 0

    duration_ms: int | None = None

    z_index: int = 0

    x: float = 0.5
    y: float = 0.5

    scale: float = 1.0

    rotation: float = 0.0

    opacity: float = 1.0
