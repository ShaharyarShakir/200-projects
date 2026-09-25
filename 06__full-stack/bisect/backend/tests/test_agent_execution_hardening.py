import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import Settings, settings
from app.core.logging import log_agent_event, sanitize_log_data
from app.schemas.actions import (
    CommandActionResult,
    InspectFileActionResult,
    LoopConfig,
    LoopResult,
    LoopStatus,
    LoopStep,
    RunCommandAction,
    InspectFileAction,
    FinishAction,
)
from app.schemas.agent import CompletionResponse, TokenUsage
from app.services.agent.base import AgentProvider
from app.services.agent.dispatcher import ActionDispatcher
from app.services.agent.loop import AgentExecutionLoop
from app.services.sandbox.base import CommandResult, Sandbox


class MockAgentProvider(AgentProvider):
    """Mock provider returning scripted responses."""

    def __init__(self, responses: list[str]):
        self._responses = list(responses)
        self._call_count = 0

    @property
    def name(self) -> str:
        return "mock-hardening-provider"

    @property
    def model_name(self) -> str:
        return "mock-hardening-model"

    async def complete(self, request) -> CompletionResponse:
        if not self._responses:
            raise RuntimeError("No more mocked responses available")
        content = self._responses.pop(0)
        self._call_count += 1
        return CompletionResponse(
            content=content,
            model=self.model_name,
            usage=TokenUsage(prompt_tokens=15, completion_tokens=10, total_tokens=25),
        )


class MockFailingProvider(AgentProvider):
    """Mock provider that always raises an error."""

    @property
    def name(self) -> str:
        return "mock-failing-provider"

    @property
    def model_name(self) -> str:
        return "mock-failing-provider"

    async def complete(self, request) -> CompletionResponse:
        raise ConnectionError("Groq API rate limit reached")


class MockSandbox(Sandbox):
    """Mock sandbox tracking calls and cleanup."""

    def __init__(self):
        super().__init__()
        self.cleanup_called = False
        self.executed_commands = []
        self._is_running = True

    @property
    def container_id(self) -> str:
        return "mock-container-hardened-123"

    @property
    def is_running(self) -> bool:
        return self._is_running

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    async def cleanup(self) -> None:
        self.cleanup_called = True
        self._is_running = False

    async def execute(self, command, timeout=None, workdir=None, env=None) -> CommandResult:
        self.executed_commands.append(command)
        return CommandResult(exit_code=0, stdout="mock output", stderr="", duration_seconds=0.05)


# ==============================================================================
# 1. Configuration & Domain Schemas Tests
# ==============================================================================


def test_settings_agent_execution_limits():
    """Verify default Settings contains the expected agent execution limits."""
    s = Settings()
    assert s.AGENT_MAX_ITERATIONS == 10
    assert s.AGENT_MAX_COMMANDS == 15
    assert s.AGENT_COMMAND_TIMEOUT_SECONDS == 60
    assert s.AGENT_MAX_DURATION_SECONDS == 300
    assert s.AGENT_MAX_CONSECUTIVE_ERRORS == 3


def test_loop_config_and_status_schemas():
    """Verify LoopConfig accepts new limits and LoopStatus has all terminal states."""
    cfg = LoopConfig(
        max_iterations=5,
        max_commands=8,
        step_timeout_seconds=30,
        max_duration_seconds=120,
        max_consecutive_errors=2,
    )
    assert cfg.max_iterations == 5
    assert cfg.max_commands == 8
    assert cfg.step_timeout_seconds == 30
    assert cfg.max_duration_seconds == 120
    assert cfg.max_consecutive_errors == 2

    # Verify LoopStatus enum values
    assert LoopStatus.RUNNING.value == "running"
    assert LoopStatus.COMPLETED.value == "completed"
    assert LoopStatus.MAX_ITERATIONS_REACHED.value == "max_iterations_reached"
    assert LoopStatus.MAX_COMMANDS_EXCEEDED.value == "max_commands_exceeded"
    assert LoopStatus.TIMEOUT.value == "timeout"
    assert LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED.value == "consecutive_errors_exceeded"
    assert LoopStatus.FAILED.value == "failed"


def test_loop_step_and_result_execution_id():
    """Verify LoopStep and LoopResult support execution_id correlation."""
    step = LoopStep(
        iteration=1,
        execution_id="exec_test_001",
        raw_response='{"action": "finish"}',
    )
    assert step.execution_id == "exec_test_001"

    result = LoopResult(
        status=LoopStatus.COMPLETED,
        total_iterations=1,
        execution_id="exec_test_001",
        steps=[step],
    )
    assert result.execution_id == "exec_test_001"
    assert len(result.steps) == 1
    assert result.steps[0].execution_id == "exec_test_001"


