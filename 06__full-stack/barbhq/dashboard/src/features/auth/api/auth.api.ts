import api from "../../../api/axios";
import type { User } from "../../../types";
import type { LoginResponse, ApiResponseEnvelope } from "../types";
import type { LoginFormValues } from "../schemas/login.schema";

export const authApi = {
  login: async (
    credentials: Omit<LoginFormValues, "rememberMe">,
  ): Promise<LoginResponse> => {
    const { data } = await api.post<ApiResponseEnvelope<LoginResponse>>(
      "/auth/login",
      credentials,
    );
    return data.data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<ApiResponseEnvelope<User>>("/auth/me");
    return data.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await api.post("/auth/logout", { refreshToken });
  },
};
