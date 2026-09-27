# Tasks

## 1. Domain Error Status Codes

- [x] 1.1 Add `status_code: int = 500` as a class attribute on `BisectError` in `backend/app/core/errors.py` (class attribute, not an `__init__` parameter), and verify `BisectError().status_code == 500` in a pytest assertion
- [x] 1.2 Rename the `status_code` constructor parameter to `upstream_status_code` on `GitHubAPIError` and `AgentProviderError`, and verify no remaining `status_code=` keyword is passed to either class via grep over `backend/app`
- [x] 1.3 Set `status_code` on every subclass per the mapping table in design.md Decision 1, including `OAuthError` 400, `ActionError` 400, `InvalidStateTransitionError` 409, `SandboxTimeoutError` 504, and `AgentAuthenticationError` 502, and verify each class's value in `backend/tests/test_errors.py`
- [x] 1.4 Extend `backend/tests/test_errors.py` to cover all error classes including the `BisectError` root, GitHub, OAuth, Action, and `InvalidStateTransitionError` families that are currently untested, and verify `uv run pytest tests/test_errors.py` passes

## 2. Global Exception Handlers

- [x] 2.1 Register an `Exception` handler in `create_app()` in `backend/app/main.py` that returns HTTP 500 with a fixed generic `detail` and a stable `code`, interpolating no part of the exception into the response body, and verify the body is byte-identical across two different raising endpoints
- [x] 2.2 Register a `BisectError` handler returning `exc.status_code` with `{"detail": exc.message, "code": <class name>}` and no per-route re-mapping, and verify a route raising each error family returns that family's status
- [x] 2.3 Add a test route or monkeypatched endpoint in `backend/tests/` that raises an unhandled exception, and verify the response is 500, is valid JSON with both `detail` and `code`, and contains no traceback, exception type, or `app/` source path
- [x] 2.4 Add a test asserting `logger.exception` is used on the unhandled path by checking the captured log record text contains `Traceback`, and verify it fails if the handler is changed to `logger.error(f"...")`

## 3. Error Logging and Secret Sanitization

- [x] 3.1 Add a `logging.Filter` to the handlers in `setup_logging()` (`backend/app/core/logging.py`) that scrubs each record through the existing `sanitize_log_data`, and verify a record logged with `access_token` shows the value redacted
- [x] 3.2 Add a test that a value matching a known secret pattern (bearer / GitHub token shape) is redacted in emitted log text, and verify it via `caplog`
- [x] 3.3 Add a test that an unhandled exception record is also scrubbed, verifying a synthetic exception whose message contains a secret is redacted in the captured output
- [x] 3.4 Replace `logger.error(f"...{exc}")` with `logger.exception(...)` in `backend/app/api/v1/auth.py:70,76`, `backend/app/api/v1/repositories.py:63,69`, `backend/app/api/v1/health.py:26`, and `backend/app/core/db.py:50`, and verify no `logger.error(f"` call remains in those files
- [x] 3.5 Replace the same pattern in `backend/app/services/auth.py:50,54,60,65`, `backend/app/services/repository.py:31`, and `backend/app/services/github.py:115,144,174`, and verify by grep that no error path in `backend/app` logs only a stringified exception
- [x] 3.6 Add a test that a 4xx and a 5xx response each produce at least one error-level log record, and verify both cases are covered

## 4. Database Migration for Per-User Repositories

- [x] 4.1 Add an Alembic revision that drops the unique index `ix_repositories_github_repo_id`, recreates it as non-unique, then adds unique constraint `uq_repositories_github_repo_id_owner_id` on (`github_repo_id`, `owner_id`), in that order, and verify `uv run alembic upgrade head` then `downgrade -1` both succeed
- [x] 4.2 Remove `unique=True` from `github_repo_id` in `backend/app/models/repository.py:16` keeping `index=True`, and verify `SQLModel.metadata.create_all` produces the same index and constraint set as the migrated schema
- [x] 4.3 Add a migration-ordering test or explicit review note confirming the composite constraint is created only after the single-column unique index is dropped, and verify the failure mode is a clear error if the order is reversed

## 5. GitHub Client Resilience

- [x] 5.1 Add `GITHUB_MAX_ATTEMPTS`, `GITHUB_RETRY_BASE_DELAY`, `GITHUB_RETRY_MAX_DELAY`, `GITHUB_RETRY_TOTAL_BUDGET`, and an explicit `GITHUB_REQUEST_TIMEOUT` to `backend/app/core/config.py`, and verify each is readable from `settings` and overridable by environment variable
- [x] 5.2 Add a new `GitHubPermissionError(GitHubAPIError)` with upstream status 403 and Bisect status 502, and verify its `status_code` in `backend/tests/test_errors.py`
- [x] 5.3 Rewrite the 403 branch of `_handle_response_error` in `backend/app/services/github.py` to classify by `Retry-After` then `X-RateLimit-Remaining`, raising `GitHubPermissionError` when neither is present, and verify with `respx` mocks for all three 403 shapes
- [x] 5.4 Implement `_request_with_retry` as an explicit `for attempt in range(GITHUB_MAX_ATTEMPTS)` loop retrying only `GitHubRateLimitError` and `httpx.RequestError`, using server `retry_after` when present and `min(BASE * 2**n, MAX_DELAY) * uniform(0.5, 1.0)` otherwise, and verify a `respx`-mocked 403-then-200 sequence returns success after exactly one retry
- [x] 5.5 Add the total-budget check that aborts before sleeping when `elapsed + delay > GITHUB_RETRY_TOTAL_BUDGET`, re-raising the last domain error, and verify with a mocked clock that the operation never sleeps past the ceiling
- [x] 5.6 Verify the non-retryable path raises `GitHubAuthError`, `GitHubPermissionError`, and `GitHubNotFoundError` immediately with no retry, and verify the attempt count against `respx` is 1
- [x] 5.7 Add optional `httpx.AsyncClient` injection to `GitHubClient` with a lazily created owned client, idempotent `close()`, and `__aenter__`/`__aexit__`, and verify `async with GitHubClient(...)` compiles and cleans up
- [x] 5.8 Change `list_all_repositories` to create one client for the whole pagination loop and pass it to every page request, and verify with a mocked transport that a 2-page sync opens a single client rather than one per page
- [x] 5.9 Add a test that exhausted rate-limit retries raise `GitHubRateLimitError` rather than `GitHubAPIError`, verifying the 429 outcome survives to the client

