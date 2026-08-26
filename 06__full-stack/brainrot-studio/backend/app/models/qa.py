from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class QACategory(str, Enum):
    MEDIA = "media"
    TIMELINE = "timeline"
    AUDIO = "audio"
    CAPTIONS = "captions"
    ASSETS = "assets"
    STORY = "story"
    VISUAL = "visual"


class QASeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class RepairType(str, Enum):
    TIMELINE = "timeline"
    ASSET = "asset"
    DIALOGUE = "dialogue"
    VOICE = "voice"
    CAPTION = "caption"
    AUDIO = "audio"
    SCENE = "scene"
    RENDER = "render"


class QAReport(SQLModel, table=True):
    __tablename__ = "qa_reports"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    generation_job_id: UUID = Field(foreign_key="generation_jobs.id", index=True)
    attempt: int = Field(default=1)
    score: float = Field(default=100.0)
    passed: bool = Field(default=True, index=True)
    checks_run: int = Field(default=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class QAIssueRecord(SQLModel, table=True):
    __tablename__ = "qa_issues"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    qa_report_id: UUID = Field(foreign_key="qa_reports.id", index=True)
    category: QACategory = Field(index=True)
    severity: QASeverity = Field(index=True)
    code: str = Field(max_length=100, index=True)
    message: str
    scene_id: UUID | None = Field(default=None, foreign_key="scenes.id", nullable=True)
    repairable: bool = Field(default=True)


class RepairAttempt(SQLModel, table=True):
    __tablename__ = "repair_attempts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    generation_job_id: UUID = Field(foreign_key="generation_jobs.id", index=True)
    qa_report_id: UUID | None = Field(default=None, foreign_key="qa_reports.id", nullable=True)
    repair_type: RepairType = Field(index=True)
    scene_id: UUID | None = Field(default=None, foreign_key="scenes.id", nullable=True)
    status: str = Field(default="completed", max_length=50)
    reason: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
