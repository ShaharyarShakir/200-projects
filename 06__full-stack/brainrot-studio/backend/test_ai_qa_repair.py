import asyncio
import os
import sys
from uuid import uuid4

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User
from app.models.project import Project
from app.models.video import Video
from app.models.story import Story, StoryVersion
from app.models.scene import Scene
from app.models.caption import Caption
from app.models.dialogue import DialogueSegment
from app.models.asset import Asset, AssetType, AssetPurpose, AssetStatus
from app.models.qa import QAReport, QAIssueRecord, RepairAttempt
from app.qa.service import QAService
from app.qa.repair import RepairEngine
from app.services.generation import execute_generation_job, apply_story_version_to_video


def test_ai_qa_and_repair_loop():
    """Integration test for multi-phase AI QA quality evaluation, flaw detection, and automatic scene repair loop."""
    print("==================================================")
    print("🚀 STARTING AI QA & AUTOMATIC REPAIR INTEGRATION TESTS")
    print("==================================================")

    with Session(engine) as session:
        # 1. Setup Test User, Project, Video
        test_email = f"qa_user_{uuid4().hex[:6]}@example.com"
        user = User(email=test_email, password_hash="fakehashedpassword", full_name="QA Tester")

        session.add(user)
        session.commit()
        session.refresh(user)

        project = Project(name="AI QA Project", owner_id=user.id)

        session.add(project)
        session.commit()
        session.refresh(project)

        video = Video(project_id=project.id, title="AI QA Short")
        session.add(video)
        session.commit()
        session.refresh(video)

        print(f"✓ Created test hierarchy: User ({user.id}), Project ({project.id}), Video ({video.id})")

        # 2. Test Story & Scenes setup
        story = Story(video_id=video.id, title="QA Test Story", premise="Test story premise", target_duration_ms=15000)

        session.add(story)
        session.commit()
        session.refresh(story)

        content_json = {
            "title": "QA Test Story",
            "premise": "Test story premise",
            "target_duration_ms": 15000,
            "hook": "Bro is rich!",
            "scenes": [
                {
                    "scene_number": 1,
                    "purpose": "hook",
                    "narration": "Bro wakes up broke in a dusty dorm.",
                    "dialogue": "I am so broke man...",
                    "visual_prompt": "Broke student waking up",
                    "duration_ms": 5000,
                },
                {
                    "scene_number": 2,
                    "purpose": "twist",
                    "narration": "Roommate opens black luxury credit card.",
                    "dialogue": "Wait... you own three skyscrapers?!",
                    "visual_prompt": "Roommate holding black card",
                    "duration_ms": 5000,
                },
                {
                    "scene_number": 3,
                    "purpose": "punchline",
                    "narration": "They order 500 pizzas.",
                    "dialogue": "Free pizza forever!",
                    "visual_prompt": "Piles of pizza boxes",
                    "duration_ms": 5000,
                },
            ],
        }

        sv = StoryVersion(story_id=story.id, version=1, content_json=content_json)
        session.add(sv)
        session.commit()
        session.refresh(sv)

        # Apply story version to populate scenes & captions
        asyncio.run(apply_story_version_to_video(session, video.id, sv.id))

        scenes = session.exec(select(Scene).where(Scene.video_id == video.id)).all()

        assert len(scenes) == 3, f"Expected 3 scenes, got {len(scenes)}"
        print(f"✓ StoryVersion applied: {len(scenes)} scenes populated in database")

        # 3. Test Full QA Evaluation
        report_data = asyncio.run(
            QAService.run_full_qa(
                session=session,
                video_id=video.id,
                story_version_id=sv.id,
                provider="ollama",
            )
        )

        print(f"✓ Initial QA Evaluation: Score={report_data.score}/100, Passed={report_data.passed}, Checks={report_data.checks_run}")

        from app.models.generation_job import GenerationJob, GenerationStatus
        initial_job = GenerationJob(video_id=video.id, prompt="QA Initial Test", status=GenerationStatus.PROCESSING)
        session.add(initial_job)
        session.commit()
        session.refresh(initial_job)

        # Save Report to DB
        db_report = QAService.save_qa_report(
            session=session,
            generation_job_id=initial_job.id,
            attempt=1,
            report_data=report_data,
        )
        assert db_report.id is not None
        print(f"✓ Saved QAReport #{db_report.id} to PostgreSQL database")

        # 4. Test Injecting Flaws & Automatic Repair Engine Analysis
        # Inject silence gap issue into Scene 2
        scene2 = scenes[1]
        scene2.duration_ms = 12000  # Make scene 12s but dialogue audio is only 2s
        session.add(scene2)
        session.commit()

        report_with_flaw = asyncio.run(
            QAService.run_full_qa(
                session=session,
                video_id=video.id,
                story_version_id=sv.id,
                provider="ollama",
            )
        )

        print(f"✓ Flaw Injected: Score={report_with_flaw.score}/100, Issues={len(report_with_flaw.issues)}")
        assert any(i.code in ("SCENE_AUDIO_SILENCE", "MISSING_VOICE_TRACK") for i in report_with_flaw.issues), "Expected audio issue code"
        assert any(i.code == "SLOW_SCENE" for i in report_with_flaw.issues), "Expected SLOW_SCENE issue code for 12s scene"

        # Analyze Repair Plan
        plans = RepairEngine.analyze_report(report_with_flaw)
        assert len(plans) > 0, "Expected repair plans for silence flaw"
        print(f"✓ Repair Engine generated {len(plans)} targeted repair plan(s): {plans[0].reason}")

        # 5. Execute Repair Loop
        job_id = uuid4()
        from app.models.generation_job import GenerationJob, GenerationStatus
        job = GenerationJob(id=job_id, video_id=video.id, prompt="QA Test", status=GenerationStatus.PROCESSING)
        session.add(job)
        session.commit()

        final_report, attempts = asyncio.run(
            QAService.evaluate_and_repair_loop(
                session=session,
                generation_job_id=job_id,
                video_id=video.id,
                story_version_id=sv.id,
                provider="ollama",
            )
        )

        print(f"✓ Evaluated & Repaired: Final Score={final_report.score}/100, Passed={final_report.passed}, Total Attempts={attempts}")

        # Verify DB Records
        saved_reports = session.exec(select(QAReport).where(QAReport.generation_job_id == job_id)).all()
        saved_repairs = session.exec(select(RepairAttempt).where(RepairAttempt.generation_job_id == job_id)).all()
        assert len(saved_reports) > 0, "Expected saved QA reports in DB"
        print(f"✓ Verified DB Persistence: {len(saved_reports)} QAReport(s), {len(saved_repairs)} RepairAttempt(s)")

    print("\n==================================================")
    print("🎉 ALL AI QA & AUTOMATIC REPAIR INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    test_ai_qa_and_repair_loop()
