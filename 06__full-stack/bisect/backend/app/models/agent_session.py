from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING
import uuid

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import utc_now

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.repository import Repository
    from app.models.agent_session_event import AgentSessionEventRow
    from app.models.agent_session_patch import AgentSessionPatchRow
    from app.models.agent_session_bisect_commit import AgentSessionBisectCommitRow


class AgentSessionStatus:
    """Lifecycle status values stored on the ``agent_sessions.status`` column.

    These are the string values of :class:`app.schemas.session.SessionStatus`
    and are declared separately so the persistence layer does not import the
    Pydantic lifecycle model. The state machine that validates transitions
    lives in that model; this class only names the persisted vocabulary.
    """

    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TERMINATED = "terminated"
    TIMED_OUT = "timed_out"

    ALL = (
        CREATED,
        RUNNING,
        COMPLETED,
        FAILED,
        TERMINATED,
        TIMED_OUT,
    )


class AgentSessionRow(SQLModel, table=True):
    """Durable record of one agent execution.

    Distinct from the ``AgentSession`` Pydantic model in
    ``app.schemas.session``, which owns the lifecycle state machine. This table
    is pure storage: the service layer converts between the two.

    The primary key is the human-readable ``sess_<hex>`` identifier the agent
    loop already generates, so persisting a session requires no identifier
    remapping.
    """

    __tablename__ = "agent_sessions"

    id: str = Field(primary_key=True, nullable=False)
    owner_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
    )
    repository_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="repositories.id",
        index=True,
        nullable=True,
    )
    task_prompt: str = Field(nullable=False)
    status: str = Field(
        default=AgentSessionStatus.CREATED,
        index=True,
        nullable=False,
    )
    iteration_count: int = Field(default=0, nullable=False)
    executed_action_count: int = Field(default=0, nullable=False)
    started_at: Optional[datetime] = Field(default=None, nullable=True)
    completed_at: Optional[datetime] = Field(default=None, nullable=True)
    termination_reason: Optional[str] = Field(default=None, nullable=True)
    prompt_tokens: int = Field(default=0, nullable=False)
    completion_tokens: int = Field(default=0, nullable=False)
    total_tokens: int = Field(default=0, nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(
        default_factory=utc_now,
        nullable=False,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Loop steps are replaced wholesale on every persist rather than stored as
    # rows. They are heterogeneous (action and result are already free-form
    # dicts), are only ever read as an ordered whole, and are never queried by
    # field. Keeping them in the session row also makes each persist atomic:
    # status, counters, and steps can never disagree.
    steps: List[Dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False),
    )

    # Relationships
    owner: Optional["User"] = Relationship()
    repository: Optional["Repository"] = Relationship()
    events: List["AgentSessionEventRow"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    # At most one of each, so a single-to-one relationship on both sides. The
    # patch table's primary key enforces the patch half; the timeline is
    # replaced wholesale when a session runs another bisect.
    patch: Optional["AgentSessionPatchRow"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "uselist": False},
    )
    bisect_commits: List["AgentSessionBisectCommitRow"] = Relationship(
        back_populates="session",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
