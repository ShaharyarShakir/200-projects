from abc import ABC, abstractmethod
from app.schemas.agent import CompletionRequest, CompletionResponse


class AgentProvider(ABC):
    """Abstract interface for LLM completion providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name identifier."""
        pass

    @abstractmethod
    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        """Generate a completion for the given request."""
        pass
