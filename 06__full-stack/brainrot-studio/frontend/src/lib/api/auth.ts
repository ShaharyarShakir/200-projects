import { api } from './client';
import type {
	LoginRequest,
	RegisterRequest,
	TokenResponse,
	User
} from '$lib/types/auth';

export function login(data: LoginRequest) {
	return api<TokenResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export function register(data: RegisterRequest) {
	return api<User>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export function getCurrentUser() {
	return api<User>('/auth/me');
}
