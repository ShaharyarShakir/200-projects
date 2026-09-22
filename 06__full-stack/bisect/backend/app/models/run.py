from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
import uuid
from sqlmodel import Field, Relationship, SQLModel

from app.models.enums import RunStatus, StepStatus, StepType
from app.models.user import utc_now

if TYPE_CHECKING:
    from app.models.repository import Repository


class RunBase(SQLModel):
    """Base schema attributes for Run."""

    branch_name: str = Field(default="main", nullable=False)
    commit_sha: Optional[str] = Field(default=None, nullable=True)
    pull_request_url: Optional[str] = Field(default=None, nullable=True)
    retry_count: int = Field(default=0, nullable=False)
    max_retries: int = Field(default=3, nullable=False)
    error_summary: Optional[str] = Field(default=None, nullable=True)


class Run(RunBase, table=True):
    """Run table managing automated test repair workflows."""

    __tablename__ = "runs"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    repository_id: uuid.UUID = Field(
        foreign_key="repositories.id",
        index=True,
        nullable=False,
    )
    status: RunStatus = Field(
        default=RunStatus.PENDING,
        index=True,
        nullable=False,
    )
    started_at: Optional[datetime] = Field(default_factory=utc_now, nullable=True)
    completed_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(
        default_factory=utc_now,
        nullable=False,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Relationships
    repository: Optional["Repository"] = Relationship(back_populates="runs")
    steps: List["RunStep"] = Relationship(
        back_populates="run",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "RunStep.sequence",
        },
    )


class RunStepBase(SQLModel):
    """Base schema attributes for RunStep."""

    sequence: int = Field(default=1, nullable=False, index=True)
    step_type: StepType = Field(index=True, nullable=False)
    status: StepStatus = Field(default=StepStatus.PENDING, index=True, nullable=False)
    duration_ms: Optional[float] = Field(default=None, nullable=True)
    stdout: Optional[str] = Field(default=None, nullable=True)
    stderr: Optional[str] = Field(default=None, nullable=True)
    patch_diff: Optional[str] = Field(default=None, nullable=True)
    tokens_used: Optional[int] = Field(default=None, nullable=True)


class RunStep(RunStepBase, table=True):
    """RunStep table recording chronological execution steps of a Run."""

    __tablename__ = "run_steps"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    run_id: uuid.UUID = Field(
        foreign_key="runs.id",
        index=True,
        nullable=False,
    )
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(
        default_factory=utc_now,
        nullable=False,
        sa_column_kwargs={"onupdate": utc_now},
    )

    # Relationships
    run: Optional[Run] = Relationship(back_populates="steps")
