import pytest
from pydantic import TypeAdapter, ValidationError

from app.schemas.actions import (
    ActionErrorResult,
    ActionName,
    AgentAction,
    CommandActionResult,
    FinishAction,
    FinishActionResult,
    InspectFileAction,
    InspectFileActionResult,
    LoopConfig,
    LoopResult,
    LoopStatus,
    LoopStep,
    RunCommandAction,
)


def test_action_names():
    assert ActionName.RUN_COMMAND == "run_command"
    assert ActionName.INSPECT_FILE == "inspect_file"
    assert ActionName.FINISH == "finish"


def test_run_command_action_valid():
    action = RunCommandAction(command="pytest -v", timeout_seconds=30, workdir="subfolder")
    assert action.action == "run_command"
    assert action.command == "pytest -v"
    assert action.timeout_seconds == 30
    assert action.workdir == "subfolder"


def test_run_command_action_empty_command_invalid():
    with pytest.raises(ValidationError):
        RunCommandAction(command="")


def test_inspect_file_action_valid():
    action = InspectFileAction(path="app/main.py", max_bytes=1024)
    assert action.action == "inspect_file"
    assert action.path == "app/main.py"
    assert action.max_bytes == 1024


def test_inspect_file_action_empty_path_invalid():
    with pytest.raises(ValidationError):
        InspectFileAction(path="")


def test_finish_action_valid():
    action = FinishAction(message="Tests passing!", success=True)
    assert action.action == "finish"
    assert action.message == "Tests passing!"
    assert action.success is True


def test_agent_action_discriminated_union():
    adapter = TypeAdapter(AgentAction)

    cmd_data = {"action": "run_command", "command": "echo 'hello'"}
    parsed_cmd = adapter.validate_python(cmd_data)
    assert isinstance(parsed_cmd, RunCommandAction)
    assert parsed_cmd.command == "echo 'hello'"

    inspect_data = {"action": "inspect_file", "path": "README.md"}
    parsed_inspect = adapter.validate_python(inspect_data)
    assert isinstance(parsed_inspect, InspectFileAction)
    assert parsed_inspect.path == "README.md"

    finish_data = {"action": "finish", "message": "Done", "success": True}
    parsed_finish = adapter.validate_python(finish_data)
    assert isinstance(parsed_finish, FinishAction)
    assert parsed_finish.message == "Done"

    with pytest.raises(ValidationError):
        adapter.validate_python({"action": "unsupported_action", "foo": "bar"})


def test_command_action_result_success():
    res = CommandActionResult(
        command="pytest",
        exit_code=0,
        stdout="5 passed",
        stderr="",
        duration_seconds=1.2,
        timed_out=False,
    )
    assert res.action_type == "run_command"
    assert res.is_success is True


def test_command_action_result_failure():
    res = CommandActionResult(
        command="pytest",
        exit_code=1,
        stdout="",
        stderr="1 failed",
        duration_seconds=1.5,
        timed_out=False,
    )
    assert res.is_success is False


def test_inspect_file_action_result():
    res = InspectFileActionResult(
        path="app/main.py",
        exists=True,
        content="print('hello')",
        size_bytes=14,
    )
    assert res.action_type == "inspect_file"
    assert res.exists is True
    assert res.content == "print('hello')"


def test_action_error_result():
    res = ActionErrorResult(
        error="File not found",
        details={"path": "unknown.py"},
    )
    assert res.action_type == "error"
    assert res.error == "File not found"
    assert res.details == {"path": "unknown.py"}


def test_finish_action_result():
    res = FinishActionResult(message="All tasks done", success=True)
    assert res.action_type == "finish"
    assert res.success is True


def test_loop_models_defaults():
    config = LoopConfig()
    assert config.max_iterations == 10
    assert config.step_timeout_seconds == 60
    assert config.max_consecutive_errors == 3

    step = LoopStep(
        iteration=1,
        raw_response='{"action": "run_command", "command": "ls"}',
        action={"action": "run_command", "command": "ls"},
        result={"action_type": "run_command", "exit_code": 0},
    )
    assert step.iteration == 1

    result = LoopResult(
        status=LoopStatus.COMPLETED,
        total_iterations=1,
        steps=[step],
        final_message="Done",
        total_duration_seconds=2.5,
    )
    assert result.status == LoopStatus.COMPLETED
    assert len(result.steps) == 1
