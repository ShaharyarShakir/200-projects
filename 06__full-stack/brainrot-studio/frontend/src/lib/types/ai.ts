export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerateStoryRequest {
	prompt: string;
	target_duration_ms?: number;
	tone?: string;
	language?: string;
	provider?: string;
}


export interface DialogueLine {
	character: string;
	text: string;
}

export interface GeneratedScenePreview {
	scene_number: number;
	duration_ms: number;
	purpose: string;
	visual_description: string;
	dialogue: DialogueLine[];
	caption: string;
}

export interface GeneratedStoryContent {
	title: string;
	hook: string;
	premise: string;
	tone: string;
	target_duration_ms: number;
	scenes: GeneratedScenePreview[];
}

export interface StoryPreview {
	story_version_id: string;
	version: number;
	content: GeneratedStoryContent;
}

export interface GenerationJobResponse {
	id: string;
	video_id: string;
	prompt: string;
	status: GenerationStatus;
	progress: number;
	error_message?: string | null;
	story_version_id?: string | null;
	story_preview?: StoryPreview | null;
}
