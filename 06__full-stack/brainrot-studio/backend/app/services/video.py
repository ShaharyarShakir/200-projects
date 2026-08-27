from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.video import Video
from app.schemas.video import VideoCreate, VideoUpdate


def create_video(
    session: Session,
    project_id: UUID,
    data: VideoCreate,
) -> Video:
    video = Video(
        project_id=project_id,
        title=data.title,
        description=data.description,
    )

    session.add(video)
    session.commit()
    session.refresh(video)

    return video


def get_videos(
    session: Session,
    project_id: UUID,
) -> list[Video]:
    statement = (
        select(Video)
        .where(Video.project_id == project_id)
        .order_by(Video.created_at.desc())
    )

    return list(session.exec(statement).all())


def get_video(
    session: Session,
    project_id: UUID,
    video_id: UUID,
) -> Video | None:
    statement = select(Video).where(
        Video.id == video_id,
        Video.project_id == project_id,
    )

    return session.exec(statement).first()


def update_video(
    session: Session,
    video: Video,
    data: VideoUpdate,
) -> Video:
    values = data.model_dump(
        exclude_unset=True,
    )

    for key, value in values.items():
        setattr(video, key, value)

    video.updated_at = datetime.now(timezone.utc)

    session.add(video)
    session.commit()
    session.refresh(video)

    return video


def delete_video(
    session: Session,
    video: Video,
) -> None:
    session.delete(video)
    session.commit()
