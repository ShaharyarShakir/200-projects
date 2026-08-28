import { api } from './client';

import type {
	Video,
	VideoAspectRatio,
	Scene
} from '$lib/types/video';

export function getVideos(
	projectId: string
) {
	return api<Video[]>(
		`/projects/${projectId}/videos`
	);
}

export function getVideo(
	projectId: string,
	videoId: string
) {
	return api<Video>(
		`/projects/${projectId}/videos/${videoId}`
	);
}

export function createVideo(
	projectId: string,
	data: {
		title: string;
		description?: string;
	}
) {
	return api<Video>(
		`/projects/${projectId}/videos`,
		{
			method: 'POST',
			body: JSON.stringify(data)
		}
	);
}

export function updateVideo(
	projectId: string,
	videoId: string,
	data: {
		title?: string;
		description?: string;
		script?: string;
		aspect_ratio?: VideoAspectRatio;
		width?: number;
		height?: number;
		fps?: number;
	}
) {
	return api<Video>(
		`/projects/${projectId}/videos/${videoId}`,
		{
			method: 'PATCH',
			body: JSON.stringify(data)
		}
	);
}

export function deleteVideo(
	projectId: string,
	videoId: string
) {
	return api<void>(
		`/projects/${projectId}/videos/${videoId}`,
		{
			method: 'DELETE'
		}
	);
}

export function getScenes(
	projectId: string,
	videoId: string
) {
	return api<Scene[]>(
		`/projects/${projectId}/videos/${videoId}/scenes`
	);
}

export function createScene(
	projectId: string,
	videoId: string,
	data: {
		narration?: string;
		visual_prompt?: string;
		dialogue?: string;
		duration_seconds?: number;
	}
) {
	return api<Scene>(
		`/projects/${projectId}/videos/${videoId}/scenes`,
		{
			method: 'POST',
			body: JSON.stringify(data)
		}
	);
}

export function updateScene(
	projectId: string,
	videoId: string,
	sceneId: string,
	data: {
		narration?: string;
		visual_prompt?: string;
		dialogue?: string;
		duration_seconds?: number;
	}
) {
	return api<Scene>(
		`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}`,
		{
			method: 'PATCH',
			body: JSON.stringify(data)
		}
	);
}

export function deleteScene(
	projectId: string,
	videoId: string,
	sceneId: string
) {
	return api<void>(
		`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}`,
		{
			method: 'DELETE'
		}
	);
}
