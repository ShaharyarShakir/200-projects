import { api } from './client';

import type { Asset } from '$lib/types/asset';

export function getAssets(
	projectId: string,
	videoId: string
) {
	return api<Asset[]>(
		`/projects/${projectId}/videos/${videoId}/assets`
	);
}

export function getAssetUrl(
	projectId: string,
	videoId: string,
	assetId: string
) {
	return api<{ url: string }>(
		`/projects/${projectId}/videos/${videoId}/assets/${assetId}/url`
	);
}

export async function uploadAsset(
	projectId: string,
	videoId: string,
	file: File
) {
	const formData = new FormData();

	formData.append(
		'file',
		file
	);

	return api<Asset>(
		`/projects/${projectId}/videos/${videoId}/assets`,
		{
			method: 'POST',
			body: formData
		}
	);
}

export function updateAsset(
	projectId: string,
	videoId: string,
	assetId: string,
	data: { scene_id: string | null }
) {
	return api<Asset>(
		`/projects/${projectId}/videos/${videoId}/assets/${assetId}`,
		{
			method: 'PATCH',
			body: JSON.stringify(data)
		}
	);
}

export function retryAssetProcessing(
	projectId: string,
	videoId: string,
	assetId: string
) {
	return api<Asset>(
		`/projects/${projectId}/videos/${videoId}/assets/${assetId}/retry`,
		{
			method: 'POST'
		}
	);
}

export function deleteAsset(
	projectId: string,
	videoId: string,
	assetId: string
) {
	return api<void>(
		`/projects/${projectId}/videos/${videoId}/assets/${assetId}`,
		{
			method: 'DELETE'
		}
	);
}
