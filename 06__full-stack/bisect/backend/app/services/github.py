from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.core.errors import (
    GitHubAPIError,
    GitHubAuthError,
    GitHubNotFoundError,
    GitHubRateLimitError,
)
from app.core.logging import logger


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
    """Asynchronous client for interacting with the GitHub REST API."""

    def __init__(
        self,
        access_token: str,
        base_url: str = "https://api.github.com",
        timeout: float = 15.0,
    ) -> None:
        self.access_token = access_token
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @property
    def headers(self) -> Dict[str, str]:
        """Standard headers for GitHub API authentication."""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Bisect-AI-Agent",
        }

    async def _handle_response_error(self, response: httpx.Response) -> None:
        """Parse error status and raise mapped domain exception."""
        status = response.status_code
        try:
            body = response.json()
        except Exception:
            body = response.text

        msg = f"GitHub API error {status}"
        if isinstance(body, dict) and "message" in body:
            msg = f"GitHub API error {status}: {body['message']}"

        if status == 401:
            raise GitHubAuthError(message=msg, status_code=status, response_body=body)
        elif status == 403:
            retry_after = None
            if "Retry-After" in response.headers:
                try:
                    retry_after = int(response.headers["Retry-After"])
                except ValueError:
                    pass
            raise GitHubRateLimitError(
                message=msg,
                status_code=status,
                retry_after=retry_after,
                response_body=body,
            )
        elif status == 404:
            raise GitHubNotFoundError(message=msg, status_code=status, response_body=body)
        else:
            raise GitHubAPIError(message=msg, status_code=status, response_body=body)

    async def get_authenticated_user(self) -> GitHubUser:
        """Fetch the authenticated user's profile from GitHub (GET /user)."""
        url = f"{self.base_url}/user"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.headers)
        except httpx.RequestError as exc:
            logger.error(f"Network error calling GitHub /user: {exc}")
            raise GitHubAPIError(message=f"Network error connecting to GitHub: {exc}") from exc

        if response.is_error:
            await self._handle_response_error(response)

        data = response.json()
        return GitHubUser.model_validate(data)

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
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.headers, params=params)
        except httpx.RequestError as exc:
            logger.error(f"Network error calling GitHub /user/repos: {exc}")
            raise GitHubAPIError(message=f"Network error connecting to GitHub: {exc}") from exc

        if response.is_error:
            await self._handle_response_error(response)

        data = response.json()
        return [GitHubRepository.model_validate(item) for item in data]

    async def list_all_repositories(self, max_pages: int = 10) -> List[GitHubRepository]:
        """Iteratively fetch all repositories across pages."""
        all_repos: List[GitHubRepository] = []
        page = 1
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
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self.headers)
        except httpx.RequestError as exc:
            logger.error(f"Network error calling GitHub /repos/{owner}/{repo}: {exc}")
            raise GitHubAPIError(message=f"Network error connecting to GitHub: {exc}") from exc

        if response.is_error:
            await self._handle_response_error(response)

        data = response.json()
        return GitHubRepository.model_validate(data)
