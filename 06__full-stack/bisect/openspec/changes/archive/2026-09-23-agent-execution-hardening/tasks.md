# Tasks: Agent Execution Hardening

## 1. Configuration & Domain Schemas

- [x] 1.1 Update `app.core.config.Settings` with default agent execution limit settings (`AGENT_MAX_ITERATIONS`, `AGENT_MAX_COMMANDS`, `AGENT_COMMAND_TIMEOUT_SECONDS`, `AGENT_MAX_DURATION_SECONDS`, `AGENT_MAX_CONSECUTIVE_ERRORS`) and verify via settings unit tests.
- [x] 1.2 Extend `LoopConfig` with `max_commands` and `max_duration_seconds`, add `MAX_COMMANDS_EXCEEDED` to `LoopStatus`, and add `execution_id` to `LoopStep` and `LoopResult` in `app.schemas.actions.py`, verifying schema validation via unit tests.

## 2. Observability & Secret Redaction

- [x] 2.1 Implement log secret masking/sanitization utility in `app.core.logging` and verify that sensitive keys, tokens, and credentials are redacted from structured log records via unit tests.
- [x] 2.2 Add execution ID generation and correlation support to `AgentExecutionLoop` and verify `execution_id` is propagated across all loop steps, results, and emitted logs.

## 3. Limit Enforcement & Failure Handling

- [x] 3.1 Implement cumulative command count limit enforcement (`max_commands`) in `AgentExecutionLoop` and verify `MAX_COMMANDS_EXCEEDED` status is returned when exceeded.
- [x] 3.2 Implement total execution duration timeout enforcement (`max_duration_seconds`) in `AgentExecutionLoop` and verify `TIMEOUT` status is returned when exceeded.
- [x] 3.3 Ensure provider failures and unexpected runtime exceptions produce structured `FAILED` status results with accurate duration and error diagnostics.

## 4. Deterministic Sandbox Teardown & Isolation

- [x] 4.1 Implement guaranteed `try...finally` sandbox cleanup in `AgentExecutionLoop` and verify container cleanup executes on normal completion, limit breach, timeout, and exceptions.
- [x] 4.2 Verify action dispatcher enforces strict sandbox isolation, routing all commands exclusively to the sandbox container and rejecting unauthorized or malformed action payloads.

## 5. Security & Reliability Test Suite

- [x] 5.1 Add comprehensive unit tests in `backend/tests/test_agent_execution_hardening.py` covering all execution limit breaches (`max_iterations`, `max_commands`, `max_duration_seconds`, `max_consecutive_errors`) and terminal statuses.
- [x] 5.2 Add unit tests verifying deterministic sandbox cleanup lifecycle and teardown guarantees across success and error pathways.
- [x] 5.3 Add unit tests verifying execution ID correlation tracking and sensitive credential redaction in execution logs.
- [x] 5.4 Run the full backend test suite (`pytest`) to confirm zero regressions across all existing tests.
