from uuid import UUID
from pydantic import BaseModel, Field

from app.models.qa import QACategory, QASeverity, RepairType


class QAIssue(BaseModel):
    category: QACategory
    severity: QASeverity
    code: str
    message: str
    scene_id: UUID | None = None
    repairable: bool = True


class QAReportData(BaseModel):
    passed: bool
    score: float = Field(ge=0.0, le=100.0)
    issues: list[QAIssue] = Field(default_factory=list)
    checks_run: int = 0


class AISceneQA(BaseModel):
    coherent: bool = True
    dialogue_caption_match: bool = True
    visual_story_match: bool = True
    repetitive: bool = False
    quality_score: float = 85.0
    issues: list[str] = Field(default_factory=list)
    repair_recommendation: str | None = None


class RepairPlan(BaseModel):
    scene_id: UUID | None = None
    repairs: list[RepairType] = Field(default_factory=list)
    reason: str
