import { User } from '../types/auth';

const API_BASE = '/api/auth';

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const errorData = await res.json().catch(() => ({}));
		throw new Error(errorData.message || 'An unexpected error occurred');
	}
	return res.json();
}

export const authApi = {
	async register(email: string, password: string): Promise<{ user: User }> {
		const res = await fetch(`${API_BASE}/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
			credentials: 'include'
		});
		return handleResponse(res);
	},

	async login(email: string, password: string): Promise<{ user: User }> {
		const res = await fetch(`${API_BASE}/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
			credentials: 'include'
		});
		return handleResponse(res);
	},

	async logout(): Promise<void> {
		const res = await fetch(`${API_BASE}/logout`, {
			method: 'POST',
			credentials: 'include'
		});
		return handleResponse(res);
	},

	async me(customFetch?: typeof fetch): Promise<User> {
		const fetchFn = customFetch || fetch;
		const res = await fetchFn(`${API_BASE}/me`, {
			method: 'GET',
			credentials: 'include'
		});
		return handleResponse(res);
	}
};
