import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React, { StrictMode } from "react";
import AuthCallbackPage from "../app/auth/callback/page";
import { AuthProvider } from "../lib/auth/useAuth";
import { authApi } from "../lib/api/auth";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams("code=gh_code_123&state=rand_state_456");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

function mockExchange() {
  return vi.spyOn(authApi, "handleCallback").mockResolvedValue({
    access_token: "token_xyz",
    token_type: "bearer",
    user: {
      id: "u123",
      github_user_id: 999,
      github_username: "testuser",
      created_at: "2026-09-25T00:00:00Z",
      updated_at: "2026-09-25T00:00:00Z",
    },
  });
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams("code=gh_code_123&state=rand_state_456");
  });

  it("exchanges code only once even when rendered inside StrictMode", async () => {
    const handleCallbackSpy = vi.spyOn(authApi, "handleCallback").mockResolvedValue({
      access_token: "token_xyz",
      token_type: "bearer",
      user: {
        id: "u123",
        github_user_id: 999,
        github_username: "testuser",
        created_at: "2026-09-25T00:00:00Z",
        updated_at: "2026-09-25T00:00:00Z",
      },
    });

    render(
      <StrictMode>
        <AuthProvider>
          <AuthCallbackPage />
        </AuthProvider>
      </StrictMode>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/workspace");
    });

    // In StrictMode effects run twice, but handleCallback should only be invoked once
    expect(handleCallbackSpy).toHaveBeenCalledTimes(1);
    expect(handleCallbackSpy).toHaveBeenCalledWith("gh_code_123", "rand_state_456");
  });

  it("displays error message if code or state parameter is missing", async () => {
    mockSearchParams = new URLSearchParams("");

    render(
      <AuthProvider>
        <AuthCallbackPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Missing code or state parameter from GitHub OAuth callback.")
      ).toBeInTheDocument();
    });
  });

  it("displays error message if handleCallback rejects", async () => {
    vi.spyOn(authApi, "handleCallback").mockRejectedValue(
      new Error("OAuth code expired")
    );

    render(
      <AuthProvider>
        <AuthCallbackPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("OAuth code expired")).toBeInTheDocument();
    });
  });

  describe("post-login destination", () => {
    it("honours a valid next parameter", async () => {
      mockExchange();
      mockSearchParams = new URLSearchParams(
        "code=gh_code_123&state=rand_state_456&next=%2Fsessions"
      );

      render(
        <AuthProvider>
          <AuthCallbackPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/sessions");
      });
    });

    it("falls back to the return path recorded on 401 when next is absent", async () => {
      mockExchange();
      localStorage.setItem("bisect_auth_return_path", "/activity");

      render(
        <AuthProvider>
          <AuthCallbackPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/activity");
      });
    });

    it("rejects an off-origin next and falls back to the default", async () => {
      mockExchange();
      mockSearchParams = new URLSearchParams(
        "code=gh_code_123&state=rand_state_456&next=%2F%2Fevil.com"
      );

      render(
        <AuthProvider>
          <AuthCallbackPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/workspace");
      });
      expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining("evil.com"));
    });

    it("rejects the backslash variant of an off-origin next", async () => {
      mockExchange();
      mockSearchParams = new URLSearchParams(
        "code=gh_code_123&state=rand_state_456&next=%2F%5Cevil.com"
      );

      render(
        <AuthProvider>
          <AuthCallbackPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/workspace");
      });
    });

    it("clears the recorded return path after a successful login", async () => {
      mockExchange();
      localStorage.setItem("bisect_auth_return_path", "/activity");

      render(
        <AuthProvider>
          <AuthCallbackPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/activity");
      });
      // The recorded path is spent, so the next sign-in is not replayed to a
      // stale destination. A later 401 may legitimately record a fresh path,
      // so assert the stale value is gone rather than that the slot is empty.
      await waitFor(() => {
        expect(localStorage.getItem("bisect_auth_return_path")).not.toBe("/activity");
      });
    });
  });
});
