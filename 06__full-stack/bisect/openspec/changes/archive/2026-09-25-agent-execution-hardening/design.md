# Design: Agent Execution Hardening

## Context

The agent execution loop orchestrates communication between the LLM provider (`AgentProvider`) and the Podman container sandbox (`Sandbox`). To ensure safe and bounded operation, the execution engine requires robust boundaries, deterministic lifecycle cleanup, configurable execution limits, and structured observability.

See `proposal.md` for motivation and background context.

## Goals / Non-Goals

**Goals:**
- Provide configurable execution boundaries (max iterations, max commands, command timeout, max overall duration, consecutive error threshold) in `Settings` and `LoopConfig`.
- Guarantee strict Podman isolation: all executable actions must run in the container sandbox with no direct host process access.
- Assign unique `execution_id` values to each run and emit structured event logs with automatic secret redaction.
- Guarantee deterministic container teardown on all exit paths via `finally` lifecycle blocks.
- Preserve explicit human control over git and deployment operations.

**Non-Goals:**
- Automated git commits, branch merges, pull requests, or CI/CD triggers.
- Multi-agent orchestration or distributed worker queues.
- Dynamic permission escalation workflows.

## Decisions

### Decision 1: Centralized Configuration in `Settings` with `LoopConfig` Overrides
- **Decision**: Define default execution limits in `backend/app/core/config.py` (`AGENT_MAX_ITERATIONS`, `AGENT_MAX_COMMANDS`, `AGENT_COMMAND_TIMEOUT_SECONDS`, `AGENT_MAX_DURATION_SECONDS`, `AGENT_MAX_CONSECUTIVE_ERRORS`) and allow per-execution overrides via `LoopConfig`.
- **Rationale**: Provides sensible environment-driven defaults while allowing specific workflows and test suites to configure tighter or looser limits.
- **Alternatives Considered**:
  - *Hardcoded constants*: Rejected due to inflexibility and difficulty in testing edge cases.
  - *Database-backed dynamic limits*: Rejected as premature complexity for Phase 1 MVP.

### Decision 2: Architectural Isolation via `ActionDispatcher` and Podman Sandbox
- **Decision**: Restrict all action execution to the `ActionDispatcher`, which only interfaces with `Sandbox.exec()` and `Sandbox.read_file()`. Host shell commands (`os.system`, `subprocess`) are strictly prohibited in the agent loop.
- **Rationale**: Isolating command execution to containerized sandboxes prevents host compromise, filesystem tampering, and container escapes.
- **Alternatives Considered**:
  - *Host execution with command allowlists/denylists*: Rejected because shell command parsing is inherently bypassable.

### Decision 3: Execution Correlation and Automated Secret Redaction
- **Decision**: Generate a unique `execution_id` (e.g. `exec_<uuid12>`) at loop initialization and propagate it across all steps, results, and structured log events via `log_agent_event()`. Implement regex-based masking in the logging utility to redact API keys, tokens, and Authorization headers.
- **Rationale**: Correlation IDs enable tracing across async operations, while automatic redaction ensures secrets are not exposed in logs or monitoring systems.
- **Alternatives Considered**:
  - *Unstructured string logging*: Rejected due to poor searchability and difficulty in programmatic inspection during tests.

### Decision 4: Deterministic Teardown in Loop `finally` Block
- **Decision**: Execute `await self._sandbox.cleanup()` inside the `finally` block of `AgentExecutionLoop.run()` (guarded by `auto_cleanup: bool = True`).
- **Rationale**: Guarantees container cleanup regardless of whether execution terminates normally, hits iteration/command/time limits, encounters validation failures, or raises unhandled exceptions.
- **Alternatives Considered**:
  - *Manual caller cleanup only*: Rejected because unhandled errors inside the loop could leak containers.

## Risks / Trade-offs

- **[Risk: Container cleanup failure leaves dangling containers]** → **Mitigation**: Wrap `sandbox.cleanup()` in a `try/except` block inside `finally`, log warnings with the `execution_id`, and ensure container creation uses auto-remove (`--rm`) or unique container naming for subsequent cleanup.
- **[Risk: Sensitive credentials in LLM output or command output leak into logs]** → **Mitigation**: Implement automated regex masking in `log_agent_event` for common secret patterns (`ghp_`, `sk-`, `Bearer `, `token=`).
- **[Risk: Loop timeout check only evaluated between iterations]** → **Mitigation**: Evaluate duration at the start of each iteration AND enforce per-command execution timeouts in `Sandbox.exec()`.
