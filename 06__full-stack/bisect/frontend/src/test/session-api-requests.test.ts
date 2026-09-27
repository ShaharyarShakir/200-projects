import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSession,
  getSessionEvents,
  listSessions,
  createSession,
} from "../lib/api/sessions";
import {
  ApiClientError,
  statusToErrorCode,
  DEFAULT_REQUEST_TIMEOUT_MS,
  registerUnauthorizedHandler,
  tokenStorage,
} from "../lib/api/client";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function lastUrl(mockFetch: ReturnType<typeof vi.fn>): string {
  return mockFetch.mock.calls[0][0] as string;
}

describe("session API request shapes", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    mockFetch = vi.fn().mockResolvedValue(jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }));
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    registerUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  it("listSessions calls the collection route with no query when unfiltered", async () => {
    await listSessions();
    expect(lastUrl(mockFetch)).toBe("http://localhost:8000/api/v1/sessions");
  });

  it("listSessions serializes every supported filter", async () => {
    await listSessions({
      limit: 10,
      offset: 20,
      status: "running",
      repository_id: "repo-1",
    });
    const url = new URL(lastUrl(mockFetch));
    expect(url.pathname).toBe("/api/v1/sessions");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("offset")).toBe("20");
    expect(url.searchParams.get("status")).toBe("running");
    expect(url.searchParams.get("repository_id")).toBe("repo-1");
  });

  it("listSessions omits unset filters instead of sending them empty", async () => {
    // `status=` would be a real request for the empty status and match nothing,
    // and an absent `offset` already means 0 to the backend.
    await listSessions({ limit: 5, status: undefined });
    const url = new URL(lastUrl(mockFetch));
    expect(url.searchParams.has("status")).toBe(false);
    expect(url.searchParams.has("repository_id")).toBe(false);
    expect(url.searchParams.has("offset")).toBe(false);
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("listSessions still sends an explicit offset of zero", async () => {
    await listSessions({ offset: 0 });
    expect(new URL(lastUrl(mockFetch)).searchParams.get("offset")).toBe("0");
  });

  it("listSessions does not send an empty-string filter", async () => {
    await listSessions({ status: "", repository_id: "" });
    const url = new URL(lastUrl(mockFetch));
    expect(url.searchParams.has("status")).toBe(false);
    expect(url.searchParams.has("repository_id")).toBe(false);
  });

  it("getSession calls the member route", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "sess-1" }));
    await getSession("sess-1");
    expect(lastUrl(mockFetch)).toBe("http://localhost:8000/api/v1/sessions/sess-1");
  });

  it("getSessionEvents calls the nested events route with no query by default", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ items: [], total: 0, limit: 100, after_sequence: 0, last_sequence: null })
    );
    await getSessionEvents("sess-1");
    expect(lastUrl(mockFetch)).toBe(
      "http://localhost:8000/api/v1/sessions/sess-1/events"
    );
  });

  it("getSessionEvents serializes after_sequence and limit", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ items: [], total: 0, limit: 50, after_sequence: 7, last_sequence: null })
    );
    await getSessionEvents("sess-1", { after_sequence: 7, limit: 50 });
    const url = new URL(lastUrl(mockFetch));
    expect(url.pathname).toBe("/api/v1/sessions/sess-1/events");
    expect(url.searchParams.get("after_sequence")).toBe("7");
    expect(url.searchParams.get("limit")).toBe("50");
  });

  it("createSession posts the prompt to the collection route", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: "sess-new" }, 201));
    await createSession({ task_prompt: "fix the test" });
    expect(lastUrl(mockFetch)).toBe("http://localhost:8000/api/v1/sessions");
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ task_prompt: "fix the test" });
  });
});

