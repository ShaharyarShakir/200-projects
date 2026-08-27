from uuid import UUID

from sqlmodel import Session, select

from app.models.caption import Caption
from app.models.composition import Composition
from app.models.scene import Scene
from app.models.scene_asset import SceneAsset
from app.models.track import Track, TrackItem
from app.schemas.scene import SceneCreate, SceneUpdate
from app.schemas.timeline import (
    CaptionCreate,
    CaptionRead,
    CompositionRead,
    SceneAssetCreate,
    SceneAssetRead,
    SceneAssetUpdate,
    SceneReadWithAssets,
    TimelineRead,
    TrackCreate,
    TrackItemCreate,
    TrackItemRead,
    TrackRead,
)


def get_or_create_composition(
    session: Session,
    video_id: UUID,
) -> Composition:
    stmt = select(Composition).where(Composition.video_id == video_id)
    composition = session.exec(stmt).first()

    if composition is None:
        composition = Composition(
            video_id=video_id,
            width=1080,
            height=1920,
            fps=30,
            duration_ms=0,
        )
        session.add(composition)
        session.commit()
        session.refresh(composition)

    return composition


def recalculate_scene_positions(
    session: Session,
    video_id: UUID,
) -> Composition:
    composition = get_or_create_composition(session, video_id)

    stmt = (
        select(Scene)
        .where(Scene.video_id == video_id)
        .order_by(Scene.order, Scene.created_at)
    )
    scenes = session.exec(stmt).all()

    current_time = 0
    for idx, scene in enumerate(scenes):
        scene.order = idx
        scene.position = idx
        scene.start_ms = current_time
        if scene.duration_seconds and (scene.duration_ms == 4000 and scene.duration_seconds != 4.0):
            scene.duration_ms = int(scene.duration_seconds * 1000)
        else:
            scene.duration_seconds = scene.duration_ms / 1000.0

        current_time += scene.duration_ms
        session.add(scene)

    composition.duration_ms = current_time
    session.add(composition)
    session.commit()
    session.refresh(composition)

    return composition


def get_video_timeline(
    session: Session,
    video_id: UUID,
) -> TimelineRead:
    comp = recalculate_scene_positions(session, video_id)

    # Scenes with assets
    scenes_stmt = (
        select(Scene)
        .where(Scene.video_id == video_id)
        .order_by(Scene.order)
    )
    scenes = session.exec(scenes_stmt).all()

    scene_reads: list[SceneReadWithAssets] = []
    for scene in scenes:
        assets_stmt = (
            select(SceneAsset)
            .where(SceneAsset.scene_id == scene.id)
            .order_by(SceneAsset.z_index)
        )
        assets = session.exec(assets_stmt).all()

        asset_reads = [
            SceneAssetRead(
                id=sa.id,
                scene_id=sa.scene_id,
                asset_id=sa.asset_id,
                role=sa.role,
                start_ms=sa.start_ms,
                duration_ms=sa.duration_ms,
                z_index=sa.z_index,
                x=sa.x,
                y=sa.y,
                scale=sa.scale,
                rotation=sa.rotation,
                opacity=sa.opacity,
            )
            for sa in assets
        ]

        scene_reads.append(
            SceneReadWithAssets(
                id=scene.id,
                video_id=scene.video_id,
                order=scene.order,
                position=scene.position,
                start_ms=scene.start_ms,
                duration_ms=scene.duration_ms,
                title=scene.title,
                description=scene.description,
                narration=scene.narration,
                visual_prompt=scene.visual_prompt,
                dialogue=scene.dialogue,
                transition_in=scene.transition_in,
                assets=asset_reads,
            )
        )

    # Tracks with items
    tracks_stmt = (
        select(Track)
        .where(Track.video_id == video_id)
        .order_by(Track.order)
    )
    tracks = session.exec(tracks_stmt).all()

    track_reads: list[TrackRead] = []
    for tr in tracks:
        items_stmt = (
            select(TrackItem)
            .where(TrackItem.track_id == tr.id)
            .order_by(TrackItem.start_ms)
        )
        items = session.exec(items_stmt).all()

        item_reads = [
            TrackItemRead(
                id=ti.id,
                track_id=ti.track_id,
                asset_id=ti.asset_id,
                start_ms=ti.start_ms,
                duration_ms=ti.duration_ms,
                offset_ms=ti.offset_ms,
            )
            for ti in items
        ]

        track_reads.append(
            TrackRead(
                id=tr.id,
                video_id=tr.video_id,
                name=tr.name,
                track_type=tr.track_type,
                order=tr.order,
                muted=tr.muted,
                items=item_reads,
            )
        )

    # Captions
    captions_stmt = (
        select(Caption)
        .where(Caption.video_id == video_id)
        .order_by(Caption.start_ms)
    )
    captions = session.exec(captions_stmt).all()

    caption_reads = [
        CaptionRead(
            id=c.id,
            video_id=c.video_id,
            text=c.text,
            start_ms=c.start_ms,
            end_ms=c.end_ms,
            style=c.style,
        )
        for c in captions
    ]

    return TimelineRead(
        composition=CompositionRead(
            id=comp.id,
            video_id=comp.video_id,
            width=comp.width,
            height=comp.height,
            fps=comp.fps,
            duration_ms=comp.duration_ms,
        ),
        scenes=scene_reads,
        tracks=track_reads,
        captions=caption_reads,
    )