## 6. Repository Sync Correctness and Atomicity

- [x] 6.1 Change the lookup in `RepositoryService.sync_repositories` to filter on both `github_repo_id` and `owner_id`, and remove the `existing_repo.owner_id = user.id` assignment on the update path at `backend/app/services/repository.py:49`, and verify a repeated sync by the same user updates in place with no duplicate
- [x] 6.2 Restructure `sync_repositories` to fetch from GitHub before opening the DB transaction, and verify no DB session is held open while the retry loop sleeps
- [x] 6.3 Wrap each per-repository upsert in `session.begin_nested()` and roll the outer transaction back on any escaping error, and remove the post-commit `session.refresh()` loop, and verify a mid-loop failure leaves no partial repository set committed
- [x] 6.4 Catch `IntegrityError` on a nested savepoint and re-select-and-update instead of failing the whole sync, and verify two concurrent syncs of a shared repository by different users both succeed
- [x] 6.5 Add a cross-user isolation test in `backend/tests/test_repositories_api.py`: user A syncs repo X, user B syncs repo X, and verify two rows exist, each visible only to its own user via `GET /repositories`, with user A's row attributes unchanged
- [x] 6.6 Make `POST /api/v1/repositories/sync` return 429 when the sync exhausts a rate limit, and verify via a `respx`-mocked 403 sequence that the response status is 429 and the body identifies the rate limit
- [x] 6.7 Add a test that a sync whose repository list is empty after a successful fetch commits no changes and returns an empty summary

## 7. Frontend Route Protection

- [x] 7.1 Create `frontend/src/lib/auth/routes.ts` exporting `PUBLIC_ROUTES` (`/`, `/auth/callback`) and an `isPublicRoute` helper defaulting to protected, and verify a unit test asserting an unlisted path such as `/workspace` is treated as protected
- [x] 7.2 Create `frontend/src/components/auth/RequireAuth.tsx` that renders a loading state while `isLoading`, redirects via `router.replace(/?next=<pathname>)` when unauthenticated, and renders children only when authenticated, issuing the redirect from `useEffect` rather than during render, and verify a Vitest test that unauthenticated render produces no children
- [x] 7.3 Wrap the content of `frontend/src/app/workspace/page.tsx`, `sessions/page.tsx`, `activity/page.tsx`, and `settings/page.tsx` in `RequireAuth`, and verify each page's existing Vitest tests still pass with the guard mocked
- [x] 7.4 Add a Vitest test asserting the workspace page's repository fetch is not called while `isLoading` is true and not called at all when unauthenticated, verifying the "no authenticated request before auth resolves" scenario
- [x] 7.5 Add a `next` validation helper that requires a leading single `/` not followed by `/` or `\`, and verify it rejects `//evil.com` and `/\evil.com` while accepting `/workspace`
- [x] 7.6 Update `frontend/src/app/auth/callback/page.tsx` to redirect to the validated `next` value after a successful exchange, falling back to `/workspace` when absent or rejected, and verify the existing `auth-callback.test.tsx` cases plus the new fallback case pass
- [x] 7.7 Update the 401 branch of `frontend/src/lib/api/client.ts` to record `window.location.pathname` as the return path before invoking the unauthorized handler, and verify a test asserting the return path is written on 401
- [x] 7.8 Change the logout action in `frontend/src/lib/auth/AuthContext.tsx` to `router.replace("/")` after clearing credentials, and verify no redirect loop occurs by asserting the unauthenticated render lands on the login page

## 8. Verification

- [x] 8.1 Run `cd backend && uv run pytest` and verify the full backend suite passes with no previously passing test now skipped or erroring
- [x] 8.2 Run `cd frontend && pnpm test` and verify the full Vitest suite passes
- [x] 8.3 _(skipped: tools not configured; reason recorded)_ Run `cd backend && uv run ruff check app tests` and `uv run mypy app`, verifying both are clean, or record in the change notes that these tools are not configured in `backend/pyproject.toml` and skip with that reason
- [x] 8.4 Run `cd frontend && pnpm build` and verify the production build succeeds with no type errors
- [x] 8.5 _(verified in browser 2026-09-26: signed-out deep-link to /sessions returned to /sessions after GitHub sign-in, confirming the post-login return fix after the post-login return fix; the "one row per user" half is covered by `test_sync_gives_two_users_separate_rows_for_a_shared_repository`)_ Manually start the backend and frontend, sign in via GitHub OAuth, deep-link to a protected route while signed out and verify the login redirect and post-login return, then confirm repository sync still works. GitHub OAuth sign-in is now working locally: `GITHUB_REDIRECT_URI` points at the frontend callback and `fetchApi` sends `credentials: "include"`. A signed-out deep-link to `/sessions` previously landed on `/workspace` because the `next` parameter cannot survive GitHub's redirect; `login()` now persists the destination first.
- [x] 8.6 Verify `openspec validate resilience-and-auth-hardening --strict` passes with the three capability deltas applied
