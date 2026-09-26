from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set
import uuid

from pydantic import BaseModel, Field, field_validator

from app.core.errors import InvalidStateTransitionError
from app.core.logging import sanitize_log_data
from app.schemas.actions import LoopStep


def utc_now() -> datetime:
    """Return current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class SessionStatus(str, Enum):
    """Explicit lifecycle states for an agent execution session."""

    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TERMINATED = "terminated"
    TIMED_OUT = "timed_out"


ALLOWED_TRANSITIONS: Dict[SessionStatus, Set[SessionStatus]] = {
    SessionStatus.CREATED: {SessionStatus.RUNNING},
    SessionStatus.RUNNING: {
        SessionStatus.COMPLETED,
        SessionStatus.FAILED,
        SessionStatus.TERMINATED,
        SessionStatus.TIMED_OUT,
    },
    SessionStatus.COMPLETED: set(),
    SessionStatus.FAILED: set(),
    SessionStatus.TERMINATED: set(),
    SessionStatus.TIMED_OUT: set(),
}


class AgentSession(BaseModel):
    """Tracks the end-to-end execution state and lifecycle of an agent task."""

    id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:12]}")
    task_prompt: str = Field(..., description="The original task description or prompt")
    status: SessionStatus = Field(
        default=SessionStatus.CREATED,
        description="Current lifecycle status of the session",
    )
    iteration_count: int = Field(
        default=0, ge=0, description="Total iterations elapsed in the execution loop"
    )
    executed_action_count: int = Field(
        default=0, ge=0, description="Count of successfully dispatched actions"
    )
    created_at: datetime = Field(
        default_factory=utc_now, description="Timestamp when the session was initialized"
    )
    started_at: Optional[datetime] = Field(
        default=None, description="Timestamp when execution transitioned to running"
    )
    completed_at: Optional[datetime] = Field(
        default=None, description="Timestamp when session reached a terminal status"
    )
    termination_reason: Optional[str] = Field(
        default=None, description="Summary or reason for termination"
    )
    steps: List[LoopStep] = Field(
        default_factory=list, description="Chronological record of execution steps"
    )
    prompt_tokens: int = Field(default=0, ge=0, description="Cumulative prompt tokens used")
    completion_tokens: int = Field(
        default=0, ge=0, description="Cumulative completion tokens used"
    )
    total_tokens: int = Field(default=0, ge=0, description="Cumulative total tokens used")

    @property
    def is_terminal(self) -> bool:
        """Return True if the session has reached a terminal status."""
        return self.status in {
            SessionStatus.COMPLETED,
            SessionStatus.FAILED,
            SessionStatus.TERMINATED,
            SessionStatus.TIMED_OUT,
        }

    def transition_to(
        self, target_status: SessionStatus, reason: Optional[str] = None
    ) -> None:
        """Validate and apply a state transition according to the lifecycle state machine."""
        allowed = ALLOWED_TRANSITIONS.get(self.status, set())
        if target_status not in allowed:
            raise InvalidStateTransitionError(
                message=f"Cannot transition session from '{self.status.value}' to '{target_status.value}'",
                current_status=self.status.value,
                target_status=target_status.value,
            )

        self.status = target_status

        if target_status == SessionStatus.RUNNING and self.started_at is None:
            self.started_at = utc_now()

        if self.is_terminal and self.completed_at is None:
            self.completed_at = utc_now()

        if reason is not None:
            self.termination_reason = reason

    def start(self) -> None:
        """Transition session from CREATED to RUNNING."""
        self.transition_to(SessionStatus.RUNNING)

    def complete(self, reason: Optional[str] = "Task completed successfully.") -> None:
        """Transition session to COMPLETED."""
        self.transition_to(SessionStatus.COMPLETED, reason=reason)

    def fail(self, reason: Optional[str] = "Task execution failed.") -> None:
        """Transition session to FAILED."""
        self.transition_to(SessionStatus.FAILED, reason=reason)

    def terminate(self, reason: Optional[str] = "Execution terminated.") -> None:
        """Transition session to TERMINATED."""
        self.transition_to(SessionStatus.TERMINATED, reason=reason)

    def time_out(self, reason: Optional[str] = "Execution timed out.") -> None:
        """Transition session to TIMED_OUT."""
        self.transition_to(SessionStatus.TIMED_OUT, reason=reason)

    def record_step(self, step: LoopStep) -> None:
        """Record a loop step and update counters."""
        self.steps.append(step)
        if step.iteration > self.iteration_count:
            self.iteration_count = step.iteration
        if step.action is not None:
            self.executed_action_count += 1

    def add_tokens(
        self, prompt: int = 0, completion: int = 0, total: Optional[int] = None
    ) -> None:
        """Accumulate token accounting statistics."""
        self.prompt_tokens += prompt
        self.completion_tokens += completion
        if total is not None:
            self.total_tokens += total
        else:
            self.total_tokens += prompt + completion

    def to_dict(self, redact_secrets: bool = True) -> Dict[str, Any]:
        """Serialize the session model to a dictionary with optional credential redaction."""
        data = self.model_dump(mode="json")
        if redact_secrets:
            return sanitize_log_data(data)
        return data

    def to_safe_dict(self) -> Dict[str, Any]:
        """Convenience method to return sanitized dictionary representation."""
        return self.to_dict(redact_secrets=True)


# ==============================================================================
# HTTP Response Schemas
# ==============================================================================
#
# The models above own the in-memory lifecycle and state machine. The models
# below are the wire contract for the session API. They are intentionally
# separate types so a change to what the API returns cannot silently alter the
# loop's state machine, and vice versa.


class SessionCreateRequest(BaseModel):
    """Request body for creating an agent session."""

    task_prompt: str = Field(
        ...,
        min_length=1,
        max_length=8000,
        description="The objective the agent should pursue",
    )
    repository_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Repository the session targets; must be owned by the caller",
    )

    @field_validator("task_prompt")
    @classmethod
    def _reject_blank_prompt(cls, value: str) -> str:
        """Reject a prompt that is only whitespace.

        ``min_length=1`` admits ``"   "``, which would create a session the
        agent cannot meaningfully act on.
        """
        if not value.strip():
            raise ValueError("task_prompt must not be blank")
        return value


class SessionRead(BaseModel):
    """A persisted agent session as returned by the API.

    Built by :meth:`app.services.session.SessionService.to_read_model` rather
    than by validating the row directly, so that credential redaction is applied
    on every read path instead of relying on each caller to remember it.
    """

    id: str
    owner_id: uuid.UUID
    repository_id: Optional[uuid.UUID] = None
    task_prompt: str
    status: str
    iteration_count: int
    executed_action_count: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    termination_reason: Optional[str] = None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    steps: List[LoopStep] = Field(default_factory=list)


class SessionListResponse(BaseModel):
    """Paginated list of the caller's sessions."""

    items: List[SessionRead]
    total: int
    limit: int
    offset: int


