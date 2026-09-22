import pytest
from app.core.errors import (
    BisectError,
    AgentProviderError,
    AgentAuthenticationError,
    AgentRateLimitError,
    AgentTimeoutError,
    AgentConfigurationError,
    SandboxError,
    SandboxConnectionError,
    SandboxContainerError,
    SandboxExecutionError,
    SandboxTimeoutError,
)


def test_agent_error_hierarchy() -> None:
    auth_err = AgentAuthenticationError("Invalid API key", provider="groq")
    assert isinstance(auth_err, AgentProviderError)
    assert isinstance(auth_err, BisectError)
    assert auth_err.status_code == 401
    assert auth_err.provider == "groq"

    rate_err = AgentRateLimitError("Too many requests", retry_after=30, provider="groq")
    assert isinstance(rate_err, AgentProviderError)
    assert rate_err.status_code == 429
    assert rate_err.retry_after == 30

    timeout_err = AgentTimeoutError("Request timed out", provider="groq")
    assert isinstance(timeout_err, AgentProviderError)
    assert timeout_err.status_code == 408

    cfg_err = AgentConfigurationError("Missing GROQ_API_KEY", provider="groq")
    assert isinstance(cfg_err, AgentProviderError)
    assert cfg_err.status_code == 500


def test_sandbox_error_hierarchy() -> None:
    conn_err = SandboxConnectionError("Socket not found", socket_path="/run/podman.sock")
    assert isinstance(conn_err, SandboxError)
    assert isinstance(conn_err, BisectError)
    assert conn_err.socket_path == "/run/podman.sock"

    container_err = SandboxContainerError("Failed to create container", container_id="c123")
    assert isinstance(container_err, SandboxError)
    assert container_err.container_id == "c123"

    exec_err = SandboxExecutionError("Exec failure", container_id="c123", command=["pytest"])
    assert isinstance(exec_err, SandboxError)
    assert exec_err.command == ["pytest"]

    timeout_err = SandboxTimeoutError("Command exceeded timeout", timeout_seconds=60)
    assert isinstance(timeout_err, SandboxError)
    assert timeout_err.timeout_seconds == 60
