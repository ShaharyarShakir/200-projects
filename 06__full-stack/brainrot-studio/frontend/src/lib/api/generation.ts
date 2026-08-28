import { api } from './client';
import type { GenerateStoryRequest, GenerationJobResponse } from '$lib/types/ai';
import type { Timeline } from '$lib/types/timeline';

export function generateStory(
	projectId: string,
	videoId: string,
	data: GenerateStoryRequest
) {
	return api<{ job_id: string; status: string; message: string }>(
		`/projects/${projectId}/videos/${videoId}/generate`,
		{
			method: 'POST',
			body: JSON.stringify(data)
		}
	);
}

export function getGenerationJob(
	projectId: string,
	videoId: string,
	jobId: string
) {
	return api<GenerationJobResponse>(
		`/projects/${projectId}/videos/${videoId}/generation-jobs/${jobId}`
	);
}

export function applyStoryVersion(
	projectId: string,
	videoId: string,
	storyVersionId: string
) {
	return api<Timeline>(
		`/projects/${projectId}/videos/${videoId}/stories/${storyVersionId}/apply`,
		{
			method: 'POST'
		}
	);
}

export function regenerateScene(
	projectId: string,
	videoId: string,
	sceneId: string,
	instruction: string
) {

	return api<Timeline>(
		`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}/regenerate`,
		{
			method: 'POST',
			body: JSON.stringify({ instruction })
		}
	);
}

