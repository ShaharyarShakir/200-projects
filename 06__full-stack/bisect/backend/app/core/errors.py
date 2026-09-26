from typing import Any, Optional


class BisectError(Exception):
    """Base exception for all Bisect application errors.

    ``status_code`` is the HTTP status the Bisect API returns for this error.
    It is a property of the class, not of the instance, so it is declared as a
    class attribute and overridden per subclass. Subclasses that wrap a
    third-party service keep that service's own status in
    ``upstream_status_code`` instead, because the upstream status and the
    status Bisect returns are frequently different (GitHub's 403 for a rate
    limit is a 429 to our client).
    """

    status_code: int = 500

    def __init__(self, message: str = "An internal error occurred"):
        super().__init__(message)
        self.message = message


# ---------------------------------------------------------------------------
# GitHub API Exception Hierarchy
# ---------------------------------------------------------------------------

class GitHubAPIError(BisectError):
    """Base exception raised when GitHub REST API interactions fail."""

    status_code: int = 502

    def __init__(
        self,
        message: str = "GitHub API request failed",
        upstream_status_code: Optional[int] = None,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message)
        self.upstream_status_code = upstream_status_code
        self.response_body = response_body


class GitHubAuthError(GitHubAPIError):
    """Raised when GitHub returns 401 Unauthorized for invalid/expired tokens."""

    status_code: int = 401

    def __init__(
        self,
        message: str = "GitHub authentication failed: invalid or expired token",
        upstream_status_code: Optional[int] = 401,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, upstream_status_code=upstream_status_code, response_body=response_body)


class GitHubRateLimitError(GitHubAPIError):
    """Raised when GitHub returns 403 due to secondary or primary rate limits.

    ``retry_after`` carries the value of GitHub's ``Retry-After`` header when it
    sent one (secondary rate limits). Primary rate limits do not set that
    header, so ``retry_after`` is None and the caller falls back to its own
    backoff.
    """

    status_code: int = 429

    def __init__(
        self,
        message: str = "GitHub API rate limit exceeded",
        upstream_status_code: Optional[int] = 403,
        retry_after: Optional[int] = None,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, upstream_status_code=upstream_status_code, response_body=response_body)
        self.retry_after = retry_after


class GitHubPermissionError(GitHubAPIError):
    """Raised when GitHub returns 403 for a plain permission denial.

    GitHub uses 403 for three distinct conditions: secondary rate limits (with
    ``Retry-After``), primary rate limits (with ``X-RateLimit-Remaining: 0``),
    and access being forbidden (with neither header). Only the first two are
    worth retrying, so this class exists to keep permission denials from being
    reported to the user as a rate limit.
    """

    status_code: int = 502

    def __init__(
        self,
        message: str = "GitHub denied access to this resource",
        upstream_status_code: Optional[int] = 403,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, upstream_status_code=upstream_status_code, response_body=response_body)


class GitHubNotFoundError(GitHubAPIError):
    """Raised when a requested resource on GitHub returns 404 Not Found."""

    status_code: int = 404

    def __init__(
        self,
        message: str = "GitHub resource not found",
        upstream_status_code: Optional[int] = 404,
        response_body: Optional[Any] = None,
    ):
        super().__init__(message=message, upstream_status_code=upstream_status_code, response_body=response_body)


class GitHubAccountNotConnectedError(BisectError):
    """Raised when an operation needs a GitHub token the user has not stored.

    A 400 rather than a 5xx: the request is well-formed, but the user's account
    is not linked, which only the user can fix by re-authenticating.
    """

    status_code: int = 400

    def __init__(self, message: str = "GitHub account is not connected"):
        super().__init__(message)


# ---------------------------------------------------------------------------
# Resource Lookup Exceptions
# ---------------------------------------------------------------------------

class InvalidRequestError(BisectError):
    """Raised when a request is well-formed but semantically unusable.

    Used for body fields that only the database can judge, such as a
    ``repository_id`` that resolves to no repository the caller owns. Such a
    field is reported as invalid rather than as not found: a 404 would confirm
    whether the repository exists for somebody else, which is the same
    disclosure ``NotFoundError`` exists to prevent.
    """

    status_code: int = 422

    def __init__(self, message: str = "Request contains an invalid value", field: Optional[str] = None):
        super().__init__(message)
        self.field = field


class NotFoundError(BisectError):
    """Raised when a requested resource does not exist, or is not visible.

    Deliberately a single class for both cases. A resource that exists but
    belongs to another user is reported with this same 404 rather than a 403,
    because a 403 would confirm the resource is real and let any caller probe
    for the existence of other users' records. The caller cannot tell the two
    situations apart, which is the point.
    """

    status_code: int = 404

    def __init__(
        self,
        message: str = "Resource not found",
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
    ):
        super().__init__(message)
        self.resource = resource
        self.resource_id = resource_id


