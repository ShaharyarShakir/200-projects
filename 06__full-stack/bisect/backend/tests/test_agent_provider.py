from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from groq import APIError, APITimeoutError, AuthenticationError, RateLimitError
import httpx

from app.core.config import settings
from app.core.errors import (
    AgentAuthenticationError,
    AgentConfigurationError,
    AgentProviderError,
    AgentRateLimitError,
    AgentTimeoutError,
)
from app.schemas.agent import ChatMessage, CompletionRequest
from app.services.agent import GroqProvider, get_agent_provider


@pytest.fixture
def mock_groq_client() -> MagicMock:
    client = MagicMock()
    client.chat = MagicMock()
    client.chat.completions = MagicMock()
    client.chat.completions.create = AsyncMock()
    return client


def create_mock_groq_response(
    content: str = "Test response",
    model: str = "llama-3.3-70b-versatile",
    prompt_tokens: int = 15,
    completion_tokens: int = 25,
    finish_reason: str = "stop",
) -> MagicMock:
    response = MagicMock()
    response.model = model

    choice = MagicMock()
    choice.message = MagicMock()
    choice.message.content = content
    choice.finish_reason = finish_reason
    response.choices = [choice]

    usage = MagicMock()
    usage.prompt_tokens = prompt_tokens
    usage.completion_tokens = completion_tokens
    usage.total_tokens = prompt_tokens + completion_tokens
    response.usage = usage

    return response


@pytest.mark.asyncio
async def test_groq_provider_missing_api_key() -> None:
    with patch.object(settings, "GROQ_API_KEY", None):
        with pytest.raises(AgentConfigurationError) as exc_info:
            GroqProvider(api_key=None)
        assert "GROQ_API_KEY is not configured" in str(exc_info.value.message)


@pytest.mark.asyncio
async def test_groq_provider_successful_completion(mock_groq_client: MagicMock) -> None:
    mock_response = create_mock_groq_response(
        content="AI generated test response",
        model="llama-3.3-70b-versatile",
        prompt_tokens=20,
        completion_tokens=40,
    )
    mock_groq_client.chat.completions.create.return_value = mock_response

    provider = GroqProvider(api_key="gsk_test_key", client=mock_groq_client)
    assert provider.name == "groq"
    assert provider.default_model == "llama-3.3-70b-versatile"

    request = CompletionRequest(
        messages=[
            ChatMessage(role="system", content="System prompt"),
            ChatMessage(role="user", content="User prompt"),
        ],
        temperature=0.5,
        max_tokens=500,
        top_p=0.95,
    )

    result = await provider.complete(request)

    assert result.content == "AI generated test response"
    assert result.model == "llama-3.3-70b-versatile"
    assert result.usage.prompt_tokens == 20
    assert result.usage.completion_tokens == 40
    assert result.usage.total_tokens == 60
    assert result.finish_reason == "stop"

    mock_groq_client.chat.completions.create.assert_awaited_once_with(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "System prompt"},
            {"role": "user", "content": "User prompt"},
        ],
        temperature=0.5,
        max_tokens=500,
        top_p=0.95,
    )


@pytest.mark.asyncio
async def test_groq_provider_custom_model_override(mock_groq_client: MagicMock) -> None:
    mock_response = create_mock_groq_response(model="llama-3.1-8b-instant")
    mock_groq_client.chat.completions.create.return_value = mock_response

    provider = GroqProvider(api_key="gsk_test_key", client=mock_groq_client)

    request = CompletionRequest(
        messages=[ChatMessage(role="user", content="Hello")],
        model="llama-3.1-8b-instant",
    )

    result = await provider.complete(request)
    assert result.model == "llama-3.1-8b-instant"

    mock_groq_client.chat.completions.create.assert_awaited_once_with(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Hello"}],
    )


@pytest.mark.asyncio
async def test_groq_provider_authentication_error(mock_groq_client: MagicMock) -> None:
    dummy_req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    mock_groq_client.chat.completions.create.side_effect = AuthenticationError(
        "Invalid API Key",
        response=httpx.Response(401, request=dummy_req),
        body={"error": {"message": "Invalid API Key"}},
    )

    provider = GroqProvider(api_key="gsk_invalid", client=mock_groq_client)

    with pytest.raises(AgentAuthenticationError) as exc_info:
        await provider.complete(CompletionRequest(messages=[ChatMessage(content="Hi")]))

    assert exc_info.value.status_code == 502
    assert exc_info.value.upstream_status_code == 401
    assert exc_info.value.provider == "groq"


@pytest.mark.asyncio
async def test_groq_provider_rate_limit_error(mock_groq_client: MagicMock) -> None:
    dummy_req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    mock_groq_client.chat.completions.create.side_effect = RateLimitError(
        "Rate limit reached",
        response=httpx.Response(429, request=dummy_req, headers={"retry-after": "60"}),
        body={"error": {"message": "Rate limit reached"}},
    )

    provider = GroqProvider(api_key="gsk_test", client=mock_groq_client)

    with pytest.raises(AgentRateLimitError) as exc_info:
        await provider.complete(CompletionRequest(messages=[ChatMessage(content="Hi")]))

    assert exc_info.value.status_code == 429
    assert exc_info.value.provider == "groq"


@pytest.mark.asyncio
async def test_groq_provider_timeout_error(mock_groq_client: MagicMock) -> None:
    dummy_req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    mock_groq_client.chat.completions.create.side_effect = APITimeoutError(request=dummy_req)

    provider = GroqProvider(api_key="gsk_test", client=mock_groq_client)

    with pytest.raises(AgentTimeoutError) as exc_info:
        await provider.complete(CompletionRequest(messages=[ChatMessage(content="Hi")]))

    assert exc_info.value.status_code == 504
    assert exc_info.value.upstream_status_code == 408
    assert exc_info.value.provider == "groq"


@pytest.mark.asyncio
async def test_groq_provider_generic_api_error(mock_groq_client: MagicMock) -> None:
    dummy_req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    mock_groq_client.chat.completions.create.side_effect = APIError(
        "Internal Groq error",
        request=dummy_req,
        body={"error": {"message": "Internal Groq error"}},
    )

    provider = GroqProvider(api_key="gsk_test", client=mock_groq_client)

    with pytest.raises(AgentProviderError) as exc_info:
        await provider.complete(CompletionRequest(messages=[ChatMessage(content="Hi")]))

    assert exc_info.value.provider == "groq"


def test_get_agent_provider_factory() -> None:
    provider = get_agent_provider("groq", api_key="gsk_test")
    assert isinstance(provider, GroqProvider)
    assert provider.name == "groq"

    with pytest.raises(AgentConfigurationError):
        get_agent_provider("unsupported_provider")
