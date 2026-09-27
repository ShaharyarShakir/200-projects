# Proposal

## Why

The frontend is calling backend endpoints that do not exist. `frontend/src/lib/api/sessions.ts` calls `GET /api/v1/sessions/{id}` and `POST /api/v1/sessions`, and `frontend/src/app/workspace/page.tsx:127` calls `createSession` on page load — but the backend router registers only `health`, `auth`, and `repositories` (`backend/app/api/router.py:6-8`). There is no `sessions` router, no sessions table, and no events endpoint. `AgentSession` exists only as an in-memory Pydantic schema (`backend/app/schemas/session.py:44`) bound to the agent loop's local variable, so it dies with the request that created it.

The consequence is that the Phase 1B workspace UI cannot work against the real backend at all: the session inspector, the activity feed, and the validation status panel are wired to a `404`, and `/sessions` and `/activity` compensate with hardcoded `SAMPLE_ARCHIVED_SESSIONS` mock data (`frontend/src/app/sessions/page.tsx:32`) that the user has no way to distinguish from real records. "The backend is the source of truth" is currently aspirational.

## What Changes

**Backend — session persistence and read API (new)**
- Add an `agent_sessions` table plus an `agent_session_events` table, with an Alembic revision on top of head `b7e2c4a91d38`, following the existing `Run`/`RunStep` SQLModel pattern (UUID PKs, `utc_now` defaults, `onupdate` timestamps, indexed FKs).
- Add a service that persists the in-memory `AgentSession` — status, counters, timestamps, termination reason, token accounting, and loop steps — so a session outlives the request that created it and is readable by a later request.
- Add a `sessions` router exposing `POST /api/v1/sessions` (create), `GET /api/v1/sessions` (list, paginated, filterable by status and repository), and `GET /api/v1/sessions/{id}` (read). All routes are owner-scoped through the existing `get_current_user` dependency, so one user cannot read another's sessions.
- Add `GET /api/v1/sessions/{id}/events` returning a chronological, stable-ordered, paginated event feed. Events are projected server-side into a small typed envelope with a `category` drawn from `system`, `agent`, `execution`, `validation`, `success`, `warning`, `error` — the server, not the browser, decides how a step is categorized, so new event types do not require a frontend release.
- Every session and event response passes through the existing `sanitize_log_data` helper, so tokens and secrets recorded in a step never reach the browser.

**Backend — agent loop integration**
- Bind the agent loop's `AgentSession` to the persisted record so a `POST /api/v1/sessions` that starts execution is observable by a subsequent `GET /api/v1/sessions/{id}` and a concurrent poller. The loop's existing `log_agent_event` calls become the event source rather than log-only output.

**Frontend — real data, no mock surfaces**
- Replace `SAMPLE_ARCHIVED_SESSIONS` on `/sessions` with a real paginated, filterable list from `GET /api/v1/sessions`; replace the hardcoded empty state on `/activity` with a real feed from `GET /api/v1/sessions/{id}/events` (and a cross-session feed).
- Extend `lib/api/types.ts` with the session list/pagination and event envelope contracts so no backend payload is consumed as `any`.
- Give the workspace session inspector, activity feed, validation panel, and repository selector an explicit `loading` / `empty` / `error` / `success` state each, and stop showing the previous session's data while a new fetch is in flight so stale state is never presented as current.
- Add a manual refresh control for workspace/session state that is available regardless of whether a session is currently active (today the refresh button only renders once a session id exists, `workspace/page.tsx:202`).
- Add a shared request-timeout so a hung backend produces a `timeout` error state instead of an indefinite spinner; normalize 401/403/404/409/422/500 and transport failure into distinct user-facing messages in one place.

**Preserved from the original request, already satisfied**
Items 1, 2, 7, 8, 9, and 10 of the original brief — the centralized client, GitHub auth integration, error normalization, loading/empty states, and typed contracts — already exist in `frontend/src/lib/` and are covered by `frontend-workspace-ui`. This change extends them rather than rebuilding them.

### Non-goals (explicitly out of scope)
- WebSockets, SSE, or any streaming transport. Polling and refetch only. The event feed is designed so a later transport can replace polling without changing the event contract.
- The agent execution loop's own logic, the Podman sandbox, patch generation, and pull-request creation.
- Migrating the JWT from `localStorage` to an HttpOnly cookie — that changes the auth contract end to end and belongs in its own change (already called out as a non-goal in `resilience-and-auth-hardening`).
- Server-side route-guard middleware, model/provider selection, API key management, and multi-agent orchestration.
- Any Git mutation. The human developer retains all Git authority; the frontend only reads.

