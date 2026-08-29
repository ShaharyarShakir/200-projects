export interface Composition {
	id: string;
	video_id: string;
	width: number;
	height: number;
	fps: number;
	duration_ms: number;
}

export type SceneAssetRole =
	| 'background'
	| 'character'
	| 'prop'
	| 'audio'
	| 'music'
	| 'voice'
	| 'overlay';

export interface SceneAsset {
	id: string;
	scene_id: string;
	asset_id: string;
	role: SceneAssetRole;
	start_ms: number;
	duration_ms: number | null;
	z_index: number;
	x: number;
	y: number;
	scale: number;
	rotation: number;
	opacity: number;
}

export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom';

export interface SceneWithAssets {
	id: string;
	video_id: string;
	order: number;
	position: number;
	start_ms: number;
	duration_ms: number;
	title: string | null;
	description: string | null;
	narration: string | null;
	visual_prompt: string | null;
	dialogue: string | null;
	transition_in: TransitionType;
	assets: SceneAsset[];
}

export type TrackType = 'video' | 'audio' | 'caption';

export interface TrackItem {
	id: string;
	track_id: string;
	asset_id: string | null;
	start_ms: number;
	duration_ms: number;
	offset_ms: number;
}

export interface Track {
	id: string;
	video_id: string;
	name: string;
	track_type: TrackType;
	order: number;
	muted: boolean;
	items: TrackItem[];
}

export interface Caption {
	id: string;
	video_id: string;
	text: string;
	start_ms: number;
	end_ms: number;
	style: string;
}

export interface Timeline {
	composition: Composition;
	scenes: SceneWithAssets[];
	tracks: Track[];
	captions: Caption[];
}