class SessionEventRead(BaseModel):
    """One event in a session's chronological feed."""

    id: uuid.UUID
    session_id: str
    sequence: int
    category: str
    event_type: str
    level: str
    summary: str
    payload: Optional[Dict[str, Any]] = None
    created_at: datetime


class SessionEventListResponse(BaseModel):
    """A page of session events, ordered by ascending sequence.

    ``last_sequence`` lets an incremental client resume from where it stopped
    without re-reading the feed.
    """

    items: List[SessionEventRead]
    total: int
    limit: int
    after_sequence: int
    last_sequence: Optional[int] = None


# ==============================================================================
# Session artifacts
# ==============================================================================


class SessionPatchRead(BaseModel):
    """A session's unified diff, returned whole.

    ``is_empty`` distinguishes "the agent produced a patch and it was empty"
    from "the agent produced nothing here", which is a meaningful difference to a
    reviewer and the reason this is a flag rather than a null diff.
    """

    session_id: str
    exists: bool
    diff: str = ""
    is_empty: bool = True


class BisectCommitRead(BaseModel):
    """One commit on a session's bisect timeline, in evaluation order."""

    hash: str
    short_hash: str = ""
    message: str = ""
    author: str = ""
    timestamp: str = ""
    # ``culprit`` is distinct from ``bad``: the first bad commit is one the
    # search proved, which is not the same claim as one that merely tested bad.
    outcome: str
    test_output: Optional[str] = None
    duration_seconds: float = 0.0


class SessionTimelineRead(BaseModel):
    """A session's bisect timeline, in the order the search evaluated commits.

    ``culprit_hash`` is null when the run did not isolate one, which is a normal
    outcome for an inconclusive search rather than an error.
    """

    session_id: str
    exists: bool
    commits: List[BisectCommitRead] = Field(default_factory=list)
    culprit_hash: Optional[str] = None

