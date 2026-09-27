# Tasks

## 1. Agent Actions

- [x] 1.1 Add `generate_patch` to the agent action vocabulary and parser, accepting the same JSON envelope as the existing actions and rejecting an unknown or malformed payload
- [x] 1.2 Implement patch collection in the dispatcher against the sandboxed repository, returning an empty patch when the tree is unmodified rather than failing
- [x] 1.3 Add `run_bisect` to the action vocabulary and parser, requiring known-good and known-bad revisions and failing with a structured error when either is missing
- [x] 1.4 Implement bisect execution in the dispatcher, recording each evaluated commit with its verdict, and stopping at the configured commit budget
- [x] 1.5 Reset bisect state during sandbox teardown so no later action observes a detached HEAD at a bisect midpoint
- [x] 1.6 Emit session events for patch collection and each bisect verdict so the activity feed reflects the new actions, using the existing server-derived event categories

## 2. Persistence

- [x] 2.1 Add a patch table storing one opaque unified diff per session, with an Alembic migration
- [x] 2.2 Add a bisect commit table storing evaluated commits per session in evaluation order, with an Alembic migration
- [x] 2.3 Assign timeline ordering on the backend, never accepting a client-supplied sequence
- [x] 2.4 Apply the existing secret redaction projection to stored artifact content before it is read

## 3. API

- [x] 3.1 Add an owner-scoped `GET /api/v1/sessions/{id}/patch` returning the session's patch, an empty artifact when none exists, and 404 for an unowned session
- [x] 3.2 Add an owner-scoped `GET /api/v1/sessions/{id}/timeline` returning commits in evaluation order with the culprit identified, and 404 for an unowned session
- [x] 3.3 Extend the session event read to support an optional cross-session filter for the owning user, preserving today's single-session behaviour
- [x] 3.4 Cover both artifact endpoints with tests for owner access, unowned access returning 404, missing artifact, and unauthenticated rejection

## 4. Frontend Contracts

- [x] 4.1 Add TypeScript read models for the patch and timeline responses, with no `any` and no string index signatures
- [x] 4.2 Add runtime decoding for the new responses consistent with the existing session contract decoder
- [x] 4.3 Add tests proving a payload using an index signature fails type checking

## 5. Frontend Panels

- [x] 5.1 Replace the timeline placeholder with fetched timeline data, keeping commit selection and culprit highlighting
- [x] 5.2 Replace the diff placeholder with fetched patch data, keeping unified and split views, per-file selection, and copy-patch
- [x] 5.3 Keep the explicit unavailable state for a session with no artifact, and an explicit nothing-to-review state for an empty patch
- [x] 5.4 Stop polling both panels once the session reaches a terminal status
- [x] 5.5 Verify no fabricated commit or diff content remains reachable in the rendered output

## 6. Activity Aggregation

- [x] 6.1 Add an "all sessions" mode to the activity view that requests events across the signed-in user's sessions
- [x] 6.2 Merge events chronologically across session boundaries and label each with its originating session
- [x] 6.3 Keep the single-session filter working alongside the aggregate mode
- [x] 6.4 Cover loading, populated, empty, error with retry, and filter-switching states for the aggregate mode

## 7. Verification

- [x] 7.1 Run `uv run pytest` and confirm the full backend suite passes
- [x] 7.2 Run `pnpm test`, `pnpm lint`, and `pnpm build` and confirm all succeed
- [ ] 7.3 Verify in a browser that a real agent run populates the timeline and diff panels with no placeholder text remaining
- [x] 7.4 Verify that a session with no artifacts shows the unavailable state rather than invented content

### Browser verification notes

Driven in Chromium against the live dev servers (`frontend/e2e/artifact-panels.spec.ts`),
with the access token injected into `bisect_auth_token` so every assertion reflects a
real HTTP response rather than a fixture.

- `7.4` verified: a session created through the workspace form shows
  `timeline-unavailable` and `diff-unavailable` with the explicit "No bisect timeline
  for this session" / "No patch for this session" copy, and none of the previously
  fabricated strings ("Breaking Commit Isolated:", "shaharyar", "48 tests passed",
  "not available yet", "will fill in once") appear in the rendered output.
- Aggregate activity verified: "All sessions" merges every owned session, labels each
  row with its session chip, and hides the per-session `seq N–M` range, which the
  single-session view still shows.
- `7.3` cannot be completed as written. Two independent blockers:
  1. No endpoint constructs `AgentExecutionLoop`, so `POST /sessions` only persists and
     no real agent run can be started from the UI. See the follow-up change.
  2. `frontend/src/app/workspace/page.tsx` sets `activeSessionId` only from a newly
     created session (line ~197). There is no `?session_id=` deep link and no session
     picker, so a finished session's patch and timeline cannot be reopened in the
     workspace at all. The artifact-backed panels are therefore unreachable in a
     browser even with seeded artifact rows present.

  The with-artifacts rendering is covered by jsdom tests and by the live endpoint
  contract, but not by a browser screenshot until the workspace can reopen a session.
