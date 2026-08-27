from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.scene import Scene
from app.schemas.scene import SceneCreate, SceneUpdate
from app.services.timeline import (
    create_timeline_scene,
    delete_timeline_scene,
    update_timeline_scene,
)


def create_scene(
    session: Session,
    video_id: UUID,
    data: SceneCreate,
) -> Scene:
    return create_timeline_scene(session, video_id, data)


def get_scenes(
    session: Session,
    video_id: UUID,
) -> list[Scene]:
    statement = (
        select(Scene)
        .where(Scene.video_id == video_id)
        .order_by(Scene.order, Scene.position)
    )

    return list(session.exec(statement).all())


def get_scene(
    session: Session,
    video_id: UUID,
    scene_id: UUID,
) -> Scene | None:
    statement = select(Scene).where(
        Scene.id == scene_id,
        Scene.video_id == video_id,
    )

    return session.exec(statement).first()


def update_scene(
    session: Session,
    scene: Scene,
    data: SceneUpdate,
) -> Scene:
    return update_timeline_scene(session, scene, data)


def delete_scene(
    session: Session,
    scene: Scene,
) -> None:
    delete_timeline_scene(session, scene)
