"""Tests for the global exception handlers registered in app.main."""

import logging
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.errors import (
    ActionParseError,
    AgentRateLimitError,
    BisectError,
    GitHubAuthError,
    GitHubPermissionError,
    GitHubRateLimitError,
    InvalidStateTransitionError,
    OAuthError,
    SandboxTimeoutError,
)
from app.main import (
    INTERNAL_ERROR_CODE,
    INTERNAL_ERROR_DETAIL,
    app,
)

# A GitHub-shaped token; used to prove a secret in an exception message never
# reaches the client.
LEAKY_SECRET = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"


class _UnreachableError(RuntimeError):
    """Raised to simulate a genuine bug escaping every route handler."""


# Test-only routes. They bypass auth because the handlers under test run before
# any route-level logic, and they need no database.
@app.get("/_test/raise-unhandled-a")
async def _raise_unhandled_a() -> None:
    raise _UnreachableError(f"connection to db-primary refused (token {LEAKY_SECRET})")


@app.get("/_test/raise-unhandled-b")
async def _raise_unhandled_b() -> None:
    raise ValueError("a completely different failure")


@app.get("/_test/raise-domain/{kind}")
async def _raise_domain(kind: str) -> None:
    errors = {
        "oauth": OAuthError("OAuth state mismatch"),
        "github_auth": GitHubAuthError(),
        "github_rate_limit": GitHubRateLimitError(retry_after=30),
        "github_permission": GitHubPermissionError(),
        "agent_rate_limit": AgentRateLimitError(retry_after=5, provider="groq"),
        "action_parse": ActionParseError(raw_content="<<<not json>>>"),
        "state_transition": InvalidStateTransitionError(
            current_status="created", target_status="completed"
        ),
        "sandbox_timeout": SandboxTimeoutError(timeout_seconds=30),
        "base": BisectError("generic domain failure"),
    }
    raise errors[kind]


@pytest_asyncio.fixture(scope="function")
async def raw_client() -> AsyncGenerator[AsyncClient, None]:
    """Client that surfaces 500 responses instead of re-raising the exception.

    Starlette's ServerErrorMiddleware sends the handler's response and then
    re-raises so the server can log it. httpx's ASGITransport re-raises that
    too unless raise_app_exceptions is disabled, which is what a real HTTP
    client would see instead.
    """
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["/_test/raise-unhandled-a", "/_test/raise-unhandled-b"])
async def test_unhandled_exception_returns_generic_500(
    raw_client: AsyncClient, path: str
) -> None:
    response = await raw_client.get(path)

    assert response.status_code == 500
    assert "application/json" in response.headers["content-type"]
    body = response.json()
    assert body == {"detail": INTERNAL_ERROR_DETAIL, "code": INTERNAL_ERROR_CODE}


@pytest.mark.asyncio
async def test_unhandled_exception_body_is_identical_across_endpoints(
    raw_client: AsyncClient,
) -> None:
    """Two different bugs must produce the same body, not distinguishable ones."""
    first = await raw_client.get("/_test/raise-unhandled-a")
    second = await raw_client.get("/_test/raise-unhandled-b")

    assert first.content == second.content


@pytest.mark.asyncio
async def test_unhandled_exception_body_leaks_nothing(raw_client: AsyncClient) -> None:
    response = await raw_client.get("/_test/raise-unhandled-a")
    text = response.text

    assert LEAKY_SECRET not in text
    assert "Traceback" not in text
    # Neither the exception type nor a source path may appear.
    assert "_UnreachableError" not in text
    assert "RuntimeError" not in text
    assert "app/tests" not in text
    assert "test_exception_handlers" not in text


@pytest.mark.asyncio
async def test_unhandled_exception_logs_traceback(
    raw_client: AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    """logger.exception must attach exc_info, so the log keeps the traceback."""
    with caplog.at_level(logging.ERROR):
        await raw_client.get("/_test/raise-unhandled-a")

    assert any(r.levelno >= logging.ERROR for r in caplog.records)
    # caplog.text includes the formatted traceback, which only exc_info adds.
    assert "Traceback" in caplog.text
    assert "_UnreachableError" in caplog.text


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("kind", "expected_status"),
    [
        ("oauth", 400),
        ("github_auth", 401),
        ("github_rate_limit", 429),
        ("github_permission", 502),
        ("agent_rate_limit", 429),
        ("action_parse", 400),
        ("state_transition", 409),
        ("sandbox_timeout", 504),
        ("base", 500),
    ],
)
async def test_domain_error_returns_its_own_status(
    raw_client: AsyncClient, kind: str, expected_status: int
) -> None:
    """A route that merely raises must not need to map the status itself."""
    response = await raw_client.get(f"/_test/raise-domain/{kind}")

    assert response.status_code == expected_status
    body = response.json()
    assert "detail" in body
    assert body["code"]
    assert body["code"] != INTERNAL_ERROR_CODE


@pytest.mark.asyncio
async def test_domain_error_body_carries_the_class_name_as_code(
    raw_client: AsyncClient,
) -> None:
    response = await raw_client.get("/_test/raise-domain/github_rate_limit")

    assert response.json()["code"] == "GitHubRateLimitError"
    assert "rate limit" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_domain_error_is_not_swallowed_by_generic_handler(
    raw_client: AsyncClient,
) -> None:
    """A 4xx domain error must keep its message, not the generic 500 text."""
    response = await raw_client.get("/_test/raise-domain/state_transition")

    assert response.status_code == 409
    assert response.json()["detail"] != INTERNAL_ERROR_DETAIL


@pytest.mark.asyncio
async def test_client_error_produces_an_error_log(
    raw_client: AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    """Scenario: every error path produces a log record (the 4xx half).

    Uses a domain error rather than the framework's 401 from
    ``get_current_user``: a bare HTTPException is converted by FastAPI without
    a log record, and changing the request-logging middleware's behaviour is
    explicitly out of scope for this change.
    """
    with caplog.at_level(logging.ERROR):
        response = await raw_client.get("/_test/raise-domain/oauth")

    assert response.status_code == 400
    assert any(r.levelno >= logging.ERROR for r in caplog.records)
    assert "OAuthError" in caplog.text


@pytest.mark.asyncio
async def test_server_error_produces_an_error_log(
    raw_client: AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    """Scenario: every error path produces a log record (the 5xx half)."""
    with caplog.at_level(logging.ERROR):
        response = await raw_client.get("/_test/raise-unhandled-a")

    assert response.status_code == 500
    assert any(r.levelno >= logging.ERROR for r in caplog.records)
