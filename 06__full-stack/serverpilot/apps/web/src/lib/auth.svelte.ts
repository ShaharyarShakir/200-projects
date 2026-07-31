import { apiFetch } from './api';
import { goto } from '$app/navigation';

export interface User {
	id: string;
	email: string;
}

class AuthStore {
	#user = $state<User | null>(null);
	#token = $state<string | null>(null);
	#loading = $state<boolean>(true);

	// Getters expose reactive Svelte 5 runes properties
	get user() {
		return this.#user;
	}
	get token() {
		return this.#token;
	}
	get loading() {
		return this.#loading;
	}
	get isAuthenticated() {
		return this.#user !== null;
	}

	// Register a new account
	async register(email: string, password: string): Promise<boolean> {
		try {
			const data = await apiFetch<{ access_token: string; user: User }>('/api/auth/register', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
				skipAuth: true
			});
			this.#token = data.access_token;
			this.#user = data.user;
			return true;
		} catch (err) {
			console.error('Registration failed:', err);
			throw err;
		}
	}

	// Login credentials
	async login(email: string, password: string): Promise<boolean> {
		try {
			const data = await apiFetch<{ access_token: string; user: User }>('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
				skipAuth: true
			});
			this.#token = data.access_token;
			this.#user = data.user;
			return true;
		} catch (err) {
			console.error('Login failed:', err);
			throw err;
		}
	}

	// Logout and purge credentials session
	async logout(): Promise<void> {
		try {
			await apiFetch('/api/auth/logout', { method: 'POST' });
		} catch (err) {
			console.error('Logout request failed:', err);
		} finally {
			this.#token = null;
			this.#user = null;
			goto('/login');
		}
	}

	// Refresh access token using cookie refresh token
	async refresh(): Promise<boolean> {
		try {
			const data = await apiFetch<{ access_token: string }>('/api/auth/refresh', {
				method: 'POST',
				skipAuth: true
			});
			this.#token = data.access_token;
			await this.me();
			return true;
		} catch {
			this.#token = null;
			this.#user = null;
			return false;
		}
	}

	// Fetch current user credentials profile
	async me(): Promise<void> {
		try {
			const data = await apiFetch<{ user: User }>('/api/auth/me');
			this.#user = data.user;
		} catch (err) {
			this.#token = null;
			this.#user = null;
			throw err;
		}
	}

	// Initial session recovery
	async init(): Promise<void> {
		this.#loading = true;
		try {
			await this.refresh();
		} catch {
			// Fail silently (anonymous visitor)
		} finally {
			this.#loading = false;
		}
	}
}

export const authStore = new AuthStore();
export type { AuthStore };
