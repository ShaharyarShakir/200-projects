"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { UserRead } from "../api/types";
import {
  tokenStorage,
  registerUnauthorizedHandler,
  returnPathStorage,
} from "../api/client";
import { authApi } from "../api/auth";
import { safeNextPath } from "./routes";

export interface AuthContextType {
  user: UserRead | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  setAuthData: (token: string, user: UserRead) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const router = useRouter();

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    if (isMountedRef.current) {
      setToken(null);
      setUser(null);
      setError(null);
    }
    // Land on the login page. Without this the user stays on a protected URL
    // with no session, which reads as a broken page rather than a signed-out
    // one. replace() is used so Back does not return to the dead route.
    router.replace("/");
  }, [router]);

  const setAuthData = useCallback((newToken: string, newUser: UserRead) => {
    tokenStorage.setToken(newToken);
    if (isMountedRef.current) {
      setToken(newToken);
      setUser(newUser);
      setError(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = tokenStorage.getToken();
    if (!savedToken) {
      if (isMountedRef.current) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }
      const profile = await authApi.getMe();
      if (isMountedRef.current) {
        setUser(profile);
        setToken(savedToken);
      }
    } catch (err: unknown) {
      logout();
      if (isMountedRef.current && err instanceof Error && !err.message.includes("401")) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [logout]);

  const login = useCallback(() => {
    if (typeof window === "undefined") return;
    // GitHub redirects to the exact registered callback URL and appends only
    // `code` and `state`, so a `next` parameter cannot survive the round trip.
    // Persist the intended destination before the browser leaves, and let the
    // callback page read it back. It is validated first because `next` arrives
    // from a URL and must never be able to redirect off-site.
    const requestedNext = safeNextPath(
      new URLSearchParams(window.location.search).get("next")
    );
    if (requestedNext) {
      returnPathStorage.set(requestedNext);
    }
    window.location.href = authApi.getLoginUrl();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    registerUnauthorizedHandler(logout);
    refreshUser();
    return () => {
      isMountedRef.current = false;
      registerUnauthorizedHandler(null);
    };
  }, [logout, refreshUser]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    logout,
    setAuthData,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