describe("ApiClientError code mapping", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    registerUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  it.each([
    [400, "validation"],
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [409, "conflict"],
    [422, "validation"],
    [500, "server"],
    [502, "server"],
    [503, "server"],
  ])("maps status %i to %s", (status, expected) => {
    expect(statusToErrorCode(status)).toBe(expected);
  });

  it("maps an unmapped 4xx to validation and status 0 to network", () => {
    expect(statusToErrorCode(418)).toBe("validation");
    expect(statusToErrorCode(451)).toBe("validation");
    expect(statusToErrorCode(0)).toBe("network");
  });

  it.each([
    [403, "forbidden"],
    [404, "not_found"],
    [409, "conflict"],
    [422, "validation"],
    [500, "server"],
  ])("throws a %i with code %s", async (status, expected) => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ detail: "nope", code: "SomeBackendError" }, status)
      ) as unknown as typeof fetch;

    await expect(fetchApiCall()).rejects.toMatchObject({
      code: expected,
      status,
    });
  });

  it("carries the backend's own code alongside the mapped one", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ detail: "Session not found", code: "NotFoundError" }, 404)
      ) as unknown as typeof fetch;

    const error = await fetchApiCall().catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("not_found");
    expect((error as ApiClientError).backendCode).toBe("NotFoundError");
  });

  it("maps a dropped connection to network", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch;

    const error = await fetchApiCall().catch((err: unknown) => err);
    expect((error as ApiClientError).code).toBe("network");
  });

  it("leaves the 401 teardown behavior intact", async () => {
    tokenStorage.setToken("expired");
    const onUnauthorized = vi.fn();
    registerUnauthorizedHandler(onUnauthorized);
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ detail: "nope", code: "HTTPError" }, 401)) as unknown as typeof fetch;

    const error = await fetchApiCall().catch((err: unknown) => err);

    expect((error as ApiClientError).code).toBe("unauthorized");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(tokenStorage.getToken()).toBeNull();
  });
});

describe("request timeout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("turns a hung request into a timeout error", async () => {
    vi.useFakeTimers();
    // Never resolves until aborted, which is what a hung request looks like.
    global.fetch = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const abortError = new Error("aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        })
    ) as unknown as typeof fetch;

    const { fetchApi } = await import("../lib/api/client");
    const pending = fetchApi("/api/v1/sessions", { timeoutMs: 50 }).catch(
      (err: unknown) => err
    );

    await vi.advanceTimersByTimeAsync(60);
    const error = await pending;

    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).code).toBe("timeout");
    expect((error as ApiClientError).message).toContain("timed out after 50ms");
  });

  it("aborts the underlying request so the connection is released", async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    global.fetch = vi.fn((_url: string, init: RequestInit) => {
      capturedSignal = init.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        capturedSignal?.addEventListener("abort", () => {
          const abortError = new Error("aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });
      });
    }) as unknown as typeof fetch;

    const { fetchApi } = await import("../lib/api/client");
    const pending = fetchApi("/api/v1/sessions", { timeoutMs: 30 }).catch(
      (err: unknown) => err
    );
    await vi.advanceTimersByTimeAsync(40);
    await pending;

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("does not time out a request that resolves in time", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse({ items: [] })) as unknown as typeof fetch;

    const { fetchApi } = await import("../lib/api/client");
    const result = await fetchApi<{ items: unknown[] }>("/api/v1/sessions", {
      timeoutMs: 1000,
    });
    expect(result).toEqual({ items: [] });
  });

  it("applies a default timeout when none is given", async () => {
    expect(DEFAULT_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
    let capturedSignal: AbortSignal | undefined;
    global.fetch = vi.fn((_url: string, init: RequestInit) => {
      capturedSignal = init.signal ?? undefined;
      return Promise.resolve(jsonResponse({ ok: true }));
    }) as unknown as typeof fetch;

    const { fetchApi } = await import("../lib/api/client");
    await fetchApi("/api/v1/sessions");
    // A signal is always attached, so the default timeout can always fire.
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);
  });

  it("treats a caller-initiated abort as a cancellation, not a network error", async () => {
    const controller = new AbortController();
    global.fetch = vi.fn((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => {
          const abortError = new Error("aborted");
          abortError.name = "AbortError";
          reject(abortError);
        });
      });
    }) as unknown as typeof fetch;

    const { fetchApi } = await import("../lib/api/client");
    const pending = fetchApi("/api/v1/sessions", {
      signal: controller.signal,
      timeoutMs: 0,
    }).catch((err: unknown) => err);

    controller.abort();
    const error = await pending;

    expect(error).not.toBeInstanceOf(ApiClientError);
    expect((error as Error).name).toBe("AbortError");
  });
});

/** Small helper so each case reads as "this request fails". */
async function fetchApiCall(): Promise<unknown> {
  const { fetchApi } = await import("../lib/api/client");
  return fetchApi("/api/v1/sessions");
}
