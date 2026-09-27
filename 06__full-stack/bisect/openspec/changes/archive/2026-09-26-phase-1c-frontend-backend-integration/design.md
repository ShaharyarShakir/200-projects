# Design

## Context

See `proposal.md` — Why for motivation. The facts that shape the approach:

- The backend router registers `health`, `auth`, `repositories` only (`backend/app/api/router.py:6-8`). The frontend already calls `POST /api/v1/sessions` and `GET /api/v1/sessions/{id}` (`frontend/src/lib/api/sessions.ts:9-20`), so those calls 404 today.
- `AgentSession` (`backend/app/schemas/session.py:44`) is a pure Pydantic model with a validated transition table. `AgentExecutionLoop.run` binds it to a local variable (`loop.py:166`) and it is discarded when the request ends. It has no owner and no repository.
- The loop mutates the session at 12 distinct exit paths (`loop.py:213,286,326,371,403,444,446,501,525` plus `record_step` at `276,314,359,433,480`). `LoopResult.session` already carries the final snapshot (`app/schemas/actions.py:157`).
- `log_agent_event(execution_id, event_type, details, level)` (`app/core/logging.py:169`) already emits structured, sanitized agent events — but only to the log. There is no store.
- `sanitize_log_data` / `SENSITIVE_KEY_NAMES` exist and are already applied on log paths; the HTTP read path is new and must apply the same treatment.
- Tests use in-memory SQLite via `SQLModel.metadata.create_all` (`backend/tests/conftest.py:32`), while production uses Alembic. The existing `Repository` model carries a comment that its constraint is "Kept in sync with the Alembic revision `b7e2c4a91d38`" — so both paths must agree.
- Errors already carry `status_code` per class and a global handler emits `{"detail", "code"}` (`app/main.py:19-33`, `app/core/errors.py`). New routes should raise and let that handler map, not return ad-hoc responses.
- Ownership enforcement has an established precedent: `RepositoryService` filters by `user_id` and returns `None` for a miss, which the route turns into 404 (`app/api/v1/repositories.py:85-91`).
- Frontend: `fetchApi` already normalizes errors, attaches the bearer token, and centralizes 401 handling (`lib/api/client.ts:63-142`). `useSessionPoll` already polls and already distinguishes background refetch from initial load internally, but does not expose that distinction.

## Goals / Non-Goals

**Goals:**
- Make a session created by one request readable by any later request, including while execution is still running, without changing the agent loop's behavior or its existing tests.
- Put the event contract on the server so a later transport change (WebSocket/SSE) is a transport swap, not a contract change.
- Guarantee no secret reaches the browser on any session read path, including inside step content and derived event summaries.
- Remove every mock-data surface in the frontend and give each affected view a real four-state model.
- Keep the persistence layer substitutable so tests and the loop can run without a database.

**Non-Goals:**
- Any change to the agent loop's decision logic, iteration limits, dispatch, or validation. The loop is observed, not modified in behavior.
- A pushed/streaming transport. Polling and manual refresh only.
- Migrating the JWT out of `localStorage`, server-side route guards, and any Git operation.
- Reusing the existing `runs` / `run_steps` tables (see Decision 2).
- Backfilling or migrating pre-existing session data — none exists, so the new tables start empty.

## Decisions

### Decision 1: Persist the session through an injected progress callback, not by editing the loop's return paths

The loop already funnels every step and every terminal transition through `record_step` and the `transition_to` family. Rather than add a persistence call at each of the 12 exit sites — which is exactly the kind of edit that gets missed on the next feature — the loop gains an optional async callback invoked after each mutation.

**Chosen:** add `session_sink: Optional[Callable[[AgentSession], Awaitable[None]]] = None` to `AgentExecutionLoop.__init__`, defaulting to no-op. Invoke it after every `record_step` and after every terminal transition. The API route constructs the loop with a sink bound to the request's DB session.

