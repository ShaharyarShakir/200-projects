from datetime import datetime
import pytest

from app.core.errors import InvalidStateTransitionError
from app.schemas.actions import LoopStep
from app.schemas.session import AgentSession, SessionStatus


def test_agent_session_initialization() -> None:
    """Verify default fields upon session initialization."""
    session = AgentSession(task_prompt="Fix failing unit tests in repo")

    assert session.id.startswith("sess_")
    assert session.task_prompt == "Fix failing unit tests in repo"
    assert session.status == SessionStatus.CREATED
    assert session.iteration_count == 0
    assert session.executed_action_count == 0
    assert isinstance(session.created_at, datetime)
    assert session.started_at is None
    assert session.completed_at is None
    assert session.termination_reason is None
    assert session.steps == []
    assert session.prompt_tokens == 0
    assert session.completion_tokens == 0
    assert session.total_tokens == 0
    assert not session.is_terminal


def test_agent_session_valid_transitions() -> None:
    """Verify all valid lifecycle state transitions."""
    # created -> running -> completed
    s1 = AgentSession(task_prompt="Task 1")
    s1.start()
    assert s1.status == SessionStatus.RUNNING
    assert s1.started_at is not None

    s1.complete("Completed successfully")
    assert s1.status == SessionStatus.COMPLETED
    assert s1.completed_at is not None
    assert s1.termination_reason == "Completed successfully"
    assert s1.is_terminal

    # created -> running -> failed
    s2 = AgentSession(task_prompt="Task 2")
    s2.start()
    s2.fail("Provider error")
    assert s2.status == SessionStatus.FAILED
    assert s2.completed_at is not None
    assert s2.termination_reason == "Provider error"
    assert s2.is_terminal

    # created -> running -> terminated
    s3 = AgentSession(task_prompt="Task 3")
    s3.start()
    s3.terminate("Max commands reached")
    assert s3.status == SessionStatus.TERMINATED
    assert s3.completed_at is not None
    assert s3.termination_reason == "Max commands reached"
    assert s3.is_terminal

    # created -> running -> timed_out
    s4 = AgentSession(task_prompt="Task 4")
    s4.start()
    s4.time_out("Execution exceeded duration limit")
    assert s4.status == SessionStatus.TIMED_OUT
    assert s4.completed_at is not None
    assert s4.termination_reason == "Execution exceeded duration limit"
    assert s4.is_terminal


def test_agent_session_invalid_transitions() -> None:
    """Verify invalid state transitions raise InvalidStateTransitionError."""
    # Direct created -> completed
    s = AgentSession(task_prompt="Invalid jump")
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        s.complete()
    assert exc_info.value.current_status == SessionStatus.CREATED.value
    assert exc_info.value.target_status == SessionStatus.COMPLETED.value
    assert s.status == SessionStatus.CREATED

    # Direct created -> failed
    with pytest.raises(InvalidStateTransitionError):
        s.fail()

    # Direct created -> terminated
    with pytest.raises(InvalidStateTransitionError):
        s.terminate()

    # Direct created -> timed_out
    with pytest.raises(InvalidStateTransitionError):
        s.time_out()

    # Terminal -> any status
    s.start()
    s.complete()
    assert s.is_terminal

    with pytest.raises(InvalidStateTransitionError):
        s.start()

    with pytest.raises(InvalidStateTransitionError):
        s.fail()

    with pytest.raises(InvalidStateTransitionError):
        s.transition_to(SessionStatus.RUNNING)


def test_agent_session_step_and_token_recording() -> None:
    """Verify recording steps, updating action counts, and accumulating tokens."""
    session = AgentSession(task_prompt="Record steps")
    session.start()

    step1 = LoopStep(
        iteration=1,
        raw_response='{"action": "run_command", "command": "pytest"}',
        action={"action": "run_command", "command": "pytest"},
        result={"action_type": "run_command", "command": "pytest", "exit_code": 1},
        duration_seconds=1.5,
    )
    session.record_step(step1)
    session.add_tokens(prompt=120, completion=45)

    assert session.iteration_count == 1
    assert session.executed_action_count == 1
    assert len(session.steps) == 1
    assert session.prompt_tokens == 120
    assert session.completion_tokens == 45
    assert session.total_tokens == 165

    step2 = LoopStep(
        iteration=2,
        raw_response='{"action": "finish", "message": "Done", "success": true}',
        action={"action": "finish", "message": "Done", "success": True},
        result={"action_type": "finish", "message": "Done", "success": True},
        duration_seconds=0.5,
    )
    session.record_step(step2)
    session.add_tokens(prompt=150, completion=30, total=180)

    assert session.iteration_count == 2
    assert session.executed_action_count == 2
    assert len(session.steps) == 2
    assert session.prompt_tokens == 270
    assert session.completion_tokens == 75
    assert session.total_tokens == 345


def test_agent_session_secret_redaction() -> None:
    """Verify that credentials and tokens are redacted when exporting session dictionary."""
    session = AgentSession(task_prompt="Analyze code with secret")
    session.start()

    sensitive_cmd = "export GITHUB_TOKEN=ghp_1234567890abcdef1234567890abcdef && pytest"
    step = LoopStep(
        iteration=1,
        raw_response=sensitive_cmd,
        action={"action": "run_command", "command": sensitive_cmd, "api_key": "sk-ant-secret123456789012345"},
        result={"stdout": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDjhPUrFYxWWbv5Bo_fDaQ", "token": "sensitive_val"},
    )
    session.record_step(step)

    safe_dict = session.to_safe_dict()

    serialized_str = str(safe_dict)
    assert "ghp_1234567890abcdef1234567890abcdef" not in serialized_str
    assert "sk-ant-secret123456789012345" not in serialized_str
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in serialized_str
    assert "[REDACTED]" in serialized_str

    # When redact_secrets is False, raw values are preserved
    raw_dict = session.to_dict(redact_secrets=False)
    assert raw_dict["steps"][0]["action"]["api_key"] == "sk-ant-secret123456789012345"
