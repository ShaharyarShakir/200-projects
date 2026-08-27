import json
import logging
from typing import Any
from pydantic import BaseModel, Field
from uuid import uuid4

from app.ai.gateway import AIGateway
from app.schemas.wizard import (
    DialogueLineSchema,
    GeneratedScriptSchema,
    GeneratedTopicSchema,
    ScriptSceneSchema,
    VideoStyleConfigSchema,
)

logger = logging.getLogger(__name__)


class TopicListContainer(BaseModel):
    topics: list[GeneratedTopicSchema] = Field(description="List of 10 unique, compelling short-form video topics")


async def generate_topics_for_wizard(
    character_names: list[str],
    niche: str,
    ai_gateway: AIGateway | None = None,
) -> list[GeneratedTopicSchema]:
    gateway = ai_gateway or AIGateway()
    chars_str = ", ".join(character_names) if character_names else "General Characters"

    prompt = f"""
Characters: {chars_str}
Niche: {niche}

Generate 10 short-form viral video topics suitable for YouTube Shorts and TikTok.
Each topic should:
- Feature comedic interaction or dialogue between the chosen characters
- Have a high-retention hook
- Be 30-45 seconds in estimated duration
- Avoid generic filler ideas
"""

    system_prompt = "You are a master viral YouTube Shorts creator specializing in fast-paced character dialogue and brainrot humor."

    try:
        container, _ = await gateway.generate_structured(
            prompt=prompt,
            schema=TopicListContainer,
            system_prompt=system_prompt,
        )
        # Ensure all topics have UUIDs
        result_topics = []
        for t in container.topics:
            t_dict = t.model_dump()
            t_dict["id"] = uuid4()
            t_dict["characters"] = character_names
            result_topics.append(GeneratedTopicSchema(**t_dict))
        return result_topics
    except Exception as exc:
        logger.error(f"AI Topic Generation failed: {exc}. Returning fallback topics.")
        # Fallback structured topics
        fallback_topics = [
            GeneratedTopicSchema(
                id=uuid4(),
                title=f"{chars_str} tackle {niche}",
                hook=f"You won't believe what happens when {chars_str} try {niche}!",
                premise=f"{chars_str} get into a chaotic argument over {niche} and escalate it ridiculously.",
                estimated_duration=35,
                characters=character_names,
            ),
            GeneratedTopicSchema(
                id=uuid4(),
                title=f"The Ultimate {niche} Secret",
                hook=f"{character_names[0] if character_names else 'Character'} discovers a secret about {niche}...",
                premise=f"A secret in {niche} is revealed leading to absurd consequences.",
                estimated_duration=30,
                characters=character_names,
            ),
        ]
        return fallback_topics


async def generate_script_for_wizard(
    character_names: list[str],
    niche: str,
    topic_title: str,
    topic_premise: str,
    ai_gateway: AIGateway | None = None,
) -> GeneratedScriptSchema:
    gateway = ai_gateway or AIGateway()
    chars_str = ", ".join(character_names) if character_names else "Peter Griffin, Stewie Griffin"

    prompt = f"""
Topic Title: {topic_title}
Topic Premise: {topic_premise}
Niche: {niche}
Characters: {chars_str}

Generate a short-form video script with 3 to 5 distinct scenes.
Each scene MUST have:
- `scene_number`: integer starting at 1
- `visual_description`: vivid description of the canvas background environment
- `dialogue`: list of dialogue lines with `character_id` (matching one of {chars_str}) and `text`
- `duration_seconds`: estimated duration for the scene (4-8 seconds)
"""

    system_prompt = "You are an expert short-form video scriptwriter. Keep dialogue punchy, hilarious, and fast-paced."

    try:
        script_res, _ = await gateway.generate_structured(
            prompt=prompt,
            schema=GeneratedScriptSchema,
            system_prompt=system_prompt,
        )
        return script_res
    except Exception as exc:
        logger.error(f"AI Script Generation failed: {exc}. Returning fallback script.")
        # Structured fallback script
        c1 = character_names[0] if character_names else "Peter Griffin"
        c2 = character_names[1] if len(character_names) > 1 else "Stewie Griffin"

        return GeneratedScriptSchema(
            id=uuid4(),
            title=topic_title,
            hook=topic_premise,
            estimated_duration=30.0,
            scenes=[
                ScriptSceneSchema(
                    scene_number=1,
                    visual_description=f"{c1} and {c2} standing in a chaotic room during a conversation about {niche}.",
                    dialogue=[
                        DialogueLineSchema(character_id=c1, text=f"Did you seriously try to automate {niche}?"),
                        DialogueLineSchema(character_id=c2, text=f"Of course I did. Why do things manually when AI can fail for us?"),
                    ],
                    duration_seconds=6.0,
                ),
                ScriptSceneSchema(
                    scene_number=2,
                    visual_description=f"Close-up reaction shot of {c1} looking completely bewildered.",
                    dialogue=[
                        DialogueLineSchema(character_id=c1, text="That is both brilliant and terrifying."),
                        DialogueLineSchema(character_id=c2, text="Exactly. Welcome to the future."),
                    ],
                    duration_seconds=6.0,
                ),
            ],
        )


async def regenerate_single_scene(
    existing_scene: dict[str, Any],
    instruction: str,
    character_names: list[str],
    ai_gateway: AIGateway | None = None,
) -> ScriptSceneSchema:
    gateway = ai_gateway or AIGateway()
    chars_str = ", ".join(character_names) if character_names else "Characters"

    prompt = f"""
Existing Scene:
{json.dumps(existing_scene)}

User Instruction: {instruction}
Available Characters: {chars_str}

Regenerate this specific scene incorporating the instruction while preserving scene_number={existing_scene.get('scene_number', 1)}.
"""

    system_prompt = "You are an AI scene editor specializing in character script refinement."

    try:
        scene_res, _ = await gateway.generate_structured(
            prompt=prompt,
            schema=ScriptSceneSchema,
            system_prompt=system_prompt,
        )
        return scene_res
    except Exception as exc:
        logger.error(f"Scene regeneration failed: {exc}. Returning updated scene.")
        c1 = character_names[0] if character_names else "Character"
        return ScriptSceneSchema(
            scene_number=existing_scene.get("scene_number", 1),
            visual_description=f"Regenerated scene for {c1}: {instruction}",
            dialogue=[
                DialogueLineSchema(character_id=c1, text=f"Regenerated line based on: {instruction}"),
            ],
            duration_seconds=5.0,
        )


async def generate_video_style_config(
    prompt: str,
    ai_gateway: AIGateway | None = None,
) -> VideoStyleConfigSchema:
    gateway = ai_gateway or AIGateway()

    prompt_text = f"""
User Style Request: "{prompt}"

Convert this style request into a validated VideoStyleConfigSchema.
Determine appropriate font_family, font_size (60-90), primary_color (hex), outline_color (hex), layout, animation, and position.
"""

    system_prompt = "You are a professional motion graphics designer converting styling prompts into valid video render configurations."

    try:
        style_res, _ = await gateway.generate_structured(
            prompt=prompt_text,
            schema=VideoStyleConfigSchema,
            system_prompt=system_prompt,
        )
        return style_res
    except Exception as exc:
        logger.error(f"AI Style generation failed: {exc}. Returning default style.")
        return VideoStyleConfigSchema(
            layout="centered",
            font_family="Impact",
            font_size=78,
            primary_color="#FFD700",
            outline_color="#000000",
            animation="pop",
            position="center",
        )
