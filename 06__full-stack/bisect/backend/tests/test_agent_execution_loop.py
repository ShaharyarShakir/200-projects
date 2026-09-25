from typing import List, Optional
import pytest

from app.core.errors import AgentRateLimitError
from app.schemas.actions import (
    CommandActionResult,
    InspectFileActionResult,
    LoopConfig,
    LoopStatus,
)
from app.schemas.agent import (
    CompletionRequest,
    CompletionResponse,
    TokenUsage,
)
from app.services.agent.base import AgentProvider
from app.services.agent.loop import AgentExecutionLoop, DEFAULT_SYSTEM_PROMPT
from app.services.sandbox.base import CommandResult, Sandbox, SandboxConfig


class MockAgentProvider(AgentProvider):
    """Mock agent provider returning scripted completions."""

    def __init__(self, responses: Optional[List[str]] = None) -> None:
        self.responses = responses or []
        self.call_count = 0
        self.requests: List[CompletionRequest] = []
        self.raise_error: Optional[Exception] = None

    @property
    def name(self) -> str:
        return "mock_groq"

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        self.requests.append(request)
        self.call_count += 1

        if self.raise_error:
            raise self.raise_error

        if self.responses:
            content = self.responses.pop(0)
        else:
            content = '{"action": "finish", "message": "Default finish", "success": true}'

        return CompletionResponse(
            content=content,
            model="mock-model",
            usage=TokenUsage(prompt_tokens=50, completion_tokens=20, total_tokens=70),
        )


class MockSandbox(Sandbox):
    """Mock sandbox capturing commands and returning scripted results."""

    def __init__(self, config: Optional[SandboxConfig] = None) -> None:
        super().__init__(config=config)
        self._is_running = True
        self.commands_executed: List[str] = []

    @property
    def container_id(self) -> Optional[str]:
        return "mock-container-id"

    @property
    def is_running(self) -> bool:
        return self._is_running

    async def start(self) -> None:
        self._is_running = True

    async def stop(self) -> None:
        self._is_running = False

    async def cleanup(self) -> None:
        self._is_running = False

    async def execute(
        self,
        command,
        timeout=None,
        workdir=None,
        env=None,
    ) -> CommandResult:
        cmd_str = command if isinstance(command, str) else " ".join(command)
        self.commands_executed.append(cmd_str)

        if "cat /workspace/app/main.py" in cmd_str or 'cat "/workspace/app/main.py"' in cmd_str:
            return CommandResult(exit_code=0, stdout="def main(): pass", stderr="", duration_seconds=0.1)
        elif "nonexistent" in cmd_str:
            return CommandResult(exit_code=44, stdout="", stderr="", duration_seconds=0.1)
        elif "pytest" in cmd_str:
            return CommandResult(exit_code=0, stdout="1 passed in 0.05s", stderr="", duration_seconds=0.5)

        return CommandResult(exit_code=0, stdout="OK", stderr="", duration_seconds=0.1)


@pytest.mark.asyncio
async def test_loop_immediate_finish():
    provider = MockAgentProvider(
        responses=['{"action": "finish", "message": "Nothing to do", "success": true}']
    )
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Check the project")

    assert result.status == LoopStatus.COMPLETED
    assert result.total_iterations == 1
    assert result.final_message == "Nothing to do"
    assert len(result.steps) == 1
    assert result.total_tokens == 70


@pytest.mark.asyncio
async def test_loop_multiturn_inspection_command_finish():
    provider = MockAgentProvider(
        responses=[
            '```json\n{"action": "inspect_file", "path": "app/main.py"}\n```',
            '{"action": "run_command", "command": "pytest tests/"}',
            '{"action": "finish", "message": "All verified", "success": true}',
        ]
    )
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Inspect main.py and run tests")

    assert result.status == LoopStatus.COMPLETED
    assert result.total_iterations == 3
    assert len(result.steps) == 3
    assert result.total_tokens == 210
    assert result.steps[0].action["action"] == "inspect_file"
    assert result.steps[1].action["action"] == "run_command"
    assert result.steps[2].action["action"] == "finish"

    # Verify conversation history passed to LLM grew across turns
    assert len(provider.requests) == 3
    # Turn 1: system, user
    assert len(provider.requests[0].messages) == 2
    # Turn 2: system, user, assistant, user(result)
    assert len(provider.requests[1].messages) == 4
    # Turn 3: system, user, assistant, user(result), assistant, user(result)
    assert len(provider.requests[2].messages) == 6


