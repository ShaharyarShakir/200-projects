from typing import TypedDict

from app.ai.schemas.story import GeneratedStory


class StoryGenerationState(TypedDict):
    video_id: str
    user_prompt: str
    target_duration_ms: int
    tone: str
    language: str

    plan: dict | None
    story: GeneratedStory | None
    validation_errors: list[str]
    retry_count: int
    max_retries: int

    story_id: str | None
    story_version_id: str | None
    generation_job_id: str | None
