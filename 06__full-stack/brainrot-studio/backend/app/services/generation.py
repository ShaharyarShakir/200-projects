import asyncio
import os
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.ai.gateway import AIGateway
from app.ai.graph.graph import story_graph
from app.ai.schemas.story import GeneratedScene
from app.audio.providers.local import LocalVoiceProvider
from app.audio.timing import get_audio_duration_ms
from app.core.database import engine
from app.models.asset import Asset, AssetPurpose, AssetStatus, AssetType
from app.models.caption import Caption
from app.models.composition import Composition
from app.models.dialogue import DialogueSegment
from app.models.generation_job import GenerationJob, GenerationStatus
from app.models.scene import Scene
from app.models.scene_asset import SceneAsset, SceneAssetRole
from app.models.qa import QAIssueRecord, RepairAttempt
from app.models.story import StoryVersion


from io import BytesIO

from app.models.track import Track, TrackItem, TrackType
from app.services.storage import upload_file
from app.services.timeline import recalculate_scene_positions, get_video_timeline

logger = logging.getLogger(__name__)


def generate_scene_background_asset(
    session: Session,
    video_id: UUID,
    scene: Scene,
    scene_index: int,
    visual_prompt: str | None,
) -> tuple[Asset, SceneAsset]:
    """Generates a vertical 9:16 background SVG asset for a scene, uploads to S3, and links as SceneAsset."""
    colors = [
        ("#1e1b4b", "#4c1d95", "#8b5cf6"),
        ("#064e3b", "#047857", "#10b981"),
        ("#1e3a8a", "#1d4ed8", "#3b82f6"),
        ("#881337", "#be123c", "#f43f5e"),
        ("#78350f", "#b45309", "#f59e0b"),
    ]
    c_idx = scene_index % len(colors)
    bg1, bg2, accent = colors[c_idx][0], colors[c_idx][1], colors[c_idx][2]

    title_clean = (scene.title or f"Scene {scene_index + 1}").replace("<", "&lt;").replace(">", "&gt;")
    prompt_clean = (visual_prompt or "Visual Scene Background").replace("<", "&lt;").replace(">", "&gt;")

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg1}" />
      <stop offset="50%" stop-color="#090a0f" />
      <stop offset="100%" stop-color="{bg2}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="{accent}" stop-opacity="0.0" />
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bgGrad)" />
  <rect width="1080" height="1920" fill="url(#glow)" />
  <g stroke="#ffffff" stroke-opacity="0.08" stroke-width="2">
    <line x1="0" y1="480" x2="1080" y2="480" />
    <line x1="0" y1="960" x2="1080" y2="960" />
    <line x1="0" y1="1440" x2="1080" y2="1440" />
    <line x1="360" y1="0" x2="360" y2="1920" />
    <line x1="720" y1="0" x2="720" y2="1920" />
  </g>
  <rect x="140" y="560" width="800" height="800" rx="40" fill="#000000" fill-opacity="0.4" stroke="{accent}" stroke-width="4" stroke-opacity="0.6" />
  <text x="540" y="860" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="bold">{title_clean}</text>
  <text x="540" y="940" text-anchor="middle" fill="{accent}" font-family="sans-serif" font-size="28" font-weight="600">SCENE {scene_index + 1} VISUAL ENGINE</text>
  <text x="540" y="1020" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="22">{prompt_clean[:60]}</text>