# ==============================================================================
# 2. Observability & Secret Redaction Tests
# ==============================================================================


def test_secret_sanitization_patterns():
    """Verify sanitize_log_data redacts token formats and sensitive keys."""
    # Test token strings
    github_token = "ghp_1234567890abcdef1234567890abcdef"
    bearer = f"Bearer {github_token}"
    groq_key = "gsk_1234567890abcdef1234567890abcdef"
    anthropic_key = "sk-ant-api03-1234567890abcdef1234567890abcdef"

    assert sanitize_log_data(github_token) == "[REDACTED]"
    assert sanitize_log_data(bearer) == "[REDACTED]"
    assert sanitize_log_data(groq_key) == "[REDACTED]"
    assert sanitize_log_data(anthropic_key) == "[REDACTED]"

    # Test dictionary with sensitive keys
    payload = {
        "api_key": "raw_secret_value",
        "nested": {
            "token": "nested_token",
            "safe_key": "safe_value",
        },
        "command": "pytest -v",
        "items": ["safe_str", f"Authorization: {bearer}"],
    }

    sanitized = sanitize_log_data(payload)
    assert sanitized["api_key"] == "[REDACTED]"
    assert sanitized["nested"]["token"] == "[REDACTED]"
    assert sanitized["nested"]["safe_key"] == "safe_value"
    assert sanitized["command"] == "pytest -v"
    assert sanitized["items"][0] == "safe_str"
    assert "[REDACTED]" in sanitized["items"][1]


def test_log_agent_event_execution(caplog):
    """Verify log_agent_event emits structured log records with execution ID."""
    with caplog.at_level("INFO"):
        log_agent_event(
            execution_id="exec_obs_123",
            event_type="test_event",
            details={"api_key": "secret123", "command": "echo test"},
        )

    assert any(
        "[AGENT-EXEC:exec_obs_123]" in record.message
        and "test_event" in record.message
        and "[REDACTED]" in record.message
        and "secret123" not in record.message
        for record in caplog.records
    )


# ==============================================================================
# 3. Limit Enforcement & Failure Handling Tests
# ==============================================================================


@pytest.mark.asyncio
async def test_max_commands_limit_enforcement():
    """Verify loop terminates with MAX_COMMANDS_EXCEEDED when cumulative commands exceed limit."""
    provider = MockAgentProvider([
        '{"action": "run_command", "command": "echo 1"}',
        '{"action": "run_command", "command": "echo 2"}',
        '{"action": "run_command", "command": "echo 3"}',
        '{"action": "finish", "message": "done"}',
    ])
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=10, max_commands=2)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    result = await loop.run("Run multiple commands")

    assert result.status == LoopStatus.MAX_COMMANDS_EXCEEDED
    assert "maximum command execution limit of 2" in result.final_message
    assert len(sandbox.executed_commands) == 2
    assert sandbox.cleanup_called is True


@pytest.mark.asyncio
async def test_overall_duration_timeout_enforcement():
    """Verify loop halts with TIMEOUT when max_duration_seconds is breached."""
    provider = MockAgentProvider([
        '{"action": "run_command", "command": "echo 1"}',
        '{"action": "run_command", "command": "echo 2"}',
    ])
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=10, max_duration_seconds=1)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    # Mock time.monotonic to simulate elapsed duration > max_duration_seconds
    initial_time = 100.0
    call_count = 0

    def mock_monotonic():
        nonlocal call_count
        call_count += 1
        # On subsequent calls, return time past the 1s limit
        if call_count > 1:
            return initial_time + 5.0
        return initial_time

    with patch("time.monotonic", side_effect=mock_monotonic):
        result = await loop.run("Run with simulated duration timeout")

    assert result.status == LoopStatus.TIMEOUT
    assert "exceeded maximum overall duration" in result.final_message
    assert sandbox.cleanup_called is True


@pytest.mark.asyncio
async def test_max_iterations_limit_enforcement():
    """Verify loop halts with MAX_ITERATIONS_REACHED when iterations exceed limit."""
    provider = MockAgentProvider([
        '{"action": "run_command", "command": "echo 1"}',
        '{"action": "run_command", "command": "echo 2"}',
    ])
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=2, max_commands=10)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    result = await loop.run("Run past max iterations")

    assert result.status == LoopStatus.MAX_ITERATIONS_REACHED
    assert result.total_iterations == 2
    assert sandbox.cleanup_called is True


@pytest.mark.asyncio
async def test_consecutive_errors_limit_enforcement():
    """Verify loop halts with CONSECUTIVE_ERRORS_EXCEEDED when consecutive error threshold is met."""
    provider = MockAgentProvider([
        "invalid json response 1",
        "invalid json response 2",
        "invalid json response 3",
    ])
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=10, max_consecutive_errors=2)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    result = await loop.run("Test consecutive errors")

    assert result.status == LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED
    assert "Consecutive action errors limit" in result.final_message
    assert sandbox.cleanup_called is True


