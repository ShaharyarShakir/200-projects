import json
import logging
from typing import Any
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlmodel import SQLModel, Session, select

from app.api.deps import get_current_user, get_db
from app.models.character import Character, CharacterAsset, Show
from app.models.generation_session import (
    GeneratedScript,
    GeneratedTopic,
    GenerationSession,
    GenerationSessionCharacter,
    StepState,
)
from app.models.niche import Niche
from app.models.project import Project
from app.models.story import Story, StoryVersion
from app.models.user import User
from app.models.video import Video
from app.schemas.wizard import (
    CharacterAssetRead,
    CharacterRead,
    CreateSessionRequest,
    GenerateStyleRequest,
    GeneratedScriptSchema,
    GeneratedTopicSchema,
    NicheRead,
    RegenerateSceneRequest,
    ScriptSceneSchema,
    SelectTopicRequest,
    UpdateSessionRequest,
    VideoStyleConfigSchema,
)
from app.services.generation import apply_story_version_to_video, create_generation_job
from app.services.wizard import (
    generate_script_for_wizard,
    generate_topics_for_wizard,
    generate_video_style_config,
    regenerate_single_scene,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["wizard"])

# Default seeded characters
DEFAULT_CHARACTERS = [
    {"id": "peter", "name": "Peter Griffin", "show": "Family Guy", "avatar": "👨‍🦰", "tier": "FREE", "imageUrl": "https://upload.wikimedia.org/wikipedia/en/c/c2/Peter_Griffin.png"},
    {"id": "stewie", "name": "Stewie Griffin", "show": "Family Guy", "avatar": "👶", "tier": "FREE", "imageUrl": "https://upload.wikimedia.org/wikipedia/en/0/02/Stewie_Griffin.png"},
    {"id": "rick", "name": "Rick Sanchez", "show": "Rick and Morty", "avatar": "👨‍🔬", "tier": "FREE", "imageUrl": "https://upload.wikimedia.org/wikipedia/en/a/a6/Rick_Sanchez.png"},
    {"id": "morty", "name": "Morty Smith", "show": "Rick and Morty", "avatar": "🧑", "tier": "FREE", "imageUrl": "https://upload.wikimedia.org/wikipedia/en/c/c3/Morty_Smith.png"},
    {"id": "stan", "name": "Stan Smith", "show": "American Dad", "avatar": "👔", "tier": "FREE", "imageUrl": "https://upload.wikimedia.org/wikipedia/en/a/a5/Stan_Smith.png"},
    {"id": "sukuna", "name": "Sukuna", "show": "Jujutsu Kaisen", "avatar": "👹", "tier": "LITE+", "imageUrl": ""},
    {"id": "gojo", "name": "Gojo", "show": "Jujutsu Kaisen", "avatar": "🥽", "tier": "LITE+", "imageUrl": ""},
    {"id": "elon", "name": "Elon Musk", "show": "Real Life", "avatar": "🚀", "tier": "LITE+", "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg"},
    {"id": "trump", "name": "Donald Trump", "show": "Real Life", "avatar": "👔", "tier": "LITE+", "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait_%28cropped%29.jpg"},
]

# Default seeded niches
DEFAULT_NICHES = [
    {"name": "Comedy", "slug": "comedy", "description": "Funny character banter & absurd situations", "icon": "😂"},
    {"name": "Relationships", "slug": "relationships", "description": "Dating, breakups & roommate drama", "icon": "❤️"},
    {"name": "School & College", "slug": "school", "description": "Exams, homework & campus life", "icon": "🎓"},
    {"name": "Gaming & Esports", "slug": "gaming", "description": "Rage moments, tips & video game logic", "icon": "🎮"},
    {"name": "Technology & AI", "slug": "tech", "description": "AI robots, smartphones & futuristic tech", "icon": "🤖"},
    {"name": "Storytelling & Lore", "slug": "storytelling", "description": "Crazy wild true story rollouts", "icon": "📜"},
    {"name": "Dark Humor & Satire", "slug": "dark_humor", "description": "Edgy satirical takes", "icon": "💀"},
    {"name": "Pop Culture & Memes", "slug": "pop_culture", "description": "Trending memes & internet gossip", "icon": "🔥"},
]


