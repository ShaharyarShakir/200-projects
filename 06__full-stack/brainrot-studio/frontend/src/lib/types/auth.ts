export interface User {
	id: string;
	email: string;
	full_name?: string;
	is_active: boolean;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
}
