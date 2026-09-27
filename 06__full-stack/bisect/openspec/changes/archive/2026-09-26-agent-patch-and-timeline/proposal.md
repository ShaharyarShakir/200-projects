# Proposal

## Why

The bisect timeline and patch diff panels in the workspace render an explicit
"not available yet" state, because the backend has no endpoint to feed them and
— more fundamentally — the agent cannot currently produce either artifact. The
agent's entire action vocabulary is `run_command`, `inspect_file`, and `finish`,
so there is no patch to display and no bisect run to chart. The panels were
stripped of their fabricated sample data rather than left lying, which left
three user-visible surfaces unfinished.

Separately, `/activity` follows a single session selected by `?session_id=`, so
an operator with many runs has no way to see anything that happened today
without first knowing a session ID.

## What Changes

- Add a `generate_patch` agent action so the agent can produce a unified diff
  from the sandboxed repository, and persist it against the session.
- Add a `run_bisect` agent action that drives `git bisect` in the sandbox and
  records each tested commit with its verdict, so a real timeline exists.
- Add owner-scoped read endpoints returning a session's patch and its commit
  bisect timeline, projected through the same redaction as session events.
- Replace the "not available yet" placeholders in `CommitTimelineScrubber` and
  `DiffReviewPanel` with the real data, keeping the rendering and interaction
  behaviour those components already have (unified/split diff views, per-file
  selection, copy-patch, commit selection, culprit highlighting).
- Extend `/activity` from one selected session to a cross-session aggregate
  across the signed-in user's sessions, with a session filter and a merged
  chronological feed.

## Capabilities

### New Capabilities
- `agent-artifacts`: Producing, persisting, and exposing the two reviewable
  artifacts an agent run yields — a unified patch and a commit bisect timeline —
  including the new agent actions required to create them.

### Modified Capabilities
- `frontend-workspace-ui`: The bisect timeline and diff panels gain a populated
  state driven by real backend data, and the activity feed gains a
  cross-session aggregated mode alongside today's single-session view.

## Impact

- **Agent**: `backend/app/services/agent/` — new action types in the parser and
  dispatcher, sandbox interaction for `git diff` and `git bisect`, and new
  session event types for each.
- **Persistence**: new tables or columns for patches and bisect commits, plus an
  Alembic migration.
- **API**: new routes under `/api/v1/sessions/{id}/patch` and
  `/api/v1/sessions/{id}/timeline`, owner-scoped, returning 404 for unowned
  sessions like the existing session and event reads.
- **Schemas**: new Pydantic/SQLModel read models, and matching TypeScript
  contracts in `frontend/src/lib/api/types.ts` with no `any` or index signatures.
- **Frontend**: `CommitTimelineScrubber.tsx` and `DiffReviewPanel.tsx` swap
  placeholders for fetched data; `activity/page.tsx` gains an aggregate mode.
- **Out of scope**: opening a real pull request, multi-agent review, and any
  change to the sandbox isolation guarantees in `agent-execution-loop`.
