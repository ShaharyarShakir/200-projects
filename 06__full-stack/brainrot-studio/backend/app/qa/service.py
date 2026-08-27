import logging
from uuid import UUID

from sqlmodel import Session, select

from app.models.asset import Asset, AssetType
from app.models.caption import Caption
from app.models.dialogue import DialogueSegment
from app.models.qa import QAIssueRecord, QAReport, RepairAttempt
from app.models.scene import Scene
from app.qa.ai import run_ai_creative_qa
from app.qa.audio import check_audio_quality
from app.qa.captions import check_captions_quality
from app.qa.deterministic import check_media_format
from app.qa.models import QAIssue, QAReportData
from app.qa.repair import RepairEngine
from app.qa.rules import MAX_QA_RETRIES, PASS_SCORE_THRESHOLD, QA_CATEGORY_WEIGHTS
from app.qa.timeline import check_timeline_integrity

logger = logging.getLogger(__name__)


class QAService:
    """Orchestrates multi-phase Quality Assurance and targeted repair workflows."""

    @staticmethod
    def compute_score(issues: list[QAIssue]) -> float:
        """Computes a weighted 0-100 QA quality score based on detected issue severities."""
        if not issues:
            return 100.0

        deductions = {
            "media": 0.0,
            "timeline": 0.0,
            "audio": 0.0,
            "captions": 0.0,
            "assets": 0.0,
            "story": 0.0,
            "visual": 0.0,
        }

        severity_penalties = {
            "info": 2.0,
            "warning": 8.0,
            "error": 20.0,
            "critical": 50.0,
        }

        for issue in issues:
            cat = issue.category.value if hasattr(issue.category, "value") else str(issue.category)
            sev = issue.severity.value if hasattr(issue.severity, "value") else str(issue.severity)

            penalty = severity_penalties.get(sev.lower(), 5.0)
            if cat in deductions:
                deductions[cat] += penalty

        total_score = 100.0
        for cat, weight in QA_CATEGORY_WEIGHTS.items():
            cat_deduction = deductions.get(cat, 0.0)
            total_score -= cat_deduction * weight

        return max(0.0, round(total_score, 1))

    @classmethod
    async def run_full_qa(
        cls,
        session: Session,
        video_id: UUID,
        story_version_id: UUID,
        video_path: str | None = None,
        provider: str = "ollama",
    ) -> QAReportData:
        """Runs pre-render, post-render media QA, and AI creative QA checks."""
        issues: list[QAIssue] = []
        checks_run = 0

        # Load database models
        scenes = session.exec(
            select(Scene).where(Scene.video_id == video_id).order_by(Scene.position)
        ).all()
        captions = session.exec(select(Caption).where(Caption.video_id == video_id)).all()

        audio_assets = session.exec(
            select(Asset).where(Asset.video_id == video_id, Asset.asset_type == AssetType.AUDIO)
        ).all()

        scene_ids = [s.id for s in scenes]
        dialogue_segments = []
        if scene_ids:
            dialogue_segments = session.exec(
                select(DialogueSegment).where(DialogueSegment.scene_id.in_(scene_ids))  # type: ignore
            ).all()

        total_dur_ms = sum((s.duration_ms or 5000) for s in scenes)

        # 1. Timeline Integrity QA
        timeline_issues = check_timeline_integrity(scenes, total_dur_ms)
        issues.extend(timeline_issues)
        checks_run += 5

        # 2. Captions QA
        caption_issues = check_captions_quality(captions, total_dur_ms)
        issues.extend(caption_issues)
        checks_run += 4

        # 3. Audio Quality QA
        audio_issues = check_audio_quality(scenes, dialogue_segments, audio_assets)
        issues.extend(audio_issues)
        checks_run += 4

        # 4. Deterministic Post-Render Media QA
        if video_path:
            media_issues = check_media_format(video_path)
            issues.extend(media_issues)
            checks_run += 5

        # 5. AI Creative QA
        ai_issues = await run_ai_creative_qa(scenes, dialogue_segments, captions, provider_override=provider)
        issues.extend(ai_issues)
        checks_run += 5

        score = cls.compute_score(issues)

        # Critical severity or score below threshold means QA failed
        has_critical = any(
            (i.severity.value if hasattr(i.severity, "value") else str(i.severity)).lower() == "critical"
            for i in issues
        )
        passed = (score >= PASS_SCORE_THRESHOLD) and not has_critical


        return QAReportData(passed=passed, score=score, issues=issues, checks_run=checks_run)

    @classmethod
    def save_qa_report(
        cls,
        session: Session,
        generation_job_id: UUID,
        attempt: int,
        report_data: QAReportData,
    ) -> QAReport:
        """Persists a QA report and its individual issues to PostgreSQL."""
        report = QAReport(
            generation_job_id=generation_job_id,
            attempt=attempt,
            score=report_data.score,
            passed=report_data.passed,
            checks_run=report_data.checks_run,
        )
        session.add(report)
        session.commit()
        session.refresh(report)

        for issue in report_data.issues:
            rec = QAIssueRecord(
                qa_report_id=report.id,
                category=issue.category,
                severity=issue.severity,
                code=issue.code,
                message=issue.message,
                scene_id=issue.scene_id,
                repairable=issue.repairable,
            )
            session.add(rec)

        session.commit()
        return report

    @classmethod
    async def evaluate_and_repair_loop(
        cls,
        session: Session,
        generation_job_id: UUID,
        video_id: UUID,
        story_version_id: UUID,
        video_path: str | None = None,
        provider: str = "ollama",
    ) -> tuple[QAReportData, int]:
        """Runs QA evaluation and automatic repair retry loop up to MAX_QA_RETRIES."""
        attempt = 1

        while attempt <= (MAX_QA_RETRIES + 1):
            logger.info(f"Running QA evaluation attempt {attempt}/{MAX_QA_RETRIES + 1}...")

            report_data = await cls.run_full_qa(
                session=session,
                video_id=video_id,
                story_version_id=story_version_id,
                video_path=video_path,
                provider=provider,
            )


            db_report = cls.save_qa_report(
                session=session,
                generation_job_id=generation_job_id,
                attempt=attempt,
                report_data=report_data,
            )

            if report_data.passed or attempt > MAX_QA_RETRIES:
                return report_data, attempt

            # Compute repair plans
            repair_plans = RepairEngine.analyze_report(report_data)
            if not repair_plans:
                logger.info("No repairable issues found. Stopping repair loop.")
                return report_data, attempt

            logger.info(f"Attempt {attempt} failed QA. Executing {len(repair_plans)} automatic repair plans...")

            for plan in repair_plans:
                repaired = await RepairEngine.execute_repair_plan(
                    session=session,
                    video_id=video_id,
                    story_version_id=story_version_id,
                    plan=plan,
                    provider=provider,
                )

                # Log repair attempt record
                for rtype in plan.repairs:
                    attempt_rec = RepairAttempt(
                        generation_job_id=generation_job_id,
                        qa_report_id=db_report.id,
                        repair_type=rtype,
                        scene_id=plan.scene_id,
                        status="completed" if repaired else "failed",
                        reason=plan.reason,
                    )
                    session.add(attempt_rec)
                session.commit()

            attempt += 1

        return report_data, attempt
