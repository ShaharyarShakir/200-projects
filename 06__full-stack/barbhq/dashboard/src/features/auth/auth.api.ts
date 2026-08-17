import { api } from "../../lib/api";
import type { LoginCredentials, RegisterCredentials, LoginResponse, User } from "./auth.types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const res = await api.post<any>("/auth/login", credentials);
    const token = res.tokens?.accessToken || res.token;
    return { user: res.user, token, shop: res.shop };
  },

  register: async (credentials: RegisterCredentials): Promise<LoginResponse> => {
    const res = await api.post<any>("/auth/register", credentials);
    const token = res.tokens?.accessToken || res.token;
    return { user: res.user, token, shop: res.shop };
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<any>("/auth/me");
    return res.user || res;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore API logout error if token already expired
    }
  },
};

