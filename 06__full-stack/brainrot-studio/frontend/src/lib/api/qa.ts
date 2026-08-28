import { api } from './client';

export interface QAIssue {
	id: string;
	category: string;
	severity: 'info' | 'warning' | 'error' | 'critical';
	code: string;
	message: string;
	scene_id: string | null;
	repairable: boolean;
}

export interface QAReportResponse {
	id?: string;
	job_id: string;
	attempt: number;
	score: number;
	passed: boolean;
	checks_run: number;
	created_at?: string;
	issues: QAIssue[];
}

export interface QAHistoryResponse {
	job_id: string;
	reports: Array<{
		id: string;
		attempt: number;
		score: number;
		passed: boolean;
		checks_run: number;
		created_at: string;
	}>;
	repair_attempts: Array<{
		id: string;
		repair_type: string;
		scene_id: string | null;
		status: string;
		reason: string;
		created_at: string;
	}>;
}

export function getLatestQAReport(projectId: string, videoId: string, jobId: string) {
	return api<QAReportResponse>(
		`/projects/${projectId}/videos/${videoId}/generation-jobs/${jobId}/qa`
	);
}

export function getQAHistory(projectId: string, videoId: string, jobId: string) {
	return api<QAHistoryResponse>(
		`/projects/${projectId}/videos/${videoId}/generation-jobs/${jobId}/qa/history`
	);
}

export function repairScene(
	projectId: string,
	videoId: string,
	sceneId: string,
	instruction?: string,
	repairType: string = 'SCENE'
) {
	return api<{ status: string; repaired_scene_id: string }>(
		`/projects/${projectId}/videos/${videoId}/scenes/${sceneId}/repair`,
		{
			method: 'POST',
			body: JSON.stringify({ instruction, repair_type: repairType })
		}
	);
}

export function repairJob(jobId: string, sceneId?: string, repairType: string = 'dialogue', reason?: string) {
	return api<{ status: string; job_id: string }>(`/generations/${jobId}/repair`, {
		method: 'POST',
		body: JSON.stringify({ scene_id: sceneId, repair_type: repairType, reason })
	});
}


