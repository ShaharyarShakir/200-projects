import { api } from './client';
import type { Project, ProjectCreate } from '$lib/types/project';

export function getProjects() {
	return api<Project[]>('/projects');
}

export function createProject(data: ProjectCreate) {
	return api<Project>('/projects', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export function deleteProject(id: string) {
	return api<void>(`/projects/${id}`, {
		method: 'DELETE'
	});
}
