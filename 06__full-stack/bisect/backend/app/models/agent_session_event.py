from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING
import uuid

from sqlalchemy import Column, JSON, Index
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import utc_now

if TYPE_CHECKING:
    from app.models.agent_session import AgentSessionRow


class SessionEventCategory:
    """The closed set of categories an event may carry.

    A category is always derived from what actually happened, never supplied by
    the caller, so the frontend can branch on a value from this fixed set
    without the server and browser disagreeing about what an event means.
    """

    SYSTEM = "system"
    AGENT = "agent"
    EXECUTION = "execution"
    VALIDATION = "validation"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

    ALL = (
        SYSTEM,
        AGENT,
        EXECUTION,
        VALIDATION,
        SUCCESS,
        WARNING,
        ERROR,
    )


class AgentSessionEventRow(SQLModel, table=True):
    """One recorded occurrence in a session's chronological event feed.

    ``sequence`` is a per-session monotonic counter assigned at write time, not
    a global identity. It is what the feed orders by and what an incremental
    reader passes back as ``after_sequence``, so a polling client never has to
    re-read the whole feed to find what is new.
    """

    __tablename__ = "agent_session_events"

    __table_args__ = (
        # Serves the event feed directly: filter by session, order by sequence.
        Index("ix_agent_session_events_session_id_sequence", "session_id", "sequence"),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    session_id: str = Field(
        foreign_key="agent_sessions.id",
        index=True,
        nullable=False,
    )
    sequence: int = Field(nullable=False)
    category: str = Field(index=True, nullable=False)
    event_type: str = Field(index=True, nullable=False)
    level: str = Field(default="info", nullable=False)
    summary: str = Field(nullable=False)
    payload: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    created_at: datetime = Field(default_factory=utc_now, nullable=False)

    # Relationships
    session: Optional["AgentSessionRow"] = Relationship(back_populates="events")
