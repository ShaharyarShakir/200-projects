import logging
from uuid import UUID

from langchain_core.messages import SystemMessage, HumanMessage
from sqlmodel import Session, select

from app.ai.graph.state import StoryGenerationState
from app.ai.model import get_chat_model
from app.ai.gateway import AIGateway
from app.ai.prompts.story import build_story_prompt
from app.ai.prompts.system import SYSTEM_PROMPT
from app.ai.schemas.story import GeneratedScene, GeneratedStory, DialogueLine
from app.core.database import engine
from app.models.story import Story, StoryVersion

logger = logging.getLogger(__name__)


async def planner_node(state: StoryGenerationState) -> dict:
    """The planner outlines hook, tone, and rough pacing before final writing."""
    target_ms = state.get("target_duration_ms", 30000)
    user_prompt = state.get("user_prompt", "")
    tone = state.get("tone", "chaotic")

    suggested_scene_count = max(3, min(8, round(target_ms / 5000)))

    plan = {
        "user_prompt": user_prompt,
        "tone": tone,
        "suggested_scene_count": suggested_scene_count,
        "avg_scene_ms": target_ms // suggested_scene_count,
    }

    return {"plan": plan}


async def writer_node(state: StoryGenerationState) -> dict:
    """The writer generates or refines the structured GeneratedStory using AIGateway (Gemini/Ollama)."""
    user_prompt = state.get("user_prompt", "")
    target_ms = state.get("target_duration_ms", 30000)
    tone = state.get("tone", "chaotic")
    language = state.get("language", "en")
    validation_errors = state.get("validation_errors", [])
    retry_count = state.get("retry_count", 0)

    formatted_prompt = build_story_prompt(
        user_prompt=user_prompt,
        target_duration_ms=target_ms,
        tone=tone,
        language=language,
        validation_errors=validation_errors if retry_count > 0 else None,
    )

    provider = state.get("provider")
    try:
        gateway = AIGateway(provider_override=provider)
        story_res, gen_metadata = await gateway.generate_structured(
            prompt=formatted_prompt,
            schema=GeneratedStory,
            system_prompt=SYSTEM_PROMPT,
            prompt_version="story-v1",
        )
        story = story_res
    except Exception as exc:
        logger.warning(f"AI Gateway generation failed: {exc}. Using deterministic fallback generator.")
        story = _build_fallback_story(user_prompt, target_ms, tone)


    if not story:
        story = _build_fallback_story(user_prompt, target_ms, tone)

    return {
        "story": story,
        "retry_count": retry_count + 1 if validation_errors else retry_count,
    }


def validator_node(state: StoryGenerationState) -> dict:
    """Deterministic validation of story structure, durations, and content."""
    story: GeneratedStory | None = state.get("story")
    target_ms = state.get("target_duration_ms", 30000)
    errors: list[str] = []

    if not story:
        errors.append("Story object was not generated.")
        return {"validation_errors": errors}

    if not story.scenes:
        errors.append("Story must contain at least 1 scene.")

    if len(story.scenes) > 12:
        errors.append("Story has too many scenes (maximum 12).")

    total_ms = sum(scene.duration_ms for scene in story.scenes)
    min_allowed = target_ms * 0.7
    max_allowed = target_ms * 1.3

    if total_ms < min_allowed or total_ms > max_allowed:
        errors.append(f"Total story duration ({total_ms}ms) is not close to target ({target_ms}ms). Adjust scene durations.")

    for i, scene in enumerate(story.scenes, 1):
        if not scene.visual_description:
            errors.append(f"Scene {i} is missing visual_description.")
        if scene.duration_ms < 500 or scene.duration_ms > 20000:
            errors.append(f"Scene {i} duration ({scene.duration_ms}ms) is outside allowed bounds [500ms - 20000ms].")

    return {"validation_errors": errors}


async def persist_node(state: StoryGenerationState) -> dict:
    """Persists valid GeneratedStory into database as Story & StoryVersion records."""
    story_data: GeneratedStory = state["story"]
    video_id_str = state["video_id"]
    video_id = UUID(video_id_str)

    with Session(engine) as session:
        existing_story = session.exec(
            select(Story).where(Story.video_id == video_id)
        ).first()

        if not existing_story:
            existing_story = Story(
                video_id=video_id,
                title=story_data.title,
                premise=story_data.premise,
                tone=story_data.tone,
                target_duration_ms=story_data.target_duration_ms,
                language=state.get("language", "en"),
            )
            session.add(existing_story)
            session.commit()
            session.refresh(existing_story)
        else:
            existing_story.title = story_data.title
            existing_story.premise = story_data.premise
            existing_story.tone = story_data.tone
            existing_story.target_duration_ms = story_data.target_duration_ms
            session.add(existing_story)
            session.commit()

        existing_versions = session.exec(
            select(StoryVersion)
            .where(StoryVersion.story_id == existing_story.id)
            .order_by(StoryVersion.version.desc())
        ).all()

        next_version = (existing_versions[0].version + 1) if existing_versions else 1

        story_version = StoryVersion(
            story_id=existing_story.id,
            version=next_version,
            content_json=story_data.model_dump(),
        )
        session.add(story_version)
        session.commit()
        session.refresh(story_version)

        return {
            "story_id": str(existing_story.id),
            "story_version_id": str(story_version.id),
        }


def _build_fallback_story(prompt: str, target_ms: int, tone: str) -> GeneratedStory:
    """Creates a structured fallback story if LLM model is unavailable."""
    scene_dur = max(3000, target_ms // 4)
    return GeneratedStory(
        title=f"Story: {prompt[:30]}...",
        hook="BRO YOU WILL NOT BELIEVE WHAT HAPPENED 💀",
        premise=prompt,
        tone=tone,
        target_duration_ms=target_ms,
        scenes=[
            GeneratedScene(
                scene_number=1,
                duration_ms=scene_dur,
                purpose="Hook & Setup",
                visual_description="Broke college student counting 12 rupees in a messy room.",
                dialogue=[DialogueLine(character="Student", text="Bro, I am literally broke.")],
                caption="BRO WAS COOKED 💀",
            ),
            GeneratedScene(
                scene_number=2,
                duration_ms=scene_dur,
                purpose="Discovery",
                visual_description="Roommate enters wearing fancy designer watch while holding apartment keys.",
                dialogue=[DialogueLine(character="Roommate", text="Hey man, just bought 3 luxury apartments.")],
                caption="SECRETLY RICH ROOMMATE 🤯",
            ),
            GeneratedScene(
                scene_number=3,
                duration_ms=scene_dur,
                purpose="Confrontation",
                visual_description="Student staring at roommate's bank app showing millions.",
                dialogue=[DialogueLine(character="Student", text="You made me eat instant noodles for 2 years?!")],
                caption="NO WAY BRO 😭",
            ),
            GeneratedScene(
                scene_number=4,
                duration_ms=target_ms - (scene_dur * 3),
                purpose="Punchline",
                visual_description="Roommate handing student a card for unlimited free pizza.",
                dialogue=[DialogueLine(character="Roommate", text="Relax bro, rent is on me forever.")],
                caption="W ROOMMATE 🔥",
            ),
        ],
    )
