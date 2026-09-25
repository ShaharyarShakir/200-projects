# Design

## Context

Bisect's agent execution loop (`AgentExecutionLoop` in `backend/app/services/agent/loop.py`) coordinates multi-turn LLM completions and sandbox execution. Prior to this change, loop execution tracked progress through temporary in-memory variables and generated an ad-hoc `LoopResult` at the end of execution without an explicit lifecycle state machine or formalized session model.

This design introduces a formal `AgentSession` model, a `SessionStatus` state machine with deterministic transition rules, and integration points with `AgentExecutionLoop` to maintain continuous execution state tracking.

See `proposal.md` for motivation and `specs/agent-session-state/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Provide a robust Pydantic v2 `AgentSession` model tracking session ID, task request, status, iteration count, executed action count, timestamps, termination reason, token usage, and step records.
- Implement an explicit state transition machine enforcing allowed transitions and rejecting invalid transitions with `InvalidStateTransitionError`.
- Ensure all execution loop termination paths (`finish`, max iterations, max commands, consecutive errors, timeouts, provider failures, unhandled exceptions) update the session state deterministically.
- Expose session state inspection and serialization without leaking sensitive credentials.

**Non-Goals:**
- Relational database persistence or Alembic migrations for sessions in this phase.
- Multi-agent or concurrent worker orchestration.
- Interactive user pause/resume mechanisms or frontend UI dashboards.

## Decisions

### 1. Model Structure and Placement
- **Choice**: Implement `AgentSession` and `SessionStatus` as Pydantic v2 models in `backend/app/schemas/session.py`.
- **Rationale**: Pydantic models provide strict type safety, automatic validation, easy serialization to dictionaries/JSON, and clean integration with existing agent schemas without imposing premature database schema dependencies.
- **Alternatives Considered**:
  - *SQLModel Database Table*: Direct SQLModel table with PostgreSQL persistence. Deferred per scope non-goals to maintain lightweight in-memory and API-level flexibility for Phase 2E.
  - *Extending LoopResult directly*: Overloading `LoopResult` to act as session state. Rejected because `LoopResult` represents the terminal output of a loop run, whereas `AgentSession` represents the live, evolving state of an execution task from creation through completion.

### 2. State Machine and Transition Rules
- **Choice**: Explicit `SessionStatus` enumeration with allowed transition mappings:
  - `created` -> `running`
  - `running` -> `completed` | `failed` | `terminated` | `timed_out`
  - Terminal statuses (`completed`, `failed`, `terminated`, `timed_out`) cannot transition to any status.
  - Encapsulate transitions through a `transition_to(target_status, reason=None)` method or explicit lifecycle helpers (`start()`, `complete()`, `fail()`, `terminate()`, `time_out()`).
- **Rationale**: Centralizing transition validation guarantees that invalid jumps (e.g., `created` -> `completed` or mutating a completed session) fail immediately with `InvalidStateTransitionError`.
- **Alternatives Considered**:
  - *Direct attribute mutation (`session.status = ...`)*: Rejected because it bypasses transition rules and risks inconsistent state.

### 3. Execution Loop Synchronization
- **Choice**: Update `AgentExecutionLoop.run()` to accept an optional `session: Optional[AgentSession] = None` or instantiate a new `AgentSession(task_prompt=...)`.
- **Rationale**: Allows callers to pre-create and inspect sessions or let the loop manage session lifecycle automatically. During loop execution, every step, error, and limit check immediately synchronizes with the bound session.
- **Alternatives Considered**:
  - *Post-hoc session population*: Creating session state only after loop completion. Rejected because it fails to capture live execution progress or state during mid-loop failures.

### 4. Secret Sanitization and Redaction
- **Choice**: Ensure `AgentSession` serialization and representation sanitize sensitive keys, tokens, or environment secrets in command outputs or error messages.
- **Rationale**: Prevents accidental leakage of credentials when sessions are logged or transmitted via API responses.

## Risks / Trade-offs

- **[Risk]** Unhandled exceptions in execution loop leaving session in an unfinished `running` state.
  - **Mitigation**: Wrap the main execution loop in a `try...except...finally` block that transitions the session to `failed` or `terminated` with the captured exception details before returning.
- **[Risk]** Redundant state tracking between `LoopResult` and `AgentSession`.
  - **Mitigation**: Align `LoopResult` properties with `AgentSession` or have `LoopResult` reference the `AgentSession` directly, ensuring consistency between loop outputs and session state.
- **[Risk]** Memory accumulation from long-running sessions with extensive step output.
  - **Mitigation**: Enforce per-step output size limits in dispatcher and loop configs.