@pytest.mark.asyncio
async def test_provider_failure_handling():
    """Verify loop handles provider failure and returns FAILED status cleanly."""
    provider = MockFailingProvider()
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run("Test provider failure")

    assert result.status == LoopStatus.FAILED
    assert "Agent provider failure" in result.final_message
    assert len(result.steps) == 1
    assert "Provider completion failed" in result.steps[0].error
    assert sandbox.cleanup_called is True


@pytest.mark.asyncio
async def test_unhandled_exception_handling():
    """Verify loop handles unexpected exceptions during execution and cleans up sandbox."""
    provider = MockAgentProvider(['{"action": "run_command", "command": "echo 1"}'])
    sandbox = MockSandbox()
    dispatcher = MagicMock(spec=ActionDispatcher)
    dispatcher.dispatch = AsyncMock(side_effect=RuntimeError("Catastrophic dispatcher error"))

    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, dispatcher=dispatcher)

    result = await loop.run("Test dispatcher exception")

    assert result.status == LoopStatus.FAILED
    assert "Catastrophic dispatcher error" in result.final_message
    assert sandbox.cleanup_called is True


# ==============================================================================
# 4. Deterministic Sandbox Teardown & Isolation Tests
# ==============================================================================


@pytest.mark.asyncio
async def test_sandbox_cleanup_on_successful_finish():
    """Verify sandbox is destroyed upon clean finish completion."""
    provider = MockAgentProvider([
        '{"action": "finish", "message": "All done successfully", "success": true}',
    ])
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run("Complete task successfully", execution_id="exec_finish_01")

    assert result.status == LoopStatus.COMPLETED
    assert result.execution_id == "exec_finish_01"
    assert sandbox.cleanup_called is True


@pytest.mark.asyncio
async def test_strict_sandbox_isolation():
    """Verify all actions route strictly through sandbox and no host execution occurs."""
    sandbox = MockSandbox()
    dispatcher = ActionDispatcher(sandbox=sandbox)

    # 1. run_command action routes to sandbox.execute
    cmd_action = RunCommandAction(command="pytest -v")
    res1 = await dispatcher.dispatch(cmd_action)
    assert isinstance(res1, CommandActionResult)
    assert len(sandbox.executed_commands) == 1
    assert sandbox.executed_commands[0] == "pytest -v"

    # 2. inspect_file action routes to sandbox.execute
    inspect_action = InspectFileAction(path="app/core/config.py")
    res2 = await dispatcher.dispatch(inspect_action)
    assert isinstance(res2, InspectFileActionResult)
    assert len(sandbox.executed_commands) == 2
    assert "cat" in sandbox.executed_commands[1]


# ==============================================================================
# 5. Session State Integration Tests
# ==============================================================================


@pytest.mark.asyncio
async def test_session_state_transition_on_timeout():
    """Verify AgentSession transitions to TIMED_OUT when overall duration limit is exceeded."""
    from app.schemas.session import AgentSession, SessionStatus

    session = AgentSession(task_prompt="Timeout task")
    provider = MockAgentProvider([
        '{"action": "run_command", "command": "echo 1"}',
        '{"action": "run_command", "command": "echo 2"}',
    ])
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=10, max_duration_seconds=1)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    initial_time = 100.0
    call_count = 0

    def mock_monotonic():
        nonlocal call_count
        call_count += 1
        if call_count > 1:
            return initial_time + 5.0
        return initial_time

    with patch("time.monotonic", side_effect=mock_monotonic):
        result = await loop.run("Timeout task", session=session)

    assert result.status == LoopStatus.TIMEOUT
    assert session.status == SessionStatus.TIMED_OUT
    assert session.is_terminal
    assert "exceeded maximum overall duration" in session.termination_reason


@pytest.mark.asyncio
async def test_session_state_transition_on_max_commands():
    """Verify AgentSession transitions to TERMINATED when max commands limit is exceeded."""
    from app.schemas.session import AgentSession, SessionStatus

    session = AgentSession(task_prompt="Max commands task")
    provider = MockAgentProvider([
        '{"action": "run_command", "command": "echo 1"}',
        '{"action": "run_command", "command": "echo 2"}',
        '{"action": "run_command", "command": "echo 3"}',
    ])
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=10, max_commands=2)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    result = await loop.run("Max commands task", session=session)

    assert result.status == LoopStatus.MAX_COMMANDS_EXCEEDED
    assert session.status == SessionStatus.TERMINATED
    assert session.is_terminal
    assert "maximum command execution limit" in session.termination_reason
