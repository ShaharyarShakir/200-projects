# Tasks

## 1. Session Models & State Machine Definition

- [x] 1.1 Implement `SessionStatus` enum (`created`, `running`, `completed`, `failed`, `terminated`, `timed_out`) and `InvalidStateTransitionError` exception in `backend/app/core/errors.py`.
- [x] 1.2 Implement `AgentSession` model in `backend/app/schemas/session.py` tracking session ID, task prompt, status, iteration count, executed action count, timestamps, termination reason, step history, and token usage with strict state transition methods (`transition_to`, `start`, `complete`, `fail`, `terminate`, `time_out`, `record_step`).
- [x] 1.3 Implement secret sanitization and serialization methods on `AgentSession` to prevent credential exposure in state exports.

## 2. Unit Testing State Transitions & Session Model

- [x] 2.1 Implement unit tests in `backend/tests/test_agent_session.py` verifying session initialization, valid state transitions, and step/action recording.
- [x] 2.2 Implement unit tests in `backend/tests/test_agent_session.py` verifying that invalid state transitions (e.g., `created` -> `completed`, transitions from terminal states) raise `InvalidStateTransitionError`.
- [x] 2.3 Implement unit tests in `backend/tests/test_agent_session.py` verifying secret redaction and clean dictionary/JSON serialization of `AgentSession`.

## 3. Execution Loop Integration

- [x] 3.1 Update `AgentExecutionLoop` in `backend/app/services/agent/loop.py` to bind to an `AgentSession` (accepting an optional existing session or creating a new one) and transition to `running` on startup.
- [x] 3.2 Update `AgentExecutionLoop` to record steps, errors, and action results directly against the bound `AgentSession`, updating iteration and executed action counters on each step.
- [x] 3.3 Ensure all termination pathways (`finish` action, max iterations, max commands, consecutive errors, timeouts, provider failures, unhandled exceptions) update the `AgentSession` with its final status, completion timestamp, and termination reason.
- [x] 3.4 Update `LoopResult` in `backend/app/schemas/actions.py` to include or reference the `AgentSession` snapshot.

## 4. Integration Verification & Regression Testing

- [x] 4.1 Update and expand `backend/tests/test_agent_execution_loop.py` and `backend/tests/test_agent_execution_hardening.py` to verify `AgentSession` tracking across full mock execution cycles.
- [x] 4.2 Run backend test suite via `pytest` to confirm all tests pass and ensure no regressions across existing modules.