@pytest.mark.asyncio
async def test_loop_error_recovery():
    provider = MockAgentProvider(
        responses=[
            "I will now run the command: {bad json syntax",  # Turn 1: parse error
            '{"action": "run_command", "command": "pytest"}',  # Turn 2: valid command
            '{"action": "finish", "message": "Fixed after error", "success": true}',  # Turn 3: finish
        ]
    )
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Run tests")

    assert result.status == LoopStatus.COMPLETED
    assert result.total_iterations == 3
    assert result.steps[0].error is not None
    assert "Invalid JSON" in result.steps[0].error or "No JSON" in result.steps[0].error
    assert result.steps[1].action["action"] == "run_command"
    assert result.steps[2].action["action"] == "finish"


@pytest.mark.asyncio
async def test_loop_max_iterations_reached():
    provider = MockAgentProvider(
        responses=[
            '{"action": "run_command", "command": "echo 1"}',
            '{"action": "run_command", "command": "echo 2"}',
            '{"action": "run_command", "command": "echo 3"}',
        ]
    )
    sandbox = MockSandbox()
    config = LoopConfig(max_iterations=2)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    result = await loop.run(task_prompt="Infinite commands")

    assert result.status == LoopStatus.MAX_ITERATIONS_REACHED
    assert result.total_iterations == 2
    assert len(result.steps) == 2


@pytest.mark.asyncio
async def test_loop_consecutive_errors_exceeded():
    provider = MockAgentProvider(
        responses=[
            "Invalid response 1",
            "Invalid response 2",
            "Invalid response 3",
        ]
    )
    sandbox = MockSandbox()
    config = LoopConfig(max_consecutive_errors=2)
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox, config=config)

    result = await loop.run(task_prompt="Trigger consecutive errors")

    assert result.status == LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED
    assert result.total_iterations == 2
    assert "Consecutive action errors limit (2) exceeded" in result.final_message


@pytest.mark.asyncio
async def test_loop_provider_failure():
    provider = MockAgentProvider()
    provider.raise_error = AgentRateLimitError(message="Rate limit 429", retry_after=10, provider="groq")
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Trigger provider failure")

    assert result.status == LoopStatus.FAILED
    assert "Rate limit 429" in result.final_message
    assert result.total_iterations == 1


@pytest.mark.asyncio
async def test_loop_inspect_file_not_found_recovery():
    provider = MockAgentProvider(
        responses=[
            '{"action": "inspect_file", "path": "nonexistent.py"}',
            '{"action": "inspect_file", "path": "app/main.py"}',
            '{"action": "finish", "message": "File inspected after error", "success": true}',
        ]
    )
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Inspect main")

    assert result.status == LoopStatus.COMPLETED
    assert result.total_iterations == 3
    # Step 1 should record exists=False in result
    assert result.steps[0].result["exists"] is False
    assert result.steps[1].result["exists"] is True
    assert result.steps[2].action["action"] == "finish"


@pytest.mark.asyncio
async def test_loop_with_bound_agent_session():
    from app.schemas.session import AgentSession, SessionStatus

    session = AgentSession(task_prompt="Run custom bound session")
    provider = MockAgentProvider(
        responses=[
            '{"action": "run_command", "command": "pytest"}',
            '{"action": "finish", "message": "Tests verified", "success": true}',
        ]
    )
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Run custom bound session", session=session)

    assert result.session is session
    assert session.status == SessionStatus.COMPLETED
    assert session.started_at is not None
    assert session.completed_at is not None
    assert session.iteration_count == 2
    assert session.executed_action_count == 2
    assert len(session.steps) == 2
    assert session.termination_reason == "Tests verified"
    assert session.total_tokens == 140


@pytest.mark.asyncio
async def test_loop_session_tracking_on_failure():
    from app.schemas.session import AgentSession, SessionStatus

    session = AgentSession(task_prompt="Failing task")
    provider = MockAgentProvider(
        responses=[
            '{"action": "finish", "message": "Could not fix bug", "success": false}',
        ]
    )
    sandbox = MockSandbox()
    loop = AgentExecutionLoop(provider=provider, sandbox=sandbox)

    result = await loop.run(task_prompt="Failing task", session=session)

    assert result.status == LoopStatus.FAILED
    assert session.status == SessionStatus.FAILED
    assert session.termination_reason == "Could not fix bug"
    assert session.is_terminal
