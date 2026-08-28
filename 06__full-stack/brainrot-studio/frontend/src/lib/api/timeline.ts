import { api } from './client';
import type {
	Caption,
	SceneAsset,
	SceneAssetRole,
	SceneWithAssets,
	Timeline,
	Track,
	TransitionType
} from '$lib/types/timeline';

export function getTimeline(projectId: string, videoId: string) {
	return api<Timeline>(`/projects/${projectId}/videos/${videoId}/timeline`);
}

export function reorderScenes(projectId: string, videoId: string, sceneIds: string[]) {
	return api<Timeline>(`/projects/${projectId}/videos/${videoId}/scenes/reorder`, {
		method: 'PATCH',
		body: JSON.stringify({ scene_ids: sceneIds })
	});
}

export function addTimelineScene(
	projectId: string,
	videoId: string,
	data: {
		title?: string;
		description?: string;
		narration?: string;
		visual_prompt?: string;
		dialogue?: string;
		duration_ms?: number;
		transition_in?: TransitionType;
	}
) {
	return api<SceneWithAssets>(`/projects/${projectId}/videos/${videoId}/scenes`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export function updateTimelineScene(
	projectId: string,
	videoId: string,
	sceneId: string,
	data: {
		title?: string;
		description?: string;
		narration?: string;
		visual_prompt?: string;
		dialogue?: string;
		order?: number;
		duration_ms?: number;
		transition_in?: TransitionType;
	}
) {
	return api<SceneWithAssets>(`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export function deleteTimelineScene(projectId: string, videoId: string, sceneId: string) {
	return api<void>(`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}`, {
		method: 'DELETE'
	});
}

export function attachSceneAsset(
	projectId: string,
	videoId: string,
	sceneId: string,
	data: {
		asset_id: string;
		role: SceneAssetRole;
		start_ms?: number;
		duration_ms?: number;
		z_index?: number;
		x?: number;
		y?: number;
		scale?: number;
		rotation?: number;
		opacity?: number;
	}
) {
	return api<SceneAsset>(`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}/assets`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export function updateSceneAsset(
	projectId: string,
	videoId: string,
	sceneAssetId: string,
	data: {
		role?: SceneAssetRole;
		start_ms?: number;
		duration_ms?: number;
		z_index?: number;
		x?: number;
		y?: number;
		scale?: number;
		rotation?: number;
		opacity?: number;
	}
) {
	return api<SceneAsset>(`/projects/${projectId}/videos/${videoId}/scene-assets/${sceneAssetId}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export function deleteSceneAsset(projectId: string, videoId: string, sceneAssetId: string) {
	return api<void>(`/projects/${projectId}/videos/${videoId}/scene-assets/${sceneAssetId}`, {
		method: 'DELETE'
	});
}

export function addCaption(
	projectId: string,
	videoId: string,
	data: {
		text: string;
		start_ms: number;
		end_ms: number;
		style?: string;
	}
) {
	return api<Caption>(`/projects/${projectId}/videos/${videoId}/captions`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export function addTrack(
	projectId: string,
	videoId: string,
	data: {
		name: string;
		track_type: 'video' | 'audio' | 'caption';
		order?: number;
		muted?: boolean;
	}
) {
	return api<Track>(`/projects/${projectId}/videos/${videoId}/tracks`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
