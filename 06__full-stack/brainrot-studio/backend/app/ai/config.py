import os
from pydantic import Field
from pydantic_settings import BaseSettings


class AISettings(BaseSettings):
    provider: str = "ollama"  # "ollama" or "gemini"
    gemini_api_key: str = Field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", os.getenv("AI_GEMINI_API_KEY", ""))
    )

    gemini_model: str = "gemini-2.5-flash"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:0.5b"

    class Config:
        env_prefix = "AI_"
        extra = "ignore"


ai_settings = AISettings()

