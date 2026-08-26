from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlmodel import Session, select

from app.api.deps import get_current_user, get_db
from app.models.scene import Scene
from app.models.scene_asset import SceneAsset
from app.models.user import User
from app.schemas.scene import SceneCreate, SceneRead, SceneUpdate
from app.schemas.timeline import (
    CaptionCreate,
    CaptionRead,
    SceneAssetCreate,
    SceneAssetRead,
    SceneAssetUpdate,
    SceneReorderRequest,
    TimelineRead,
    TrackCreate,
    TrackRead,
)
from app.services.project import get_project
from app.services.timeline import (
    add_scene_asset,
    create_caption,
    create_timeline_scene,
    create_track,
    delete_scene_asset,
    delete_timeline_scene,
    get_video_timeline,
    reorder_scenes,
    update_scene_asset,
    update_timeline_scene,
)
from app.services.video import get_video

router = APIRouter(
    prefix="/projects/{project_id}/videos/{video_id}",
    tags=["Timeline"],
)


def require_video(
    project_id: UUID,
    video_id: UUID,
    session: Session,
    user: User,
):
    project = get_project(session, project_id, user.id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    video = get_video(session, project_id, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    return video


@router.get("/timeline", response_model=TimelineRead)
def get_timeline(
    project_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    return get_video_timeline(session, video_id)


@router.patch("/scenes/reorder", response_model=TimelineRead)
def reorder_video_scenes(
    project_id: UUID,
    video_id: UUID,
    data: SceneReorderRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    return reorder_scenes(session, video_id, data.scene_ids)


@router.post(
    "/scenes",
    response_model=SceneRead,
    status_code=status.HTTP_201_CREATED,
)
def add_scene(
    project_id: UUID,
    video_id: UUID,
    data: SceneCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    return create_timeline_scene(session, video_id, data)


@router.patch(
    "/scenes/{scene_id}",
    response_model=SceneRead,
)
def update_scene_details(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    data: SceneUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    scene = session.get(Scene, scene_id)
    if scene is None or scene.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    return update_timeline_scene(session, scene, data)


@router.delete(
    "/scenes/{scene_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_scene(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    scene = session.get(Scene, scene_id)
    if scene is None or scene.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    delete_timeline_scene(session, scene)


@router.post(
    "/scenes/{scene_id}/assets",
    response_model=SceneAssetRead,
    status_code=status.HTTP_201_CREATED,
)
def attach_scene_asset(
    project_id: UUID,
    video_id: UUID,
    scene_id: UUID,
    data: SceneAssetCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    scene = session.get(Scene, scene_id)
    if scene is None or scene.video_id != video_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found",
        )
    return add_scene_asset(session, scene_id, data)


@router.patch(
    "/scene-assets/{scene_asset_id}",
    response_model=SceneAssetRead,
)
def update_asset_transform(
    project_id: UUID,
    video_id: UUID,
    scene_asset_id: UUID,
    data: SceneAssetUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    scene_asset = session.get(SceneAsset, scene_asset_id)
    if scene_asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene asset not found",
        )
    return update_scene_asset(session, scene_asset, data)


@router.delete(
    "/scene-assets/{scene_asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_scene_asset(
    project_id: UUID,
    video_id: UUID,
    scene_asset_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    scene_asset = session.get(SceneAsset, scene_asset_id)
    if scene_asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene asset not found",
        )
    delete_scene_asset(session, scene_asset)


@router.post(
    "/captions",
    response_model=CaptionRead,
    status_code=status.HTTP_201_CREATED,
)
def add_caption(
    project_id: UUID,
    video_id: UUID,
    data: CaptionCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    return create_caption(session, video_id, data)


@router.post(
    "/tracks",
    response_model=TrackRead,
    status_code=status.HTTP_201_CREATED,
)
def add_track(
    project_id: UUID,
    video_id: UUID,
    data: TrackCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_video(project_id, video_id, session, current_user)
    return create_track(session, video_id, data)
