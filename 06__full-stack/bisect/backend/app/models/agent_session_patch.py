from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, Text
from sqlmodel import Field, Relationship, SQLModel

from app.models.user import utc_now

if TYPE_CHECKING:
    from app.models.agent_session import AgentSessionRow


class AgentSessionPatchRow(SQLModel, table=True):
    """The unified diff one agent session produced, stored whole.

    ``session_id`` is the primary key, so "one patch per session" is a schema
    invariant rather than something the service layer has to police: a second
    patch for the same session replaces the first instead of accumulating.

    The diff is stored as an opaque blob because it is only ever read whole and
    never queried by field. It is deliberately unbounded here; the response-size
    question is deferred rather than answered with a silent truncation.
    """

    __tablename__ = "agent_session_patches"

    session_id: str = Field(
        foreign_key="agent_sessions.id",
        primary_key=True,
        nullable=False,
    )
    diff: str = Field(
        default="",
        sa_column=Column(Text, nullable=False),
    )
    is_empty: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(
        default_factory=utc_now,
        nullable=False,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Relationships
    session: Optional["AgentSessionRow"] = Relationship(back_populates="patch")
