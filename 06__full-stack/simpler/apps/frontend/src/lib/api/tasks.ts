import type { Task, PaginatedResponse, QueryTaskParams } from '$lib/types/task';

const API_BASE = 'http://localhost:3001/api/tasks';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(url, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		}
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({}));
		throw new Error(error.message || 'API Request failed');
	}

	return res.json();
}

export const tasksApi = {
	getTasks(params: QueryTaskParams = {}): Promise<PaginatedResponse<Task>> {
		const query = new URLSearchParams();
		Object.entries(params).forEach(([key, val]) => {
			if (val !== undefined && val !== null && val !== '') {
				query.append(key, String(val));
			}
		});
		return request(`${API_BASE}?${query.toString()}`);
	},

	getTask(id: string): Promise<Task> {
		return request(`${API_BASE}/${id}`);
	},

	createTask(data: Partial<Task>): Promise<Task> {
		return request(API_BASE, { method: 'POST', body: JSON.stringify(data) });
	},

	updateTask(id: string, data: Partial<Task>): Promise<Task> {
		return request(`${API_BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
	},

	toggleTask(id: string): Promise<Task> {
		return request(`${API_BASE}/${id}/toggle`, { method: 'PATCH' });
	},

	deleteTask(id: string): Promise<{ message: string }> {
		return request(`${API_BASE}/${id}`, { method: 'DELETE' });
	}
};
