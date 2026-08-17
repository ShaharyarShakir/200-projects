import { useContext } from "react";
import { AuthContext } from "./auth-context";
import type { AuthContextValue } from "./auth-context";
import { useAuthStore } from "../../store/authStore";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context) {
    return context;
  }

  const store = useAuthStore();
  const legacyUser = store.user;

  const user = legacyUser
    ? {
        id: legacyUser.id,
        email: legacyUser.email,
        name: `${legacyUser.firstName || ""} ${legacyUser.lastName || ""}`.trim() || legacyUser.email,
        role: (legacyUser.role as any) || "OWNER",
        shopId: legacyUser.shopId || "shop-01",
        avatar: legacyUser.avatar,
      }
    : null;

  return {
    user,
    token: localStorage.getItem("barbhq_token"),
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: null,
    login: async () => {
      // Fallback
    },
    register: async () => {
      // Fallback
    },
    logout: () => {
      store.logout();
    },
    initializeAuth: async () => {},

  };
}
