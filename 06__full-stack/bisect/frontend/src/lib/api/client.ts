/**
 * A failure category the UI can branch on without reading an error string.
 *
 * Derived from the HTTP status rather than the backend's `code`, so it stays
 * meaningful for responses that never reach the API (a dropped connection, a
 * request that hung). The backend's own `code` is still available on
 * `ApiClientError.backendCode` when more detail is needed.
 */
export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "server"
  | "network"
  | "timeout";

const STATUS_TO_ERROR_CODE: Record<number, ApiErrorCode> = {
  400: "validation",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation",
};

/** Milliseconds before an in-flight request is abandoned. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export class ApiClientError extends Error {
  public status: number;
  public code: ApiErrorCode;
  /** The backend's own error code, e.g. `NotFoundError`. */
  public backendCode?: string;
  public details?: unknown;

  constructor(
    message: string,
    status: number = 500,
    details?: unknown,
    code?: ApiErrorCode,
    backendCode?: string
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code ?? statusToErrorCode(status);
    this.backendCode = backendCode;
    this.details = details;
  }
}

/**
 * Maps an HTTP status onto a stable error code.
 *
 * 4xx statuses that are not listed explicitly are the caller's fault and map to
 * `validation`; every 5xx is the server's, so it maps to `server`. Status 0 means
 * the request never produced a response at all.
 */
export function statusToErrorCode(status: number): ApiErrorCode {
  const mapped = STATUS_TO_ERROR_CODE[status];
  if (mapped) return mapped;
  if (status === 0) return "network";
  if (status >= 500) return "server";
  if (status >= 400) return "validation";
  return "server";
}

const TOKEN_KEY = "bisect_auth_token";
const RETURN_PATH_KEY = "bisect_auth_return_path";

export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

/**
 * Remembers where an unauthenticated visitor was headed.
 *
 * A 401 can arrive from any page, so the current path is recorded before the
 * session is torn down. Login reads it back to return the user to the page
 * they actually asked for instead of a generic landing page.
 */
export const returnPathStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(RETURN_PATH_KEY);
  },
  set: (path: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(RETURN_PATH_KEY, path);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RETURN_PATH_KEY);
  },
};

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FetchApiOptions extends RequestInit {
  /**
   * Milliseconds before the request is abandoned. Defaults to
   * `DEFAULT_REQUEST_TIMEOUT_MS`; pass 0 to disable.
   */
  timeoutMs?: number;
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, signal: callerSignal, ...init } =
    options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = tokenStorage.getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // An AbortController rather than a race on the fetch promise: aborting
  // actually releases the connection and stops the server doing work for a
  // response nobody will read, which a race would not.
  const controller = new AbortController();
  let timedOut = false;
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;

  // A caller may already be aborting on its own schedule (unmounting a view, a
  // superseded poll). Forwarding that into the same controller keeps one signal
  // for the request instead of dropping the caller's cancellation on the floor.
  const forwardCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", forwardCallerAbort, {
        once: true,
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
      // The frontend and API are on different ports, so requests are
      // cross-origin. Without this the `github_oauth_state` CSRF cookie set by
      // the login redirect never reaches the callback and every sign-in fails
      // with "Invalid or missing OAuth state parameter". Safe because the API
      // is same-site and the backend pins CORS to explicit origins with
      // allow_credentials, never a wildcard.
      credentials: "include",
    });
  } catch (err: unknown) {
    if (timedOut) {
      throw new ApiClientError(
        `Request timed out after ${timeoutMs}ms: ${endpoint}`,
        0,
        err,
        "timeout"
      );
    }
    // A caller-supplied signal aborting is not a network failure, so it is
    // re-thrown as-is and the caller handles it as a cancellation.
    if (isAbortError(err)) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiClientError(
      `Failed to communicate with backend: ${message}`,
      0,
      err,
      "network"
    );
  } finally {
    if (timer) clearTimeout(timer);
    // Detached unconditionally: the controller outlives this call, and leaving
    // a listener behind would retain this request for the caller's signal.
    callerSignal?.removeEventListener("abort", forwardCallerAbort);
  }

  if (response.status === 401) {
    // Record where the user was before the session is torn down, so login can
    // return them there.
    returnPathStorage.set(window.location.pathname);
    tokenStorage.clearToken();
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiClientError(
      "Authentication required or token expired",
      401,
      undefined,
      "unauthorized"
    );
  }

  let data: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: Request failed`;
    let backendCode: string | undefined;
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail
          .map((d: { msg?: string }) => d.msg || JSON.stringify(d))
          .join(", ");
      } else if (detail) {
        errorMessage = JSON.stringify(detail);
      }
      const code = (data as { code?: unknown }).code;
      if (typeof code === "string") {
        backendCode = code;
      }
    } else if (typeof data === "string" && data.trim().length > 0) {
      errorMessage = data;
    }

    throw new ApiClientError(
      errorMessage,
      response.status,
      data,
      undefined,
      backendCode
    );
  }

  return data as T;
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: unknown }).name === "AbortError"
  );
}
