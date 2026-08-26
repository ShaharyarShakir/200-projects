from io import BytesIO
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlmodel import Session

from app.api.deps import (
    get_current_user,
    get_db,
)
from app.core.queue import media_queue
from app.models.asset import (
    Asset,
    AssetProcessingStatus,
    AssetPurpose,
    AssetType,
)
from app.models.media_job import (
    MediaJob,
    MediaJobStatus,
    MediaJobType,
)
from app.models.user import User
from app.schemas.asset import (
    AssetRead,
    AssetUpdate,
    AssetUrlResponse,
)
from app.services.asset import (
    assign_asset_to_scene,
    build_asset_read,
    get_asset,
    get_asset_url,
    get_assets,
    remove_asset,
)
from app.services.project import (
    get_project,
)
from app.services.storage import (
    upload_file,
)
from app.services.video import (
    get_video,
)


router = APIRouter(
    prefix="/projects/{project_id}/videos/{video_id}/assets",
    tags=["Assets"],
)

MAX_FILE_SIZE = 500 * 1024 * 1024

ALLOWED_TYPES = {
    "image/jpeg": AssetType.IMAGE,
    "image/png": AssetType.IMAGE,
    "image/webp": AssetType.IMAGE,
    "image/gif": AssetType.IMAGE,

    "video/mp4": AssetType.VIDEO,
    "video/webm": AssetType.VIDEO,
    "video/quicktime": AssetType.VIDEO,

    "audio/mpeg": AssetType.AUDIO,
    "audio/mp3": AssetType.AUDIO,
    "audio/wav": AssetType.AUDIO,
    "audio/x-wav": AssetType.AUDIO,
    "audio/ogg": AssetType.AUDIO,
    "audio/aac": AssetType.AUDIO,

    "font/ttf": AssetType.FONT,
    "font/otf": AssetType.FONT,
    "font/woff": AssetType.FONT,
    "font/woff2": AssetType.FONT,
    "application/font-sfnt": AssetType.FONT,
}


@router.post(
    "",
    response_model=AssetRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_asset_endpoint(
    project_id: UUID,
    video_id: UUID,
    file: UploadFile = File(...),
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    content_type = file.content_type or "application/octet-stream"

    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}",
        )

    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large (exceeds 500MB)",
        )

    asset_id = uuid4()

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    if not extension:
        extension = ".bin"

    object_key = (
        f"videos/{video_id}/"
        f"assets/{asset_id}/"
        f"original{extension}"
    )

    upload_file(
        BytesIO(data),
        object_key,
        content_type,
    )

    asset = Asset(
        id=asset_id,
        video_id=video_id,
        filename=file.filename
        or "unnamed",
        object_key=object_key,
        content_type=content_type,
        asset_type=ALLOWED_TYPES[
            content_type
        ],
        size_bytes=len(data),
        processing_status=AssetProcessingStatus.PENDING,
        purpose=AssetPurpose.ORIGINAL,
        source="upload",
    )

    session.add(asset)

    # Create MediaJob
    job = MediaJob(
        asset_id=asset_id,
        job_type=MediaJobType.PROBE,
        status=MediaJobStatus.PENDING,
    )
    session.add(job)
    session.commit()
    session.refresh(asset)

    # Enqueue background job
    try:
        media_queue.enqueue(
            "app.workers.jobs.process_asset",
            asset_id,
        )
    except Exception as e:
        print(f"Warning: Failed to enqueue media processing job: {e}")

    return build_asset_read(
        session,
        asset,
    )


@router.get(
    "",
    response_model=list[AssetRead],
)
def list_assets_endpoint(
    project_id: UUID,
    video_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    assets = get_assets(
        session,
        video_id,
    )

    return [
        build_asset_read(session, a)
        for a in assets
    ]


@router.get(
    "/{asset_id}",
    response_model=AssetRead,
)
def get_asset_endpoint(
    project_id: UUID,
    video_id: UUID,
    asset_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    asset = get_asset(
        session,
        video_id,
        asset_id,
    )

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    return build_asset_read(
        session,
        asset,
    )


@router.get(
    "/{asset_id}/url",
    response_model=AssetUrlResponse,
)
def get_asset_url_endpoint(
    project_id: UUID,
    video_id: UUID,
    asset_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    asset = get_asset(
        session,
        video_id,
        asset_id,
    )

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    return AssetUrlResponse(
        url=get_asset_url(asset)
    )


@router.post(
    "/{asset_id}/retry",
    response_model=AssetRead,
)
def retry_asset_processing_endpoint(
    project_id: UUID,
    video_id: UUID,
    asset_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    asset = get_asset(
        session,
        video_id,
        asset_id,
    )

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    asset.processing_status = (
        AssetProcessingStatus.PENDING
    )
    asset.processing_error = None
    session.add(asset)

    job = MediaJob(
        asset_id=asset_id,
        job_type=MediaJobType.PROBE,
        status=MediaJobStatus.PENDING,
    )
    session.add(job)
    session.commit()

    try:
        media_queue.enqueue(
            "app.workers.jobs.process_asset",
            asset_id,
        )
    except Exception as e:
        print(f"Warning: Failed to enqueue retry media job: {e}")

    return build_asset_read(
        session,
        asset,
    )


@router.patch(
    "/{asset_id}",
    response_model=AssetRead,
)
def update_asset_endpoint(
    project_id: UUID,
    video_id: UUID,
    asset_id: UUID,
    asset_update: AssetUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    asset = get_asset(
        session,
        video_id,
        asset_id,
    )

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    updated = assign_asset_to_scene(
        session,
        asset,
        asset_update.scene_id,
    )

    return build_asset_read(
        session,
        updated,
    )


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_asset_endpoint(
    project_id: UUID,
    video_id: UUID,
    asset_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    project = get_project(
        session,
        project_id,
        current_user.id,
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

    asset = get_asset(
        session,
        video_id,
        asset_id,
    )

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    remove_asset(
        session,
        asset,
    )
