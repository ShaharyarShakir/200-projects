from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.asset import (
    Asset,
    AssetPurpose,
)
from app.schemas.asset import AssetRead
from app.services.storage import (
    delete_file,
    get_file_url,
)


def build_asset_read(
    session: Session,
    asset: Asset,
) -> AssetRead:
    thumbnail_url = None

    if asset.purpose == AssetPurpose.ORIGINAL:
        thumb_asset = session.exec(
            select(Asset).where(
                Asset.parent_asset_id == asset.id,
                Asset.purpose == AssetPurpose.THUMBNAIL,
                Asset.status != "deleted",
            )
        ).first()

        if thumb_asset:
            thumbnail_url = get_file_url(
                thumb_asset.object_key
            )

    return AssetRead(
        id=asset.id,
        video_id=asset.video_id,
        scene_id=asset.scene_id,
        filename=asset.filename,
        content_type=asset.content_type,
        asset_type=asset.asset_type,
        size_bytes=asset.size_bytes,
        status=asset.status,
        processing_status=asset.processing_status,
        processing_error=asset.processing_error,
        purpose=asset.purpose,
        parent_asset_id=asset.parent_asset_id,
        source=asset.source,
        width=asset.width,
        height=asset.height,
        duration_seconds=asset.duration_seconds,
        thumbnail_url=thumbnail_url,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


def get_assets(
    session: Session,
    video_id: UUID,
) -> list[Asset]:
    statement = (
        select(Asset)
        .where(
            Asset.video_id == video_id,
            Asset.status != "deleted",
            Asset.purpose == AssetPurpose.ORIGINAL,
        )
        .order_by(
            Asset.created_at.desc()
        )
    )

    return list(
        session.exec(statement).all()
    )


def get_asset(
    session: Session,
    video_id: UUID,
    asset_id: UUID,
) -> Asset | None:
    statement = select(Asset).where(
        Asset.id == asset_id,
        Asset.video_id == video_id,
    )

    return session.exec(
        statement
    ).first()


def get_asset_url(
    asset: Asset,
) -> str:
    return get_file_url(
        asset.object_key
    )


def remove_asset(
    session: Session,
    asset: Asset,
) -> None:
    delete_file(
        asset.object_key
    )

    asset.status = "deleted"
    asset.updated_at = datetime.now(
        timezone.utc
    )

    session.add(asset)
    session.commit()


def assign_asset_to_scene(
    session: Session,
    asset: Asset,
    scene_id: UUID | None,
) -> Asset:
    asset.scene_id = scene_id
    asset.updated_at = datetime.now(
        timezone.utc
    )

    session.add(asset)
    session.commit()
    session.refresh(asset)

    return asset