**Alternatives considered:**
- *Edit all 12 return paths.* Rejected: high miss risk, and a missed site means a session that silently never reaches a terminal state in the database.
- *Put I/O inside `AgentSession.transition_to` / `record_step`.* Rejected: `agent-session-state` specifies the model as a data/lifecycle contract; giving it a database handle couples the state machine to persistence and makes it untestable without one.
- *Persist only at the end, from `LoopResult.session`.* Rejected: it fails the spec requirement that a running session be readable mid-execution, which is the entire point of polling.
- *A `SessionRecorder` ABC.* Rejected as over-abstraction for a single implementation; a callable is enough and keeps the loop's constructor honest about its one dependency.

**Consequence:** existing tests construct `AgentExecutionLoop` with the current signature and get the no-op default, so `test_agent_execution_loop.py`, `test_agent_session.py`, and the hardening suites pass unmodified.

### Decision 2: Two new tables, not a reuse of `runs` / `run_steps`

`Run` is repository-scoped with a `RunStatus` of `PENDING → CLONING → RUNNING_TESTS → ANALYZING → PATCHING → APPLYING_PATCH → CREATING_PR` and a `branch_name`. `AgentSession` is execution-scoped with `created → running → {completed, failed, terminated, timed_out}`. The lifecycles, the granularity, and the owner semantics differ; `Run` also has no `user_id`, only a `repository_id`.

**Chosen:** new `agent_sessions` and `agent_session_events` tables. `AgentSession.id` is already a `sess_<hex12>` string, so it becomes the primary key directly with no remapping.

**Alternatives considered:**
- *Add `user_id` and reuse `runs`.* Rejected: forces one lifecycle onto two unrelated state machines, and would require the frontend to interpret a repository-level pipeline as a session.
- *Add a nullable `user_id` to `runs`.* Rejected: same conflation, plus a nullable owner is a permanent way for rows to become unowned.

**Consequence:** two additive tables and one migration; no existing table is altered and no existing row is touched.

### Decision 3: Events are a stored projection, categorized by the recorder

`log_agent_event` already knows the `event_type` and `level` at every call site (`loop.py:177,206,` and the per-iteration equivalents). The recorder runs alongside it, so the same call site supplies both the log line and the stored event.

**Chosen:** `agent_session_events` holds `(id, session_id, sequence, category, event_type, level, summary, payload, created_at)`. `sequence` is a per-session monotonic counter assigned at write time, not a global identity. The mapping from `event_type` to `category` is a single pure function in the service layer, not a `category` argument at the call site — which is what makes the spec's "caller cannot supply the category" scenario true by construction.

`summary` is a short human-readable string built from known fields. `payload` holds structured detail and is sanitized on the way out.

**Alternatives considered:**
- *Derive events in the frontend from `session.steps`.* Rejected during scoping: it makes categories a frontend convention, so a new server-side event type would need a frontend release to become visible, and it forfeits the transport-independence the spec requires.
- *Let the client POST its own events.* Rejected: the spec requires the server to derive the category, and client-authored events are trivially spoofable in a multi-user system.

**Consequence:** `GET /api/v1/sessions/{id}/events?after_sequence=N` is a pure indexed range scan. A later WebSocket transport pushes the same rows.

### Decision 4: Steps are stored as a JSON column on the session, not a third table

`LoopStep` is a heterogeneous record (`action` and `result` are already `Dict[str, Any]` in `app/schemas/actions.py:137-143`) that is always read as a whole, always in order, and never queried by field. The `runs`/`run_steps` split exists because `RunStep` is flat and column-typed.

**Chosen:** `steps` as a JSON column on `agent_sessions`, replaced wholesale on each persist. Read paths deserialize through a Pydantic projection.

**Alternatives considered:**
- *A separate `agent_session_steps` table.* Rejected: it buys queryability nothing currently needs, and every persist becomes a delete-and-reinsert. Revisit if step-level search is ever required.

**Consequence:** a persisting poll rewrites the steps blob on each callback. At the loop's bounded iteration count (default 10) this is a handful of small writes; `LoopConfig` caps it. If this ever becomes hot, the write is the thing to optimize, not the schema.

### Decision 5: Owner-scoped reads return 404, never 403, and the check lives in the service

