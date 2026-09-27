import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "../lib/auth/useAuth";
import { tokenStorage } from "../lib/api/client";
import { authApi } from "../lib/api/auth";
import Home from "../app/page";

const mockReplace = vi.fn();

// AuthProvider redirects on logout, so the app router must be present.
vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

function TestAuthConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, setAuthData } =
    useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "idle"}</div>
      <div data-testid="auth-status">
        {isAuthenticated ? "authenticated" : "unauthenticated"}
      </div>
      <div data-testid="user-name">{user ? user.github_username : "none"}</div>
      <button onClick={login} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
      <button
        onClick={() =>
          setAuthData("token_abc", {
            id: "u1",
            github_user_id: 1,
            github_username: "user_test",
            created_at: "2026-09-25",
            updated_at: "2026-09-25",
          })
        }
        data-testid="set-auth-btn"
      >
        SetAuth
      </button>
    </div>
  );
}

describe("AuthContext and useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockReplace.mockClear();
  });

  it("starts in unauthenticated state when no token exists", async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });
    expect(screen.getByTestId("auth-status").textContent).toBe(
      "unauthenticated"
    );
    expect(screen.getByTestId("user-name").textContent).toBe("none");
  });

  it("hydrates user profile if valid token is present in storage", async () => {
    tokenStorage.setToken("saved_token");
    vi.spyOn(authApi, "getMe").mockResolvedValue({
      id: "u_existing",
      github_user_id: 1234,
      github_username: "github_dev",
      created_at: "2026-09-25T00:00:00Z",
      updated_at: "2026-09-25T00:00:00Z",
    });

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });
    expect(screen.getByTestId("auth-status").textContent).toBe("authenticated");
    expect(screen.getByTestId("user-name").textContent).toBe("github_dev");
  });

  it("sets auth data and clears on logout", async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });

    fireEvent.click(screen.getByTestId("set-auth-btn"));
    expect(screen.getByTestId("auth-status").textContent).toBe("authenticated");
    expect(screen.getByTestId("user-name").textContent).toBe("user_test");
    expect(tokenStorage.getToken()).toBe("token_abc");

    fireEvent.click(screen.getByTestId("logout-btn"));
    expect(screen.getByTestId("auth-status").textContent).toBe(
      "unauthenticated"
    );
    expect(screen.getByTestId("user-name").textContent).toBe("none");
    expect(tokenStorage.getToken()).toBeNull();
  });

  it("redirects to the login page after logout", async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });
    mockReplace.mockClear();

    fireEvent.click(screen.getByTestId("set-auth-btn"));
    fireEvent.click(screen.getByTestId("logout-btn"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
    expect(tokenStorage.getToken()).toBeNull();
  });

  it("settles on the login page after logout without a redirect loop", async () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
        <Home />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("idle");
    });
    mockReplace.mockClear();

    fireEvent.click(screen.getByTestId("set-auth-btn"));
    fireEvent.click(screen.getByTestId("logout-btn"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    // The login page is public, so the app must now go quiet. A redirect loop
    // between "/" and "/workspace" would keep navigating after this point.
    const loginButtons = await screen.findAllByRole("button", {
      name: /sign in with github/i,
    });
    expect(loginButtons.length).toBeGreaterThan(0);
    expect(loginButtons[0]).toBeInTheDocument();
    mockReplace.mockClear();

    // Flush pending effects deterministically rather than waiting on a
    // wall-clock delay, which would be flaky under load.
    await act(async () => {});
    await act(async () => {});
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
