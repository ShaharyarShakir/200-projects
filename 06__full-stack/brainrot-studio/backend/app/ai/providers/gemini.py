import logging
from typing import Type, TypeVar
from pydantic import BaseModel

from google import genai
from google.genai import types

from app.ai.providers.base import LLMProvider

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class GeminiProvider:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model
        self.client = genai.Client(api_key=api_key) if api_key else None

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: str | None = None,
    ) -> T:
        if not self.client:
            raise ValueError("Gemini API key is not configured.")

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.7,
        )
        if system_prompt:
            config.system_instruction = system_prompt

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=config,
        )

        if not response.text:
            raise ValueError("Empty response received from Gemini API.")

        return schema.model_validate_json(response.text)
