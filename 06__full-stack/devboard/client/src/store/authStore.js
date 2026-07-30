import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true, // Default to true while checking initial session on startup
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null }),
}));
