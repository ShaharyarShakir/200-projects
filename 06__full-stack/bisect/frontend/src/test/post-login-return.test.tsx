import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "../lib/auth/AuthContext";
import { returnPathStorage } from "../lib/api/client";
import { safeNextPath } from "../lib/auth/routes";

/**
 * A signed-out visitor who deep-links to a protected page must come back to that
 * page after signing in.
 *
 * The `next` parameter cannot do this job on its own: GitHub redirects to the
 * exact registered callback URL and appends only `code` and `state`, so `next`
 * is gone by the time the callback page runs. The intended destination therefore
 * has to be persisted before the browser leaves for GitHub.
 */

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => window.location.pathname,
}));

vi.mock("../lib/api/auth", () => ({
  authApi: {
    getLoginUrl: () => "http://localhost:8000/api/v1/auth/github/login",
    getMe: vi.fn().mockRejectedValue(new Error("no session")),
    handleCallback: vi.fn(),
  },
}));

let assignedLocation: string | null = null;

function LoginButton() {
  const { login } = useAuth();
  return (
    <button type="button" onClick={login}>
      Sign in with GitHub
    </button>
  );
}

beforeEach(() => {
  mockReplace.mockClear();
  localStorage.clear();
  assignedLocation = null;
  // Capture the navigation instead of performing it.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      get href() {
        return assignedLocation ?? "http://localhost:3000/";
      },
      set href(value: string) {
        assignedLocation = value;
      },
      pathname: "/",
      search: "",
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("post-login return path", () => {
  it("persists a deep-linked destination before leaving for GitHub", () => {
    // The landing page after RequireAuth redirected here.
    window.location.search = "?next=%2Fsessions";
    window.location.pathname = "/";

    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );

    screen.getByRole("button", { name: /sign in with github/i }).click();

    expect(assignedLocation).toBe(
      "http://localhost:8000/api/v1/auth/github/login"
    );
    // This is the value the callback page will read to decide where to go.
    expect(returnPathStorage.get()).toBe("/sessions");
  });

  it("does not persist a destination when there is no next parameter", () => {
    window.location.search = "";
    window.location.pathname = "/";

    render(
      <AuthProvider>
        <LoginButton />
      </AuthProvider>
    );

    screen.getByRole("button", { name: /sign in with github/i }).click();

    expect(assignedLocation).toBe(
      "http://localhost:8000/api/v1/auth/github/login"
    );
    expect(returnPathStorage.get()).toBeNull();
  });

  it("refuses to persist an off-site next parameter", () => {
    // `next` is attacker-controllable via a crafted link, so an absolute or
    // protocol-relative URL must not survive into the post-login redirect.
    for (const hostile of [
      "?next=https://evil.example/steal",
      "?next=%2F%2Fevil.example",
      "?next=%2F%5Cevil.example",
    ]) {
      window.location.search = hostile;
      returnPathStorage.clear();

      const view = render(
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      );
      screen.getByRole("button", { name: /sign in with github/i }).click();

      expect(returnPathStorage.get()).toBeNull();
      view.unmount();
    }
  });
});

describe("safeNextPath", () => {
  it("accepts a local absolute path", () => {
    expect(safeNextPath("/sessions")).toBe("/sessions");
  });

  it("rejects off-site and protocol-relative values", () => {
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });
});
