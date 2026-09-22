# Tasks

## 1. Dependencies and Configuration

- [x] 1.1 Add `groq` to backend dependencies in `backend/pyproject.toml` and verify `uv sync` completes successfully.
- [x] 1.2 Add `GROQ_API_KEY`, `GROQ_MODEL`, and `PODMAN_SOCKET` to `backend/app/core/config.py` and `backend/.env.example` and verify settings load correctly.
- [x] 1.3 Add Agent and Sandbox domain exception classes to `backend/app/core/errors.py` and verify exception hierarchy unit tests pass.

## 2. Agent Provider Implementation

- [x] 2.1 Define normalized message and completion schemas (`ChatMessage`, `CompletionRequest`, `CompletionResponse`, `TokenUsage`) in `backend/app/schemas/agent.py` and verify validation tests pass.
- [x] 2.2 Implement `AgentProvider` abstract base class in `backend/app/services/agent/base.py` and verify class contracts.
- [x] 2.3 Implement `GroqProvider` in `backend/app/services/agent/groq.py` with parameter mapping and normalized exception handling, and verify unit tests pass with mocked Groq responses.
- [x] 2.4 Add provider factory and dependency injection helper in `backend/app/services/agent/__init__.py` and verify instantiation with configured settings.

## 3. Podman Sandbox Implementation

- [x] 3.1 Define `CommandResult`, `SandboxConfig`, and abstract `Sandbox` base class with async context manager support in `backend/app/services/sandbox/base.py` and verify schema validation.
- [x] 3.2 Implement `PodmanClient` in `backend/app/services/sandbox/client.py` using `httpx` async UDS transport with ping, container lifecycle, and exec endpoints, and verify unit tests with mocked socket responses pass.
- [x] 3.3 Implement `PodmanSandbox` in `backend/app/services/sandbox/podman.py` managing `/workspace` directory, container start/stop/remove, and command execution with timeout handling, and verify unit tests pass.

## 4. Verification and Testing

- [x] 4.1 Implement comprehensive unit tests in `backend/tests/test_agent_provider.py` covering Groq completion, parameter customization, missing API keys, authentication errors, and rate limits, and verify all tests pass.
- [x] 4.2 Implement comprehensive unit tests in `backend/tests/test_podman_sandbox.py` covering socket connection health, container lifecycle, command execution, stdout/stderr capture, exit codes, timeout handling, and context manager cleanup, and verify all tests pass.
- [x] 4.3 Run the full backend test suite with `pytest` and verify that all new and existing tests pass.
