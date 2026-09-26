# Proposal

## Why

Three defects compound each other and make the authenticated core of Bisect
unreliable and unobservable. First, the backend has **no global exception
handler and no traceback logging on any error path**, so an unhandled exception
produces a bare HTTP 500 with no log line at all — failures are effectively
invisible during development and in production. The well-structured
`BisectError` hierarchy in `app/core/errors.py` is entirely unwired: each route
hand-rolls its own `try/except`, and no family carries a status code. Second,
repository sync captures GitHub's `Retry-After` header on rate limits and then
discards it, and matches repositories by `github_repo_id` alone instead of by
`github_repo_id` **and** `owner_id` as `github-integration/spec.md` already
requires — so one user syncing a shared repository can silently steal
ownership of another user's record. Third, the frontend stores the JWT in
`localStorage` and **guards no routes**: `/workspace`, `/sessions`,
`/activity`, and `/settings` all render for unauthenticated visitors and only
fail later via a 401 banner, and a global 401 clears the token without
redirecting the user to a login prompt — a behavior `frontend-workspace-ui`
already specifies but the code does not implement.

## What Changes

**Backend error handling and observability**
- Register a global handler for unhandled `Exception` in `app/main.py` that logs
  the full traceback via `logger.exception` and returns a sanitized JSON 500
  envelope, instead of relying on Starlette's default empty 500.
- Give `BisectError` and its five families a `status_code` so domain errors map
  to HTTP status codes centrally, and register a handler for it.
- Replace bare `logger.error(f"...{exc}")` interpolation with
  `logger.exception(...)` on every existing error path in `auth.py`,
  `repositories.py`, `health.py`, `core/db.py`, and the service layer, so
  tracebacks are recorded where the failure actually originates.
- Route the error payloads through the existing-but-unused
  `sanitize_log_data` / `SENSITIVE_KEY_NAMES` helpers so tokens and secrets
  cannot reach logs through error messages.

**Repository sync resilience and ownership correctness**
- Act on `GitHubRateLimitError.retry_after`: bounded retry with exponential
  backoff and jitter for 403 rate limits and transient `httpx` transport
  errors, with a hard attempt cap and a total time budget so sync cannot hang.
- Honor the server's `Retry-After` when present, otherwise fall back to
  exponential backoff; surface a distinct 429 response when the budget is
  exhausted so the UI can say "rate limited" instead of "something broke".
- Fix the upsert lookup to match on `github_repo_id` **and** `owner_id`, and
  drop the explicit `owner_id` reassignment on the update path, bringing the
  implementation into line with the existing spec and preventing cross-user
  ownership theft. This requires replacing the unique index on
  `github_repo_id` with a composite unique constraint on
  (`github_repo_id`, `owner_id`).
- Reuse a single pooled `httpx.AsyncClient` across pagination pages instead of
  constructing one per request.
- Roll back the transaction on partial sync failure so a failed batch does not
  commit a half-written repository set.

**Frontend route protection**
- Add a shared authenticated-route guard so `/workspace`, `/sessions`,
  `/activity`, and `/settings` redirect to the login prompt instead of
  rendering, while `/` and `/auth/callback` stay public.
- Complete the specified 401 behavior: clear credentials **and** redirect to
  the login prompt, preserving the attempted path for post-login return.
- Add a route-manifest for the public vs. protected page set so the guard set
  cannot silently drift as routes are added.

### Non-goals (explicitly out of scope)
- **Migrating the JWT from `localStorage` to an HttpOnly cookie.** This is the
  correct long-term fix for token theft, but it changes the auth contract
  end-to-end (backend cookie issuance, CORS credentials, CSRF) and belongs in
  its own change. This change does not reduce the current token exposure.
- **Server-side `middleware.ts` route guards.** With the token in
  `localStorage`, middleware cannot read it. Guards here are client-side, and
  that limitation is accepted for now.
- Agent execution, sandbox, and PR-creation capabilities — untouched.
- `LoggingMiddleware` request/response log format and the plain-text vs. JSON
  log format question — untouched.