`repositories.py:85-91` already establishes the pattern: the service returns `None` on a miss, the route raises 404. Every session read is scoped `WHERE session_id = :id AND owner_id = :current_user`.

**Chosen:** a `NotFoundError` family member mapped to 404, raised by the service so a session that exists but is unowned is indistinguishable from one that never existed. This satisfies both the ownership spec and the error-contract spec without a per-route special case.

**Alternatives considered:**
- *Return 403 for unowned.* Rejected: it confirms the session exists, leaking per-user activity to anyone who can guess a `sess_` id.
- *Enforce via a SQLAlchemy filter injected globally.* Rejected: implicit global filters are hard to audit; an explicit `owner_id` argument at each call site is greppable.

### Decision 6: Redaction happens on the response path, once, at the projection boundary

`sanitize_log_data` is already the project's redaction primitive and is already applied on log paths. The gap is that it has never guarded an HTTP body.

**Chosen:** a single `to_read_model()` projection per response type that runs `sanitize_log_data` over the step payload and event payload before the response model is constructed. Both the single-read, list, and event-feed paths call the same projection, so the three cannot drift — which is what the "redaction is applied on every read path" scenario requires.

**Alternatives considered:**
- *Redact at write time.* Rejected: it destroys the original data, making debugging a real credential leak impossible, and it would also redact values the agent legitimately needs to read back during its own loop.
- *Redact in the frontend.* Rejected: the secret has already crossed the network boundary by then.

### Decision 7: Request timeout and status→error-code mapping live in `fetchApi`

`fetchApi` already owns URL construction, auth headers, 401 teardown, and `detail` extraction. A hung backend currently leaves a spinner forever, and the request carries no abort.

**Chosen:** `fetchApi` gains an `AbortController` with a default timeout, and maps status → stable error code (`unauthorized`, `forbidden`, `not_found`, `conflict`, `validation`, `server`, `network`, `timeout`) on `ApiClientError`. The timeout is overridable per call for the long-lived operations.

**Alternatives considered:**
- *Per-component timeouts.* Rejected: duplicates the same `setTimeout` in every view and guarantees drift.
- *Retry inside `fetchApi`.* Rejected for now: it hides 4xx that the UI should show, and it interacts badly with manual refresh. Retries belong with the rate-limit work.

### Decision 8: `isRefreshing` is separate from `isLoading` in the poll hook

`useSessionPoll` already distinguishes background refetch from initial load internally (`useSessionPoll.ts:55-86`) but only uses it to decide whether to clear the loading flag. The refresh control needs to show progress during a *manual* refresh, and the views must not present the previous result as current while a fetch for a *different* session is in flight.

**Chosen:** the hook exposes `isLoading` (no data yet for the current key), `isRefreshing` (a request in flight with data already shown), and drops stale data when `sessionId` changes. The workspace page's refresh button moves out of the `activeSessionId &&` conditional so it exists before any session does.

**Alternatives considered:**
- *A global query cache (TanStack Query).* Rejected: it would be the right answer at scale, but it adds a dependency and a caching model to a codebase with no data layer to migrate into, and the four-state requirement is satisfiable with the hook that already exists.

### Decision 9: Events replace `steps` as the activity feed's data source

`ActivityFeed` takes `steps: LoopStep[]` and branches on `action.action` to decide how to render each row. That is the category decision, made in the browser.

**Chosen:** `ActivityFeed` takes `events: SessionEvent[]` and branches on `event.category` plus `event.level`. The component no longer interprets raw step internals. The tab's diff and timeline panels are untouched — they are static mock surfaces outside this change's scope and are called out in tasks as follow-up, not silently left.

**Alternatives considered:**
- *Keep `steps` and add events alongside.* Rejected: two sources of truth for the same feed, guaranteed to disagree.

## Risks / Trade-offs

**[Persisting on every step adds a write to the agent hot path]** → The write is bounded by `LoopConfig.max_iterations` (default 10) and the loop is already dominated by sandbox command execution. The sink is a no-op by default, so no existing test or non-API caller pays for it. If write latency ever matters, the fix is to coalesce the callback on a timer, not to reduce what is persisted.

