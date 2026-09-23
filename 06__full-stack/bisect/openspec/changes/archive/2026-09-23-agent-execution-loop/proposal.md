# Proposal: Agent Execution Loop

## Why

Bisect has established the foundational AI provider (`GroqProvider`), isolated container sandbox (`PodmanSandbox`), and repository workspace management capabilities. However, there is currently no controlled execution loop connecting these components.

To autonomously analyze codebases and fix failing tests, Bisect requires a structured, safe feedback loop where an LLM agent can request discrete actions (such as running shell commands or inspecting files), have those actions strictly validated for safety, execute them inside the Podman sandbox, and receive structured feedback to decide its next step.

## What Changes

* Define a structured agent action schema and protocol (e.g. `run_command`, `inspect_file`, `finish`).
* Implement strict action validation to ensure LLM-generated requests conform to schema constraints and prevent unvalidated host execution.
* Implement an iterative execution loop (`AgentExecutionLoop` / `LoopRunner`) that drives the Groq ↔ validation ↔ Podman sandbox ↔ result feedback cycle.
* Normalize action execution results (stdout, stderr, exit code, file content, execution errors) and format them back into agent messages.
* Enforce deterministic loop termination conditions: agent explicit completion (`finish`), max iteration limits, timeout limits, and consecutive failure thresholds.
* Add comprehensive unit and integration tests covering action validation, sandboxed execution, error handling, and termination limits.

## Capabilities

### New Capabilities
- `agent-execution-loop`: Defines structured agent action models, pre-execution action validation, sandboxed execution via Podman, structured result formatting, bounded iterative loop orchestration, and termination handling.

### Modified Capabilities

## Impact

- **Backend Architecture**: Introduces `app/services/agent/actions.py`, `app/services/agent/loop.py`, and related Pydantic schemas in `app/schemas/agent.py` or `app/schemas/actions.py`.
- **Sandbox Integration**: Executes agent actions exclusively via `app.services.sandbox.base.Sandbox` (e.g. `PodmanSandbox`) without direct host shell access.
- **Provider Integration**: Integrates with `AgentProvider` (e.g. `GroqProvider`) via message sequences and structured action parsing.
- **Dependencies**: Uses existing dependencies (`pydantic`, `fastapi`, `pytest`, `pytest-asyncio`). No new external packages required.

## Non-Goals

- Automatic Git commits, branch creation, or GitHub pull request generation (deferred to later phases).
- Multi-agent collaboration or complex hierarchical agent swarms.
- Long-term persistent vector memory or embeddings.
- Frontend UI approval dialogs or interactive human-in-the-loop debugging during execution.
- Arbitrary unvalidated host-level execution or network access within the sandbox.
