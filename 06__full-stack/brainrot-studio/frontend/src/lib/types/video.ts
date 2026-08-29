export type VideoStatus =
	| 'draft'
	| 'generating'
	| 'rendering'
	| 'ready'
	| 'published'
	| 'failed';

export type VideoAspectRatio =
	| '9:16'
	| '16:9'
	| '1:1';

export interface Video {
	id: string;
	project_id: string;

	title: string;
	description: string | null;
	script: string | null;

	status: VideoStatus;

	aspect_ratio: VideoAspectRatio;

	width: number;
	height: number;
	fps: number;

	duration_seconds: number | null;
	output_url: string | null;

	created_at: string;
	updated_at: string;
}

export interface Scene {
	id: string;
	video_id: string;
	position: number;

	narration: string | null;
	visual_prompt: string | null;
	dialogue: string | null;

	duration_seconds: number | null;
	asset_url: string | null;

	created_at: string;
	updated_at: string;
}