def seed_characters_and_niches_if_needed(db: Session):
    try:
        SQLModel.metadata.create_all(db.bind)
    except Exception as e:
        logger.warning(f"Metadata create_all error: {e}")

    try:
        existing_chars = db.exec(select(Character)).all()
    except Exception:
        existing_chars = []
    if not existing_chars:
        logger.info("Seeding default characters into database...")
        for cdata in DEFAULT_CHARACTERS:
            show_obj = None
            if cdata["show"]:
                show_obj = db.exec(select(Show).where(Show.name == cdata["show"])).first()
                if not show_obj:
                    show_obj = Show(name=cdata["show"])
                    db.add(show_obj)
                    db.flush()
            char = Character(
                id=cdata["id"],
                name=cdata["name"],
                show_id=show_obj.id if show_obj else None,
                avatar=cdata["avatar"],
                image_url=cdata["imageUrl"],
                tier=cdata["tier"],
            )
            db.add(char)
        db.commit()

    try:
        existing_niches = db.exec(select(Niche)).all()
    except Exception:
        existing_niches = []

    if not existing_niches:
        logger.info("Seeding default niches into database...")
        for ndata in DEFAULT_NICHES:
            niche = Niche(
                name=ndata["name"],
                slug=ndata["slug"],
                description=ndata["description"],
                icon=ndata["icon"],
            )
            db.add(niche)
        db.commit()


@router.get("/characters", response_model=list[CharacterRead])
def get_characters(db: Session = Depends(get_db)):
    seed_characters_and_niches_if_needed(db)
    chars = db.exec(select(Character)).all()
    result = []
    for c in chars:
        show_name = c.show.name if c.show else None
        asset_reads = [
            CharacterAssetRead(
                id=a.id,
                character_id=a.character_id,
                asset_type=a.asset_type,
                expression=a.expression,
                image_url=a.image_url,
            )
            for a in (c.assets or [])
        ]
        result.append(
            CharacterRead(
                id=c.id,
                name=c.name,
                show_name=show_name,
                image_url=c.image_url,
                avatar=c.avatar,
                tier=c.tier,
                assets=asset_reads,
            )
        )
    return result


@router.get("/niches", response_model=list[NicheRead])
def get_niches(db: Session = Depends(get_db)):
    seed_characters_and_niches_if_needed(db)
    niches = db.exec(select(Niche).where(Niche.active)).all()
    return [
        NicheRead(
            id=n.id,
            name=n.name,
            slug=n.slug,
            description=n.description,
            icon=n.icon,
        )
        for n in niches
    ]


