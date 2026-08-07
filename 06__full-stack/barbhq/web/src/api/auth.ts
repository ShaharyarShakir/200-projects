import api from "./axios";
import type { User } from "../types";

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (
    credentials: Record<string, unknown>,
  ): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
};
