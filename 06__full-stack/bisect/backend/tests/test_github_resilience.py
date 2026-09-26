"""Tests for GitHub client resilience: 403 classification and bounded retries.

GitHub returns 403 for three unrelated conditions -- secondary rate limits,
primary rate limits, and genuine permission denials -- and the first two are
worth retrying while the third is not. The retry policy must therefore be
driven by the response headers, and it must be bounded on both attempts and
wall-clock time.
"""

from typing import List

import httpx
import pytest
import respx

import app.services.github as github_module
from app.core.config import settings
from app.core.errors import (
    GitHubAPIError,
    GitHubAuthError,
    GitHubNotFoundError,
    GitHubPermissionError,
    GitHubRateLimitError,
)
from app.services.github import GitHubClient

BASE = "https://api.github.com"
USER_URL = f"{BASE}/user"
REPO_URL = f"{BASE}/repos/o/r"

REPO = {"id": 1, "name": "r", "full_name": "o/r", "clone_url": "u"}


@pytest.fixture(autouse=True)
def sleeps(monkeypatch: pytest.MonkeyPatch) -> List[float]:
    """Record retry delays instead of actually waiting for them.

    Autouse so no test can accidentally block on a real sleep, regardless of
    how the retry budget is configured.
    """
    recorded: List[float] = []

    async def fake_sleep(delay: float) -> None:
        recorded.append(delay)

    monkeypatch.setattr(github_module.asyncio, "sleep", fake_sleep)
    return recorded


# --- 403 classification (5.3) ---


@pytest.mark.asyncio
@respx.mock
async def test_403_with_retry_after_is_a_rate_limit(sleeps: List[float]) -> None:
    """Secondary rate limit: GitHub names the wait in Retry-After."""
    route = respx.get(REPO_URL).respond(
        status_code=403, json={"message": "slow down"}, headers={"Retry-After": "42"}
    )

    with pytest.raises(GitHubRateLimitError) as exc:
        await GitHubClient("token").get_repository("o", "r")

    assert exc.value.retry_after == 42
    assert exc.value.upstream_status_code == 403
    assert route.call_count == 1, "42s exceeds the budget, so no retry"


@pytest.mark.asyncio
@respx.mock
async def test_403_with_zero_remaining_is_a_rate_limit(sleeps: List[float]) -> None:
    """Primary rate limit: no Retry-After, but the window is exhausted."""
    respx.get(REPO_URL).respond(
        status_code=403, json={"message": "limit"}, headers={"X-RateLimit-Remaining": "0"}
    )

    with pytest.raises(GitHubRateLimitError) as exc:
        await GitHubClient("token").get_repository("o", "r")

    # No Retry-After means the client's own backoff ceiling governs the wait.
    assert exc.value.retry_after is None


@pytest.mark.asyncio
@respx.mock
async def test_403_without_limit_headers_is_a_permission_error(sleeps: List[float]) -> None:
    """Neither rate-limit header: access is simply forbidden."""
    respx.get(REPO_URL).respond(status_code=403, json={"message": "forbidden"})

    with pytest.raises(GitHubPermissionError) as exc:
        await GitHubClient("token").get_repository("o", "r")

    assert exc.value.upstream_status_code == 403


@pytest.mark.asyncio
@respx.mock
async def test_403_with_nonzero_remaining_is_a_permission_error(sleeps: List[float]) -> None:
    """Remaining quota means this is not a rate limit."""
    respx.get(REPO_URL).respond(
        status_code=403, json={"message": "no"}, headers={"X-RateLimit-Remaining": "4999"}
    )

    with pytest.raises(GitHubPermissionError):
        await GitHubClient("token").get_repository("o", "r")


@pytest.mark.asyncio
@respx.mock
async def test_unparseable_retry_after_is_ignored(sleeps: List[float]) -> None:
    respx.get(REPO_URL).respond(
        status_code=403, json={"message": "x"}, headers={"Retry-After": "tomorrow"}
    )

    with pytest.raises(GitHubPermissionError):
        await GitHubClient("token").get_repository("o", "r")


def test_permission_and_rate_limit_errors_are_distinguishable() -> None:
    """Callers choose a retry policy from the type, so the split must hold."""
    assert not issubclass(GitHubPermissionError, GitHubRateLimitError)
    assert not issubclass(GitHubRateLimitError, GitHubPermissionError)


# --- non-retryable errors (5.6) ---


