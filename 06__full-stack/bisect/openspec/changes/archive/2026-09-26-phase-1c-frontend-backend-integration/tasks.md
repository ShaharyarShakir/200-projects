# Tasks

## 1. Backend Persistence Layer

- [x] 1.1 Add `app/models/agent_session.py` with an `AgentSessionRow` SQLModel table (`__tablename__ = "agent_sessions"`) holding `id` (the existing `sess_<hex>` string as primary key), `owner_id` FK to `users.id`, `repository_id` nullable FK to `repositories.id`, `task_prompt`, `status`, `iteration_count`, `executed_action_count`, the three lifecycle timestamps, `termination_reason`, the three token counters, and a `steps` JSON column; register it in `app/models/__init__.py` and verify `SQLModel.metadata` resolves the new table
- [x] 1.2 Add `app/models/agent_session_event.py` with an `AgentSessionEventRow` table (`__tablename__ = "agent_session_events"`) holding a UUID primary key, `session_id` FK to `agent_sessions.id`, a per-session monotonic `sequence`, `category`, `event_type`, `level`, `summary`, a JSON `payload`, and `created_at`; index `(session_id, sequence)` for the range scan and register it in `app/models/__init__.py`
- [x] 1.3 Write the Alembic revision with `down_revision = "b7e2c4a91d38"` creating both tables, and verify `uv run alembic upgrade head` then `uv run alembic downgrade -1` both succeed against a scratch database
- [x] 1.4 Add a schema-agreement test asserting that `SQLModel.metadata.create_all` and the Alembic revision produce identical columns, types, and constraints for both new tables, following the precedent set by the `Repository` model's `b7e2c4a91d38` comment; verify it passes
- [x] 1.5 Add a `NotFoundError` family member to `app/core/errors.py` mapped to 404 so unowned and absent sessions are indistinguishable, and verify a test asserting the status code

## 2. Backend Session Service and Event Projection

- [x] 2.1 Add `app/services/session.py` with a `SessionService` exposing owner-scoped create, get, and list operations, where every read filters on `owner_id` and returns `None`/raises `NotFoundError` on a miss; verify a test that user B receives not-found for user A's session id
- [x] 2.2 Implement the upsert used by the loop's progress callback: replace `steps` wholesale and update status, counters, timestamps, and token accounting in one write; verify a test that two successive persists leave only the latest step set
- [x] 2.3 Implement the list operation with `limit`/`offset` plus optional `status` and `repository_id` filters, returning the page alongside the total count of matching rows; verify tests for pagination, both filters, and the zero-session empty case
- [x] 2.4 Implement the pure `event_type` → `category` mapping function covering `system`, `agent`, `execution`, `validation`, `success`, `warning`, and `error`, derived from the recorded occurrence rather than a caller argument; verify a test that no call path accepts a caller-supplied category
- [x] 2.5 Implement the event recorder that assigns the per-session `sequence` and writes the event row alongside the existing `log_agent_event` call, and the range read supporting `after_sequence` and `limit`; verify tests for ascending order, no-repeat after a given sequence, and pagination
- [x] 2.6 Add the single response projection used by every read path that runs `sanitize_log_data` over step and event payloads before the response model is built; verify a test that a step containing a token is masked on the single-read, list, and event-feed paths alike, and that the event summary carries no unmasked value

## 3. Backend Session API

- [x] 3.1 Add `app/api/v1/sessions.py` with `POST /api/v1/sessions` returning 201 for an authenticated caller with a non-empty prompt, rejecting an empty prompt and an unknown-or-unowned `repository_id` as validation failures, and rejecting unauthenticated calls; verify each with an API test
- [x] 3.2 Add `GET /api/v1/sessions` and `GET /api/v1/sessions/{id}` with the same owner scoping, and register the router in `app/api/router.py`; verify a test that an unauthenticated request to each returns unauthorized and an unknown id returns not-found
- [x] 3.3 Add `GET /api/v1/sessions/{id}/events` with `after_sequence` and `limit`, returning an empty collection for a session with no events; verify the empty, paginated, and not-found cases
- [x] 3.4 Confirm every failure path raises a `BisectError` subclass or `HTTPException` and is mapped by the existing global handler, so responses carry `{"detail", "code"}` and no stack trace; verify a test that an injected internal fault returns the fixed generic detail and records the fault in the log

## 4. Backend Agent Loop Integration

- [x] 4.1 Add an optional async `session_sink` parameter to `AgentExecutionLoop.__init__` defaulting to a no-op, and invoke it after every `record_step` and after every terminal transition, leaving all existing return paths untouched; verify `test_agent_execution_loop.py`, `test_agent_session.py`, `test_agent_execution_hardening.py`, and `test_agent_provider.py` pass unmodified
- [x] 4.2 Wire a `SessionService`-backed sink in the create route so a session created through the API is persisted and readable by a later request; verify a test that the session is retrievable after the creating request completes
- [x] 4.3 Emit progress events from the loop's existing `log_agent_event` call sites so a running session accumulates events before it terminates; verify a test that a mid-execution read returns both the running status and the events recorded so far

## 5. Frontend Data Layer

