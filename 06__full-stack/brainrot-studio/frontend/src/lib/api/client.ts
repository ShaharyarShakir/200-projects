import { auth } from '$lib/state/auth.svelte';

const API_URL = 'http://localhost:8000/api/v1';

export async function api<T>(
	path: string,
	options: RequestInit = {}
): Promise<T> {
	const headers = new Headers(options.headers);

	headers.set('Content-Type', 'application/json');

	if (auth.accessToken) {
		headers.set('Authorization', `Bearer ${auth.accessToken}`);
	}

	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const body = await response.json().catch(() => null);

		throw new Error(
			body?.detail ?? `API request failed: ${response.status}`
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json();
}