@router.post("/generation-sessions", response_model=dict)
def create_generation_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_obj = GenerationSession(
        user_id=current_user.id,
        project_id=payload.project_id,
        status=StepState.CHARACTER_SELECTION,
        current_step=1,
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return {"id": session_obj.id, "status": session_obj.status, "current_step": session_obj.current_step}


@router.get("/generation-sessions/{session_id}")
def get_generation_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    # Fetch selected characters
    char_links = db.exec(
        select(GenerationSessionCharacter).where(GenerationSessionCharacter.session_id == session_id)
    ).all()
    character_ids = [c.character_id for c in char_links]

    # Fetch generated topics
    topics_db = db.exec(select(GeneratedTopic).where(GeneratedTopic.session_id == session_id)).all()
    topics = [
        GeneratedTopicSchema(
            id=t.id,
            title=t.title,
            hook=t.hook,
            premise=t.premise,
            estimated_duration=t.estimated_duration,
            characters=json.loads(t.characters_json),
        )
        for t in topics_db
    ]

    # Fetch generated script
    script_obj = None
    if sess.script_id:
        s_db = db.get(GeneratedScript, sess.script_id)
        if s_db:
            script_obj = GeneratedScriptSchema(
                id=s_db.id,
                title=s_db.title,
                hook=s_db.hook,
                estimated_duration=s_db.estimated_duration,
                scenes=[ScriptSceneSchema(**sc) for sc in json.loads(s_db.scenes_json)],
            )

    style_config = json.loads(sess.style_config_json) if sess.style_config_json else None

    return {
        "id": sess.id,
        "status": sess.status,
        "current_step": sess.current_step,
        "niche": sess.niche,
        "character_ids": character_ids,
        "selected_topic_id": sess.selected_topic_id,
        "topics": topics,
        "script": script_obj,
        "style_config": style_config,
    }


@router.patch("/generation-sessions/{session_id}")
def update_generation_session(
    session_id: UUID,
    payload: UpdateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    if payload.current_step is not None:
        sess.current_step = payload.current_step
    if payload.niche is not None:
        sess.niche = payload.niche

    if payload.character_ids is not None:
        # Clear existing and replace
        existing = db.exec(
            select(GenerationSessionCharacter).where(GenerationSessionCharacter.session_id == session_id)
        ).all()
        for e in existing:
            db.delete(e)
        db.flush()
        for cid in payload.character_ids:
            db.add(GenerationSessionCharacter(session_id=session_id, character_id=cid))

    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"status": "ok", "current_step": sess.current_step, "niche": sess.niche}


@router.post("/generation-sessions/{session_id}/topics", response_model=list[GeneratedTopicSchema])
async def generate_topics_for_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    char_links = db.exec(
        select(GenerationSessionCharacter).where(GenerationSessionCharacter.session_id == session_id)
    ).all()
    char_ids = [c.character_id for c in char_links]

    # Fetch character names
    chars = db.exec(select(Character).where(Character.id.in_(char_ids))).all() if char_ids else []
    char_names = [c.name for c in chars] if chars else ["Peter Griffin", "Stewie Griffin"]
    niche_name = sess.niche or "Comedy"

    topics = await generate_topics_for_wizard(character_names=char_names, niche=niche_name)

    # Persist topics
    # Clear old topics
    old_topics = db.exec(select(GeneratedTopic).where(GeneratedTopic.session_id == session_id)).all()
    for ot in old_topics:
        db.delete(ot)
    db.flush()

    saved_topics = []
    for t in topics:
        topic_uuid = t.id if t.id else uuid4()
        gt = GeneratedTopic(
            id=topic_uuid,
            session_id=session_id,
            title=t.title,
            hook=t.hook,
            premise=t.premise,
            estimated_duration=t.estimated_duration,
            characters_json=json.dumps(t.characters),
        )
        db.add(gt)
        saved_topics.append(
            GeneratedTopicSchema(
                id=topic_uuid,
                title=t.title,
                hook=t.hook,
                premise=t.premise,
                estimated_duration=t.estimated_duration,
                characters=t.characters,
            )
        )

    sess.status = StepState.TOPIC_SELECTION
    sess.current_step = 3
    db.add(sess)
    db.commit()

    logger.info(f"Returning {len(saved_topics)} saved topics for session {session_id}")
    return saved_topics


@router.post("/generation-sessions/{session_id}/select-topic")
def select_topic(
    session_id: UUID,
    payload: SelectTopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    topic = db.get(GeneratedTopic, payload.topic_id)
    if not topic or topic.session_id != session_id:
        raise HTTPException(status_code=404, detail="Topic not found for session")

    sess.selected_topic_id = topic.id
    db.add(sess)
    db.commit()
    return {"status": "selected", "topic_id": topic.id}


@router.post("/generation-sessions/{session_id}/script", response_model=GeneratedScriptSchema)
async def generate_script_for_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    if not sess.selected_topic_id:
        raise HTTPException(status_code=400, detail="Must select a topic before generating script")

    topic = db.get(GeneratedTopic, sess.selected_topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Selected topic record missing")

    char_links = db.exec(
        select(GenerationSessionCharacter).where(GenerationSessionCharacter.session_id == session_id)
    ).all()
    char_ids = [c.character_id for c in char_links]
    chars = db.exec(select(Character).where(Character.id.in_(char_ids))).all() if char_ids else []
    char_names = [c.name for c in chars] if chars else ["Peter Griffin", "Stewie Griffin"]

    script = await generate_script_for_wizard(
        character_names=char_names,
        niche=sess.niche or "Comedy",
        topic_title=topic.title,
        topic_premise=topic.premise,
    )

    # Save to database
    db_script = GeneratedScript(
        session_id=session_id,
        topic_id=topic.id,
        title=script.title,
        hook=script.hook,
        scenes_json=json.dumps([sc.model_dump() for sc in script.scenes]),
        estimated_duration=script.estimated_duration,
    )
    db.add(db_script)
    db.flush()

    sess.script_id = db_script.id
    sess.status = StepState.SCRIPT_GENERATION
    sess.current_step = 4
    db.add(sess)
    db.commit()

    script.id = db_script.id
    return script


@router.patch("/generation-sessions/{session_id}/script/scenes/{scene_idx}")
async def regenerate_scene_in_session(
    session_id: UUID,
    scene_idx: int,
    payload: RegenerateSceneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    if not sess.script_id:
        raise HTTPException(status_code=400, detail="No active script found for session")

    script_db = db.get(GeneratedScript, sess.script_id)
    if not script_db:
        raise HTTPException(status_code=404, detail="Script model not found")

    scenes = json.loads(script_db.scenes_json)
    if scene_idx < 0 or scene_idx >= len(scenes):
        raise HTTPException(status_code=400, detail="Invalid scene index")

    char_links = db.exec(
        select(GenerationSessionCharacter).where(GenerationSessionCharacter.session_id == session_id)
    ).all()
    char_ids = [c.character_id for c in char_links]
    chars = db.exec(select(Character).where(Character.id.in_(char_ids))).all() if char_ids else []
    char_names = [c.name for c in chars] if chars else ["Peter Griffin", "Stewie Griffin"]

    updated_scene = await regenerate_single_scene(
        existing_scene=scenes[scene_idx],
        instruction=payload.instruction,
        character_names=char_names,
    )

    scenes[scene_idx] = updated_scene.model_dump()
    script_db.scenes_json = json.dumps(scenes)
    db.add(script_db)
    db.commit()

    return updated_scene


@router.post("/generation-sessions/{session_id}/style", response_model=VideoStyleConfigSchema)
async def generate_style_for_session(
    session_id: UUID,
    payload: GenerateStyleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    style_cfg = await generate_video_style_config(prompt=payload.prompt)
    sess.style_config_json = json.dumps(style_cfg.model_dump())
    db.add(sess)
    db.commit()
    return style_cfg


@router.post("/generation-sessions/{session_id}/render")
async def trigger_render_for_session(
    session_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sess = db.get(GenerationSession, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Generation session not found")

    if not sess.script_id:
        raise HTTPException(status_code=400, detail="Cannot render without a generated script")

    script_db = db.get(GeneratedScript, sess.script_id)
    if not script_db:
        raise HTTPException(status_code=404, detail="Script not found")

    # 1. Resolve or create Project & Video
    project_id = sess.project_id
    if not project_id:
        project = db.exec(select(Project).where(Project.owner_id == current_user.id)).first()
        if not project:
            project = Project(owner_id=current_user.id, name="My Brainrot Shorts")
            db.add(project)
            db.flush()
        project_id = project.id

    video = Video(
        project_id=project_id,
        title=script_db.title,
        description=script_db.hook,
    )
    db.add(video)
    db.flush()

    sess.video_id = video.id
    sess.status = StepState.RENDERING
    sess.current_step = 5
    db.add(sess)
    db.commit()

    # 2. Convert script scenes into story data
    scenes_raw = json.loads(script_db.scenes_json)
    story_scenes = []
    for sc in scenes_raw:
        story_scenes.append(
            {
                "purpose": f"Scene {sc.get('scene_number', 1)}",
                "visual_description": sc.get("visual_description", ""),
                "dialogue": sc.get("dialogue", []),
                "duration_ms": int(sc.get("duration_seconds", 6.0) * 1000),
            }
        )

    story_dict = {
        "title": script_db.title,
        "hook": script_db.hook,
        "scenes": story_scenes,
    }

    story = db.exec(select(Story).where(Story.video_id == video.id)).first()
    if not story:
        story = Story(
            video_id=video.id,
            title=script_db.title,
            premise=script_db.hook,
            target_duration_ms=int(script_db.estimated_duration * 1000),
        )
        db.add(story)
        db.flush()

    story_version = StoryVersion(
        story_id=story.id,
        version=1,
        content_json=story_dict,
    )
    db.add(story_version)
    db.flush()

    # Apply to timeline asynchronously
    await apply_story_version_to_video(
        session=db,
        video_id=video.id,
        story_version_id=story_version.id,
    )

    return {
        "status": "rendering",
        "video_id": video.id,
        "project_id": project_id,
        "session_id": session_id,
    }
