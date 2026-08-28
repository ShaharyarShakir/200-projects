export type AssetType =
	| 'image'
	| 'video'
	| 'audio'
	| 'font'
	| 'other';

export type AssetStatus =
	| 'uploading'
	| 'ready'
	| 'failed'
	| 'deleted';

export type AssetProcessingStatus =
	| 'pending'
	| 'processing'
	| 'ready'
	| 'failed';

export type AssetPurpose =
	| 'original'
	| 'thumbnail'
	| 'preview'
	| 'proxy'
	| 'waveform'
	| 'render';

export interface Asset {
	id: string;

	video_id: string;

	scene_id: string | null;

	filename: string;

	content_type: string;

	asset_type: AssetType;

	size_bytes: number;

	status: AssetStatus;

	processing_status: AssetProcessingStatus;

	processing_error?: string | null;

	purpose: AssetPurpose;

	parent_asset_id?: string | null;

	source?: string | null;

	width: number | null;

	height: number | null;

	duration_seconds: number | null;

	url?: string | null;

	thumbnail_url?: string | null;

	created_at: string;

	updated_at: string;
}
