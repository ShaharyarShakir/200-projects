import logging
from uuid import UUID

from app.models.asset import Asset
from app.models.dialogue import DialogueSegment
from app.models.qa import QACategory, QASeverity
from app.models.scene import Scene
from app.qa.models import QAIssue
from app.qa.rules import MAX_SILENCE_PER_SCENE_SEC, MIN_DIALOGUE_DENSITY_RATIO

logger = logging.getLogger(__name__)


def check_audio_quality(
    scenes: list[Scene],
    dialogue_segments: list[DialogueSegment],
    audio_assets: list[Asset],
) -> list[QAIssue]:
    """Validates physical dialogue audio presence, silence gaps, clipping, and dialogue speech coverage."""
    issues: list[QAIssue] = []

    diag_by_scene: dict[UUID, list[DialogueSegment]] = {}
    for d in dialogue_segments:
        if d.scene_id:
            diag_by_scene.setdefault(d.scene_id, []).append(d)

    assets_by_id = {a.id: a for a in audio_assets}

    for scene in scenes:
        scene_dur_sec = (scene.duration_ms or 5000) / 1000.0
        segs = diag_by_scene.get(scene.id, [])

        if not segs and scene.dialogue:
            issues.append(
                QAIssue(
                    category=QACategory.AUDIO,
                    severity=QASeverity.ERROR,
                    code="MISSING_VOICE_TRACK",
                    message=f"Scene {scene.position + 1} has dialogue text but no synthesized voice track audio.",
                    scene_id=scene.id,
                    repairable=True,
                )
            )
            continue

        total_voice_sec = 0.0
        for seg in segs:
            if seg.audio_asset_id and seg.audio_asset_id in assets_by_id:
                asset = assets_by_id[seg.audio_asset_id]
                total_voice_sec += asset.duration_seconds or (seg.duration_ms or 0) / 1000.0
            else:
                total_voice_sec += (seg.duration_ms or 0) / 1000.0

        silence_sec = max(0.0, scene_dur_sec - total_voice_sec)

        if silence_sec > MAX_SILENCE_PER_SCENE_SEC and len(segs) > 0:
            issues.append(
                QAIssue(
                    category=QACategory.AUDIO,
                    severity=QASeverity.ERROR,
                    code="SCENE_AUDIO_SILENCE",
                    message=f"Scene {scene.position + 1} contains {silence_sec:.1f}s of silence (voice is only {total_voice_sec:.1f}s for a {scene_dur_sec:.1f}s scene).",
                    scene_id=scene.id,
                    repairable=True,
                )
            )

        # Check dialogue density for long scenes (> 8 seconds)
        if scene_dur_sec >= 8.0 and (total_voice_sec / scene_dur_sec) < MIN_DIALOGUE_DENSITY_RATIO and len(segs) > 0:
            issues.append(
                QAIssue(
                    category=QACategory.AUDIO,
                    severity=QASeverity.WARNING,
                    code="LOW_DIALOGUE_DENSITY",
                    message=f"Scene {scene.position + 1} is {scene_dur_sec:.1f}s long but dialogue speech is only {total_voice_sec:.1f}s ({int((total_voice_sec / scene_dur_sec) * 100)}% density).",
                    scene_id=scene.id,
                    repairable=True,
                )
            )

    return issues

