# Proposal: Agent Execution Hardening

## Why

Phase 1C established the baseline execution loop connecting the LLM agent with the Podman sandbox. Before expanding Bisect's autonomous capabilities, the execution layer requires robust security controls, resource limits, observability, explicit human control, and guaranteed sandbox cleanup to prevent runaway executions, resource exhaustion, and security boundary leaks.

Enforcing these hardening measures now ensures that all future agent workflows operate within deterministic guardrails and observable boundaries.

## What Changes

* **Configurable Execution Limits**: Add application-level configuration for maximum agent iterations, maximum commands per execution run, per-command timeout limits, and maximum overall execution duration.
* **Execution Correlation & IDs**: Generate a unique execution ID (`execution_id`) for each agent run and propagate it through loop steps, results, and structured logs.
* **Structured Execution Logging**: Record structured events for agent actions, sandbox execution results, status transitions, and termination causes while ensuring secrets and sensitive credentials are never logged.
* **Deterministic Sandbox Cleanup**: Guarantee that sandbox containers and related resources are cleanly destroyed upon normal completion, limit breach, command timeout, or unhandled errors.
* **Enforced Host Isolation**: Ensure all agent commands and file inspections execute exclusively inside the isolated Podman sandbox container, strictly preventing direct host execution or path traversal.
* **Failure Handling & Terminal States**: Introduce clear, unambiguous loop termination statuses (`COMPLETED`, `MAX_ITERATIONS_REACHED`, `MAX_COMMANDS_EXCEEDED`, `TIMEOUT`, `CONSECUTIVE_ERRORS_EXCEEDED`, `FAILED`).
* **Human Control Preservation**: Explicitly preserve developer control by ensuring the execution loop performs only sandboxed analysis and testing, without initiating automatic Git commits, pull requests, merges, or deployments.
* **Security & Reliability Test Suite**: Add comprehensive unit and integration tests verifying execution limits, timeouts, sandbox cleanup, error handling, and security boundaries.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `agent-execution-loop`: Modify to include requirements for total duration timeout enforcement, maximum command count limits, execution ID correlation, structured execution logging, explicit termination states, and guaranteed sandbox lifecycle cleanup on completion or failure.

## Impact

- **Backend Configuration** (`backend/app/core/config.py`): Add default settings for agent execution limits (`AGENT_MAX_ITERATIONS`, `AGENT_MAX_COMMANDS`, `AGENT_COMMAND_TIMEOUT_SECONDS`, `AGENT_MAX_DURATION_SECONDS`).
- **Action & Loop Schemas** (`backend/app/schemas/actions.py`): Extend `LoopConfig` with `max_commands` and `max_duration_seconds`, add `MAX_COMMANDS_EXCEEDED` to `LoopStatus`, and attach `execution_id` to `LoopStep` and `LoopResult`.
- **Execution Loop Orchestration** (`backend/app/services/agent/loop.py`): Enforce command counts, overall time limits, execution ID generation, structured logging, and guaranteed sandbox cleanup via `finally` blocks.
- **Logging & Security** (`backend/app/core/logging.py`): Support structured log context with execution IDs and sensitive data redaction.
- **Test Suite** (`backend/tests/`): Add tests for security isolation, limit violations, timeout handling, and sandbox cleanup.
