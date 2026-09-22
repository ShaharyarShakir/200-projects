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
