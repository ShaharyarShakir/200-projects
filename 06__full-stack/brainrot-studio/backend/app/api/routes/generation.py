import asyncio
from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.api.deps import get_current_user, get_db
from app.models.generation_job import GenerationJob, GenerationStatus
from app.models.story import StoryVersion
from app.models.user import User
from app.services.generation import (
    apply_story_version_to_video,
    create_generation_job,
    execute_generation_job,
    get_generation_job,
    regenerate_scene_service,
)
from app.services.project import get_project
from app.services.video import get_video

router = APIRouter()


class GenerateStoryRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    target_duration_ms: int = Field(default=30000, ge=5000, le=120000)
    tone: str = Field(default="chaotic")
    language: str = Field(default="en")
    provider: str = Field(default="gemini")


class RegenerateSceneRequest(BaseModel):
    instruction: str = Field(..., min_length=3, max_length=1000)


class GenerationJobResponse(BaseModel):
    id: UUID
    video_id: UUID
    prompt: str
    status: GenerationStatus
    progress: float
    error_message: str | None = None
    story_version_id: UUID | None = None
    story_preview: dict[str, Any] | None = None


@router.post(
    "/projects/{project_id}/videos/{video_id}/generate",
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_story(
    project_id: UUID,
    video_id: UUID,
    req: GenerateStoryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Queues an AI story generation job using AIGateway (Gemini / Ollama)."""
    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    video = get_video(db, project_id, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    job = create_generation_job(db, video_id, req.prompt)

    # Launch generation task asynchronously
    asyncio.create_task(
        execute_generation_job(
            job_id=job.id,
            video_id=video_id,
            prompt=req.prompt,
            target_duration_ms=req.target_duration_ms,
            tone=req.tone,
            language=req.language,
            provider=req.provider,
        )
    )


    return {
        "job_id": job.id,
        "status": job.status,
        "message": "AI Story generation job queued successfully",
    }


@router.get(
    "/projects/{project_id}/videos/{video_id}/generation-jobs/{job_id}",
    response_model=GenerationJobResponse,
)
def get_job_status(
    project_id: UUID,
    video_id: UUID,
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gets generation job status and story preview once completed."""
    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    job = get_generation_job(db, job_id)
    if not job or job.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generation job not found",
        )

    preview_json = None
    if job.story_version_id:
        story_version = db.get(StoryVersion, job.story_version_id)
        if story_version:
            preview_json = {
                "story_version_id": str(story_version.id),
                "version": story_version.version,
                "content": story_version.content_json,
            }

    return GenerationJobResponse(
        id=job.id,
        video_id=job.video_id,
        prompt=job.prompt,
        status=job.status,
        progress=job.progress,
        error_message=job.error_message,
        story_version_id=job.story_version_id,
        story_preview=preview_json,
    )


@router.post(
    "/projects/{project_id}/videos/{video_id}/stories/{story_version_id}/apply",
)
async def apply_story_version(
    project_id: UUID,
    video_id: UUID,
    story_version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Applies a generated story version to the video timeline."""
    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    video = get_video(db, project_id, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    try:
        timeline_payload = await apply_story_version_to_video(
            db,
            video_id,
            story_version_id,
        )
        return timeline_payload

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as exc:
        logger.error(f"Error in apply_story_version: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )


@router.post(
    "/projects/{project_id}/videos/{video_id}/scenes/{scene_id}/regenerate",
)
async def regenerate_scene(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    req: RegenerateSceneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    """Regenerates a single scene using AI Gateway while preserving the surrounding timeline."""
    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    video = get_video(db, project_id, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    try:
        timeline = await regenerate_scene_service(
            db,
            video_id,
            scene_id,
            req.instruction,
        )

        return timeline
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


class RepairJobRequest(BaseModel):
    scene_id: UUID | None = None
    repair_type: str = "dialogue"
    reason: str = "Manual repair request"


@router.get(
    "/generations/{id}/qa",
)
def get_qa_report_by_job_id(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gets latest QA report directly by generation job ID."""
    from sqlmodel import select
    from app.models.qa import QAIssueRecord, QAReport

    job = get_generation_job(db, id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    report = db.exec(
        select(QAReport)
        .where(QAReport.generation_job_id == id)
        .order_by(QAReport.attempt.desc())  # type: ignore
    ).first()

    if not report:
        return {
            "passed": True,
            "score": 100.0,
            "checks_run": 0,
            "attempt": 1,
            "issues": [],
        }

    issues = db.exec(
        select(QAIssueRecord).where(QAIssueRecord.qa_report_id == report.id)
    ).all()

    return {
        "id": str(report.id),
        "job_id": str(id),
        "attempt": report.attempt,
        "score": report.score,
        "passed": report.passed,
        "checks_run": report.checks_run,
        "created_at": report.created_at.isoformat(),
        "issues": [
            {
                "id": str(i.id),
                "category": i.category.value if hasattr(i.category, "value") else str(i.category),
                "severity": i.severity.value if hasattr(i.severity, "value") else str(i.severity),
                "code": i.code,
                "message": i.message,
                "scene_id": str(i.scene_id) if i.scene_id else None,
                "repairable": i.repairable,
            }
            for i in issues
        ],
    }


@router.get(
    "/generations/{id}/qa/history",
)
def get_qa_history_by_job_id(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gets QA history directly by generation job ID."""
    from sqlmodel import select
    from app.models.qa import QAReport, RepairAttempt

    job = get_generation_job(db, id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    reports = db.exec(
        select(QAReport)
        .where(QAReport.generation_job_id == id)
        .order_by(QAReport.attempt.asc())  # type: ignore
    ).all()

    repairs = db.exec(
        select(RepairAttempt)
        .where(RepairAttempt.generation_job_id == id)
        .order_by(RepairAttempt.created_at.asc())  # type: ignore
    ).all()

    return {
        "job_id": str(id),
        "reports": [
            {
                "id": str(r.id),
                "attempt": r.attempt,
                "score": r.score,
                "passed": r.passed,
                "checks_run": r.checks_run,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ],
        "repair_attempts": [
            {
                "id": str(rep.id),
                "repair_type": rep.repair_type.value if hasattr(rep.repair_type, "value") else str(rep.repair_type),
                "scene_id": str(rep.scene_id) if rep.scene_id else None,
                "status": rep.status,
                "reason": rep.reason,
                "created_at": rep.created_at.isoformat(),
            }
            for rep in repairs
        ],
    }


@router.post(
    "/generations/{id}/repair",
)
async def manual_job_repair(
    id: UUID,
    req: RepairJobRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Triggers manual targeted repair for a generation job."""
    job = get_generation_job(db, id)
    if not job or not job.story_version_id:
        raise HTTPException(status_code=404, detail="Generation job or story version not found")

    from app.models.qa import RepairType
    from app.qa.models import RepairPlan
    from app.qa.repair import RepairEngine

    repair_type_enum = RepairType(req.repair_type) if req.repair_type in RepairType._value2member_map_ else RepairType.DIALOGUE

    plan = RepairPlan(
        scene_id=req.scene_id,
        repairs=[repair_type_enum],
        reason=req.reason,
    )

    success = await RepairEngine.execute_repair_plan(
        session=db,
        video_id=job.video_id,
        story_version_id=job.story_version_id,
        plan=plan,
    )

    return {
        "job_id": str(id),
        "status": "success" if success else "failed",
        "repair_plan": plan.model_dump(),
    }


@router.get(
    "/projects/{project_id}/videos/{video_id}/generation-jobs/{job_id}/qa",
)
def get_latest_qa_report(
    project_id: UUID,
    video_id: UUID,
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gets the latest QA quality report and issue list for a generation job."""
    from sqlmodel import select
    from app.models.qa import QAIssueRecord, QAReport

    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    report = db.exec(
        select(QAReport)
        .where(QAReport.generation_job_id == job_id)
        .order_by(QAReport.attempt.desc())  # type: ignore
    ).first()

    if not report:
        return {
            "passed": True,
            "score": 100.0,
            "checks_run": 0,
            "attempt": 1,
            "issues": [],
        }

    issues = db.exec(
        select(QAIssueRecord).where(QAIssueRecord.qa_report_id == report.id)
    ).all()

    return {
        "id": str(report.id),
        "job_id": str(job_id),
        "attempt": report.attempt,
        "score": report.score,
        "passed": report.passed,
        "checks_run": report.checks_run,
        "created_at": report.created_at.isoformat(),
        "issues": [
            {
                "id": str(i.id),
                "category": i.category.value if hasattr(i.category, "value") else str(i.category),
                "severity": i.severity.value if hasattr(i.severity, "value") else str(i.severity),
                "code": i.code,
                "message": i.message,
                "scene_id": str(i.scene_id) if i.scene_id else None,
                "repairable": i.repairable,
            }
            for i in issues
        ],
    }


@router.get(
    "/projects/{project_id}/videos/{video_id}/generation-jobs/{job_id}/qa/history",
)
def get_qa_history(
    project_id: UUID,
    video_id: UUID,
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Gets complete history of QA evaluation attempts and repair actions for a job."""
    from sqlmodel import select
    from app.models.qa import QAReport, RepairAttempt

    project = get_project(db, project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reports = db.exec(
        select(QAReport)
        .where(QAReport.generation_job_id == job_id)
        .order_by(QAReport.attempt.asc())  # type: ignore
    ).all()

    repairs = db.exec(
        select(RepairAttempt)
        .where(RepairAttempt.generation_job_id == job_id)
        .order_by(RepairAttempt.created_at.asc())  # type: ignore
    ).all()

    return {
        "job_id": str(job_id),
        "reports": [
            {
                "id": str(r.id),
                "attempt": r.attempt,
                "score": r.score,
                "passed": r.passed,
                "checks_run": r.checks_run,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ],
        "repair_attempts": [
            {
                "id": str(rep.id),
                "repair_type": rep.repair_type.value if hasattr(rep.repair_type, "value") else str(rep.repair_type),
                "scene_id": str(rep.scene_id) if rep.scene_id else None,
                "status": rep.status,
                "reason": rep.reason,
                "created_at": rep.created_at.isoformat(),
            }
            for rep in repairs
        ],
    }


