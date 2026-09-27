import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import WorkspacePage from "../app/workspace/page";
import { AuthContextType } from "../lib/auth/AuthContext";
import * as repoApi from "../lib/api/repositories";

const mockReplace = vi.fn();

// RequireAuth is deliberately NOT mocked here: this suite is about the guard
// actually holding the page back.
let currentAuth: AuthContextType;

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../lib/auth/useAuth", () => ({
  useAuth: () => currentAuth,
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

beforeEach(() => {
  vi.restoreAllMocks();
  mockReplace.mockClear();
  localStorage.clear();

  vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValue({
    items: [],
    total: 0,
    limit: 100,
    offset: 0,
  });
});

describe("workspace page auth guard", () => {
  it("does not fetch repositories while auth is still loading", async () => {
    currentAuth = authValue({ isLoading: true });

    render(<WorkspacePage />);

    // Give any effect a chance to fire before asserting it did not.
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(repoApi.repositoriesApi.getRepositories).not.toHaveBeenCalled();
    expect(screen.queryByText("Agent Workspace")).not.toBeInTheDocument();
  });

  it("does not fetch repositories when unauthenticated", async () => {
    currentAuth = authValue({ isLoading: false, isAuthenticated: false });

    render(<WorkspacePage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(repoApi.repositoriesApi.getRepositories).not.toHaveBeenCalled();
  });

  it("fetches repositories once authenticated", async () => {
    currentAuth = authValue({
      isLoading: false,
      isAuthenticated: true,
      token: "token",
      user: USER,
    });

    render(<WorkspacePage />);

    await waitFor(() =>
      expect(repoApi.repositoriesApi.getRepositories).toHaveBeenCalled()
    );
    expect(await screen.findByText("Agent Workspace")).toBeInTheDocument();
  });

  it("sends an unauthenticated visitor to login carrying the return path", async () => {
    currentAuth = authValue({ isLoading: false, isAuthenticated: false });

    render(<WorkspacePage />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/?next=%2Fworkspace")
    );
  });
});
