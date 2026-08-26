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
from app.schemas.scene import (
    SceneCreate,
    SceneRead,
    SceneUpdate,
)
from app.services.project import get_project
from app.services.scene import (
    create_scene,
    delete_scene,
    get_scene,
    get_scenes,
    update_scene,
)
from app.services.video import get_video


router = APIRouter(
    prefix="/projects/{project_id}/videos/{video_id}/scenes",
    tags=["Scenes"],
)


def require_video(
    project_id: UUID,
    video_id: UUID,
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
            status_code=404,
            detail="Project not found",
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


@router.post(
    "",
    response_model=SceneRead,
    status_code=status.HTTP_201_CREATED,
)
def create(
    project_id: UUID,
    video_id: UUID,
    data: SceneCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(
        project_id,
        video_id,
        session,
        current_user,
    )

    return create_scene(
        session,
        video_id,
        data,
    )


@router.get(
    "",
    response_model=list[SceneRead],
)
def list_all(
    project_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(
        project_id,
        video_id,
        session,
        current_user,
    )

    return get_scenes(
        session,
        video_id,
    )


@router.patch(
    "/{scene_id}",
    response_model=SceneRead,
)
def update(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    data: SceneUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(
        project_id,
        video_id,
        session,
        current_user,
    )

    scene = get_scene(
        session,
        video_id,
        scene_id,
    )

    if scene is None:
        raise HTTPException(
            status_code=404,
            detail="Scene not found",
        )

    return update_scene(
        session,
        scene,
        data,
    )


@router.delete(
    "/{scene_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(
        project_id,
        video_id,
        session,
        current_user,
    )

    scene = get_scene(
        session,
        video_id,
        scene_id,
    )

    if scene is None:
        raise HTTPException(
            status_code=404,
            detail="Scene not found",
        )

    delete_scene(
        session,
        scene,
    )


class SceneRepairRequest(PydanticBaseModel := __import__("pydantic").BaseModel):
    instruction: str = "Regenerate dialogue and repair timing for this scene"
    repair_type: str = "dialogue"


@router.post(
    "/{scene_id}/repair",
)
async def repair_scene_endpoint(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    req: SceneRepairRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Triggers targeted AI repair for a specific scene."""
    require_video(
        project_id,
        video_id,
        session,
        current_user,
    )

    scene = get_scene(
        session,
        video_id,
        scene_id,
    )

    if scene is None:
        raise HTTPException(
            status_code=404,
            detail="Scene not found",
        )

    from app.services.generation import regenerate_scene_service

    timeline_payload = await regenerate_scene_service(
        session,
        video_id,
        scene_id,
        instruction=req.instruction,
    )

    return {
        "status": "success",
        "scene_id": str(scene_id),
        "timeline": timeline_payload,
    }

