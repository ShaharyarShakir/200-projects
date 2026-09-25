# Design: Agent Execution Hardening

## Context

The initial agent execution loop (`AgentExecutionLoop`) established basic iterative interaction between the LLM provider, action parser/validator, and the Podman sandbox. However, the execution layer lacks comprehensive safeguards:
- Execution limits only cover `max_iterations` and `max_consecutive_errors`, leaving total execution duration and cumulative sandbox commands unbounded.
- Runs lack unique correlation identifiers (`execution_id`) for tracing steps across logs and telemetry.
- Logs do not sanitize sensitive keys, tokens, or credentials.
- Sandbox container cleanup is handled ad-hoc rather than deterministically guaranteed on all exit paths (normal, limit breach, timeout, or uncaught exception).

See `proposal.md` for motivation and scope boundaries.

## Goals / Non-Goals

**Goals:**
- Enforce multidimensional execution limits: maximum iterations, cumulative command executions, per-command timeouts, and total loop duration timeouts.
- Provide full observability via unique execution IDs (`execution_id`) and structured logging with secret redaction.
- Guarantee deterministic sandbox container cleanup across all termination states via structured lifecycle management (`try...finally`).
- Introduce unambiguous loop termination states (`COMPLETED`, `MAX_ITERATIONS_REACHED`, `MAX_COMMANDS_EXCEEDED`, `TIMEOUT`, `CONSECUTIVE_ERRORS_EXCEEDED`, `FAILED`).
- Ensure all agent actions execute exclusively within the Podman sandbox without direct host execution or path traversal risks.

**Non-Goals:**
- Automated Git commits, pull requests, merges, or remote deployment (human control is preserved).
- Distributed or multi-agent execution clustering.
- Interactive human-in-the-loop approvals mid-execution (batch execution within bounded limits).

## Decisions

### Decision 1: Multidimensional Limit Configuration in Settings and LoopConfig
- **Choice**: Add centralized default configuration settings in `app.core.config.Settings`:
  - `AGENT_MAX_ITERATIONS: int = 10`
  - `AGENT_MAX_COMMANDS: int = 15`
  - `AGENT_COMMAND_TIMEOUT_SECONDS: int = 60`
  - `AGENT_MAX_DURATION_SECONDS: int = 300`
  - `AGENT_MAX_CONSECUTIVE_ERRORS: int = 3`
  These defaults initialize `LoopConfig` in `app.schemas.actions.py`, allowing per-run overrides.
- **Rationale**: Centralizes operational defaults in application environment configuration while permitting caller overrides for specific tasks.
- **Alternatives Considered**: Hardcoding limits in `loop.py` (inflexible for testing and varied workloads) or accepting unvalidated client parameters (unsafe).

### Decision 2: Unique Execution ID Generation & Correlation
- **Choice**: Generate a unique `execution_id` (`exec_<uuid4_hex[:12]>` or full UUID) at the beginning of `AgentExecutionLoop.run()` (or accept an optional caller-supplied ID). Propagate `execution_id` to `LoopResult`, every `LoopStep`, and all emitted log records.
- **Rationale**: Enables end-to-end tracing and correlation of multi-turn completions, validation errors, container executions, and terminal outcomes.
- **Alternatives Considered**: Using container IDs (containers may be created after loop initialization or fail to start) or sequential integers (collisions across concurrent runs).

### Decision 3: Deterministic Sandbox Cleanup via `try...finally` Lifecycle
- **Choice**: Wrap the execution loop logic in a `try...finally` block in `AgentExecutionLoop.run()` that invokes `await self._sandbox.cleanup()` if sandbox cleanup is managed by the loop, or ensure caller context management cleanly tears down resources.
- **Rationale**: Guarantees sandbox container destruction on all exit paths, including normal completion, limit exhaustion, command timeouts, and unhandled exceptions.
- **Alternatives Considered**: Manual cleanup at each return statement (fragile and prone to container leaks when unhandled exceptions occur).

### Decision 4: Sensitive Data Redaction in Structured Logging
- **Choice**: Implement a sanitization utility (`sanitize_log_data`) that redacts configured secret values (`GROQ_API_KEY`, `ENCRYPTION_SECRET_KEY`, `JWT_SECRET_KEY`, GitHub tokens) and regex patterns matching Bearer tokens and API keys before logging.
- **Rationale**: Prevents accidental leakage of credentials and authentication tokens into persistent logs, console streams, or telemetry.
- **Alternatives Considered**: Raw unstructured logging (security risk) or omitting command/action details entirely (severely impairs debugging).

### Decision 5: Explicit Terminal Status Enumeration
- **Choice**: Expand `LoopStatus` enum in `app.schemas.actions.py`:
  - `COMPLETED = "completed"`
  - `MAX_ITERATIONS_REACHED = "max_iterations_reached"`
  - `MAX_COMMANDS_EXCEEDED = "max_commands_exceeded"`
  - `TIMEOUT = "timeout"`
  - `CONSECUTIVE_ERRORS_EXCEEDED = "consecutive_errors_exceeded"`
  - `FAILED = "failed"`
- **Rationale**: Clear, distinct status values simplify client-side polling status evaluation and downstream run state tracking.
- **Alternatives Considered**: Lumping all limit breaches into a single `FAILED` status (loses actionable context).

## Risks / Trade-offs

- **[Risk] Premature loop timeout on resource-constrained hosts** → *Mitigation*: Provide sensible default timeouts (300s total duration, 60s per command) with configurable overrides via `Settings` and `LoopConfig`.
- **[Risk] Container leak on catastrophic process termination (SIGKILL)** → *Mitigation*: Podman containers are created with auto-removal flags (`--rm`) where supported, supplemented by async `cleanup()` in Python `finally` blocks.
- **[Risk] Secret leakage in LLM conversational memory or tool outputs** → *Mitigation*: Centralized redaction filter inspects text payloads before structured logging; sensitive tokens are never injected into system prompts.
- **[Risk] Agent infinite retry loops with alternating errors** → *Mitigation*: Bounded by both `max_iterations` and `max_commands` limits in addition to `max_consecutive_errors`.
