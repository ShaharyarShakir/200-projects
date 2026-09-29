export type ManagerMethod = "health" | "list";

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

export interface ProtocolVm {
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
  vms: ProtocolVm[];
}

export interface ManagerResultMap {
  health: HealthResult;
  list: ListResult;
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

export type ManagerResponse<T> = ManagerSuccess<T> | ManagerResponseFailure;

export type ManagerErrorCode =
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "UNKNOWN_METHOD"
  | "REQUEST_TOO_LARGE"
  | "INVALID_FRAME"
  | "SHUTTING_DOWN"
  | "INTERNAL_ERROR";

export const MANAGER_ERROR_CODES: readonly ManagerErrorCode[] = [
  "INVALID_JSON",
  "INVALID_REQUEST",
  "UNKNOWN_METHOD",
  "REQUEST_TOO_LARGE",
  "INVALID_FRAME",
  "SHUTTING_DOWN",
  "INTERNAL_ERROR",
];

export const MANAGER_METHODS: readonly ManagerMethod[] = ["health", "list"];

const MAX_ID_LENGTH = 128;

export function success<T>(id: string, result: T): ManagerSuccess<T> {
  return { id, ok: true, result };
}

export function failure(
  id: string,
  code: ManagerErrorCode,
  message: string
): ManagerResponseFailure {
  return { id, ok: false, error: { code, message } };
}

export type ManagerResponseFailure = ManagerFailure;

export function isManagerSuccess<T>(
  response: ManagerResponse<T>
): response is ManagerSuccess<T> {
  return response.ok === true;
}

export function isManagerFailure<T>(
  response: ManagerResponse<T>
): response is ManagerResponseFailure {
  return response.ok === false;
}

export function isManagerErrorCode(value: unknown): value is ManagerErrorCode {
  return (
    typeof value === "string" &&
    (MANAGER_ERROR_CODES as readonly string[]).includes(value)
  );
}

/**
 * Check that a value is a well-formed response frame.
 *
 * The manager normally builds its own frames, so this exists for the sync test
 * and for tests that assert a frame really is safe to hand to a client. The
 * client declares the mirror of this guard independently; the two must agree.
 */
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

/** Mirror of the client's `isListResult`; the two must agree. */
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

export type FrameResult =
  | { ok: true; request: ManagerRequest }
  | { ok: false; id: string; code: ManagerErrorCode; message: string };

/**
 * Extract a usable request id from an already-parsed payload.
 *
 * A payload with no usable id is still reported with a synthetic id so the
 * client can still correlate the failure, but the caller treats that as a
 * validation failure regardless of what the id says.
 */
function extractId(payload: unknown): string | null {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const id = (payload as Record<string, unknown>).id;
  if (typeof id !== "string") {
    return null;
  }
  if (id.length === 0 || id.length > MAX_ID_LENGTH) {
    return null;
  }
  return id;
}

/**
 * Validate one newline-delimited frame before any method dispatch happens.
 *
 * Every rejection returns a structured error rather than throwing, so the
 * connection handler can answer the frame and keep serving.
 */
export function validateFrame(raw: string, maxRequestBytes: number): FrameResult {
  const byteLength = Buffer.byteLength(raw, "utf8");
  if (byteLength > maxRequestBytes) {
    return {
      ok: false,
      id: "unknown",
      code: "REQUEST_TOO_LARGE",
      message: `Request frame of ${byteLength} bytes exceeds the maximum of ${maxRequestBytes}`,
    };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      id: "unknown",
      code: "INVALID_FRAME",
      message: "Empty request frame",
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      id: "unknown",
      code: "INVALID_JSON",
      message: "Request frame is not valid JSON",
    };
  }

  const id = extractId(payload);
  if (id === null) {
    return {
      ok: false,
      id: "unknown",
      code: "INVALID_REQUEST",
      message: `Request must be a JSON object with a string "id" of 1-${MAX_ID_LENGTH} characters`,
    };
  }

  const method = (payload as Record<string, unknown>).method;
  if (typeof method !== "string") {
    return {
      ok: false,
      id,
      code: "INVALID_REQUEST",
      message: 'Request must include a string "method"',
    };
  }

  if (method !== "health" && method !== "list") {
    return {
      ok: false,
      id,
      code: "UNKNOWN_METHOD",
      message: `Unknown method "${sanitizeForMessage(method)}"`,
    };
  }

  return { ok: true, request: { id, method } as ManagerRequest };
}

const CONTROL_CHARS = /[\r\n\t]+/g;

/**
 * Strip control characters and cap the length of a value echoed back in an
 * error message, so a hostile `method` value cannot forge extra log lines or
 * blow up a response.
 */
export function sanitizeForMessage(value: string): string {
  const cleaned = value.replace(CONTROL_CHARS, " ").trim();
  return cleaned.length > 64 ? `${cleaned.slice(0, 64)}...` : cleaned;
}