- Rate-limit handling for the AI provider (Groq), not GitHub.

## Capabilities

### New Capabilities

None. All three areas are already covered by existing capabilities; this change
tightens their requirements rather than introducing a new capability boundary.

### Modified Capabilities

- `backend-foundation`: adds requirements for global unhandled-exception
  handling, domain-error-to-status-code mapping, and traceback-level error
  logging with secret sanitization. Extends the existing "Structured Logging
  and Request Correlation" requirement, which today says nothing about error
  paths.
- `github-integration`: extends "Reusable GitHub REST API Client" with
  rate-limit-aware bounded retry/backoff and connection reuse, and corrects
  "Repository Synchronization" so the upsert match key and failure atomicity
  are stated as testable behavior rather than assumed.
- `frontend-workspace-ui`: completes "GitHub Authentication Flow and Session
  State" by adding the route-guard requirement and the 401-redirect behavior
  that the existing spec asserts but the code does not implement.

## Impact

**Backend code**
- `backend/app/main.py` — register exception handlers.
- `backend/app/core/errors.py` — add `status_code` to `BisectError` and each
  family.
- `backend/app/core/logging.py` — use `sanitize_log_data` on error paths; no
  format change.
- `backend/app/api/v1/{auth,repositories,health}.py`, `backend/app/core/db.py`,
  `backend/app/services/{auth,repository,github}.py` — `logger.exception`
  instead of interpolated `logger.error`.
- `backend/app/services/github.py` — retry/backoff policy, pooled client.
- `backend/app/services/repository.py` — owner-scoped upsert, rollback.

**Backend API surface**
- `POST /api/v1/repositories/sync` may now return **429** (new) in addition to
  200 / 400 / 401 / 500, and gains a bounded worst-case duration.
- All 500 responses gain a consistent `{"detail": ...}` envelope with a stable
  error code. Response bodies for existing 4xx paths are unchanged.

**Frontend code**
- New auth guard component and route manifest.
- `frontend/src/lib/api/client.ts` — 401 handler adds a redirect.
- `frontend/src/app/workspace/page.tsx`, `sessions/page.tsx`,
  `activity/page.tsx`, `settings/page.tsx` — wrapped in the guard.

**Frontend behavior**
- Deep-linking to a protected route while signed out now lands on the login
  page instead of a broken workspace. Users who sign in are returned to the
  originally requested path.
- A 429 from sync renders a rate-limit message rather than a generic error.

**Data**
- **One migration is required.** `github_repo_id` currently carries a unique
  index (`ix_repositories_github_repo_id`, created `unique=True` in
  `461b70848be3_initial_schema.py:52`), which makes a per-user row for a shared
  repository impossible today. The migration replaces that unique index with a
  non-unique one and adds a composite unique constraint on
  (`github_repo_id`, `owner_id`). The SQLModel field drops `unique=True`.
- Existing mis-assigned `Repository` rows for shared repositories are **not**
  repaired retroactively — the pre-migration data has no record of who the row
  legitimately belonged to. Rows are reconciled on each user's next sync.
- The migration is additive and non-destructive to the `runs` table, which
  references `repositories.id`; no repository row is deleted, so no agent run
  history is lost.

**Dependencies**
- None added. `respx` and `pytest` already cover the new backend tests;
  Vitest and Testing Library already cover the new frontend tests.

**Tests**
- New backend tests: global 500 handler, `BisectError` → status mapping,
  sync retry on 403/429, owner-scoped upsert isolation, rollback on partial
  failure.
- New frontend tests: guard redirect for each protected route, public-route
  pass-through, 401 → login redirect, post-login return path.
- `backend/tests/test_errors.py` currently covers only two of the eight error
  classes and is extended as part of this change.

## Non-Goals And Boundaries

- Human Git ownership rules are unchanged: no Git mutations from either the
  agent or this change.
- Out of scope: WebSocket transport, the agent execution loop, the Podman
  sandbox, and the pull-request creation flow.