**[Steps are replaced wholesale on each persist, so a crash mid-write could truncate step history]** → The session row and its steps blob live in one row, so the write is atomic at the database level; there is no partial-step state. A crash loses at most the steps of the in-flight iteration, and the session status remains readable.

**[`AgentSession` and the new `AgentSession` table model share a name]** → They are different things (a Pydantic lifecycle model and a SQLModel table). The table is named `AgentSessionRow` in code with `__tablename__ = "agent_sessions"` to keep `SQLModel.metadata` unambiguous, and a service layer is the only thing that converts between them.

**[SQLite tests and Alembic production can drift]** → The existing `Repository` comment shows this is a known failure mode here. A test asserts that `SQLModel.metadata.create_all` and the Alembic revision produce the same columns and constraints for both new tables, matching the precedent set in `b7e2c4a91d38`.

**[The event summary is written server-side, so wording can drift from what the UI expects]** → The summary is free text for display and the `category`/`level` are the machine-readable contract. The frontend must branch on `category`, never on summary text, and the types make the summary a plain `string`.

**[Rewriting the activity feed to events changes a component's public props, breaking existing tests]** → `workspace-page.test.tsx` and `bisect-workbench-components.test.tsx` assert against `steps`. They are updated in the same change as part of the feed migration, not left failing.

**[Removing mock data leaves the diff and timeline tabs visibly empty]** → They are already static mock surfaces outside this change's stated scope. Each gets an explicit "not available" state rather than fake content, and a task records the follow-up. The alternative — leaving fabricated data on screen — is what this change exists to remove.

**[`next build` treats any untyped or `any` boundary as a soft failure that CI may not catch]** → The API response models are Pydantic-derived and mirrored as explicit TypeScript interfaces with no `any`; a task adds a check that the mirrored types compile against a captured response fixture.

## Migration Plan

1. Land the two model modules, the Alembic revision (`down_revision = "b7e2c4a91d38"`), and the service layer. No route yet, so nothing observable changes.
2. Apply the migration. Both tables are additive; `runs`, `run_steps`, `repositories`, and `users` are untouched. Rollback is `downgrade()` dropping the two new tables — no data loss elsewhere because no existing table is written.
3. Land the `sessions` router and register it. `POST /api/v1/sessions` and `GET /api/v1/sessions` are inert until the frontend calls them; the frontend's current 404s are replaced by real responses.
4. Wire the loop's session sink in the route, then land the event recorder alongside the existing `log_agent_event` calls.
5. Land the frontend data layer (types, client timeout and error codes, session and event API functions, hook changes).
6. Replace the mock surfaces in `/sessions` and `/activity` and the workspace inspector, then delete the sample data.

**Rollback:** the frontend can be reverted independently — it degrades to 404s and error states rather than crashing, because the error path is implemented before the success path is switched on. Reverting the backend migration after sessions exist would drop recorded sessions; acceptable pre-GA since no session data is authoritative anywhere else.

**Verification before merge:** `uv run pytest` green with the existing suites unmodified; `pnpm test` green; `pnpm build` succeeds; a manual pass that a session created in the workspace appears in `/sessions` and produces events in `/activity` after a reload.

## Open Questions

- **Event retention.** Nothing prunes `agent_session_events` or old `agent_sessions`. At MVP volumes this is fine, but an unbounded table is a real problem eventually. The answer is a retention window plus a periodic prune job, which does not change the event contract, the approach, or the task breakdown — so it is deliberately deferred rather than decided here.
- **Default event page size.** The feed needs a limit; the value is a tuning choice, not a contract one, and is set alongside the existing pagination defaults rather than treated as a design decision.

Every deferred item above is a tuning or follow-up choice that leaves the event contract, the persistence approach, and the task breakdown unchanged.

**Settled during design, recorded here so it is not re-litigated in implementation:** `/activity` follows the currently selected session's event feed in this change. Cross-session aggregation needs a feed endpoint that spans sessions, which is a different query shape and a different set of filters, so it is a follow-up rather than a variant built here.
