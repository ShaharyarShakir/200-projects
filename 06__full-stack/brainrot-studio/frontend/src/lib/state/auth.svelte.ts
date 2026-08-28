import type { User } from '$lib/types/auth';

class AuthState {
	user = $state<User | null>(null);
	accessToken = $state<string | null>(
		typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
	);

	isAuthenticated = $derived(this.accessToken !== null);

	setSession(token: string, user: User) {
		this.accessToken = token;
		this.user = user;

		if (typeof window !== 'undefined') {
			localStorage.setItem('access_token', token);
		}
	}

	logout() {
		this.user = null;
		this.accessToken = null;

		if (typeof window !== 'undefined') {
			localStorage.removeItem('access_token');
		}
	}
}

export const auth = new AuthState();
