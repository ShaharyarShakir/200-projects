import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AuthContext } from "./auth-context";
import type { AuthContextValue } from "./auth-context";
import type { AuthState, LoginCredentials, RegisterCredentials, User } from "./auth.types";

import { authApi } from "./auth.api";
import { registerUnauthorizedHandler, API_CONFIG } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem(API_CONFIG.tokenStorageKey);
    const savedUserJson = localStorage.getItem(API_CONFIG.userStorageKey);
    let savedUser: User | null = null;
    if (savedUserJson) {
      try {
        savedUser = JSON.parse(savedUserJson);
      } catch {
        savedUser = null;
      }
    }
    return {
      user: savedUser,
      token: savedToken,
      isAuthenticated: Boolean(savedToken && savedUser),
      isLoading: Boolean(savedToken && !savedUser),
      error: null,
    };
  });

  const lastUnauthorizedTime = useRef(0);

  const logout = useCallback((options?: { notifyUser?: boolean; reason?: string }) => {
    const notifyUser = options?.notifyUser ?? true;
    const reason = options?.reason;

    const token = localStorage.getItem(API_CONFIG.tokenStorageKey);
    localStorage.removeItem(API_CONFIG.tokenStorageKey);
    localStorage.removeItem(API_CONFIG.userStorageKey);
    localStorage.removeItem(API_CONFIG.shopStorageKey);

    if (token) {
      authApi.logout().catch(() => {});
    }

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    useAuthStore.getState().logout();

    if (notifyUser) {
      if (reason === "session_expired") {
        toast.error("Session expired. Please log in again.", { id: "session_expired" });
      } else {
        toast.success("Logged out successfully", { id: "logout_success" });
      }
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      const now = Date.now();
      if (now - lastUnauthorizedTime.current > 3000) {
        lastUnauthorizedTime.current = now;
        logout({ notifyUser: true, reason: "session_expired" });
      } else {
        logout({ notifyUser: false });
      }
    });
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await authApi.login(credentials);
      const { user, token } = res;
      localStorage.setItem(API_CONFIG.tokenStorageKey, token);
      localStorage.setItem(API_CONFIG.userStorageKey, JSON.stringify(user));

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      useAuthStore.getState().setAuth(token, user as any);

      toast.success(`Welcome back, ${user.name || user.email}!`, { id: "login_success" });
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to sign in. Check your credentials.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      toast.error(errorMsg, { id: "login_error" });
      throw err;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await authApi.register(credentials);
      const { user, token } = res;
      localStorage.setItem(API_CONFIG.tokenStorageKey, token);
      localStorage.setItem(API_CONFIG.userStorageKey, JSON.stringify(user));

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      useAuthStore.getState().setAuth(token, user as any);

      toast.success(`Account and Shop created successfully! Welcome, ${user.name || credentials.ownerFirstName}!`, { id: "register_success" });
    } catch (err: any) {
      const errorMsg = err?.message || "Registration failed. Please check details and try again.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      toast.error(errorMsg, { id: "register_error" });
      throw err;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem(API_CONFIG.tokenStorageKey);
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return;
    }

    try {
      const user = await authApi.getCurrentUser();
      localStorage.setItem(API_CONFIG.userStorageKey, JSON.stringify(user));
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      useAuthStore.getState().setAuth(token, user as any);
    } catch {
      logout({ notifyUser: false });
    }
  }, [logout]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      initializeAuth,
    }),
    [state, login, register, logout, initializeAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


