"""Tests that error logs are scrubbed of secrets and carry a stack trace."""

import logging

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.logging import SENSITIVE_KEY_NAMES, logger, sanitize_log_data
from app.main import app

GITHUB_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"
BEARER_VALUE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payloadpart.signaturepart"
# Read the configured value rather than hardcoding the default, because a local
# .env overrides it.
JWT_SECRET = settings.JWT_SECRET_KEY


class _SecretLeakingError(RuntimeError):
    pass


@app.get("/_test/leak-token")
async def _leak_token() -> None:
    raise _SecretLeakingError(f"upstream rejected token {GITHUB_TOKEN}")


@pytest_asyncio.fixture(scope="function")
async def raw_client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def test_sanitize_redacts_by_sensitive_key_name() -> None:
    sanitized = sanitize_log_data(
        {
            "access_token": "super-secret",
            "encrypted_token": "cipher",
            "password": "hunter2",
            "full_name": "octocat/hello-world",
        }
    )

    assert sanitized["access_token"] == "[REDACTED]"
    assert sanitized["encrypted_token"] == "[REDACTED]"
    assert sanitized["password"] == "[REDACTED]"
    # Non-sensitive values survive untouched.
    assert sanitized["full_name"] == "octocat/hello-world"
    for key in ("access_token", "encrypted_token", "password"):
        assert key in SENSITIVE_KEY_NAMES


def test_sanitize_redacts_by_secret_pattern() -> None:
    text = f"Authorization: Bearer {BEARER_VALUE} and token {GITHUB_TOKEN}"

    sanitized = sanitize_log_data(text)

    assert GITHUB_TOKEN not in sanitized
    assert BEARER_VALUE not in sanitized
    assert "[REDACTED]" in sanitized


def test_sanitize_redacts_known_settings_secrets() -> None:
    """A configured secret is redacted even without a recognisable prefix."""
    sanitized = sanitize_log_data(f"jwt signing key leaked: {JWT_SECRET}")

    assert JWT_SECRET not in sanitized
    assert "[REDACTED]" in sanitized


def test_sanitize_passes_through_nested_structures() -> None:
    payload = {"outer": [{"token": "abc"}, {"safe": 1}], "n": None}

    sanitized = sanitize_log_data(payload)

    assert sanitized["outer"][0]["token"] == "[REDACTED]"
    assert sanitized["outer"][1]["safe"] == 1
    assert sanitized["n"] is None


def test_sanitize_handles_non_string_scalars() -> None:
    assert sanitize_log_data(42) == 42
    assert sanitize_log_data(None) is None
    assert sanitize_log_data(True) is True


def test_logged_message_is_redacted(caplog: pytest.LogCaptureFixture) -> None:
    """A secret passed straight to the logger never reaches the output."""
    with caplog.at_level(logging.ERROR):
        logger.error(f"auth failed for token {GITHUB_TOKEN}")

    assert GITHUB_TOKEN not in caplog.text
    assert "[REDACTED]" in caplog.text


def test_logged_dict_payload_is_redacted(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.ERROR):
        logger.error("sync failed", extra={"payload": {"access_token": "leaked"}})

    assert "leaked" not in caplog.text


def test_logged_lazy_args_are_redacted(caplog: pytest.LogCaptureFixture) -> None:
    """Percent-style args are formatted by the handler, after the filter runs."""
    with caplog.at_level(logging.ERROR):
        logger.error("token %s rejected", GITHUB_TOKEN)

    assert GITHUB_TOKEN not in caplog.text
    assert "[REDACTED]" in caplog.text


@pytest.mark.asyncio
async def test_unhandled_exception_log_is_scrubbed(
    raw_client: AsyncClient, caplog: pytest.LogCaptureFixture
) -> None:
    """Scenario: redaction applies to unhandled exception records, traceback too."""
    with caplog.at_level(logging.ERROR):
        await raw_client.get("/_test/leak-token")

    # Neither the handler's record nor the request-logging middleware's record
    # may carry the token.
    assert GITHUB_TOKEN not in caplog.text
    assert "[REDACTED]" in caplog.text
    # The traceback is still present, so the failure remains diagnosable.
    assert "Traceback" in caplog.text
