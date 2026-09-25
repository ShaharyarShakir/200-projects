from enum import Enum
from typing import Annotated, Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


class ActionName(str, Enum):
    """Enumeration of supported agent action types."""

    RUN_COMMAND = "run_command"
    INSPECT_FILE = "inspect_file"
    FINISH = "finish"


class BaseAction(BaseModel):
    """Base model for all agent actions."""

    pass


class RunCommandAction(BaseAction):
    """Action requesting execution of a shell command in the sandbox."""

    action: Literal["run_command"] = "run_command"
    command: str = Field(..., min_length=1, description="Shell command string to execute")
    timeout_seconds: Optional[int] = Field(default=None, gt=0, description="Optional command timeout in seconds")
    workdir: Optional[str] = Field(default=None, description="Working directory relative to /workspace")


class InspectFileAction(BaseAction):
    """Action requesting inspection/reading of a file in the workspace."""

    action: Literal["inspect_file"] = "inspect_file"
    path: str = Field(..., min_length=1, description="Path of the file to inspect relative to /workspace")
    max_bytes: Optional[int] = Field(default=None, gt=0, description="Max bytes to read from the file")


class FinishAction(BaseAction):
    """Action indicating agent task completion or termination."""

    action: Literal["finish"] = "finish"
    message: str = Field(default="", description="Summary message or explanation of the finished task")
    success: bool = Field(default=True, description="Whether the agent achieved its objective")


AgentAction = Annotated[
    Union[RunCommandAction, InspectFileAction, FinishAction],
    Field(discriminator="action"),
]


# ==============================================================================
# Action Results
# ==============================================================================


class CommandActionResult(BaseModel):
    """Result of a command execution action."""

    action_type: Literal["run_command"] = "run_command"
    command: str
    exit_code: int
    stdout: str = ""
    stderr: str = ""
    duration_seconds: float = 0.0
    timed_out: bool = False

    @property
    def is_success(self) -> bool:
        return self.exit_code == 0 and not self.timed_out


class InspectFileActionResult(BaseModel):
    """Result of a file inspection action."""

    action_type: Literal["inspect_file"] = "inspect_file"
    path: str
    exists: bool = True
    content: Optional[str] = None
    size_bytes: Optional[int] = None
    error: Optional[str] = None


class FinishActionResult(BaseModel):
    """Result representing successful agent completion."""

    action_type: Literal["finish"] = "finish"
    message: str = ""
    success: bool = True


class ActionErrorResult(BaseModel):
    """Result representing an action validation or dispatch error."""

    action_type: Literal["error"] = "error"
    error: str
    details: Optional[Dict[str, Any]] = None


ActionResult = Annotated[
    Union[CommandActionResult, InspectFileActionResult, FinishActionResult, ActionErrorResult],
    Field(discriminator="action_type"),
]


# ==============================================================================
# Loop Config & Result Models
# ==============================================================================


class LoopStatus(str, Enum):
    """Termination status of the agent execution loop."""

    RUNNING = "running"
    COMPLETED = "completed"
    MAX_ITERATIONS_REACHED = "max_iterations_reached"
    MAX_COMMANDS_EXCEEDED = "max_commands_exceeded"
    CONSECUTIVE_ERRORS_EXCEEDED = "consecutive_errors_exceeded"
    TIMEOUT = "timeout"
    FAILED = "failed"


class LoopConfig(BaseModel):
    """Configuration options for the agent execution loop."""

    max_iterations: int = Field(default=10, ge=1, le=50, description="Max turns the loop may run")
    max_commands: int = Field(default=15, ge=1, le=100, description="Max cumulative commands allowed")
    step_timeout_seconds: int = Field(default=60, ge=1, description="Per-action sandbox execution timeout")
    max_duration_seconds: int = Field(default=300, ge=1, description="Total maximum execution duration in seconds")
    max_consecutive_errors: int = Field(default=3, ge=1, description="Max consecutive parse/validation errors before halting")
    system_prompt: Optional[str] = None


class LoopStep(BaseModel):
    """A discrete recorded step within an execution loop iteration."""

    iteration: int
    raw_response: str
    execution_id: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    duration_seconds: float = 0.0


class LoopResult(BaseModel):
    """The aggregate summary of a completed or halted agent execution loop."""

    status: LoopStatus
    total_iterations: int
    execution_id: Optional[str] = None
    steps: List[LoopStep] = Field(default_factory=list)
    final_message: Optional[str] = None
    total_duration_seconds: float = 0.0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    session: Optional[Any] = Field(default=None, description="Bound AgentSession snapshot")
