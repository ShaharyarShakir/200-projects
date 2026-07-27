import { QueryClient } from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false
		}
	}
});

const API_BASE = 'http://localhost:3000/api';

// API Fetch Helper
async function apiRequest<T = any>(
	path: string,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
	body?: any
): Promise<T> {
	const headers: HeadersInit = {
		'Content-Type': 'application/json'
	};

	const response = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include' // Essential for forwarding cookie sessions
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || `HTTP ${response.status} Error`);
	}

	return response.json();
}

// Notebook Operations
export const notebooksApi = {
	list: () => apiRequest<any[]>('/notebooks'),
	create: (name: string, icon?: string, color?: string) =>
		apiRequest('/notebooks', 'POST', { name, icon, color }),
	update: (id: string, name?: string, icon?: string, color?: string) =>
		apiRequest(`/notebooks/${id}`, 'PATCH', { name, icon, color }),
	delete: (id: string) => apiRequest(`/notebooks/${id}`, 'DELETE')
};

// Note Operations
export const notesApi = {
	list: () => apiRequest<any[]>('/notes'),
	listTrash: () => apiRequest<any[]>('/notes/trash'),
	search: (q: string) => apiRequest<any[]>(`/notes/search?q=${encodeURIComponent(q)}`),
	get: (id: string) => apiRequest<any>(`/notes/${id}`),
	create: (title: string, notebookId?: string | null, content?: any) =>
		apiRequest('/notes', 'POST', { title, notebookId, content }),
	update: (
		id: string,
		data: {
			title?: string;
			notebookId?: string | null;
			content?: any;
			isFavorite?: boolean;
			isPinned?: boolean;
			isArchived?: boolean;
			summary?: string | null;
		}
	) => apiRequest(`/notes/${id}`, 'PATCH', data),
	softDelete: (id: string) => apiRequest(`/notes/${id}`, 'DELETE'),
	restore: (id: string) => apiRequest(`/notes/${id}/restore`, 'PATCH'),
	permanentDelete: (id: string) => apiRequest(`/notes/${id}/permanent`, 'DELETE'),
	toggleFavorite: (id: string) => apiRequest(`/notes/${id}/favorite`, 'PATCH'),
	togglePin: (id: string) => apiRequest(`/notes/${id}/pin`, 'PATCH')
};