## Capabilities

### New Capabilities
- `session-api`: Persisted agent sessions and the chronological event feed — the storage model, the owner-scoped REST surface for creating, listing, and reading sessions, the server-side event projection and its categories, and the guarantee that secrets are stripped from both.

### Modified Capabilities
- `frontend-workspace-ui`: replaces the mock-data and implied-endpoint behavior in the workspace, sessions, and activity views with real backend consumption, and tightens the existing "Frontend API Layer, Error Normalization, and Polling" requirement with request timeout, owner-scoped empty/error states, and a refresh control that is not gated on an active session.
- `agent-session-state`: the in-memory `AgentSession` becomes a persisted record with an owner and a repository, so the "Session State Inspection and Security Boundary" requirement is restated to cover cross-request reads and the sanitization guarantee on the HTTP path, not only on the serialization helper.

## Impact

**Backend code**
- `backend/app/models/agent_session.py`, `backend/app/models/agent_session_event.py` (new), registered in `backend/app/models/__init__.py`.
- `backend/app/services/session.py` (new) — persistence and owner-scoped reads, mirroring `backend/app/services/repository.py`.
- `backend/app/api/v1/sessions.py` (new), registered in `backend/app/api/router.py`.
- `backend/app/schemas/session.py` — add a `SessionRead`/list/event projection; the existing lifecycle schema and its transition table are unchanged.
- `backend/app/services/agent/loop.py` — persist the session and emit events where it currently only calls `log_agent_event`.
- `backend/alembic/versions/<new>.py` — one additive migration, `down_revision = "b7e2c4a91d38"`.

**Backend API surface (all new)**
- `POST /api/v1/sessions` → 201 / 401 / 422
- `GET /api/v1/sessions` → 200 / 401, paginated with `limit`/`offset`, optional `status` and `repository_id` filters
- `GET /api/v1/sessions/{id}` → 200 / 401 / 404
- `GET /api/v1/sessions/{id}/events` → 200 / 401 / 404, paginated with `after_sequence` and `limit`
- Errors reuse the existing `{"detail", "code"}` envelope produced by the `BisectError` handler; 409 via `InvalidStateTransitionError` is reserved for illegal transitions and is not used by the read paths.

**Frontend code**
- `frontend/src/lib/api/types.ts` — `SessionListResponse`, `SessionEvent`, `SessionEventCategory`, `AgentSession` gains `owner_id`/`repository_id`.
- `frontend/src/lib/api/sessions.ts` — add `listSessions`, `getSessionEvents`; correct paths to match the router.
- `frontend/src/lib/api/client.ts` — request timeout; timeout and transport failure normalized to distinct `ApiClientError` codes.
- `frontend/src/lib/hooks/useSessionPoll.ts` — expose `isRefreshing` distinct from `isLoading`, and stop presenting stale data during a refetch.
- `frontend/src/app/workspace/page.tsx`, `frontend/src/app/sessions/page.tsx`, `frontend/src/app/activity/page.tsx` — real fetches, explicit states, refresh control.
- `frontend/src/components/workspace/{ActivityFeed,SessionCard,StatusSummary}.tsx` — consume the event envelope.

**Data**
- One additive migration creating two tables. No existing table is altered, no row is rewritten, and `runs`/`run_steps` are untouched, so no agent run history is lost. `AgentSession.id` is the human-readable `sess_<hex>` string already used by the loop, so it becomes a natural primary key and no ID remapping is needed.
- Existing `Run`/`RunStep` tables are **not** repurposed for this. They model a repository-level repair run; `AgentSession` models one agent execution. Merging them is a separate decision.

**Dependencies**
- None added. Backend uses SQLModel/Alembic/pytest-asyncio/aiosqlite, all present. Frontend uses Vitest/Testing Library, all present.

**Tests**
- New backend tests: session create/list/read, owner isolation (user B receives 404 for user A's session), event ordering and category projection, pagination, secret sanitization on the response path, migration/schema agreement between `create_all` and the Alembic revision.
- New frontend tests: each affected view in its loading, success, empty, and error state; mock data absent from the rendered output; refresh control; timeout error state.
- Existing suites (`backend/tests/`, `frontend/src/test/`) must continue to pass unmodified except where a shared fixture is extended.

**Human Control**
This change adds no autonomous Git or filesystem operation. It adds a REST surface for creating and reading agent sessions and their events; the agent loop's existing execution behavior is unchanged.
