# Proposal

## Why

Currently, Bisect's agent execution loop coordinates multi-turn LLM interactions and sandbox execution in-memory using ad-hoc counters and loop step records. Without a formalized session state layer and explicit lifecycle state machine, tracking task progress, recording execution history, enforcing deterministic state transitions, and querying or resuming execution state is prone to inconsistency.

Introducing a formal `AgentSession` model and state machine provides a robust contract for session tracking from initiation to completion, ensuring structured auditing, state validation, and reliable transition management across all execution outcomes.

## What Changes

- Introduce `AgentSession` and `SessionStatus` models representing the lifecycle and state of an agent task execution.
- Define explicit lifecycle states: `created`, `running`, `completed`, `failed`, `terminated`, and `timed_out`.
- Implement a state transition validation mechanism that enforces valid transitions and rejects invalid lifecycle mutations.
- Track session-level metadata including session ID, task description, status, iteration count, executed action count, start/finish timestamps, and termination reason.
- Store structured action records and execution results against the session.
- Integrate session state management with `AgentExecutionLoop` so the loop binds to an `AgentSession`, updates state on each iteration/action, and finalizes session state on termination (completion, action failure, timeout, limit exhaustion, unexpected error).
- Ensure session state models and representations sanitize or omit secrets and sensitive credentials.
- Add comprehensive test suites verifying valid state transitions, invalid transition rejections, and execution loop session synchronization.

## Capabilities

### New Capabilities
- `agent-session-state`: Defines the data model, lifecycle states (`created`, `running`, `completed`, `failed`, `terminated`, `timed_out`), state transition rules, action/result storage, and state access/update contracts for agent execution sessions.

### Modified Capabilities
- `agent-execution-loop`: Update loop orchestration requirements to bind execution to an `AgentSession`, update session counters/state during each step, and set deterministic final session state and termination reasons upon loop exit.

## Non-Goals

- Persistent relational database storage or migration in this phase (sessions can be maintained in-memory or through structured state objects without requiring DB tables).
- Multi-agent collaboration or distributed session management.
- Git commits, branch creation, or automated PR generation.
- Interactive human approval or UI-driven pause/resume workflows.
- Long-term memory or vector database persistence.

## Impact

- `backend/app/schemas/`: New or updated schemas for `AgentSession`, `SessionStatus`, `SessionStep`/`SessionActionRecord`, and transition errors.
- `backend/app/services/agent/`: Updates to `AgentExecutionLoop` and potential helper session managers to bind and update `AgentSession` instances.
- `backend/tests/`: New test files for session lifecycle, valid/invalid state transitions, and execution loop session tracking.
