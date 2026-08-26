from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlmodel import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.video import (
    VideoCreate,
    VideoRead,
    VideoUpdate,
)
from app.services.project import get_project
from app.services.video import (
    create_video,
    delete_video,
    get_video,
    get_videos,
    update_video,
)


router = APIRouter(
    prefix="/projects/{project_id}/videos",
    tags=["Videos"],
)


def require_project(
    project_id: UUID,
    session: Session,
    user: User,
):
    project = get_project(
        session,
        project_id,
        user.id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.post(
    "",
    response_model=VideoRead,
    status_code=status.HTTP_201_CREATED,
)
def create(
    project_id: UUID,
    data: VideoCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project(
        project_id,
        session,
        current_user,
    )

    return create_video(
        session,
        project_id,
        data,
    )


@router.get(
    "",
    response_model=list[VideoRead],
)
def list_all(
    project_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project(
        project_id,
        session,
        current_user,
    )

    return get_videos(
        session,
        project_id,
    )


@router.get(
    "/{video_id}",
    response_model=VideoRead,
)
def get(
    project_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project(
        project_id,
        session,
        current_user,
    )

    video = get_video(
        session,
        project_id,
        video_id,
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found",
        )

    return video


@router.patch(
    "/{video_id}",
    response_model=VideoRead,
)
def update(
    project_id: UUID,
    video_id: UUID,
    data: VideoUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project(
        project_id,
        session,
        current_user,
    )

    video = get_video(
        session,
        project_id,
        video_id,
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found",
        )

    return update_video(
        session,
        video,
        data,
    )


@router.delete(
    "/{video_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    project_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_project(
        project_id,
        session,
        current_user,
    )

    video = get_video(
        session,
        project_id,
        video_id,
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found",
        )

    delete_video(
        session,
        video,
    )
