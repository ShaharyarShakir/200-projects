import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  fetchApi,
  tokenStorage,
  returnPathStorage,
  ApiClientError,
  registerUnauthorizedHandler,
} from "../lib/api/client";
import { authApi } from "../lib/api/auth";
import { repositoriesApi } from "../lib/api/repositories";

describe("API Client & Modules", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    registerUnauthorizedHandler(null);
  });

  it("stores, retrieves, and clears auth tokens correctly", () => {
    expect(tokenStorage.getToken()).toBeNull();
    tokenStorage.setToken("test_token_123");
    expect(tokenStorage.getToken()).toBe("test_token_123");
    tokenStorage.clearToken();
    expect(tokenStorage.getToken()).toBeNull();
  });

  it("adds Authorization header when token is stored", async () => {
    tokenStorage.setToken("valid_token");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    const result = await fetchApi<{ success: boolean }>("/test");
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/test",
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );

    const calledHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get("Authorization")).toBe("Bearer valid_token");
  });

  it("sends cookies so the OAuth state check can pass cross-origin", async () => {
    // The frontend (:3000) and API (:8000) are different origins, so cookies
    // are dropped unless credentials are explicitly included. The GitHub
    // sign-in sets a `github_oauth_state` CSRF cookie on the login redirect and
    // the callback rejects the exchange without it.
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    await fetchApi<{ success: boolean }>("/api/v1/auth/github/callback?code=c&state=s");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("handles 401 Unauthorized and invokes unauthorized handler", async () => {
    tokenStorage.setToken("expired_token");
    const onUnauthorized = vi.fn();
    registerUnauthorizedHandler(onUnauthorized);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ detail: "Token invalid or expired" }),
    });

    await expect(fetchApi("/protected")).rejects.toThrowError(ApiClientError);
    expect(tokenStorage.getToken()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("normalizes backend error detail message properly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ detail: "Repository already exists" }),
    });

    await expect(fetchApi("/api/v1/repositories")).rejects.toMatchObject({
      message: "Repository already exists",
      status: 400,
    });
  });

  it("calls auth API endpoints accurately", async () => {
    expect(authApi.getLoginUrl()).toBe(
      "http://localhost:8000/api/v1/auth/github/login"
    );

    const mockResponse = {
      access_token: "jwt_token",
      token_type: "bearer",
      user: {
        id: "usr_123",
        github_user_id: 999,
        github_username: "octocat",
        created_at: "2026-09-25T12:00:00Z",
        updated_at: "2026-09-25T12:00:00Z",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockResponse,
    });

    const res = await authApi.handleCallback("test_code", "test_state");
    expect(res).toEqual(mockResponse);
  });

  it("calls repository list and sync endpoints", async () => {
    const mockSyncResponse = {
      synced_count: 2,
      repositories: [
        {
          id: "repo_1",
          github_repo_id: 101,
          full_name: "octocat/hello-world",
          default_branch: "main",
          clone_url: "https://github.com/octocat/hello-world.git",
          is_private: false,
          owner_id: "usr_1",
          created_at: "2026-09-25T12:00:00Z",
          updated_at: "2026-09-25T12:00:00Z",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockSyncResponse,
    });

    const syncRes = await repositoriesApi.syncRepositories();
    expect(syncRes.synced_count).toBe(2);
    expect(syncRes.repositories).toHaveLength(1);
  });

  it("records the current path as the return path on a 401", async () => {
    window.history.replaceState({}, "", "/workspace?tab=diff");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ detail: "expired" }),
    });

    await expect(fetchApi("/test")).rejects.toThrow(ApiClientError);

    // The path without its query string, so the redirect lands on the page
    // rather than a stale view state.
    expect(returnPathStorage.get()).toBe("/workspace");
  });

  it("clears the token and fires the unauthorized handler on a 401", async () => {
    tokenStorage.setToken("stale_token");
    window.history.replaceState({}, "", "/sessions");
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ detail: "expired" }),
    });

    await expect(fetchApi("/test")).rejects.toThrow(ApiClientError);

    expect(tokenStorage.getToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(returnPathStorage.get()).toBe("/sessions");
  });

  it("does not record a return path for a non-401 failure", async () => {
    window.history.replaceState({}, "", "/workspace");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ detail: "boom" }),
    });

    await expect(fetchApi("/test")).rejects.toThrow(ApiClientError);
    expect(returnPathStorage.get()).toBeNull();
  });
});
