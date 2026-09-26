import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Column, Index, Text, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import utc_now

if TYPE_CHECKING:
    from app.models.agent_session import AgentSessionRow


class BisectVerdict:
    """The verdicts a bisect can record for an evaluated commit."""

    GOOD = "good"
    BAD = "bad"

    ALL = (GOOD, BAD)


class AgentSessionBisectCommitRow(SQLModel, table=True):
    """One commit a bisect evaluated, in the order it was evaluated.

    Modelled as rows rather than a JSON blob because a timeline is read as an
    ordered sequence and grows with the run, so a long bisect can be read
    without loading one large document.

    ``evaluation_index`` is assigned by the service layer and is unique per
    session, which is what makes the ordering a property of the store: a
    client cannot claim a position in the timeline, and two rows cannot claim
    the same one.
    """

    __tablename__ = "agent_session_bisect_commits"

    __table_args__ = (
        # Serves the timeline read directly: filter by session, order by
        # evaluation index.
        Index(
            "ix_agent_session_bisect_commits_session_id_evaluation_index",
            "session_id",
            "evaluation_index",
        ),
        UniqueConstraint(
            "session_id",
            "evaluation_index",
            name="uq_agent_session_bisect_commits_session_evaluation",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    session_id: str = Field(
        foreign_key="agent_sessions.id",
        index=True,
        nullable=False,
    )
    evaluation_index: int = Field(nullable=False)
    sha: str = Field(nullable=False)
    short_sha: str = Field(default="", nullable=False)
    author: str = Field(default="", nullable=False)
    authored_at: str = Field(default="", nullable=False)
    message: str = Field(default="", sa_column=Column(Text, nullable=False))
    verdict: str = Field(index=True, nullable=False)
    is_culprit: bool = Field(default=False, nullable=False)
    exit_code: int = Field(default=0, nullable=False)
    test_output: str = Field(default="", sa_column=Column(Text, nullable=False))
    duration_seconds: float = Field(default=0.0, nullable=False)
    timed_out: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)

    # Relationships
    session: Optional["AgentSessionRow"] = Relationship(back_populates="bisect_commits")
