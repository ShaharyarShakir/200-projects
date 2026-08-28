import { api } from './client';

export interface CharacterAsset {
	id: string;
	character_id: string;
	asset_type: string;
	expression: string;
	image_url: string;
}

export interface Character {
	id: string;
	name: string;
	show_name?: string;
	image_url: string;
	avatar: string;
	tier: string;
	selected?: boolean;
	assets?: CharacterAsset[];
}

export interface Niche {
	id: string;
	name: string;
	slug: string;
	description?: string;
	icon: string;
}

export interface GeneratedTopic {
	id: string;
	title: string;
	hook: string;
	premise: string;
	estimated_duration: number;
	characters: string[];
}

export interface DialogueLine {
	character_id: string;
	text: string;
}

export interface ScriptScene {
	scene_number: number;
	visual_description: string;
	dialogue: DialogueLine[];
	duration_seconds: number;
}

export interface GeneratedScript {
	id?: string;
	title: string;
	hook: string;
	scenes: ScriptScene[];
	estimated_duration: number;
}

export interface VideoStyleConfig {
	layout: string;
	font_family: string;
	font_size: number;
	primary_color: string;
	outline_color: string;
	outline_width: number;
	animation: string;
	position: string;
}

export interface GenerationSession {
	id: string;
	status: string;
	current_step: number;
	niche?: string;
	character_ids: string[];
	selected_topic_id?: string;
	topics: GeneratedTopic[];
	script?: GeneratedScript;
	style_config?: VideoStyleConfig;
}

export async function fetchCharacters(): Promise<Character[]> {
	return api<Character[]>('/characters');
}

export async function fetchNiches(): Promise<Niche[]> {
	return api<Niche[]>('/niches');
}

export async function createGenerationSession(projectId?: string): Promise<{ id: string; status: string; current_step: number }> {
	return api('/generation-sessions', {
		method: 'POST',
		body: JSON.stringify({ project_id: projectId })
	});
}

export async function getGenerationSession(sessionId: string): Promise<GenerationSession> {
	return api<GenerationSession>(`/generation-sessions/${sessionId}`);
}

export async function updateGenerationSession(
	sessionId: string,
	data: { current_step?: number; character_ids?: string[]; niche?: string }
): Promise<{ status: string }> {
	return api(`/generation-sessions/${sessionId}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
}

export async function generateSessionTopics(sessionId: string): Promise<GeneratedTopic[]> {
	return api<GeneratedTopic[]>(`/generation-sessions/${sessionId}/topics`, {
		method: 'POST'
	});
}

export async function selectSessionTopic(sessionId: string, topicId: string): Promise<{ status: string }> {
	return api(`/generation-sessions/${sessionId}/select-topic`, {
		method: 'POST',
		body: JSON.stringify({ topic_id: topicId })
	});
}

export async function generateSessionScript(sessionId: string): Promise<GeneratedScript> {
	return api<GeneratedScript>(`/generation-sessions/${sessionId}/script`, {
		method: 'POST'
	});
}

export async function regenerateSessionScene(
	sessionId: string,
	sceneIdx: number,
	instruction: string
): Promise<ScriptScene> {
	return api<ScriptScene>(`/generation-sessions/${sessionId}/script/scenes/${sceneIdx}`, {
		method: 'PATCH',
		body: JSON.stringify({ instruction })
	});
}

export async function generateSessionStyle(sessionId: string, prompt: string): Promise<VideoStyleConfig> {
	return api<VideoStyleConfig>(`/generation-sessions/${sessionId}/style`, {
		method: 'POST',
		body: JSON.stringify({ prompt })
	});
}

export async function renderSessionVideo(sessionId: string): Promise<{ status: string; video_id: string; project_id: string }> {
	return api(`/generation-sessions/${sessionId}/render`, {
		method: 'POST'
	});
}
