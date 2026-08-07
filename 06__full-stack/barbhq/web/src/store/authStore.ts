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
      set({ accessToken, user, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
      localStorage.removeItem("barbhq_token");
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    initializeAuth: async () => {
      const token = localStorage.getItem("barbhq_token");
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
        // Fetch current user details from backend (GET /auth/me)
        const { data } = await api.get<{ data: User }>("/auth/me");
        // Standard payload envelope from server controller sends response in data wrapper
        set({ user: data.data, isAuthenticated: true, isLoading: false });
      } catch {
        // If profile fetch fails, clean up token and session
        localStorage.removeItem("barbhq_token");
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
