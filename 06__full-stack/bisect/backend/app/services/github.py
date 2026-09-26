from datetime import datetime
import asyncio
import random
import time
from typing import Any, Callable, Dict, List, Optional, TypeVar
import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from app.core.errors import (
    GitHubAPIError,
    GitHubAuthError,
    GitHubNotFoundError,
    GitHubPermissionError,
    GitHubRateLimitError,
)
from app.core.logging import logger

T = TypeVar("T")


class GitHubUser(BaseModel):
    """Pydantic model representing a GitHub user account."""

    model_config = ConfigDict(extra="ignore")

    id: int
    login: str
    avatar_url: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class GitHubOwner(BaseModel):
    """Pydantic model representing a GitHub repository owner."""

    model_config = ConfigDict(extra="ignore")

    id: int
    login: str
    avatar_url: Optional[str] = None


class GitHubRepository(BaseModel):
    """Pydantic model representing a GitHub repository."""

    model_config = ConfigDict(extra="ignore")

    id: int
    name: str
    full_name: str
    owner: Optional[GitHubOwner] = None
    default_branch: str = "main"
    clone_url: str
    is_private: bool = Field(default=False, alias="private")
    description: Optional[str] = None
    updated_at: Optional[datetime] = None


class GitHubClient:
    """Asynchronous client for interacting with the GitHub REST API.

    Retries rate limits and transient transport failures under a bounded
    policy: a fixed attempt cap plus a wall-clock budget, checked before every
    sleep so an operation can never overrun its bound.
    """

    def __init__(
        self,
        access_token: str,
        base_url: str = "https://api.github.com",
        timeout: Optional[float] = None,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self.access_token = access_token
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout if timeout is not None else settings.GITHUB_REQUEST_TIMEOUT
        # An injected client is borrowed, never closed by this object; an owned
        # one is created lazily and closed by close().
        self._client = client
        self._owns_client = client is None

    @property
    def headers(self) -> Dict[str, str]:
        """Standard headers for GitHub API authentication."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Bisect-AI-Agent",
        }

    def _get_client(self) -> httpx.AsyncClient:
        """Return the pooled client, creating it on first use."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
            self._owns_client = True
        return self._client

    async def close(self) -> None:
        """Close the client if this object owns it. Safe to call repeatedly."""
        if self._client is not None and self._owns_client:
            await self._client.aclose()
        self._client = None

    async def __aenter__(self) -> "GitHubClient":
        self._get_client()
        return self

    async def __aexit__(self, *exc_info: Any) -> None:
        await self.close()

    async def _handle_response_error(self, response: httpx.Response) -> None:
        """Parse error status and raise the matching domain exception.

        A 403 is ambiguous in GitHub's API: it covers secondary rate limits,
        primary rate limits, and plain permission denials. Only the first two
        are worth retrying, so the headers decide which error is raised.
        """
        status = response.status_code
        try:
            body = response.json()
        except Exception:
            body = response.text

        msg = f"GitHub API error {status}"
        if isinstance(body, dict) and "message" in body:
            msg = f"GitHub API error {status}: {body['message']}"

        if status == 401:
            raise GitHubAuthError(message=msg, upstream_status_code=status, response_body=body)
        elif status == 403:
            retry_after = self._parse_retry_after(response)
            if retry_after is not None:
                # Secondary rate limit: the server told us how long to wait.
                raise GitHubRateLimitError(
                    message=msg,
                    upstream_status_code=status,
                    retry_after=retry_after,
                    response_body=body,
                )
            if self._is_rate_limit_exhausted(response):
                # Primary rate limit: no Retry-After, so the backoff ceiling
                # governs the wait.
                raise GitHubRateLimitError(
                    message=msg,
                    upstream_status_code=status,
                    retry_after=None,
                    response_body=body,
                )
            # Neither rate-limit header: access is simply forbidden. Retrying
            # would not help, and reporting it as a rate limit would mislead.
            raise GitHubPermissionError(
                message=msg, upstream_status_code=status, response_body=body
            )
        elif status == 404:
            raise GitHubNotFoundError(
                message=msg, upstream_status_code=status, response_body=body
            )
        else:
            raise GitHubAPIError(
                message=msg, upstream_status_code=status, response_body=body
            )

    @staticmethod
    def _parse_retry_after(response: httpx.Response) -> Optional[int]:
        """Read Retry-After as seconds, ignoring an unparseable value."""
        raw = response.headers.get("Retry-After")
        if raw is None:
            return None
        try:
            return int(raw)
        except ValueError:
            return None

    @staticmethod
    def _is_rate_limit_exhausted(response: httpx.Response) -> bool:
        """True when GitHub reports zero remaining requests for the window."""
        remaining = response.headers.get("X-RateLimit-Remaining")
        if remaining is None:
            return False
        try:
            return int(remaining) == 0
        except ValueError:
            return False

    def _compute_delay(self, attempt: int, server_retry_after: Optional[int]) -> float:
        """Delay before the next attempt, with jitter to avoid a thundering herd."""
        if server_retry_after is not None:
            return float(server_retry_after)
        exponential = min(
            settings.GITHUB_RETRY_BASE_DELAY * (2**attempt),
            settings.GITHUB_RETRY_MAX_DELAY,
        )
        return exponential * random.uniform(0.5, 1.0)

    async def _request_with_retry(
        self,
        send: Callable[[httpx.AsyncClient], Any],
        description: str,
        sleep: Optional[Callable[[float], Any]] = None,
    ) -> Any:
        """Run one logical request under the bounded retry policy.

        Retries only what can succeed on a second attempt: rate limits and
        transport errors. Everything else propagates immediately. When the
        budget or attempt cap is reached, the last domain error is re-raised so
        the caller still sees a rate limit rather than a generic failure.
        """
        if sleep is None:
            sleep = asyncio.sleep

        started = time.monotonic()
        last_error: Optional[Exception] = None

        for attempt in range(settings.GITHUB_MAX_ATTEMPTS):
            try:
                return await send(self._get_client())
            except (GitHubRateLimitError, httpx.RequestError) as exc:
                last_error = exc
                server_retry_after = (
                    exc.retry_after if isinstance(exc, GitHubRateLimitError) else None
                )

                is_last_attempt = attempt == settings.GITHUB_MAX_ATTEMPTS - 1
                if is_last_attempt:
                    break

                delay = self._compute_delay(attempt, server_retry_after)

                # The budget is checked before sleeping, so the operation never
                # overruns its bound even if the next attempt would.
                elapsed = time.monotonic() - started
                if elapsed + delay > settings.GITHUB_RETRY_TOTAL_BUDGET:
                    logger.warning(
                        f"GitHub {description}: retry budget exhausted after "
                        f"{elapsed:.2f}s, not retrying"
                    )
                    break

                logger.warning(
                    f"GitHub {description}: attempt {attempt + 1} failed "
                    f"({exc.__class__.__name__}), retrying in {delay:.2f}s"
                )
                await sleep(delay)

        assert last_error is not None
        raise last_error

    async def get_authenticated_user(self) -> GitHubUser:
        """Fetch the authenticated user's profile from GitHub (GET /user)."""
        url = f"{self.base_url}/user"

        async def send(client: httpx.AsyncClient) -> GitHubUser:
            try:
                response = await client.get(url, headers=self.headers)
            except httpx.RequestError as exc:
                logger.exception("Network error calling GitHub /user")
                raise exc

            if response.is_error:
                await self._handle_response_error(response)

            return GitHubUser.model_validate(response.json())

        return await self._request_with_retry(send, "GET /user")

    async def list_repositories(
        self,
        page: int = 1,
        per_page: int = 100,
        sort: str = "updated",
        visibility: str = "all",
    ) -> List[GitHubRepository]:
        """Fetch repositories accessible to the user (GET /user/repos)."""
        url = f"{self.base_url}/user/repos"
        params: Dict[str, Any] = {
            "page": page,
            "per_page": per_page,
            "sort": sort,
            "visibility": visibility,
            "affiliation": "owner,collaborator,organization_member",
        }

        async def send(client: httpx.AsyncClient) -> List[GitHubRepository]:
            try:
                response = await client.get(url, headers=self.headers, params=params)
            except httpx.RequestError as exc:
                logger.exception("Network error calling GitHub /user/repos")
                raise exc

            if response.is_error:
                await self._handle_response_error(response)

            return [
                GitHubRepository.model_validate(item) for item in response.json()
            ]

        return await self._request_with_retry(send, "GET /user/repos")

    async def list_all_repositories(self, max_pages: int = 10) -> List[GitHubRepository]:
        """Iteratively fetch all repositories across pages.

        One client is created for the whole loop so every page shares a
        connection pool, instead of a fresh TCP and TLS handshake per page.
        """
        all_repos: List[GitHubRepository] = []
        page = 1
        async with self:
            while page <= max_pages:
                repos = await self.list_repositories(page=page, per_page=100)
                if not repos:
                    break
                all_repos.extend(repos)
                if len(repos) < 100:
                    break
                page += 1
        return all_repos

    async def get_repository(self, owner: str, repo: str) -> GitHubRepository:
        """Fetch a specific repository by owner and name (GET /repos/{owner}/{repo})."""
        url = f"{self.base_url}/repos/{owner}/{repo}"

        async def send(client: httpx.AsyncClient) -> GitHubRepository:
            try:
                response = await client.get(url, headers=self.headers)
            except httpx.RequestError as exc:
                logger.exception(f"Network error calling GitHub /repos/{owner}/{repo}")
                raise exc

            if response.is_error:
                await self._handle_response_error(response)

            return GitHubRepository.model_validate(response.json())

        return await self._request_with_retry(send, f"GET /repos/{owner}/{repo}")
