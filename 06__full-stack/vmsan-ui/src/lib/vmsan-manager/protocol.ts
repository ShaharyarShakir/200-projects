/**
 * Protocol contract shared with the unprivileged web application.
 *
 * These types are re-declared rather than imported from the manager package.
 * A cross-package import would pull the manager's `tsconfig` (no DOM, no
 * React) and its `vmsan` dependency into the Next.js build. The duplication is
 * deliberate and `src/lib/vmsan-manager/__tests__/protocol-sync.test.ts`
 * fails if the two declarations drift apart.
 */

export type ManagerMethod = "health" | "list";

/**
 * Runtime list of methods, so the client can check a frame it did not build
 * itself. Kept in step with the manager's `MANAGER_METHODS` by the sync test.
 */
export const MANAGER_METHODS: readonly ManagerMethod[] = ["health", "list"];

export interface HealthRequest {
  id: string;
  method: "health";
}

export interface ListRequest {
  id: string;
  method: "list";
}

export type ManagerRequest = HealthRequest | ListRequest;

export interface HealthResult {
  status: "ok";
}

export interface ManagerVm {
  id: string;
  status: string;
  runtime: string;
  vcpuCount: number;
  memSizeMib: number;
  createdAt: string;
  snapshot: string | null;
  timeoutAt: string | null;
  tunnelHostnames: string[];
}

export interface ListResult {
  vms: ManagerVm[];
}

export interface ManagerResultMap {
  health: HealthResult;
  list: ListResult;
}

export type ManagerErrorCode =
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "UNKNOWN_METHOD"
  | "REQUEST_TOO_LARGE"
  | "INVALID_FRAME"
  | "SHUTTING_DOWN"
  | "INTERNAL_ERROR";

/**
 * Runtime list of error codes.
 *
 * The manager and this app ship together, so a code the manager can emit that
 * is not on this list means the two are out of step. Failing loudly beats
 * passing an unrecognized code through to a route that would map it blindly.
 */
export const MANAGER_ERROR_CODES: readonly ManagerErrorCode[] = [
  "INVALID_JSON",
  "INVALID_REQUEST",
  "UNKNOWN_METHOD",
  "REQUEST_TOO_LARGE",
  "INVALID_FRAME",
  "SHUTTING_DOWN",
  "INTERNAL_ERROR",
];

export function isManagerErrorCode(value: unknown): value is ManagerErrorCode {
  return (
    typeof value === "string" &&
    (MANAGER_ERROR_CODES as readonly string[]).includes(value)
  );
}

export interface ManagerSuccess<T> {
  id: string;
  ok: true;
  result: T;
}

export interface ManagerFailure {
  id: string;
  ok: false;
  error: {
    code: ManagerErrorCode;
    message: string;
  };
}

export type ManagerResponse<T> = ManagerSuccess<T> | ManagerFailure;

export function isManagerSuccess<T>(
  response: ManagerResponse<T>
): response is ManagerSuccess<T> {
  return response.ok === true;
}

export function isManagerFailure<T>(
  response: ManagerResponse<T>
): response is ManagerFailure {
  return response.ok === false;
}

/** Runtime guard: a frame is a manager response only if its shape matches. */
export function isManagerResponse(value: unknown): value is ManagerResponse<unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string") {
    return false;
  }
  if (candidate.ok === true) {
    return "result" in candidate;
  }
  if (candidate.ok === false) {
    const error = candidate.error;
    if (error === null || typeof error !== "object") {
      return false;
    }
    const fields = error as Record<string, unknown>;
    return isManagerErrorCode(fields.code) && typeof fields.message === "string";
  }
  return false;
}

/** Runtime guard for the `list` result, so a malformed payload is typed out. */
export function isListResult(value: unknown): value is ListResult {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.vms)) {
    return false;
  }
  return candidate.vms.every((vm) => {
    if (vm === null || typeof vm !== "object") {
      return false;
    }
    const entry = vm as Record<string, unknown>;
    return (
      typeof entry.id === "string" &&
      typeof entry.status === "string" &&
      typeof entry.runtime === "string" &&
      typeof entry.vcpuCount === "number" &&
      typeof entry.memSizeMib === "number" &&
      typeof entry.createdAt === "string"
    );
  });
}
