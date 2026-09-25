# Proposal: Agent Execution Hardening

## Why

As Bisect connects the agent provider with the Podman execution sandbox through an iterative loop, the execution layer requires robust security controls, resource limits, observability, and deterministic lifecycle management. 

Without strict guardrails and execution limits enforced by Bisect, runaway agent loops, unconstrained command execution, unhandled timeouts, and leaked container resources can destabilize the host and cause resource exhaustion. Enforcing isolation boundaries, configurable execution constraints, structured event telemetry with correlation IDs, and reliable container teardown ensures safe, observable, and bounded agent operations.

## What Changes

* **Configurable Execution Limits**: Add application configuration settings and per-loop parameters for maximum agent iterations, maximum commands executed, per-command timeouts, maximum overall duration, and consecutive error thresholds.
* **Sandbox Isolation Guardrails**: Ensure all executable actions strictly dispatch inside the Podman container sandbox, prohibiting direct execution on the Bisect host or development environment.
* **Action Validation Restrictions**: Enforce strict schema validation and reject unsupported action types, malformed structures, or empty commands before execution.
* **Execution Observability & Correlation**: Assign a unique `execution_id` to each agent run and emit structured event logs for transitions, actions, results, errors, and termination states, while redacting sensitive tokens and credentials.
* **Deterministic Resource Teardown**: Guarantee sandbox container termination and cleanup across all completion states (success, limit exhaustion, timeout, error, or unhandled exceptions).
* **Explicit Human Control**: Preserve strict human oversight by keeping automated git commits, remote pushes, pull requests, and automated deployments out of scope for agent execution.
* **Comprehensive Test Suite**: Implement unit and integration tests verifying execution limits, timeout handling, security isolation, error recovery, and teardown reliability.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `agent-execution-loop`: Harden agent execution contracts to enforce configurable iteration, command, and duration limits, strict sandbox isolation prohibiting host execution, structured logging with correlation IDs and secret redaction, and deterministic container cleanup across all termination paths.

## Impact

- **Affected Systems**: `backend/app/services/agent/loop.py`, `backend/app/schemas/actions.py`, `backend/app/core/config.py`, `backend/app/core/logging.py`, `backend/app/services/agent/dispatcher.py`.
- **APIs & Data Models**: `LoopConfig`, `LoopResult`, `LoopStatus`, `LoopStep`, `ExecutionLogEvent`.
- **Dependencies**: Uses existing Python standard libraries (`uuid`, `time`, `logging`) and Pydantic v2 / SQLModel settings.
- **Non-Goals / Out of Scope**:
  - Automatic git commits, pull requests, or branch merges without human approval.
  - Multi-agent orchestration workflows.
  - Production infrastructure deployment or cloud container clusters.
  - Advanced dynamic permission escalation systems.
