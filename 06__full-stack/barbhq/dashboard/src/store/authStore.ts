import { create } from "zustand";
import api, { registerUnauthorizedHandler } from "../api/axios";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (accessToken: string, user: User) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Register unauthorized response handler to trigger logout on 401
  registerUnauthorizedHandler(() => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true, // loading on startup during token verification

    setAuth: (accessToken, user) => {
      localStorage.setItem("barbhq_token", accessToken);
      localStorage.setItem("barbhq_user", JSON.stringify(user));
      set({ accessToken, user, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
      localStorage.removeItem("barbhq_token");
      localStorage.removeItem("barbhq_user");
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    initializeAuth: async () => {
      const token = localStorage.getItem("barbhq_token");
      console.log("[authStore] initializeAuth start. Token exists:", !!token);
      if (!token) {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      set({ accessToken: token, isLoading: true });

      try {
        console.log("[authStore] Fetching current user profile /auth/me...");
        const { data } = await api.get<{ data: User }>("/auth/me");
        console.log("[authStore] Fetch /auth/me profile success:", data.data);
        localStorage.setItem("barbhq_user", JSON.stringify(data.data));
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } catch (error: any) {
        console.error("[authStore] Fetch /auth/me profile failed:", error.response?.data || error.message || error);
        localStorage.removeItem("barbhq_token");
        localStorage.removeItem("barbhq_user");
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },
  };
});
