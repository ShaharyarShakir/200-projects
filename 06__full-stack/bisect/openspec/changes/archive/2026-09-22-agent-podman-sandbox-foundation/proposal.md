# Proposal

## Why

Bisect requires two foundational capabilities to enable its AI-assisted development workflow:
1. An AI agent provider abstraction to interface with LLM inference engines (with Groq as the initial fast inference provider).
2. A sandbox abstraction to run isolated test suites and commands safely on host-managed Podman containers without running nested container runtimes.

Establishing these modular abstractions and concrete implementations now provides the necessary building blocks for automated code patch generation, test execution, and repair loops in subsequent phases.

## What Changes

### Agent Provider
- Add an `AgentProvider` abstract base class defining standard LLM completion interfaces.
- Implement `GroqProvider` using Groq's API client (`groq` / HTTP client) for high-speed inference.
- Define normalized request and response schemas (messages, model configuration, token usage, completion responses).
- Support configuration for `GROQ_API_KEY` and `GROQ_MODEL` via application settings.
- Normalize provider-specific errors (rate limits, authentication failures, API errors) into unified domain exceptions.

### Podman Sandbox
- Add a `Sandbox` abstract base class defining container lifecycle and command execution interfaces.
- Add a `PodmanClient` utility to communicate with the host Podman daemon via Unix socket (`PODMAN_SOCKET`, e.g., `/run/user/1000/podman/podman.sock` or `/var/run/podman/podman.sock`).
- Implement `PodmanSandbox` providing isolated execution environments using pre-built base images.
- Provide a dedicated `/workspace` directory inside sandbox containers for repository files and test runs.
- Execute commands inside the sandbox with strict timeouts, capturing `stdout`, `stderr`, `exit_code`, `duration_seconds`, and `timed_out` indicators.
- Implement robust container lifecycle management ensuring containers are reliably stopped and removed upon cleanup.

## Capabilities

### New Capabilities
- `agent-provider`: Abstract LLM provider interface and concrete Groq provider implementation with normalized request/response schemas, error handling, and configuration.
- `podman-sandbox`: Abstract sandbox interface, host Podman API socket client, and Podman container lifecycle and command execution management with resource limits and timeout handling.

### Modified Capabilities
*(None)*

## Non-Goals & Out-of-Scope

- **Autonomous Agent Loops**: Loop orchestration, multi-turn reasoning, and convergence heuristics are deferred to later changes.
- **AI Tool Calling**: Function calling and structured tool execution protocols will be added in a future change.
- **GitHub Repo Checkout to Sandbox**: Automated cloning of repositories into `/workspace` via GitHub tokens is handled in integration changes.
- **Automated Patch Application**: Parsing unified diffs and applying code patches inside sandbox workspaces will be addressed separately.
- **Git Commit and Pull Request Automation**: Committing fixes and submitting pull requests will be built on top of these foundations in later phases.
- **Nested Podman Daemon**: Running a Podman daemon inside the Bisect dev container is strictly out of scope; communication must route to the host Podman socket.

## Impact

- **Backend Dependencies**: Addition of `groq` SDK, `httpx` (for socket transport or async HTTP to Podman API) or `docker`/`podman` client library in `backend/pyproject.toml`.
- **Backend Architecture**: New services/modules under `backend/app/services/agent/` and `backend/app/services/sandbox/` (or `backend/app/core/sandbox/`).
- **Configuration**: Addition of `GROQ_API_KEY`, `GROQ_MODEL`, and `PODMAN_SOCKET` settings in `backend/app/core/config.py` and `.env.example`.
- **Security**: Strict isolation enforcement in sandboxes (network isolation, memory limits, read-only root filesystems where appropriate, non-root user execution).
