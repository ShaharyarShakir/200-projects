# Design

## Context

Bisect is an AI coding agent running inside a containerized development environment (Podman container on blendOS). To enable subsequent phases of automated patch generation and test repair loops, Bisect requires two decoupled foundational subsystems:
1. An LLM agent provider abstraction with an initial high-throughput implementation using Groq.
2. A sandboxed execution environment capable of creating and managing isolated ephemeral containers on the **host Podman daemon** via Unix domain socket without requiring nested container engines.

See `proposal.md` for motivation and scope boundaries.

## Goals / Non-Goals

**Goals:**
- Provide a clean, provider-agnostic `AgentProvider` abstraction with normalized request/response contracts and unified error hierarchies.
- Deliver an async `GroqProvider` leveraging Groq's low-latency inference models.
- Provide a `Sandbox` abstraction with structured `CommandResult` output (stdout, stderr, exit code, execution time, timeout flag).
- Provide a lightweight, asynchronous `PodmanClient` communicating directly with the host Podman daemon via Unix socket (`httpx` UDS transport).
- Ensure strict container isolation (memory caps, disabled network by default, execution timeouts, non-root workspaces).
- Ensure guaranteed container cleanup via async context managers (`async with`) and explicit teardown methods.

**Non-Goals:**
- Multi-step reasoning loops or autonomous retry algorithms (deferred to later agent orchestration changes).
- AI Tool/Function calling interfaces (deferred to tool-calling changes).
- Git repository clone/checkout workflows into sandboxes (deferred to GitHub integration changes).
- Nested Podman daemon execution within the dev container.

## Decisions

### 1. Direct Async UDS HTTP Client for Podman API over Heavy SDKs
- **Choice**: Implement `PodmanClient` using `httpx.AsyncClient` configured with `httpx.AsyncHTTPTransport(uds=socket_path)` against Podman's Docker-compatible / Libpod REST API.
- **Rationale**:
  - Eliminates heavy C/binary dependencies or sync-blocking client libraries (`docker-py`, `podman-py`) in an async FastAPI application.
  - Matches the project's existing asynchronous architecture and `httpx` stack.
  - Enables direct, fine-grained control over connection timeouts, health checks (`/_ping`), exec streams, and container lifecycles.
- **Alternatives Considered**:
  - *`docker-py`*: Blocking synchronous library requiring `run_in_executor` wrapping; inconsistent with modern async Python.
  - *`podman-py`*: Inconsistent maintenance, heavy dependency footprint, mixed async support.
  - *CLI subprocess calls (`podman run ...`)*: Fragile parsing of CLI stdout/stderr, high process spawn overhead, security risk with shell argument injection.

### 2. Provider Abstraction with Pydantic v2 Normalized Schemas
- **Choice**: Define strict Pydantic v2 models (`ChatMessage`, `CompletionRequest`, `CompletionResponse`, `TokenUsage`) and an abstract `AgentProvider` base class.
- **Rationale**:
  - Decouples downstream business logic from provider-specific response formats (Groq, Anthropic, OpenAI).
  - Enforces strict type validation and serialization consistency across the backend.
- **Alternatives Considered**:
  - *LangChain / LiteLLM*: Adds significant dependency overhead and abstraction bloat that violates our constraint for simple, explicit architecture.

### 3. Structured Command Result without Raising on Non-Zero Exit Codes
- **Choice**: Sandbox `execute()` returns a `CommandResult` object capturing `exit_code`, `stdout`, `stderr`, `duration_seconds`, and `timed_out` rather than raising exceptions for non-zero exit codes.
- **Rationale**:
  - In automated test execution and bisect loops, failing test commands (exit code > 0) are expected standard data to be inspected by the agent, not exceptional application failures.
  - Exceptions are reserved for infrastructure failures (daemon disconnect, container crash, timeout exhaustion).
- **Alternatives Considered**:
  - *Raising `CalledProcessError` on non-zero exit*: Requires noisy `try/except` blocks in normal test-running loops.

### 4. Ephemeral Sandbox Lifecycle and Workspace Layout
- **Choice**: Each sandbox instance manages a single container with a dedicated `/workspace` directory, stopped and forcefully removed on teardown (`force=True`).
- **Rationale**:
  - Prevents resource leaks and orphan containers on the host.
  - Async context manager pattern (`async with PodmanSandbox(...) as sandbox:`) guarantees cleanup even on unhandled errors.
- **Alternatives Considered**:
  - *Reusing long-lived warm containers*: State pollution between runs and complex reset mechanics.

## Risks / Trade-offs

- **[Host Podman Socket Availability]** → *Risk*: Podman socket may not be running or mounted inside the dev container at runtime.
  - *Mitigation*: Provide configurable `PODMAN_SOCKET` setting, sensible default paths (`/run/user/1000/podman/podman.sock`, `/var/run/podman/podman.sock`), and early connectivity health checks (`ping()`) with clear descriptive diagnostic errors (`SandboxConnectionError`).
- **[Hanging or Malicious Commands in Sandbox]** → *Risk*: Infinite loops or blocking test suites exhausting host resources.
  - *Mitigation*: Enforce mandatory per-command execution timeouts and memory/CPU limits in container configuration.
- **[Groq API Rate Limits / Outages]** → *Risk*: Upstream LLM rate limiting or service unavailability disrupting workflows.
  - *Mitigation*: Normalize errors into structured `AgentRateLimitError` and `AgentProviderError` with retry-after metadata.
- **[Secret Exposure in Logs and Errors]** → *Risk*: Leaking `GROQ_API_KEY` in error traces or logs.
  - *Mitigation*: Mask credentials in logs and exclude API keys from exception representations.
