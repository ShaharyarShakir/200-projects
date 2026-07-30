import { PUBLIC_API_URL } from '$env/static/public';
import { authStore } from './auth.svelte';

const API_BASE = PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
	skipAuth?: boolean;
}

interface APIResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code?: number;
	};
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const url = `${API_BASE}${path}`;

	const headers = new Headers(options.headers || {});

	if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}

	// Automatically inject access token if authenticated
	if (!options.skipAuth && authStore.token) {
		headers.set('Authorization', `Bearer ${authStore.token}`);
	}

	const fetchOptions: RequestInit = {
		...options,
		headers,
		credentials: 'include' // Crucial for cookie passing (refresh_token)
	};

	let response = await fetch(url, fetchOptions);

	// Intercept 401 (Expired Access Token) and attempt refresh cycle
	if (response.status === 401 && !options.skipAuth && path !== '/api/auth/refresh') {
		const success = await authStore.refresh();
		if (success) {
			// Update auth header and retry original call
			headers.set('Authorization', `Bearer ${authStore.token}`);
			response = await fetch(url, fetchOptions);
		}
	}

	let json: APIResponse<T>;
	try {
		json = await response.json();
	} catch (e) {
		throw new Error(`Failed to parse JSON response: ${response.statusText}`, { cause: e });
	}

	if (!response.ok || !json.success) {
		throw new Error(json.error?.message || `API Error: ${response.statusText}`);
	}

	return json.data as T;
}
