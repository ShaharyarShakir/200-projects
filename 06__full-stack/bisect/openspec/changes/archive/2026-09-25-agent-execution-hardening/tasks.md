# Tasks

## 1. Configuration & Data Models

- [x] 1.1 Add configurable agent execution limits (`AGENT_MAX_ITERATIONS`, `AGENT_MAX_COMMANDS`, `AGENT_COMMAND_TIMEOUT_SECONDS`, `AGENT_MAX_DURATION_SECONDS`, `AGENT_MAX_CONSECUTIVE_ERRORS`) to `backend/app/core/config.py` and verify settings load with defaults.
- [x] 1.2 Update action schemas in `backend/app/schemas/actions.py` to include `LoopConfig`, `LoopStatus` termination enums (`MAX_ITERATIONS_REACHED`, `MAX_COMMANDS_EXCEEDED`, `TIMEOUT`, `CONSECUTIVE_ERRORS_EXCEEDED`), `LoopStep`, and `LoopResult` with `execution_id`. Verify with unit tests.

## 2. Structured Logging & Secret Redaction

- [x] 2.1 Implement `log_agent_event` and secret/token redaction filter in `backend/app/core/logging.py` to sanitize API keys, tokens, and Authorization headers. Verify redaction with unit tests.
- [x] 2.2 Integrate structured event logging across `AgentExecutionLoop` for loop start, iterations, completions, limit breaches, errors, and teardown events.

## 3. Execution Guardrails & Sandbox Teardown

- [x] 3.1 Enforce strict sandbox isolation in `ActionDispatcher` and `AgentExecutionLoop`, ensuring actions only dispatch to the Podman container sandbox and never spawn host processes.
- [x] 3.2 Implement execution limit evaluation (max iterations, max commands, duration timeout, consecutive errors) in `AgentExecutionLoop.run()`.
- [x] 3.3 Implement deterministic sandbox cleanup in the `finally` block of `AgentExecutionLoop.run()` ensuring container teardown occurs on success, limits reached, timeouts, or unhandled exceptions.

## 4. Verification & Testing

- [x] 4.1 Write comprehensive tests in `backend/tests/test_agent_execution_hardening.py` verifying limit enforcement, timeouts, consecutive error termination, isolation, and container teardown.
- [x] 4.2 Run test suite with `uv run pytest` in the backend directory and verify 100% pass rate.
