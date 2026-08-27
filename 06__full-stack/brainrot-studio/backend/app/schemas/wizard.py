from uuid import UUID
from pydantic import BaseModel, Field


class CharacterAssetRead(BaseModel):
    id: UUID
    character_id: str
    asset_type: str
    expression: str
    image_url: str


class CharacterRead(BaseModel):
    id: str
    name: str
    show_name: str | None = None
    image_url: str
    avatar: str
    tier: str
    assets: list[CharacterAssetRead] = []


class NicheRead(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None = None
    icon: str = "🎬"


class GeneratedTopicSchema(BaseModel):
    id: UUID | None = None
    title: str = Field(description="Catchy title for the Short")
    hook: str = Field(description="Initial hook or opening premise")
    premise: str = Field(description="Core narrative summary")
    estimated_duration: int = Field(default=35, description="Duration in seconds")
    characters: list[str] = Field(default=[], description="List of character IDs involved")


class DialogueLineSchema(BaseModel):
    character_id: str = Field(description="Character ID or name speaking")
    text: str = Field(description="Dialogue line spoken")


class ScriptSceneSchema(BaseModel):
    scene_number: int
    visual_description: str = Field(description="Detailed visual direction for canvas background")
    dialogue: list[DialogueLineSchema] = Field(default=[])
    duration_seconds: float = Field(default=6.0)


class GeneratedScriptSchema(BaseModel):
    id: UUID | None = None
    title: str
    hook: str
    scenes: list[ScriptSceneSchema]
    estimated_duration: float = Field(default=35.0)


class VideoStyleConfigSchema(BaseModel):
    layout: str = Field(default="centered", description="Layout preset e.g. centered, classic, top_caption, character_dialogue")
    font_family: str = Field(default="Inter", description="Font family name e.g. Inter, Impact, Outfit")
    font_size: int = Field(default=72, description="Font size in px")
    primary_color: str = Field(default="#FFFFFF", description="Hex text color")
    outline_color: str = Field(default="#000000", description="Hex outline color")
    outline_width: int = Field(default=4, description="Outline width in px")
    animation: str = Field(default="pop", description="Subtitle animation style e.g. pop, fade, bounce")
    position: str = Field(default="center", description="Position on screen")


class CreateSessionRequest(BaseModel):
    project_id: UUID | None = None


class UpdateSessionRequest(BaseModel):
    current_step: int | None = None
    character_ids: list[str] | None = None
    niche: str | None = None


class SelectTopicRequest(BaseModel):
    topic_id: UUID


class RegenerateSceneRequest(BaseModel):
    instruction: str = Field(description="Instruction on how to regenerate this specific scene")


class GenerateStyleRequest(BaseModel):
    prompt: str = Field(description="Natural language prompt describing the desired video style")
