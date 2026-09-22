from typing import Optional
from app.core.config import settings
from app.core.errors import AgentConfigurationError
from app.services.agent.base import AgentProvider
from app.services.agent.groq import GroqProvider

__all__ = [
    "AgentProvider",
    "GroqProvider",
    "get_agent_provider",
]


def get_agent_provider(
    provider_name: str = "groq",
    api_key: Optional[str] = None,
    default_model: Optional[str] = None,
) -> AgentProvider:
    """Factory function returning the configured AgentProvider."""
    provider_key = provider_name.lower().strip()
    if provider_key == "groq":
        return GroqProvider(api_key=api_key, default_model=default_model)
    else:
        raise AgentConfigurationError(
            message=f"Unsupported agent provider: '{provider_name}'",
            provider=provider_name,
        )
