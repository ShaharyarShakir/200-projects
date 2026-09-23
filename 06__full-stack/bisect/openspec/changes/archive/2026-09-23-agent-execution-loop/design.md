# Design: Agent Execution Loop

## Context

Bisect has built the `AgentProvider` (with `GroqProvider`), `PodmanSandbox` execution container, and GitHub integration infrastructure. See `proposal.md` for motivation and background.

This design specifies the architectural patterns and components needed to orchestrate an iterative agent execution loop where an LLM agent interacts safely with a sandboxed environment to inspect files and execute commands.

## Goals / Non-Goals

**Goals:**
- Provide typed Pydantic models for agent actions (`run_command`, `inspect_file`, `finish`) and action execution results.
- Implement robust parsing and validation for LLM-generated action payloads (including JSON markdown block extraction and schema validation).
- Implement an `ActionDispatcher` that executes approved actions strictly inside a `Sandbox` instance.
- Implement an `AgentExecutionLoop` coordinator that manages prompt building, turn history, provider completions, action execution, result feedback, and bounded termination.
- Ensure 100% isolation with zero unvalidated host execution.

**Non-Goals:**
- Handling Git commits, pull request creation, or multi-branch workspace syncing.
- Multi-agent or parallel swarm execution.
- Web UI streaming or WebSocket infrastructure.
- Complex autonomous multi-step planning heuristics outside the single agent loop.

## Decisions

### 1. Action Specification and Discriminated Schema Protocol
- **Decision**: Define actions as structured JSON schemas validated via Pydantic models (`RunCommandAction`, `InspectFileAction`, `FinishAction`) unified under a discriminated union or wrapper `AgentAction`.
- **Rationale**: Strict type checking with Pydantic ensures invalid parameters (e.g. missing commands, bad paths, unrecognized action types) are rejected before execution. JSON schemas can be injected cleanly into system prompts.
- **Alternatives Considered**:
  - *Custom XML/tag syntax (`<action>...</action>`)*: Requires custom regex/parsers and is harder to validate strictly compared to standard Pydantic JSON parsing.
  - *Provider-specific native Tool/Function Calling*: Locks implementation into specific vendor APIs, whereas normalized JSON actions work uniformly across Groq, Claude, OpenAI, and local models.

### 2. Action Dispatcher and Sandboxed Execution
- **Decision**: Introduce an `ActionDispatcher` responsible for dispatching validated actions to the sandbox:
  - `run_command`: executes `sandbox.execute(command)`
  - `inspect_file`: executes a safe container command (e.g. `cat <sanitized_path>` or read via container) and returns content or file-not-found error.
  - `finish`: signals completion to the loop runner without container execution.
- **Rationale**: Decouples action execution logic from loop management, simplifying testing with mock sandboxes and allowing seamless addition of future actions (e.g. file editing, test parsing).
- **Alternatives Considered**:
  - *Inline execution directly in the loop while-body*: Creates tight coupling, making unit testing and mocking complex.

### 3. Loop Coordinator (`AgentExecutionLoop`) Architecture
- **Decision**: Implement `AgentExecutionLoop` taking `AgentProvider`, `Sandbox`, and `LoopConfig` (max_iterations, timeout, max_consecutive_errors):
  1. Initialize conversation with system prompt and task instructions.
  2. In each iteration:
     - Request completion from `AgentProvider`.
     - Extract and validate action from response.
     - If invalid: record error, build feedback message, increment consecutive error counter.
     - If valid: dispatch action to sandbox, capture `ActionResult`, build feedback message, reset error counter.
     - If action is `finish` or limits reached: terminate and return `LoopResult`.
- **Rationale**: State machine design makes every step observable, testable, and cleanly bounded.
- **Alternatives Considered**:
  - *Recursive async generator*: Harder to track consecutive failure states and manage clean loop termination.

### 4. Robust Output Parsing & Error Recovery
- **Decision**: Provide an `ActionParser` helper that extracts JSON payloads from raw LLM output even when wrapped in markdown code blocks (` ```json ... ``` `) or surrounded by reasoning text. On parse or validation error, generate a structured feedback prompt instructing the agent on the exact syntax error so it can recover.
- **Rationale**: LLMs occasionally include conversational commentary alongside JSON. Lenient JSON extraction combined with strict schema validation minimizes unnecessary loop failures.
- **Alternatives Considered**:
  - *Strict raw-string JSON parsing only*: Fails frequently when LLMs include markdown fencing or introductory text.

## Risks / Trade-offs

- **[Risk] LLM hallucinating invalid JSON or non-existent action types**
  → *Mitigation*: Action parser catches JSON decoding and validation errors, creating a structured user error message (`"Invalid action: <error>. Supported actions: ...'`) returned to the model to prompt self-correction, bounded by `max_consecutive_errors`.

- **[Risk] Command execution hanging or timing out inside sandbox**
  → *Mitigation*: Each sandbox command inherits a per-action timeout (`timeout_seconds`), returning `timed_out=True` with exit code 124 rather than hanging the server process.

- **[Risk] Infinite loop leading to high API costs and resource exhaustion**
  → *Mitigation*: Hard bounding by `max_iterations` (default 10), per-step timeouts, and consecutive error thresholds that immediately halt execution.

- **[Risk] Escaping sandbox or path traversal via `inspect_file`**
  → *Mitigation*: Paths are validated and resolved relative to the container's `/workspace` directory; file inspection is executed strictly inside the Podman container without host filesystem access.
