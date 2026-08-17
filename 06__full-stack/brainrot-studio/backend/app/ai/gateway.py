import logging
from typing import Any, Type, TypeVar
from pydantic import BaseModel

from app.ai.config import AISettings, ai_settings
from app.ai.providers.base import LLMProvider
from app.ai.providers.gemini import GeminiProvider
from app.ai.providers.ollama import OllamaProvider

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def create_ai_provider(
    settings: AISettings | None = None,
    provider_override: str | None = None,
) -> LLMProvider:
    cfg = settings or ai_settings
    provider_name = (provider_override or cfg.provider).lower()

    if provider_name == "gemini":
        if not cfg.gemini_api_key:
            logger.warning("Gemini API key missing in settings; falling back to OllamaProvider.")
            return OllamaProvider(base_url=cfg.ollama_base_url, model=cfg.ollama_model)
        return GeminiProvider(api_key=cfg.gemini_api_key, model=cfg.gemini_model)

    if provider_name == "ollama":
        return OllamaProvider(base_url=cfg.ollama_base_url, model=cfg.ollama_model)

    raise ValueError(f"Unknown AI provider specified: {provider_name}")


class AIGateway:
    def __init__(
        self,
        provider: LLMProvider | None = None,
        settings: AISettings | None = None,
        provider_override: str | None = None,
    ):
        self.settings = settings or ai_settings
        self.provider = provider or create_ai_provider(self.settings, provider_override=provider_override)


    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: str | None = None,
        prompt_version: str = "v1",
    ) -> tuple[T, dict[str, Any]]:
        provider_type = "gemini" if isinstance(self.provider, GeminiProvider) else "ollama"
        model_name = (
            getattr(self.provider, "model", None)
            or getattr(self.provider, "model_name", None)
            or "unknown"
        )

        metadata = {
            "provider": provider_type,
            "model": str(model_name),
            "temperature": 0.7,
            "prompt_version": prompt_version,
        }

        try:
            result = await self.provider.generate_structured(
                prompt=prompt,
                schema=schema,
                system_prompt=system_prompt,
            )
            return result, metadata
        except Exception as exc:
            logger.warning(f"AI Provider ({provider_type}) failed: {exc}. Attempting Ollama fallback...")
            if not isinstance(self.provider, OllamaProvider):
                fallback_provider = OllamaProvider(
                    base_url=self.settings.ollama_base_url,
                    model=self.settings.ollama_model,
                )
                try:
                    res = await fallback_provider.generate_structured(
                        prompt=prompt,
                        schema=schema,
                        system_prompt=system_prompt,
                    )
                    metadata["provider"] = "ollama_fallback"
                    metadata["model"] = self.settings.ollama_model
                    return res, metadata
                except Exception as fallback_exc:
                    logger.error(f"Fallback provider also failed: {fallback_exc}")

            raise exc
