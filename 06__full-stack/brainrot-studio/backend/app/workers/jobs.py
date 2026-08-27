import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from sqlmodel import Session, select

from app.core.database import engine
from app.core.media import MEDIA_WORK_DIR
from app.models.asset import (
    Asset,
    AssetProcessingStatus,
    AssetPurpose,
    AssetStatus,
    AssetType,
)
from app.models.media_job import (
    MediaJob,
    MediaJobStatus,
    MediaJobType,
)
from app.services.media.image import (
    get_image_dimensions,
)
from app.services.media.metadata import (
    extract_metadata,
)
from app.services.media.thumbnails import (
    generate_video_thumbnail,
)
from app.services.storage import (
    download_file,
    upload_file,
)


logger = logging.getLogger("brainrot.media")


def process_asset(asset_id: UUID) -> None:
    logger.info("Starting processing for asset %s", asset_id)

    with Session(engine) as session:
        asset = session.get(Asset, asset_id)

        if not asset:
            logger.error(
                "Asset %s not found for processing",
                asset_id,
            )
            return

        job = session.exec(
            select(MediaJob).where(
                MediaJob.asset_id == asset_id,
                MediaJob.status == MediaJobStatus.PENDING,
            )
        ).first()

        if not job:
            job = MediaJob(
                asset_id=asset_id,
                job_type=MediaJobType.PROBE,
                status=MediaJobStatus.PENDING,
            )

            session.add(job)
            session.commit()
            session.refresh(job)

        job.status = MediaJobStatus.PROCESSING
        job.attempts += 1
        job.started_at = datetime.now(
            timezone.utc
        )

        asset.processing_status = (
            AssetProcessingStatus.PROCESSING
        )

        session.add(job)
        session.add(asset)
        session.commit()

        job_dir = (
            MEDIA_WORK_DIR
            / f"job_{job.id}"
        )
        job_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        extension = Path(
            asset.filename
        ).suffix or ".bin"

        local_input_path = (
            job_dir / f"input{extension}"
        )

        try:
            logger.info(
                "Downloading asset object %s to %s",
                asset.object_key,
                local_input_path,
            )

            download_file(
                asset.object_key,
                local_input_path,
            )

            if asset.asset_type == AssetType.IMAGE:
                w, h = get_image_dimensions(
                    local_input_path
                )
                asset.width = w
                asset.height = h
            elif asset.asset_type in (
                AssetType.VIDEO,
                AssetType.AUDIO,
            ):
                meta = extract_metadata(
                    local_input_path
                )
                if meta.get("width"):
                    asset.width = meta["width"]
                if meta.get("height"):
                    asset.height = meta["height"]
                if meta.get("duration_seconds"):
                    asset.duration_seconds = meta[
                        "duration_seconds"
                    ]

            if asset.asset_type == AssetType.VIDEO:
                local_thumb_path = (
                    job_dir / "thumbnail.jpg"
                )

                try:
                    logger.info(
                        "Generating video thumbnail for %s",
                        asset_id,
                    )

                    generate_video_thumbnail(
                        local_input_path,
                        local_thumb_path,
                    )

                    if local_thumb_path.exists():
                        thumb_asset_id = uuid4()
                        thumb_object_key = (
                            f"videos/{asset.video_id}/"
                            f"assets/{thumb_asset_id}/"
                            f"thumbnail.jpg"
                        )

                        with open(
                            local_thumb_path,
                            "rb",
                        ) as thumb_f:
                            upload_file(
                                thumb_f,
                                thumb_object_key,
                                "image/jpeg",
                            )

                        thumb_asset = Asset(
                            id=thumb_asset_id,
                            video_id=asset.video_id,
                            scene_id=asset.scene_id,
                            filename=f"thumb_{asset.filename}.jpg",
                            object_key=thumb_object_key,
                            content_type="image/jpeg",
                            asset_type=AssetType.IMAGE,
                            size_bytes=local_thumb_path.stat().st_size,
                            status=AssetStatus.READY,
                            processing_status=AssetProcessingStatus.READY,
                            purpose=AssetPurpose.THUMBNAIL,
                            parent_asset_id=asset.id,
                            source="generated",
                        )

                        session.add(thumb_asset)
                except Exception as thumb_err:
                    logger.warning(
                        "Thumbnail generation warning for %s: %s",
                        asset_id,
                        str(thumb_err),
                    )

            asset.processing_status = (
                AssetProcessingStatus.READY
            )
            asset.processing_error = None
            asset.updated_at = datetime.now(
                timezone.utc
            )

            job.status = MediaJobStatus.COMPLETED
            job.completed_at = datetime.now(
                timezone.utc
            )

            session.add(asset)
            session.add(job)
            session.commit()

            logger.info(
                "Successfully processed asset %s",
                asset_id,
            )

        except Exception as err:
            logger.exception(
                "Failed processing asset %s: %s",
                asset_id,
                str(err),
            )

            asset.processing_status = (
                AssetProcessingStatus.FAILED
            )
            asset.processing_error = str(err)
            asset.updated_at = datetime.now(
                timezone.utc
            )

            job.status = MediaJobStatus.FAILED
            job.error = str(err)

            session.add(asset)
            session.add(job)
            session.commit()
        finally:
            if job_dir.exists():
                shutil.rmtree(
                    job_dir,
                    ignore_errors=True,
                )