def reorder_scenes(
    session: Session,
    video_id: UUID,
    scene_ids: list[UUID],
) -> TimelineRead:
    stmt = select(Scene).where(Scene.video_id == video_id)
    scenes = session.exec(stmt).all()
    scene_map = {s.id: s for s in scenes}

    for idx, sid in enumerate(scene_ids):
        if sid in scene_map:
            scene_map[sid].order = idx
            session.add(scene_map[sid])

    session.commit()
    return get_video_timeline(session, video_id)


def create_timeline_scene(
    session: Session,
    video_id: UUID,
    data: SceneCreate,
) -> Scene:
    stmt = select(Scene).where(Scene.video_id == video_id)
    existing = session.exec(stmt).all()
    next_order = len(existing)

    scene = Scene(
        video_id=video_id,
        order=next_order,
        position=next_order,
        start_ms=0,
        duration_ms=data.duration_ms,
        title=data.title,
        description=data.description,
        narration=data.narration,
        visual_prompt=data.visual_prompt,
        dialogue=data.dialogue,
        transition_in=data.transition_in,
        duration_seconds=data.duration_ms / 1000.0,
    )
    session.add(scene)
    session.commit()
    session.refresh(scene)

    recalculate_scene_positions(session, video_id)
    session.refresh(scene)
    return scene


def update_timeline_scene(
    session: Session,
    scene: Scene,
    data: SceneUpdate,
) -> Scene:
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(scene, field, value)

    if data.duration_ms is not None:
        scene.duration_seconds = data.duration_ms / 1000.0

    session.add(scene)
    session.commit()
    session.refresh(scene)

    recalculate_scene_positions(session, scene.video_id)
    session.refresh(scene)
    return scene


def delete_timeline_scene(
    session: Session,
    scene: Scene,
) -> None:
    video_id = scene.video_id

    # Delete scene assets
    assets_stmt = select(SceneAsset).where(SceneAsset.scene_id == scene.id)
    scene_assets = session.exec(assets_stmt).all()
    for sa in scene_assets:
        session.delete(sa)

    session.delete(scene)
    session.commit()

    recalculate_scene_positions(session, video_id)


def add_scene_asset(
    session: Session,
    scene_id: UUID,
    data: SceneAssetCreate,
) -> SceneAsset:
    scene_asset = SceneAsset(
        scene_id=scene_id,
        asset_id=data.asset_id,
        role=data.role,
        start_ms=data.start_ms,
        duration_ms=data.duration_ms,
        z_index=data.z_index,
        x=data.x,
        y=data.y,
        scale=data.scale,
        rotation=data.rotation,
        opacity=data.opacity,
    )
    session.add(scene_asset)
    session.commit()
    session.refresh(scene_asset)
    return scene_asset


def update_scene_asset(
    session: Session,
    scene_asset: SceneAsset,
    data: SceneAssetUpdate,
) -> SceneAsset:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(scene_asset, field, value)

    session.add(scene_asset)
    session.commit()
    session.refresh(scene_asset)
    return scene_asset


def delete_scene_asset(
    session: Session,
    scene_asset: SceneAsset,
) -> None:
    session.delete(scene_asset)
    session.commit()


def create_caption(
    session: Session,
    video_id: UUID,
    data: CaptionCreate,
) -> Caption:
    caption = Caption(
        video_id=video_id,
        text=data.text,
        start_ms=data.start_ms,
        end_ms=data.end_ms,
        style=data.style,
    )
    session.add(caption)
    session.commit()
    session.refresh(caption)
    return caption


def create_track(
    session: Session,
    video_id: UUID,
    data: TrackCreate,
) -> Track:
    track = Track(
        video_id=video_id,
        name=data.name,
        track_type=data.track_type,
        order=data.order,
        muted=data.muted,
    )
    session.add(track)
    session.commit()
    session.refresh(track)
    return track


def add_track_item(
    session: Session,
    track_id: UUID,
    data: TrackItemCreate,
) -> TrackItem:
    item = TrackItem(
        track_id=track_id,
        asset_id=data.asset_id,
        start_ms=data.start_ms,
        duration_ms=data.duration_ms,
        offset_ms=data.offset_ms,
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item
