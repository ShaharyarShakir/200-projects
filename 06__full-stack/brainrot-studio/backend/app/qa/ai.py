import asyncio
import logging
from uuid import UUID

from app.ai.gateway import AIGateway
from app.models.caption import Caption
from app.models.dialogue import DialogueSegment
from app.models.qa import QACategory, QASeverity
from app.models.scene import Scene
from app.qa.models import AISceneQA, QAIssue

logger = logging.getLogger(__name__)

AI_QA_SYSTEM_PROMPT = """You are a video short quality evaluator.
Evaluate:
1. Narrative coherence across scenes
2. Dialogue and caption alignment
3. Story repetition or weak pacing
4. Hook strength (Scene 1) and punchline strength (Final Scene)

Return structured JSON according to the requested schema.
Do NOT evaluate video resolutions, file codecs, or exact timestamps.
"""


async def run_ai_creative_qa(
    scenes: list[Scene],
    dialogue_segments: list[DialogueSegment],
    captions: list[Caption],
    provider_override: str | None = None,
) -> list[QAIssue]:
    """Runs AI-assisted creative quality assessment for story narrative, hook, punchline, and repetition."""
    issues: list[QAIssue] = []

    if not scenes:
        return issues

    # Prepare structured representation for AI QA prompt
    scene_data = []
    for s in scenes:
        segs = [d.text for d in dialogue_segments if d.scene_id == s.id]
        scene_data.append(
            {
                "scene_position": s.position + 1,
                "title": s.title,
                "duration_ms": s.duration_ms,
                "visual_description": s.visual_prompt,
                "dialogue": segs or ([s.dialogue] if s.dialogue else []),
            }
        )

    prompt = f"Evaluate the creative quality of this {len(scenes)}-scene short video composition:\n{scene_data}"

    try:
        gateway = AIGateway(provider_override=provider_override or "ollama")
        res, _ = await gateway.generate_structured(
            prompt=prompt,
            schema=AISceneQA,
            system_prompt=AI_QA_SYSTEM_PROMPT,
            prompt_version="ai-qa-v1",
        )


        if not res.coherent:
            issues.append(
                QAIssue(
                    category=QACategory.STORY,
                    severity=QASeverity.WARNING,
                    code="STORY_INCOHERENT",
                    message="AI QA flagged story arc as confusing or incoherent.",
                    repairable=True,
                )
            )

        if res.repetitive:
            issues.append(
                QAIssue(
                    category=QACategory.STORY,
                    severity=QASeverity.WARNING,
                    code="REPETITIVE_STORY",
                    message="AI QA detected repetitive dialogue or scene themes across scenes.",
                    repairable=True,
                )
            )

        if not res.dialogue_caption_match:
            issues.append(
                QAIssue(
                    category=QACategory.CAPTIONS,
                    severity=QASeverity.WARNING,
                    code="CAPTION_MISMATCH",
                    message="AI QA detected mismatch between spoken dialogue and visual captions.",
                    repairable=True,
                )
            )

        for issue_str in res.issues:
            issues.append(
                QAIssue(
                    category=QACategory.STORY,
                    severity=QASeverity.INFO,
                    code="AI_CREATIVE_FEEDBACK",
                    message=issue_str,
                    repairable=True,
                )
            )

    except Exception as exc:
        logger.warning(f"AI Creative QA gateway call failed/timed out: {exc}. Running deterministic fallback rules.")
        # Fallback check 1: Weak Hook Check (Scene 1 duration or dialogue)
        first_scene = scenes[0]
        if (first_scene.duration_ms or 5000) > 8000:
            issues.append(
                QAIssue(
                    category=QACategory.STORY,
                    severity=QASeverity.WARNING,
                    code="WEAK_HOOK",
                    message="Scene 1 (Hook) duration exceeds 8 seconds before punchy progression.",
                    scene_id=first_scene.id,
                    repairable=True,
                )
            )

        # Fallback check 2: Dialogue repetition check
        dialogues = [s.dialogue for s in scenes if s.dialogue]
        if len(dialogues) >= 2 and dialogues[0] == dialogues[1]:
            issues.append(
                QAIssue(
                    category=QACategory.STORY,
                    severity=QASeverity.WARNING,
                    code="REPETITIVE_STORY",
                    message="Identical dialogue text detected across multiple scenes.",
                    scene_id=scenes[1].id,
                    repairable=True,
                )
            )

    return issues