- [x] 5.1 Extend `lib/api/types.ts` with `SessionListResponse`, `SessionEvent`, and `SessionEventCategory`, and add `owner_id` and `repository_id` to `AgentSession`; verify the file typechecks with no `any` on any backend payload
- [x] 5.2 Add `listSessions` and `getSessionEvents` to `lib/api/sessions.ts` against the routes registered in `app/api/router.py`, and correct any path that does not match; verify a test asserting each function calls the expected URL and query string
- [x] 5.3 Add an `AbortController`-based timeout and a status→error-code mapping (`unauthorized`, `forbidden`, `not_found`, `conflict`, `validation`, `server`, `network`, `timeout`) to `ApiClientError` in `lib/api/client.ts`, leaving the existing 401 teardown behavior intact; verify tests for each mapped status and for a hung request becoming a timeout
- [x] 5.4 Update `useSessionPoll` to expose `isRefreshing` separately from `isLoading` and to drop the previous session's data when the session id changes, so a pending fetch is never presented as current; verify tests for the initial load, a background refresh, and an id switch
- [x] 5.5 Add a type-safety check that the mirrored TypeScript contracts compile against a captured backend response fixture with no `any` and no `Record<string, unknown>` escape hatch on the session or event payloads; verify the check runs in the test suite

## 6. Frontend Views

- [x] 6.1 Replace `SAMPLE_ARCHIVED_SESSIONS` in `app/sessions/page.tsx` with a real fetch from `listSessions`, preserving the search and status-filter behavior against real fields and adding a repository filter; verify a test asserting real rows render, the empty state renders with no sample rows, and filters re-query
- [x] 6.2 Replace the hardcoded empty state in `app/activity/page.tsx` with the selected session's event feed, following the design's settled choice to track one session rather than aggregate; verify loading, populated, empty, and error states each render
- [x] 6.3 Update `workspace/page.tsx` to fetch and display the persisted session's status, timestamps, current operation, errors, validation information, and lifecycle, deriving validation state from the backend rather than from `session.status` alone; verify tests for a running session and for each terminal status
- [x] 6.4 Move the refresh control out of the `activeSessionId &&` conditional so it is available before any session exists, wire it to the manual refresh path, and have it indicate progress and remain usable after a failure; verify a test that it exists with no active session and that a failed refresh leaves prior state visible
- [x] 6.5 Give the session inspector, activity feed, validation panel, and repository selector an explicit loading, empty, error, and success state each, and hold or clear prior data while a request for different parameters is in flight; verify a test per view per state
- [x] 6.6 Replace the diff and timeline tabs' static mock content with an explicit not-yet-available state rather than fabricated data; verify no sample records remain in the rendered output

## 7. Component Migration and Cleanup

- [x] 7.1 Change `ActivityFeed` to accept `events: SessionEvent[]` instead of `steps: LoopStep[]` and branch on `event.category` and `event.level` rather than on raw step internals; verify the component renders each category distinctly and shows no raw provider response text
- [x] 7.2 Update `workspace-page.test.tsx` and `bisect-workbench-components.test.tsx` for the new `ActivityFeed` props and real data; verify `pnpm test` passes with no test deleted to make the suite green
- [x] 7.3 Confirm no component issues a raw `fetch` or `axios` call, and that every backend call goes through `lib/api`; verify a grep over `src/components` and `src/app` returns no direct HTTP invocation
- [x] 7.4 Record a follow-up task for the diff and timeline panels' real backend data, and for the `/activity` cross-session aggregation, in the change's tasks so neither is silently dropped

## 8. Verification

- [x] 8.1 Run `uv run pytest` and confirm the full backend suite passes, including the pre-existing suites unmodified
- [x] 8.2 Run `pnpm test` and confirm the full frontend suite passes
- [x] 8.3 Run `pnpm lint` and `pnpm build` and confirm both succeed with no type errors
- [x] 8.4 Manually verify end to end: sign in via GitHub, create a session from the workspace, confirm it appears in `/sessions` after a page reload, and confirm its events appear in `/activity` in chronological order
- [x] 8.5 Manually verify the failure states: signed-out access to a protected route redirects to login, an expired token returns the user to the login prompt, and an unreachable backend shows an error state with retry rather than a blank view

## 9. Follow-ups (promoted, not dropped)

These were out of scope here because the backend had no endpoint for them. Both
panels were reduced to an explicit "not available yet" state rather than left
with fabricated data. Planning for the work lives in its own change,
`agent-patch-and-timeline`, which supersedes the wording used here.

- [x] 9.1 Promoted to `agent-patch-and-timeline` §1–2, §3.1, §5.2–5.3. Scope corrected while promoting it: the agent cannot currently produce a patch at all (its only actions are `run_command`, `inspect_file`, `finish`), so this needs a new agent action before any endpoint can return anything.
- [x] 9.2 Promoted to `agent-patch-and-timeline` §1.3–1.5, §3.2, §5.1. Same correction: there is no bisect capability to chart, so a `run_bisect` action must exist first.
- [x] 9.3 Promoted to `agent-patch-and-timeline` §3.3 and §6. `/activity` follows one `?session_id=` today by design.
