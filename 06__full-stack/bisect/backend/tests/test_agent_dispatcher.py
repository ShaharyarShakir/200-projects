from typing import Dict, List, Optional, Union
import pytest

from app.core.errors import SandboxExecutionError, SandboxTimeoutError
from app.schemas.actions import (
    ActionErrorResult,
    CommandActionResult,
    FinishAction,
    FinishActionResult,
    InspectFileAction,
    InspectFileActionResult,
    RunCommandAction,
)
from app.services.agent.dispatcher import ActionDispatcher
from app.services.sandbox.base import CommandResult, Sandbox, SandboxConfig


class MockSandbox(Sandbox):
    """In-memory mock sandbox for unit testing ActionDispatcher."""

    def __init__(self, config: Optional[SandboxConfig] = None) -> None:
        super().__init__(config=config)
        self._container_id = "mock-container-123"
        self._is_running = True
        self.commands_executed: List[Union[str, List[str]]] = []
        self.mock_results: Dict[str, CommandResult] = {}
        self.default_result = CommandResult(exit_code=0, stdout="mock output", stderr="", duration_seconds=0.1)
        self.raise_timeout = False
        self.raise_execution_error = False

    @property
    def container_id(self) -> Optional[str]:
        return self._container_id

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
        command: Union[str, List[str]],
        timeout: Optional[int] = None,
        workdir: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> CommandResult:
        self.commands_executed.append(command)

        if self.raise_timeout:
            raise SandboxTimeoutError(message="Command exceeded timeout limit", timeout_seconds=timeout)

        if self.raise_execution_error:
            raise SandboxExecutionError(message="Container killed unexpectedly", container_id=self._container_id)

        cmd_str = command if isinstance(command, str) else " ".join(command)
        for key, res in self.mock_results.items():
            if key in cmd_str:
                return res

        return self.default_result


@pytest.mark.asyncio
async def test_dispatch_run_command_success():
    sandbox = MockSandbox()
    sandbox.default_result = CommandResult(
        exit_code=0,
        stdout="pytest passed\n",
        stderr="",
        duration_seconds=0.5,
        timed_out=False,
    )
    dispatcher = ActionDispatcher(sandbox)
    action = RunCommandAction(command="pytest", timeout_seconds=10)

    result = await dispatcher.dispatch(action)

    assert isinstance(result, CommandActionResult)
    assert result.command == "pytest"
    assert result.exit_code == 0
    assert result.stdout == "pytest passed\n"
    assert result.is_success is True


@pytest.mark.asyncio
async def test_dispatch_run_command_failure():
    sandbox = MockSandbox()
    sandbox.default_result = CommandResult(
        exit_code=1,
        stdout="",
        stderr="AssertionError: 1 != 2\n",
        duration_seconds=0.3,
        timed_out=False,
    )
    dispatcher = ActionDispatcher(sandbox)
    action = RunCommandAction(command="pytest")

    result = await dispatcher.dispatch(action)

    assert isinstance(result, CommandActionResult)
    assert result.exit_code == 1
    assert result.stderr == "AssertionError: 1 != 2\n"
    assert result.is_success is False


@pytest.mark.asyncio
async def test_dispatch_run_command_timeout():
    sandbox = MockSandbox()
    sandbox.raise_timeout = True
    dispatcher = ActionDispatcher(sandbox)
    action = RunCommandAction(command="sleep 100", timeout_seconds=5)

    result = await dispatcher.dispatch(action)

    assert isinstance(result, CommandActionResult)
    assert result.exit_code == 124
    assert result.timed_out is True
    assert "Command timed out" in result.stderr


@pytest.mark.asyncio
async def test_dispatch_run_command_sandbox_error():
    sandbox = MockSandbox()
    sandbox.raise_execution_error = True
    dispatcher = ActionDispatcher(sandbox)
    action = RunCommandAction(command="pytest")

    result = await dispatcher.dispatch(action)

    assert isinstance(result, ActionErrorResult)
    assert "Sandbox execution error" in result.error


@pytest.mark.asyncio
async def test_dispatch_inspect_file_existing():
    sandbox = MockSandbox()
    sandbox.default_result = CommandResult(
        exit_code=0,
        stdout="def hello(): return 'world'\n",
        stderr="",
        duration_seconds=0.05,
    )
    dispatcher = ActionDispatcher(sandbox)
    action = InspectFileAction(path="app/main.py")

    result = await dispatcher.dispatch(action)

    assert isinstance(result, InspectFileActionResult)
    assert result.path == "app/main.py"
    assert result.exists is True
    assert result.content == "def hello(): return 'world'\n"
    assert result.size_bytes is not None
    assert result.error is None


@pytest.mark.asyncio
async def test_dispatch_inspect_file_not_found():
    sandbox = MockSandbox()
    sandbox.default_result = CommandResult(
        exit_code=44,
        stdout="",
        stderr="",
        duration_seconds=0.05,
    )
    dispatcher = ActionDispatcher(sandbox)
    action = InspectFileAction(path="nonexistent.py")

    result = await dispatcher.dispatch(action)

    assert isinstance(result, InspectFileActionResult)
    assert result.path == "nonexistent.py"
    assert result.exists is False
    assert result.content is None
    assert "File not found" in result.error


@pytest.mark.asyncio
async def test_dispatch_inspect_file_is_directory():
    sandbox = MockSandbox()
    sandbox.default_result = CommandResult(
        exit_code=43,
        stdout="",
        stderr="",
        duration_seconds=0.05,
    )
    dispatcher = ActionDispatcher(sandbox)
    action = InspectFileAction(path="app")

    result = await dispatcher.dispatch(action)

    assert isinstance(result, InspectFileActionResult)
    assert result.exists is True
    assert result.content is None
    assert "is a directory" in result.error


@pytest.mark.asyncio
async def test_dispatch_finish_action():
    sandbox = MockSandbox()
    dispatcher = ActionDispatcher(sandbox)
    action = FinishAction(message="All tests are green!", success=True)

    result = await dispatcher.dispatch(action)

    assert isinstance(result, FinishActionResult)
    assert result.message == "All tests are green!"
    assert result.success is True
    assert len(sandbox.commands_executed) == 0
