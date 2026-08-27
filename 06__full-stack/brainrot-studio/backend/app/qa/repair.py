import logging
from uuid import UUID

from sqlmodel import Session, select

from app.audio.providers.local import LocalVoiceProvider
from app.audio.timing import get_audio_duration_ms
from app.models.asset import Asset, AssetPurpose, AssetStatus, AssetType
from app.models.caption import Caption
from app.models.dialogue import DialogueSegment
from app.models.qa import QACategory, RepairType
from app.models.scene import Scene
from app.models.story import StoryVersion
from app.qa.models import QAReportData, RepairPlan
from app.services.generation import regenerate_scene_service

logger = logging.getLogger(__name__)


class RepairEngine:
    """Targeted automatic repair engine that selectively fixes broken video scenes or dialogue layers."""

    @staticmethod
    def analyze_report(report_data: QAReportData) -> list[RepairPlan]:
        """Analyzes QA issues to compute a list of repair plans."""
        plans: list[RepairPlan] = []

        for issue in report_data.issues:
            if not issue.repairable:
                continue

            if issue.code in ("SCENE_AUDIO_SILENCE", "MISSING_VOICE_TRACK"):
                plans.append(
                    RepairPlan(
                        scene_id=issue.scene_id,
                        repairs=[RepairType.VOICE, RepairType.CAPTION, RepairType.TIMELINE],
                        reason=f"Fix missing or silent audio: {issue.message}",
                    )
                )

            elif issue.code in ("CAPTION_OUT_OF_BOUNDS", "EMPTY_CAPTION", "CAPTION_OVERLAP", "INVALID_CAPTION_TIMING"):
                plans.append(
                    RepairPlan(
                        scene_id=issue.scene_id,
                        repairs=[RepairType.CAPTION],
                        reason=f"Recalculate caption timing: {issue.message}",
                    )
                )

            elif issue.code in ("SCENE_OVERLAP", "TIMELINE_GAP", "SCENE_TOO_SHORT"):
                plans.append(
                    RepairPlan(
                        scene_id=issue.scene_id,
                        repairs=[RepairType.TIMELINE],
                        reason=f"Realign timeline scene timings: {issue.message}",
                    )
                )

            elif issue.code in (
                "REPETITIVE_STORY",
                "STORY_INCOHERENT",
                "WEAK_HOOK",
                "WEAK_PUNCHLINE",
                "SLOW_SCENE",
                "LOW_DIALOGUE_DENSITY",
            ):
                plans.append(
                    RepairPlan(
                        scene_id=issue.scene_id,
                        repairs=[RepairType.DIALOGUE, RepairType.VOICE, RepairType.CAPTION, RepairType.TIMELINE],
                        reason=f"Regenerate AI dialogue & timeline for scene: {issue.message}",
                    )
                )

        return plans

    @staticmethod
    async def execute_repair_plan(
        session: Session,
        video_id: UUID,
        story_version_id: UUID,
        plan: RepairPlan,
        provider: str = "ollama",
    ) -> bool:
        """Executes targeted repairs for a specific scene or layer without re-generating intact video scenes."""
        logger.info(f"Executing repair plan: {plan.reason} (Scene: {plan.scene_id}, Types: {plan.repairs})")

        scenes = session.exec(
            select(Scene).where(Scene.video_id == video_id).order_by(Scene.position)
        ).all()

        if not scenes:
            return False

        target_scene = next((s for s in scenes if s.id == plan.scene_id), scenes[0])

        # 1. Dialogue Repair
        if RepairType.DIALOGUE in plan.repairs:
            instruction = f"Fix issue: {plan.reason}. Rewrite dialogue to be punchier and non-repetitive."
            await regenerate_scene_service(
                session=session,
                video_id=video_id,
                scene_id=target_scene.id,
                instruction=instruction,
                provider=provider,
            )
            # Refresh scene
            session.refresh(target_scene)

        # 2. Voice Repair
        if RepairType.VOICE in plan.repairs:
            voice_provider = LocalVoiceProvider()

            # Find or create dialogue segment
            segs = session.exec(select(DialogueSegment).where(DialogueSegment.scene_id == target_scene.id)).all()
            if not segs:
                seg = DialogueSegment(
                    scene_id=target_scene.id,
                    character_name="narrator",
                    text=target_scene.narration or target_scene.dialogue or "Brainrot video scene",
                    duration_ms=target_scene.duration_ms or 5000,
                )
                session.add(seg)
                session.commit()
                session.refresh(seg)
                segs = [seg]

            import os
            media_dir = os.path.join(os.getcwd(), "media", "voice", str(video_id))
            os.makedirs(media_dir, exist_ok=True)

            for seg in segs:
                filename = f"voice_repair_{target_scene.id}_{seg.id}.wav"
                out_file = os.path.join(media_dir, filename)

                synth_res = await voice_provider.synthesize(
                    text=seg.text, voice_id="narrator", output_path=out_file
                )
                dur_ms = synth_res.get("duration_ms", 3000)
                file_size = os.path.getsize(out_file) if os.path.exists(out_file) else 0

                from uuid import uuid4
                audio_asset = Asset(
                    video_id=video_id,
                    scene_id=target_scene.id,
                    filename=filename,
                    object_key=f"voice/{video_id}/{uuid4().hex[:8]}_{filename}",
                    content_type="audio/wav",
                    asset_type=AssetType.AUDIO,
                    size_bytes=file_size,
                    status=AssetStatus.READY,
                    purpose=AssetPurpose.VOICE,
                    duration_seconds=dur_ms / 1000.0,
                )

                session.add(audio_asset)
                session.commit()
                session.refresh(audio_asset)


                seg.audio_asset_id = audio_asset.id
                seg.duration_ms = dur_ms
                session.add(seg)

                target_scene.duration_ms = max(target_scene.duration_ms or 5000, dur_ms)
                session.add(target_scene)
                session.commit()

        # 3. Caption Repair & Timeline Rebuild
        if RepairType.CAPTION in plan.repairs or RepairType.TIMELINE in plan.repairs:
            # Clear old captions & rebuild timeline sequence
            all_scenes = session.exec(
                select(Scene).where(Scene.video_id == video_id).order_by(Scene.position)
            ).all()

            current_ms = 0
            for sc in all_scenes:
                sc.start_ms = current_ms
                dur = sc.duration_ms or 5000
                current_ms += dur
                session.add(sc)

                # Re-generate captions
                old_caps = session.exec(select(Caption).where(Caption.video_id == video_id)).all()
                for c in old_caps:
                    session.delete(c)
                session.commit()

                cap_text = sc.dialogue or sc.narration or f"Scene {sc.position + 1}"
                new_cap = Caption(
                    video_id=video_id,
                    text=cap_text.upper(),
                    start_ms=sc.start_ms,
                    end_ms=sc.start_ms + dur,
                    style="default",

                )
                session.add(new_cap)

            session.commit()


        return True
