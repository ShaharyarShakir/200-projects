import { fetchApi, API_BASE_URL } from "./client";
import { TokenResponse, UserRead } from "./types";

export const authApi = {
  getLoginUrl(): string {
    return `${API_BASE_URL}/api/v1/auth/github/login`;
  },

  async handleCallback(code: string, state: string): Promise<TokenResponse> {
    const query = new URLSearchParams({ code, state }).toString();
    return fetchApi<TokenResponse>(`/api/v1/auth/github/callback?${query}`, {
      method: "GET",
    });
  },

  async getMe(): Promise<UserRead> {
    return fetchApi<UserRead>("/api/v1/auth/me", {
      method: "GET",
    });
  },
};
