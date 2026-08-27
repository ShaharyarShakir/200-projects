import logging

from app.models.qa import QACategory, QASeverity
from app.models.scene import Scene
from app.qa.models import QAIssue
from app.qa.rules import MAX_SLOW_SCENE_MS

logger = logging.getLogger(__name__)


def check_timeline_integrity(scenes: list[Scene], total_duration_ms: int = 0) -> list[QAIssue]:
    """Validates scene sequence, timing overlaps, coverage gaps, and pacing before or after rendering."""
    issues: list[QAIssue] = []

    if not scenes:
        issues.append(
            QAIssue(
                category=QACategory.TIMELINE,
                severity=QASeverity.CRITICAL,
                code="EMPTY_TIMELINE",
                message="Video timeline has no scenes.",
                repairable=True,
            )
        )
        return issues

    sorted_scenes = sorted(scenes, key=lambda s: s.start_ms if s.start_ms is not None else (s.position * 5000))

    current_time_ms = 0
    for i, scene in enumerate(sorted_scenes):
        scene_start = scene.start_ms if scene.start_ms is not None else current_time_ms
        scene_dur = scene.duration_ms if scene.duration_ms is not None else 5000
        scene_end = scene_start + scene_dur

        if i > 0:
            prev_scene = sorted_scenes[i - 1]
            prev_dur = prev_scene.duration_ms if prev_scene.duration_ms is not None else 5000
            prev_end = (prev_scene.start_ms or 0) + prev_dur

            # Check overlap
            if scene_start < prev_end - 50:
                issues.append(
                    QAIssue(
                        category=QACategory.TIMELINE,
                        severity=QASeverity.ERROR,
                        code="SCENE_OVERLAP",
                        message=f"Scene {scene.position + 1} (starts at {scene_start}ms) overlaps with Scene {prev_scene.position + 1} (ends at {prev_end}ms).",
                        scene_id=scene.id,
                        repairable=True,
                    )
                )

            # Check gap
            elif scene_start > prev_end + 100:
                gap_ms = scene_start - prev_end
                issues.append(
                    QAIssue(
                        category=QACategory.TIMELINE,
                        severity=QASeverity.WARNING,
                        code="TIMELINE_GAP",
                        message=f"Timeline gap of {gap_ms}ms detected between Scene {prev_scene.position + 1} and Scene {scene.position + 1}.",
                        scene_id=scene.id,
                        repairable=True,
                    )
                )

        if scene_dur < 1000:
            issues.append(
                QAIssue(
                    category=QACategory.TIMELINE,
                    severity=QASeverity.WARNING,
                    code="SCENE_TOO_SHORT",
                    message=f"Scene {scene.position + 1} duration ({scene_dur}ms) is shorter than recommended minimum 1000ms.",
                    scene_id=scene.id,
                    repairable=True,
                )
            )
        elif scene_dur > MAX_SLOW_SCENE_MS:
            issues.append(
                QAIssue(
                    category=QACategory.TIMELINE,
                    severity=QASeverity.WARNING,
                    code="SLOW_SCENE",
                    message=f"Scene {scene.position + 1} duration ({scene_dur / 1000.0:.1f}s) exceeds recommended pacing maximum ({MAX_SLOW_SCENE_MS / 1000.0:.0f}s).",
                    scene_id=scene.id,
                    repairable=True,
                )
            )

        current_time_ms = max(current_time_ms, scene_end)

    return issues