# ---------------------------------------------------------------------------
# OAuth & Domain Exceptions
# ---------------------------------------------------------------------------

class OAuthError(BisectError):
    """Raised when an OAuth authorization handshake fails."""

    status_code: int = 400

    def __init__(self, message: str = "OAuth authorization failed"):
        super().__init__(message)


# ---------------------------------------------------------------------------
# Agent Provider Exceptions
# ---------------------------------------------------------------------------

class AgentProviderError(BisectError):
    """Base exception for all AI agent provider failures."""

    status_code: int = 502

    def __init__(
        self,
        message: str = "Agent provider operation failed",
        upstream_status_code: Optional[int] = None,
        provider: Optional[str] = None,
    ):
        super().__init__(message)
        self.upstream_status_code = upstream_status_code
        self.provider = provider


class AgentAuthenticationError(AgentProviderError):
    """Raised when provider authentication fails (e.g., invalid/missing API key).

    This is a 502 rather than a 401 on purpose: the caller *is* authenticated to
    Bisect, the provider credential is not. A 401 would send the frontend's
    unauthorized handler into a logout the user cannot fix.
    """

    status_code: int = 502

    def __init__(
        self,
        message: str = "Agent provider authentication failed: invalid or missing credentials",
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, upstream_status_code=401, provider=provider)


class AgentRateLimitError(AgentProviderError):
    """Raised when the LLM provider rate limit is exceeded."""

    status_code: int = 429

    def __init__(
        self,
        message: str = "Agent provider rate limit exceeded",
        retry_after: Optional[int] = None,
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, upstream_status_code=429, provider=provider)
        self.retry_after = retry_after


class AgentTimeoutError(AgentProviderError):
    """Raised when an LLM completion request times out."""

    status_code: int = 504

    def __init__(
        self,
        message: str = "Agent completion request timed out",
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, upstream_status_code=408, provider=provider)


class AgentConfigurationError(AgentProviderError):
    """Raised when provider settings are invalid or missing.

    A server-side misconfiguration rather than an upstream failure, so it stays
    a 500.
    """

    status_code: int = 500

    def __init__(
        self,
        message: str = "Agent provider is misconfigured or missing required settings",
        provider: Optional[str] = None,
    ):
        super().__init__(message=message, upstream_status_code=500, provider=provider)


# ---------------------------------------------------------------------------
# Agent Action & Loop Exceptions
# ---------------------------------------------------------------------------

class ActionError(BisectError):
    """Base exception for action parsing, validation, and dispatch errors."""

    status_code: int = 400

    def __init__(self, message: str = "Action error occurred"):
        super().__init__(message)


class ActionParseError(ActionError):
    """Raised when parsing an agent action from raw LLM output fails."""

    def __init__(self, message: str = "Failed to parse action JSON from LLM output", raw_content: Optional[str] = None):
        super().__init__(message)
        self.raw_content = raw_content


class ActionValidationError(ActionError):
    """Raised when an agent action fails schema or security validation."""

    def __init__(
        self,
        message: str = "Action validation failed",
        action_name: Optional[str] = None,
        field: Optional[str] = None,
    ):
        super().__init__(message)
        self.action_name = action_name
        self.field = field


class InvalidStateTransitionError(BisectError):
    """Raised when an illegal or unsupported session state transition is attempted."""

    status_code: int = 409

    def __init__(
        self,
        message: str = "Invalid session state transition",
        current_status: Optional[str] = None,
        target_status: Optional[str] = None,
    ):
        super().__init__(message)
        self.current_status = current_status
        self.target_status = target_status


class LoopExecutionError(BisectError):
    """Raised when the agent execution loop encounters an unrecoverable failure."""

    def __init__(self, message: str = "Agent execution loop failed"):
        super().__init__(message)


# ---------------------------------------------------------------------------
# Sandbox Exceptions
# ---------------------------------------------------------------------------

class SandboxError(BisectError):
    """Base exception for all container sandbox failures."""

    status_code: int = 502

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
    """Raised when container lifecycle operations (create, start, stop, remove) fail.

    Stays a 500 rather than inheriting SandboxError's 502: a container that
    cannot be created is an operation failure, not an unreachable dependency.
    """

    status_code: int = 500

    def __init__(
        self,
        message: str = "Sandbox container operation failed",
        container_id: Optional[str] = None,
    ):
        super().__init__(message)
        self.container_id = container_id


class SandboxExecutionError(SandboxError):
    """Raised when command execution fails due to infrastructure/daemon errors.

    Stays a 500 rather than inheriting SandboxError's 502, for the same reason
    as SandboxContainerError.
    """

    status_code: int = 500

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

    status_code: int = 504

    def __init__(
        self,
        message: str = "Sandbox execution timed out",
        timeout_seconds: Optional[int] = None,
    ):
        super().__init__(message)
        self.timeout_seconds = timeout_seconds
