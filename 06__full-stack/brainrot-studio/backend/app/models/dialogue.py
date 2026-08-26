from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel


class DialogueSegment(SQLModel, table=True):
    __tablename__ = "dialogue_segments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    scene_id: UUID = Field(foreign_key="scenes.id", index=True)
    character_name: str = Field(index=True)
    text: str
    audio_asset_id: UUID | None = Field(default=None, foreign_key="assets.id", nullable=True)
    start_ms: int | None = Field(default=0)
    duration_ms: int | None = Field(default=3000)


class VoiceProfile(SQLModel, table=True):
    __tablename__ = "voice_profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    character_name: str = Field(index=True, unique=True)
    provider: str = Field(default="local")
    voice_id: str = Field(default="default_voice")
    speed: float = Field(default=1.0)
    pitch: float = Field(default=0.0)
