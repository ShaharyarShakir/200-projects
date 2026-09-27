import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { RequireAuth } from "../components/auth/RequireAuth";
import { AuthContextType } from "../lib/auth/AuthContext";

const mockReplace = vi.fn();

// The context itself is module-private, so the hook is mocked instead of
// widening the production API for testability.
let currentAuth: AuthContextType;

vi.mock("../lib/auth/useAuth", () => ({
  useAuth: () => currentAuth,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

const USER = {
  id: "user-1",
  github_user_id: 1,
  github_username: "octocat",
  avatar_url: null,
  email: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as unknown as AuthContextType["user"];

function authValue(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    setAuthData: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  };
}

function renderGuard(value: AuthContextType) {
  currentAuth = value;
  return render(
    <RequireAuth>
      <p>protected content</p>
    </RequireAuth>
  );
}

beforeEach(() => {
  mockReplace.mockClear();
  localStorage.clear();
});

describe("RequireAuth", () => {
  it("renders no children while authentication is still loading", () => {
    renderGuard(authValue({ isLoading: true }));

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByText("Checking your session...")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders no children when unauthenticated", async () => {
    renderGuard(authValue({ isAuthenticated: false, isLoading: false }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("redirects to login carrying the current path as next", async () => {
    renderGuard(authValue({ isAuthenticated: false, isLoading: false }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith("/?next=%2Fworkspace");
  });

  it("prefers a return path recorded by a 401", async () => {
    localStorage.setItem("bisect_auth_return_path", "/sessions");

    renderGuard(authValue({ isAuthenticated: false, isLoading: false }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith("/?next=%2Fsessions");
  });

  it("refuses to build an off-origin redirect from a tampered return path", async () => {
    localStorage.setItem("bisect_auth_return_path", "//evil.com");

    renderGuard(authValue({ isAuthenticated: false, isLoading: false }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("renders children once authenticated", () => {
    renderGuard(
      authValue({ isAuthenticated: true, isLoading: false, token: "t", user: USER })
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when loading resolves into an authenticated session", async () => {
    const { rerender } = renderGuard(authValue({ isLoading: true }));

    currentAuth = authValue({
      isLoading: false,
      isAuthenticated: true,
      token: "t",
      user: USER,
    });
    rerender(
      <RequireAuth>
        <p>protected content</p>
      </RequireAuth>
    );

    await waitFor(() =>
      expect(screen.getByText("protected content")).toBeInTheDocument()
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
