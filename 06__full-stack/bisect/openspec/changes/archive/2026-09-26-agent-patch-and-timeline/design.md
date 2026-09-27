# Design

## Context

The workspace already renders a bisect timeline and a patch diff panel, and
both are complete renderers driven entirely by props — they were reduced to
"not available yet" states only because no data source exists. The blocking
constraint is upstream: the agent's action vocabulary is `run_command`,
`inspect_file`, and `finish`, so the agent cannot currently edit a file, emit a
diff, or drive `git bisect`. Adding read endpoints before the producing
capability exists would deliver empty panels behind real URLs.

The `Run`/`RunStep` models already carry `PATCHING`, `APPLYING`, and
`GENERATE_PATCH` lifecycle values, so the domain vocabulary predates the agent
session loop. This change brings the live loop in line with that vocabulary
rather than inventing a parallel one.

## Goals / Non-Goals

**Goals:**
- Let the agent produce a patch and a bisect timeline, persist both against the
  session, and expose them through owner-scoped reads.
- Reuse the existing event, redaction, and ownership machinery rather than
  building a second path.
- Leave the two panels' rendering and interaction code untouched.
- Give `/activity` a cross-session aggregate mode without regressing the
  single-session view.

**Non-Goals:**
- Opening a pull request, or any write to a remote repository.
- Review, approval, or rejection workflows for a patch.
- Changing sandbox isolation guarantees, timeouts, or resource limits.
- Retro-fitting the older `Run`/`RunStep` models to the new artifact storage.

## Decisions

**Extend the action vocabulary rather than special-casing the loop.** `generate_patch`
and `run_bisect` become ordinary parsed actions alongside the existing three, so
they inherit the loop's validation, dispatch, event emission, and bounded
termination for free. The alternative — reaching into the loop for patch
collection — would bypass the safety guardrails that every other action passes
through, which is the one thing this codebase is most careful about.

**Store the patch as a single opaque blob, the timeline as ordered rows.** A patch
is written once and read whole, so it needs no query surface; a bisect timeline is
read as an ordered sequence and grows per commit, so it is modelled as rows
keyed by session and evaluation index. Splitting the timeline into rows also
means a long run can be read without loading a large document.

**Sequence is assigned by the backend, never by the client.** Consistent with the
existing session event contract, ordering is a server concern so a client cannot
reorder history. This is the same reasoning that made `category` server-derived.

**Two read endpoints, not one polymorphic one.** `/patch` and `/timeline` return
different shapes with different natural empty states (empty diff vs. absent
timeline). A single endpoint would force both into one nullable envelope and
make the frontend's two panels guess at meaning.

**Reuse the existing redaction projection.** Artifact content passes through the
same sanitizer as session events, because a diff or a commit message can contain
a credential just as easily as a command's stdout.

**Aggregation is a query option, not a new feed.** The activity view gains an
"all sessions" mode that requests events across the user's sessions with an
optional session filter, reusing the existing event read model. A separate
aggregate endpoint returning a different shape would double the frontend's
event-handling code for no gain.

**Panel placeholders are removed only when a real endpoint exists.** Until each
endpoint lands, its panel keeps the explicit unavailable state. The rendering
code stays covered by tests that pass data as props, so the swap is a wiring
change rather than a rewrite.

## Risks / Trade-offs

- **`git bisect` needs a known-good and known-bad commit.** Without them the
  action cannot start. The design treats this as an action-level precondition
  that fails with a structured error, rather than guessing revisions.
- **`git bisect` mutates repository state inside the sandbox.** It must reset
  afterwards, or a later action observes a detached HEAD at a bisect midpoint.
  Cleanup belongs with the existing deterministic teardown, not ad hoc.
- **A patch is unbounded in size.** A large refactor could produce a diff big
  enough to be a real response-size problem. This change records and returns the
  patch as-is; truncation or pagination is deliberately deferred until there is
  evidence it is needed, and the limit is noted rather than silently assumed.
- **Aggregation raises query cost** as a user's session count grows. Bounded by
  the existing per-request event limit; an explicit cross-session cap may be
  needed later.
- **Two new action types widen the agent's capability surface**, which is the
  main security consideration. Both are sandbox-confined and must pass the same
  pre-execution validation as every other action.
