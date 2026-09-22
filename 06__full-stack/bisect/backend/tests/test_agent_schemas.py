import pytest
from pydantic import ValidationError
from app.schemas.agent import ChatMessage, CompletionRequest, CompletionResponse, TokenUsage


def test_chat_message_schema() -> None:
    msg = ChatMessage(role="user", content="Hello")
    assert msg.role == "user"
    assert msg.content == "Hello"

    # Default role
    msg_default = ChatMessage(content="Test")
    assert msg_default.role == "user"

    # Invalid role
    with pytest.raises(ValidationError):
        ChatMessage(role="invalid", content="Test")  # type: ignore


def test_completion_request_schema() -> None:
    req = CompletionRequest(
        messages=[
            ChatMessage(role="system", content="You are a helpful assistant."),
            ChatMessage(role="user", content="Explain Python."),
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1000,
        top_p=0.9,
    )
    assert len(req.messages) == 2
    assert req.temperature == 0.7
    assert req.max_tokens == 1000

    # Invalid temperature
    with pytest.raises(ValidationError):
        CompletionRequest(
            messages=[ChatMessage(content="Hi")],
            temperature=2.5,
        )

    # Invalid max_tokens
    with pytest.raises(ValidationError):
        CompletionRequest(
            messages=[ChatMessage(content="Hi")],
            max_tokens=-10,
        )


def test_completion_response_schema() -> None:
    usage = TokenUsage(prompt_tokens=10, completion_tokens=20, total_tokens=30)
    res = CompletionResponse(
        content="Here is the response",
        model="llama-3.3-70b-versatile",
        usage=usage,
        finish_reason="stop",
    )
    assert res.content == "Here is the response"
    assert res.model == "llama-3.3-70b-versatile"
    assert res.usage.total_tokens == 30
    assert res.finish_reason == "stop"
