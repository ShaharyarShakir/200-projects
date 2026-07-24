import type { User } from '$lib/types/auth';
import { authApi } from '$lib/api/auth';

class AuthState {
	user = $state<User | null>(null);
	loading = $state<boolean>(true);

	isAuthenticated = $derived(this.user !== null);

	setUser(user: User | null) {
		this.user = user;
		this.loading = false;
	}

	async login(email: string, password: string) {
		this.loading = true;
		try {
			const data = await authApi.login(email, password);
			this.user = data.user;
		} finally {
			this.loading = false;
		}
	}

	async register(email: string, password: string) {
		this.loading = true;
		try {
			const data = await authApi.register(email, password);
			this.user = data.user;
		} finally {
			this.loading = false;
		}
	}

	async logout() {
		try {
			await authApi.logout();
		} finally {
			this.user = null;
			this.loading = false;
		}
	}

	async fetchUser() {
		this.loading = true;
		try {
			const user = await authApi.me();
			this.user = user;
		} catch {
			this.user = null;
		} finally {
			this.loading = false;
		}
	}
}

export const auth = new AuthState();
