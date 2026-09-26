from typing import Any, Dict, Optional
from groq import APIError, APITimeoutError, AsyncGroq, AuthenticationError, RateLimitError

from app.core.config import settings
from app.core.errors import (
    AgentAuthenticationError,
    AgentConfigurationError,
    AgentProviderError,
    AgentRateLimitError,
    AgentTimeoutError,
)
from app.schemas.agent import CompletionRequest, CompletionResponse, TokenUsage
from app.services.agent.base import AgentProvider


class GroqProvider(AgentProvider):
    """LLM completion provider using the Groq API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: Optional[str] = None,
        client: Optional[AsyncGroq] = None,
    ) -> None:
        self._api_key = api_key or settings.GROQ_API_KEY
        self._default_model = default_model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"

        if not self._api_key:
            raise AgentConfigurationError(
                message="GROQ_API_KEY is not configured or is empty.",
                provider="groq",
            )

        self._client = client or AsyncGroq(api_key=self._api_key)

    @property
    def name(self) -> str:
        return "groq"

    @property
    def default_model(self) -> str:
        return self._default_model

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Execute chat completion against Groq API with normalized request/response contracts."""
        model = request.model or self._default_model
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        kwargs: Dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        if request.temperature is not None:
            kwargs["temperature"] = request.temperature
        if request.max_tokens is not None:
            kwargs["max_tokens"] = request.max_tokens
        if request.top_p is not None:
            kwargs["top_p"] = request.top_p

        try:
            response = await self._client.chat.completions.create(**kwargs)
        except AuthenticationError as e:
            raise AgentAuthenticationError(
                message=f"Groq authentication failed: {getattr(e, 'message', str(e))}",
                provider="groq",
            ) from e
        except RateLimitError as e:
            retry_after = getattr(e, "retry_after", None)
            raise AgentRateLimitError(
                message=f"Groq rate limit exceeded: {getattr(e, 'message', str(e))}",
                retry_after=retry_after,
                provider="groq",
            ) from e
        except APITimeoutError as e:
            raise AgentTimeoutError(
                message=f"Groq request timed out: {getattr(e, 'message', str(e))}",
                provider="groq",
            ) from e
        except APIError as e:
            raise AgentProviderError(
                message=f"Groq API error: {getattr(e, 'message', str(e))}",
                upstream_status_code=getattr(e, "status_code", 500),
                provider="groq",
            ) from e
        except Exception as e:
            raise AgentProviderError(
                message=f"Unexpected error communicating with Groq: {str(e)}",
                upstream_status_code=500,
                provider="groq",
            ) from e

        choice = response.choices[0] if response.choices else None
        content = choice.message.content or "" if choice and choice.message else ""
        finish_reason = choice.finish_reason if choice else None

        usage = TokenUsage()
        if response.usage:
            usage = TokenUsage(
                prompt_tokens=response.usage.prompt_tokens or 0,
                completion_tokens=response.usage.completion_tokens or 0,
                total_tokens=response.usage.total_tokens or 0,
            )

        return CompletionResponse(
            content=content,
            model=response.model or model,
            usage=usage,
            finish_reason=finish_reason,
        )