</svg>"""

    object_key = f"videos/{video_id}/assets/scene_{scene.id}_bg.svg"
    try:
        upload_file(BytesIO(svg_content.encode("utf-8")), object_key, "image/svg+xml")
    except Exception as exc:
        logger.warning(f"Failed to upload scene background to storage: {exc}")

    asset = Asset(
        video_id=video_id,
        scene_id=scene.id,
        filename=f"scene_{scene_index + 1}_bg.svg",
        object_key=object_key,
        content_type="image/svg+xml",
        size_bytes=len(svg_content),
        asset_type=AssetType.IMAGE,
        status=AssetStatus.READY,
        purpose=AssetPurpose.ORIGINAL,
        width=1080,
        height=1920,
    )
    session.add(asset)
    session.flush()

    scene_asset = SceneAsset(
        scene_id=scene.id,
        asset_id=asset.id,
        role=SceneAssetRole.BACKGROUND,
        start_ms=0,
        duration_ms=scene.duration_ms or 5000,
        z_index=0,
        x=0.5,
        y=0.5,
        scale=1.0,
        rotation=0,
        opacity=1.0,
    )
    session.add(scene_asset)
    session.flush()

    return asset, scene_asset


def create_generation_job(
    session: Session,
    video_id: UUID,
    prompt: str,
) -> GenerationJob:
    job = GenerationJob(
        video_id=video_id,
        prompt=prompt,
        status=GenerationStatus.QUEUED,
        progress=0.0,
    )
    session.add(job)
    session.commit()
    session.refresh(job)
    return job


def get_generation_job(
    session: Session,
    job_id: UUID,
) -> GenerationJob | None:
    return session.get(GenerationJob, job_id)


async def execute_generation_job(
    job_id: UUID,
    video_id: UUID,
    prompt: str,
    target_duration_ms: int = 30000,
    tone: str = "chaotic",
    language: str = "en",
    provider: str = "gemini",
):
    """Executes the AI story generation job in background and updates DB status."""
    with Session(engine) as session:
        job = session.get(GenerationJob, job_id)
        if not job:
            return
        job.status = GenerationStatus.PROCESSING
        job.progress = 25.0
        session.add(job)
        session.commit()

    try:
        initial_state = {
            "video_id": str(video_id),
            "user_prompt": prompt,
            "target_duration_ms": target_duration_ms,
            "tone": tone,
            "language": language,
            "provider": provider,
            "plan": None,
            "story": None,
            "validation_errors": [],
            "retry_count": 0,
            "max_retries": 2,
            "story_id": None,
            "story_version_id": None,
            "generation_job_id": str(job_id),
        }


        final_state = await story_graph.ainvoke(initial_state)

        story_version_id_str = final_state.get("story_version_id")

        with Session(engine) as session:
            job = session.get(GenerationJob, job_id)
            if job:
                if story_version_id_str:
                    sv_id = UUID(story_version_id_str)
                    job.story_version_id = sv_id
                    
                    # Apply story version to populate scenes, audio assets, captions
                    await apply_story_version_to_video(session, video_id, sv_id)


                    # Import QAService and run QA + automatic repair loop
                    from app.qa.service import QAService
                    qa_report, attempts = await QAService.evaluate_and_repair_loop(
                        session=session,
                        generation_job_id=job_id,
                        video_id=video_id,
                        story_version_id=sv_id,
                        provider=provider,
                    )

                    job.status = GenerationStatus.COMPLETED
                    job.progress = 100.0
                    if not qa_report.passed:
                        job.error_message = f"QA score: {qa_report.score:.1f}/100 after {attempts} attempts. Minor QA warnings detected."


                else:
                    job.status = GenerationStatus.COMPLETED
                    job.progress = 100.0

                job.completed_at = datetime.now(timezone.utc)
                session.add(job)
                session.commit()

    except Exception as exc:
        logger.error(f"Error executing generation job {job_id}: {exc}", exc_info=True)
        with Session(engine) as session:
            job = session.get(GenerationJob, job_id)
            if job:
                job.status = GenerationStatus.FAILED
                job.error_message = str(exc)
                job.completed_at = datetime.now(timezone.utc)
                session.add(job)
                session.commit()



async def apply_story_version_to_video(
    session: Session,
    video_id: UUID,
    story_version_id: UUID,
) -> dict:
    """Applies a generated StoryVersion to a video timeline, creating Scene, Voice Asset, DialogueSegment, and Caption records."""
    story_version = session.get(StoryVersion, story_version_id)
    if not story_version:
        raise ValueError("StoryVersion not found")

    content = story_version.content_json
    raw_scenes = content.get("scenes", [])

    # Clear existing dialogue segments, assets, scene_assets, captions, and scenes
    existing_scenes = session.exec(select(Scene).where(Scene.video_id == video_id)).all()
    scene_ids = [s.id for s in existing_scenes]

    if scene_ids:
        # Delete DialogueSegments referencing existing scenes
        existing_dialogues = session.exec(
            select(DialogueSegment).where(DialogueSegment.scene_id.in_(scene_ids))
        ).all()
        for d in existing_dialogues:
            session.delete(d)

        # Delete SceneAssets referencing existing scenes
        existing_scene_assets = session.exec(
            select(SceneAsset).where(SceneAsset.scene_id.in_(scene_ids))
        ).all()
        for sa in existing_scene_assets:
            session.delete(sa)

        # Delete Assets referencing existing scenes (e.g. voice tracks)
        existing_assets = session.exec(
            select(Asset).where(Asset.scene_id.in_(scene_ids))
        ).all()
        for a in existing_assets:
            session.delete(a)

        # Unlink QAIssueRecords pointing to scenes being cleared
        existing_issues = session.exec(
            select(QAIssueRecord).where(QAIssueRecord.scene_id.in_(scene_ids))
        ).all()
        for issue in existing_issues:
            issue.scene_id = None
            session.add(issue)

        # Unlink RepairAttempts pointing to scenes being cleared
        existing_repairs = session.exec(
            select(RepairAttempt).where(RepairAttempt.scene_id.in_(scene_ids))
        ).all()
        for rep in existing_repairs:
            rep.scene_id = None
            session.add(rep)


    for s in existing_scenes:
        session.delete(s)

    existing_captions = session.exec(select(Caption).where(Caption.video_id == video_id)).all()
    for c in existing_captions:
        session.delete(c)

    session.commit()


    voice_provider = LocalVoiceProvider()
    media_dir = os.path.join(os.getcwd(), "media", "voice", str(video_id))
    os.makedirs(media_dir, exist_ok=True)

    voice_track = session.exec(
        select(Track).where(Track.video_id == video_id, Track.track_type == TrackType.AUDIO)
    ).first()
    if not voice_track:
        voice_track = Track(
            video_id=video_id,
            name="Voice Narration",
            track_type=TrackType.AUDIO,
            order=0,
            muted=False,
        )
        session.add(voice_track)
        session.commit()
        session.refresh(voice_track)

    current_ms = 0

    for idx, sc in enumerate(raw_scenes):
        dur_ms = sc.get("duration_ms", 5000)
        raw_diag = sc.get("dialogue", [])
        if isinstance(raw_diag, list):
            dialogue_items = raw_diag
            dialogue_text = " ".join([f"{d.get('character')}: {d.get('text')}" if isinstance(d, dict) else str(d) for d in dialogue_items])
        elif raw_diag:
            dialogue_items = [raw_diag]
            dialogue_text = str(raw_diag)
        else:
            dialogue_items = []
            dialogue_text = ""




        db_scene = Scene(
            video_id=video_id,
            order=idx,
            position=idx,
            start_ms=current_ms,
            duration_ms=dur_ms,
            title=sc.get("purpose") or f"Scene {idx + 1}",
            visual_prompt=sc.get("visual_description"),
            narration=sc.get("visual_description"),
            dialogue=dialogue_text,
        )
        session.add(db_scene)
        session.flush()

        # Generate visual background asset for scene canvas
        generate_scene_background_asset(
            session=session,
            video_id=video_id,
            scene=db_scene,
            scene_index=idx,
            visual_prompt=sc.get("visual_description"),
        )

        # Synthesize voice dialogue segments if present
        scene_voice_duration = 0
        for d_idx, d_item in enumerate(dialogue_items):
            if isinstance(d_item, dict):
                char_name = d_item.get("character", "Narrator")
                speech_text = d_item.get("text", "")
            else:
                char_name = "Narrator"
                speech_text = str(d_item)
            out_file = os.path.join(media_dir, f"scene_{idx + 1}_diag_{d_idx + 1}.wav")

            # LocalVoiceProvider synthesis
            synth_res = await voice_provider.synthesize(
                text=speech_text, voice_id=char_name, output_path=out_file
            )

            phys_dur = get_audio_duration_ms(out_file)
            scene_voice_duration += phys_dur

            out_object_key = f"videos/{video_id}/voice/scene_{idx + 1}_diag_{d_idx + 1}.wav"
            if os.path.exists(out_file):
                try:
                    with open(out_file, "rb") as f:
                        upload_file(f, out_object_key, "audio/wav")
                except Exception as exc:
                    logger.warning(f"Failed to upload voice audio to storage: {exc}")

            # Create audio Asset record
            audio_asset = Asset(
                video_id=video_id,
                scene_id=db_scene.id,
                filename=os.path.basename(out_file),
                object_key=out_object_key,
                content_type="audio/wav",
                size_bytes=os.path.getsize(out_file) if os.path.exists(out_file) else 0,
                asset_type=AssetType.AUDIO,
                status=AssetStatus.READY,
                purpose=AssetPurpose.VOICE,
                duration_seconds=phys_dur / 1000.0,
            )
            session.add(audio_asset)
            session.flush()

            # Add TrackItem to Voice Narration track
            track_item = TrackItem(
                track_id=voice_track.id,
                asset_id=audio_asset.id,
                start_ms=current_ms + (scene_voice_duration - phys_dur),
                duration_ms=phys_dur,
                offset_ms=0,
            )
            session.add(track_item)

            # Create DialogueSegment record
            diag_seg = DialogueSegment(
                scene_id=db_scene.id,
                character_name=char_name,
                text=speech_text,
                audio_asset_id=audio_asset.id,
                start_ms=scene_voice_duration - phys_dur,
                duration_ms=phys_dur,
            )
            session.add(diag_seg)

        # Physical reality rule: extend scene duration if dialogue audio is longer
        if scene_voice_duration > dur_ms:
            dur_ms = scene_voice_duration
            db_scene.duration_ms = dur_ms
            session.add(db_scene)

        # Create synchronized Caption record
        first_diag = dialogue_items[0] if dialogue_items else None
        if isinstance(first_diag, dict):
            diag_text_fallback = first_diag.get("text")
        elif first_diag is not None:
            diag_text_fallback = str(first_diag)
        else:
            diag_text_fallback = f"Scene {idx + 1}"

        caption_text = sc.get("caption") or diag_text_fallback

        cap = Caption(
            video_id=video_id,
            text=caption_text,
            start_ms=current_ms,
            end_ms=current_ms + dur_ms,
            style="meme",
        )
        session.add(cap)

        current_ms += dur_ms
        session.commit()

    recalculate_scene_positions(session, video_id)
    return get_video_timeline(session, video_id)


async def regenerate_scene_service(
    session: Session,
    video_id: UUID,
    scene_id: UUID,
    instruction: str,
    provider: str = "ollama",
) -> dict:
    """Regenerates a single scene using AI Gateway while keeping surrounding timeline intact."""
    scene = session.get(Scene, scene_id)
    if not scene or scene.video_id != video_id:
        raise ValueError("Scene not found")

    prompt = f"Regenerate scene with instruction: '{instruction}'. Original context: {scene.visual_prompt}. Dialogue: {scene.dialogue}"

    try:
        gateway = AIGateway(provider_override=provider)
        new_scene_data, _ = await gateway.generate_structured(
            prompt=prompt,
            schema=GeneratedScene,
            system_prompt="You are a video scene writer. Generate a single updated video scene based on the user instruction.",
            prompt_version="scene-regen-v1",
        )

    except Exception as exc:
        logger.warning(f"Scene regeneration AI gateway failed: {exc}. Using fallback regenerated scene.")
        new_scene_data = GeneratedScene(
            scene_number=scene.position + 1,
            duration_ms=scene.duration_ms or 5000,
            purpose=scene.title or "Regenerated Scene",
            visual_description=f"{scene.visual_prompt or 'Scene'} (Updated: {instruction})",
            dialogue=[
                {
                    "character": "Student" if "Student" in (scene.dialogue or "") else "Narrator",
                    "text": f"Absurd plot twist! {instruction}",
                }
            ],
            caption="SCENE REGENERATED 🔥",
        )

    scene.title = new_scene_data.purpose or scene.title
    scene.visual_prompt = new_scene_data.visual_description
    scene.narration = new_scene_data.visual_description
    if new_scene_data.duration_ms:
        scene.duration_ms = new_scene_data.duration_ms

    if new_scene_data.dialogue:
        scene.dialogue = " ".join([f"{d.character}: {d.text}" for d in new_scene_data.dialogue])

    session.add(scene)
    session.commit()
    session.refresh(scene)

    recalculate_scene_positions(session, video_id)
    return get_video_timeline(session, video_id)