@pytest.mark.asyncio
@respx.mock
async def test_401_is_not_retried(sleeps: List[float]) -> None:
    route = respx.get(REPO_URL).respond(status_code=401, json={"message": "bad creds"})

    with pytest.raises(GitHubAuthError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == 1
    assert sleeps == [], "a 401 is deterministic; retrying is pointless"


@pytest.mark.asyncio
@respx.mock
async def test_404_is_not_retried(sleeps: List[float]) -> None:
    route = respx.get(REPO_URL).respond(status_code=404, json={"message": "missing"})

    with pytest.raises(GitHubNotFoundError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == 1
    assert sleeps == []


@pytest.mark.asyncio
@respx.mock
async def test_permission_error_makes_exactly_one_call(sleeps: List[float]) -> None:
    route = respx.get(REPO_URL).respond(status_code=403, json={"message": "forbidden"})

    with pytest.raises(GitHubPermissionError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == 1


# --- bounded retries (5.4, 5.6, 5.9) ---


@pytest.mark.asyncio
@respx.mock
async def test_rate_limit_then_success_retries_exactly_once(sleeps: List[float]) -> None:
    route = respx.get(REPO_URL).mock(
        side_effect=[
            httpx.Response(
                403, json={"message": "limit"}, headers={"Retry-After": "1"}
            ),
            httpx.Response(200, json=REPO),
        ]
    )

    repo = await GitHubClient("token").get_repository("o", "r")

    assert repo.full_name == "o/r"
    assert route.call_count == 2
    # The server's Retry-After is honoured rather than replaced by our backoff.
    assert sleeps == [1.0]


@pytest.mark.asyncio
@respx.mock
async def test_exhausted_retries_raise_rate_limit_not_generic_error(
    sleeps: List[float],
) -> None:
    """The 429 outcome must survive to the caller, not degrade to a 502."""
    route = respx.get(REPO_URL).respond(
        status_code=403, json={"message": "limit"}, headers={"Retry-After": "1"}
    )

    with pytest.raises(GitHubRateLimitError) as exc:
        await GitHubClient("token").get_repository("o", "r")

    assert not isinstance(exc.value, type(None))
    assert exc.value.status_code == 429
    assert route.call_count == settings.GITHUB_MAX_ATTEMPTS
    assert len(sleeps) == settings.GITHUB_MAX_ATTEMPTS - 1


@pytest.mark.asyncio
@respx.mock
async def test_transport_error_is_retried_then_reraised(sleeps: List[float]) -> None:
    route = respx.get(REPO_URL).mock(side_effect=httpx.ConnectError("boom"))

    with pytest.raises(httpx.ConnectError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == settings.GITHUB_MAX_ATTEMPTS


@pytest.mark.asyncio
@respx.mock
async def test_transport_error_recovers_on_a_later_attempt(sleeps: List[float]) -> None:
    respx.get(REPO_URL).mock(
        side_effect=[httpx.ReadTimeout("slow"), httpx.Response(200, json=REPO)]
    )

    repo = await GitHubClient("token").get_repository("o", "r")
    assert repo.full_name == "o/r"


@pytest.mark.asyncio
@respx.mock
async def test_server_error_is_not_retried(sleeps: List[float]) -> None:
    """5xx is a GitHub fault, not a transient client condition."""
    route = respx.get(REPO_URL).respond(status_code=500, json={"message": "boom"})

    with pytest.raises(GitHubAPIError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == 1


def test_backoff_is_capped_at_the_configured_ceiling() -> None:
    client = GitHubClient("token")
    assert client._compute_delay(10, None) <= settings.GITHUB_RETRY_MAX_DELAY


def test_backoff_jitters_between_half_and_full_of_the_nominal_delay() -> None:
    client = GitHubClient("token")
    nominal = settings.GITHUB_RETRY_BASE_DELAY * 2
    for _ in range(25):
        assert nominal * 0.5 <= client._compute_delay(1, None) <= nominal


def test_server_retry_after_overrides_local_backoff() -> None:
    assert GitHubClient("token")._compute_delay(0, 5) == 5.0


# --- wall-clock budget (5.5) ---


@pytest.mark.asyncio
@respx.mock
async def test_retry_larger_than_the_budget_is_never_slept_on(sleeps: List[float]) -> None:
    """A Retry-After beyond the whole budget must abort rather than hang."""
    route = respx.get(REPO_URL).respond(
        status_code=403, json={"message": "limit"}, headers={"Retry-After": "600"}
    )

    with pytest.raises(GitHubRateLimitError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == 1
    assert sleeps == []


@pytest.mark.asyncio
@respx.mock
async def test_budget_exhaustion_preserves_the_domain_error(sleeps: List[float]) -> None:
    """Stopping early must not downgrade the error the caller sees."""
    respx.get(REPO_URL).respond(
        status_code=403, json={"message": "limit"}, headers={"Retry-After": "600"}
    )

    with pytest.raises(GitHubRateLimitError) as exc:
        await GitHubClient("token").get_repository("o", "r")

    assert exc.value.retry_after == 600
    assert exc.value.status_code == 429


@pytest.mark.asyncio
@respx.mock
async def test_elapsed_time_consumes_the_budget(
    sleeps: List[float], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A clock that jumps past the budget stops retries on its own.

    The clock must advance rather than hold steady: a constant reading would
    make every elapsed measurement zero, because the start time and the
    current time would be the same value.
    """
    ticks = iter([0.0] + [settings.GITHUB_RETRY_TOTAL_BUDGET * 10] * 8)
    monkeypatch.setattr(github_module.time, "monotonic", lambda: next(ticks))
    route = respx.get(REPO_URL).respond(
        status_code=403, json={"message": "limit"}, headers={"Retry-After": "1"}
    )

    with pytest.raises(GitHubRateLimitError):
        await GitHubClient("token").get_repository("o", "r")

    assert route.call_count == 1, "no time left for another attempt"
    assert sleeps == []


# --- pooled client and pagination (5.7, 5.8) ---


@pytest.mark.asyncio
@respx.mock
async def test_pagination_uses_one_client_for_every_page(
    sleeps: List[float], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A 2-page sync must open a single pool, not one client per page."""
    created: List[httpx.AsyncClient] = []
    real_client = httpx.AsyncClient

    class CountingAsyncClient(real_client):
        def __init__(self, *args, **kwargs) -> None:
            super().__init__(*args, **kwargs)
            created.append(self)

    monkeypatch.setattr(github_module.httpx, "AsyncClient", CountingAsyncClient)

    page = [{"id": i, "name": f"r{i}", "full_name": f"o/r{i}", "clone_url": "u"} for i in range(100)]
    route = respx.get(f"{BASE}/user/repos").mock(
        side_effect=[
            httpx.Response(200, json=page),
            httpx.Response(200, json=[{"id": 999, "name": "z", "full_name": "o/z", "clone_url": "u"}]),
        ]
    )

    repos = await GitHubClient("token").list_all_repositories(max_pages=5)

    assert len(repos) == 101
    assert route.call_count == 2
    assert len(created) == 1, "every page must share one connection pool"


@pytest.mark.asyncio
@respx.mock
async def test_pagination_stops_at_max_pages(sleeps: List[float]) -> None:
    page = [{"id": i, "name": f"r{i}", "full_name": f"o/r{i}", "clone_url": "u"} for i in range(100)]
    route = respx.get(f"{BASE}/user/repos").mock(
        side_effect=httpx.Response(200, json=page)
    )

    repos = await GitHubClient("token").list_all_repositories(max_pages=3)

    assert len(repos) == 300
    assert route.call_count == 3


@pytest.mark.asyncio
@respx.mock
async def test_pagination_stops_on_an_empty_page(sleeps: List[float]) -> None:
    route = respx.get(f"{BASE}/user/repos").respond(200, json=[])
    assert await GitHubClient("token").list_all_repositories(max_pages=5) == []
    assert route.call_count == 1


@pytest.mark.asyncio
@respx.mock
async def test_owned_client_is_created_once_and_closed(sleeps: List[float]) -> None:
    respx.get(REPO_URL).respond(200, json=REPO)
    client = GitHubClient("token")

    await client.get_repository("o", "r")
    http_client = client._client
    assert client._get_client() is http_client, "the pool must be reused"
    assert not http_client.is_closed

    await client.close()
    assert http_client.is_closed
    await client.close()  # idempotent


@pytest.mark.asyncio
@respx.mock
async def test_async_context_manager_cleans_up(sleeps: List[float]) -> None:
    respx.get(REPO_URL).respond(200, json=REPO)

    async with GitHubClient("token") as client:
        await client.get_repository("o", "r")
        http_client = client._client
        assert not http_client.is_closed

    assert http_client.is_closed


@pytest.mark.asyncio
async def test_injected_client_is_not_closed_by_the_borrower(sleeps: List[float]) -> None:
    http_client = httpx.AsyncClient()

    async with GitHubClient("token", client=http_client) as client:
        assert client._get_client() is http_client

    assert not http_client.is_closed, "an injected client is owned by the caller"
    await http_client.aclose()


def test_client_uses_configured_timeout_by_default() -> None:
    assert GitHubClient("token").timeout == settings.GITHUB_REQUEST_TIMEOUT
    assert GitHubClient("token", timeout=1.5).timeout == 1.5


@pytest.mark.asyncio
@respx.mock
async def test_error_body_is_preserved_for_logging(sleeps: List[float]) -> None:
    respx.get(REPO_URL).respond(
        status_code=403, json={"message": "forbidden", "documentation_url": "x"}
    )

    with pytest.raises(GitHubAPIError) as exc:
        await GitHubClient("token").get_repository("o", "r")

    assert "forbidden" in str(exc.value)
    assert exc.value.response_body["documentation_url"] == "x"
