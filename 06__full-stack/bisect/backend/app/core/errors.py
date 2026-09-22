from typing import Any, Optional


class BisectError(Exception):
    """Base exception for all Bisect application errors."""

    def __init__(self, message: str = "An internal error occurred"):
        super().__init__(message)
        self.message = message


# ---------------------------------------------------------------------------
# GitHub API Exception Hierarchy
# ---------------------------------------------------------------------------

class GitHubAPIError(BisectError):
    """Base exception raised when GitHub REST API interactions fail."""

    def __init__(
        self,
        message: str = "GitHub API request failed",
        status_code: Optional[int] = None,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class GitHubAuthError(GitHubAPIError):
    """Raised when GitHub returns 401 Unauthorized for invalid/expired tokens."""

    def __init__(
        self,
        message: str = "GitHub authentication failed: invalid or expired token",
        status_code: Optional[int] = 401,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, status_code=status_code, response_body=response_body)


class GitHubRateLimitError(GitHubAPIError):
    """Raised when GitHub returns 403 due to secondary or primary rate limits."""

    def __init__(
        self,
        message: str = "GitHub API rate limit exceeded",
        status_code: Optional[int] = 403,
        retry_after: Optional[int] = None,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, status_code=status_code, response_body=response_body)
        self.retry_after = retry_after


class GitHubNotFoundError(GitHubAPIError):
    """Raised when a requested resource on GitHub returns 404 Not Found."""

    def __init__(
        self,
        message: str = "GitHub resource not found",
        status_code: Optional[int] = 404,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, status_code=status_code, response_body=response_body)


# ---------------------------------------------------------------------------
# OAuth & Domain Exceptions
# ---------------------------------------------------------------------------

class OAuthError(BisectError):
    """Raised when an OAuth authorization handshake fails."""

    def __init__(self, message: str = "OAuth authorization failed"):
        super().__init__(message)


# ---------------------------------------------------------------------------
# Agent Provider Exceptions
# ---------------------------------------------------------------------------

class AgentProviderError(BisectError):
    """Base exception for all AI agent provider failures."""

    def __init__(
        self,
        message: str = "Agent provider operation failed",
        status_code: Optional[int] = None,
        provider: Optional[str] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.provider = provider


class AgentAuthenticationError(AgentProviderError):
    """Raised when provider authentication fails (e.g., invalid/missing API key)."""

    def __init__(
        self,
        message: str = "Agent provider authentication failed: invalid or missing credentials",
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, status_code=401, provider=provider)


class AgentRateLimitError(AgentProviderError):
    """Raised when the LLM provider rate limit is exceeded."""

    def __init__(
        self,
        message: str = "Agent provider rate limit exceeded",
        retry_after: Optional[int] = None,
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, status_code=429, provider=provider)
        self.retry_after = retry_after


class AgentTimeoutError(AgentProviderError):
    """Raised when an LLM completion request times out."""

    def __init__(
        self,
        message: str = "Agent completion request timed out",
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, status_code=408, provider=provider)


class AgentConfigurationError(AgentProviderError):
    """Raised when provider settings are invalid or missing."""

    def __init__(
        self,
        message: str = "Agent provider is misconfigured or missing required settings",
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, status_code=500, provider=provider)


# ---------------------------------------------------------------------------
# Sandbox Exceptions
# ---------------------------------------------------------------------------

class SandboxError(BisectError):
    """Base exception for all container sandbox failures."""

    def __init__(self, message: str = "Sandbox operation failed"):
        super().__init__(message)


class SandboxConnectionError(SandboxError):
    """Raised when connecting to the host Podman socket fails."""

    def __init__(
        self,
        message: str = "Failed to connect to host Podman socket",
        socket_path: Optional[str] = None,
    ):
        super().__init__(message)
        self.socket_path = socket_path


class SandboxContainerError(SandboxError):
    """Raised when container lifecycle operations (create, start, stop, remove) fail."""

    def __init__(
        self,
        message: str = "Sandbox container operation failed",
        container_id: Optional[str] = None,
    ):
        super().__init__(message)
        self.container_id = container_id


class SandboxExecutionError(SandboxError):
    """Raised when command execution fails due to infrastructure/daemon errors."""

    def __init__(
        self,
        message: str = "Failed to execute command inside sandbox",
        container_id: Optional[str] = None,
        command: Optional[Any] = None,
    ):
        super().__init__(message)
        self.container_id = container_id
        self.command = command


class SandboxTimeoutError(SandboxError):
    """Raised when a sandbox execution exceeds its allotted time limit."""

    def __init__(
        self,
        message: str = "Sandbox execution timed out",
        timeout_seconds: Optional[int] = None,
    ):
        super().__init__(message)
        self.timeout_seconds = timeout_seconds
