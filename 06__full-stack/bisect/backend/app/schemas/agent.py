from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Normalized chat message structure."""

    role: Literal["system", "user", "assistant"] = "user"
    content: str


class CompletionRequest(BaseModel):
    """Normalized request for LLM text/chat completion."""

    messages: List[ChatMessage]
    model: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, gt=0)
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class TokenUsage(BaseModel):
    """Normalized token accounting statistics."""

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class CompletionResponse(BaseModel):
    """Normalized response returned by an AgentProvider."""

    content: str
    model: str
    usage: TokenUsage = Field(default_factory=TokenUsage)
    finish_reason: Optional[str] = None
