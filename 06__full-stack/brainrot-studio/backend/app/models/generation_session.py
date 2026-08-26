from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel


class StepState(str, Enum):
    CHARACTER_SELECTION = "CHARACTER_SELECTION"
    NICHE_SELECTION = "NICHE_SELECTION"
    TOPIC_SELECTION = "TOPIC_SELECTION"
    SCRIPT_GENERATION = "SCRIPT_GENERATION"
    EDITOR = "EDITOR"
    RENDERING = "RENDERING"
    COMPLETE = "COMPLETE"


class GenerationSession(SQLModel, table=True):
    __tablename__ = "generation_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    video_id: UUID | None = Field(default=None, foreign_key="videos.id", index=True)
    project_id: UUID | None = Field(default=None, foreign_key="projects.id", index=True)

    status: StepState = Field(default=StepState.CHARACTER_SELECTION)
    current_step: int = Field(default=1)

    niche: str | None = Field(default=None)
    selected_topic_id: UUID | None = Field(default=None, foreign_key="generated_topics.id")
    script_id: UUID | None = Field(default=None, foreign_key="generated_scripts.id")
    style_config_json: str | None = Field(default=None)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GenerationSessionCharacter(SQLModel, table=True):
    __tablename__ = "generation_session_characters"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="generation_sessions.id", index=True)
    character_id: str = Field(foreign_key="characters.id", index=True)


class GeneratedTopic(SQLModel, table=True):
    __tablename__ = "generated_topics"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="generation_sessions.id", index=True)

    title: str
    hook: str
    premise: str
    estimated_duration: int = Field(default=35)
    characters_json: str = Field(default="[]")  # JSON list of character IDs

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GeneratedScript(SQLModel, table=True):
    __tablename__ = "generated_scripts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    session_id: UUID = Field(foreign_key="generation_sessions.id", index=True)
    topic_id: UUID | None = Field(default=None, foreign_key="generated_topics.id")

    title: str
    hook: str
    scenes_json: str = Field(default="[]")  # JSON list of ScriptScene dicts
    estimated_duration: float = Field(default=35.0)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
