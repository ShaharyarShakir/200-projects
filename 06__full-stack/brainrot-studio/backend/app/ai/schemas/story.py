from pydantic import BaseModel, Field


class DialogueLine(BaseModel):
    character: str
    text: str


class SceneCharacter(BaseModel):
    name: str
    role: str


class SceneVisual(BaseModel):
    description: str
    location: str
    mood: str


class GeneratedScene(BaseModel):
    scene_number: int
    duration_ms: int = Field(
        default=5000,
        ge=500,
        le=20000,
    )
    purpose: str
    visual_description: str
    visual_intent: SceneVisual | None = None
    characters: list[SceneCharacter] = []
    dialogue: list[DialogueLine] = []
    caption: str


class GeneratedStory(BaseModel):
    title: str
    hook: str
    premise: str
    tone: str = "chaotic"
    target_duration_ms: int = 30000
    scenes: list[GeneratedScene]
