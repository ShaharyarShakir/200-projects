export type ManagerMethod =
  | "health"
  | "list"
  | "vm.create"
  | "vm.start"
  | "vm.stop"
  | "vm.remove";

export const MANAGER_METHODS: readonly ManagerMethod[] = [
  "health",
  "list",
  "vm.create",
  "vm.start",
  "vm.stop",
  "vm.remove",
];

export const VALID_RUNTIMES = ["base", "node22", "node24", "python3.13"] as const;
export type RuntimeOption = (typeof VALID_RUNTIMES)[number];

export const VALID_NETWORK_POLICIES = ["allow-all", "deny-all", "custom"] as const;
export type NetworkPolicyOption = (typeof VALID_NETWORK_POLICIES)[number];

export interface VmCreateParams {
  runtime?: RuntimeOption;
  vcpus?: number;
  memoryMib?: number;
  diskSizeGb?: number;
  networkPolicy?: NetworkPolicyOption;
  timeoutMs?: number;
}

export interface VmIdParams {
  vmId: string;
}

export type VmStartParams = VmIdParams;
export type VmStopParams = VmIdParams;
export type VmRemoveParams = VmIdParams;

export interface HealthRequest {
  id: string;
  method: "health";
}

export interface ListRequest {
  id: string;
  method: "list";
}

export interface VmCreateRequest {
  id: string;
  method: "vm.create";
  params?: VmCreateParams;
}

export interface VmStartRequest {
  id: string;
  method: "vm.start";
  params: VmStartParams;
}

export interface VmStopRequest {
  id: string;
  method: "vm.stop";
  params: VmStopParams;
}

export interface VmRemoveRequest {
  id: string;
  method: "vm.remove";
  params: VmRemoveParams;
}

export type ManagerRequest =
  | HealthRequest
  | ListRequest
  | VmCreateRequest
  | VmStartRequest
  | VmStopRequest
  | VmRemoveRequest;

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

export type VmCreateResult = ProtocolVm;
export type VmStartResult = ProtocolVm;
export type VmStopResult = ProtocolVm;

export interface VmRemoveResult {
  removed: true;
  vmId: string;
}

export interface ManagerResultMap {
  health: HealthResult;
  list: ListResult;
  "vm.create": VmCreateResult;
  "vm.start": VmStartResult;
  "vm.stop": VmStopResult;
  "vm.remove": VmRemoveResult;
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
  | "VALIDATION_ERROR"
  | "VM_NOT_FOUND"
  | "VM_INVALID_STATE"
  | "VM_OPERATION_FAILED"
  | "UNKNOWN_METHOD"
  | "REQUEST_TOO_LARGE"
  | "INVALID_FRAME"
  | "SHUTTING_DOWN"
  | "INTERNAL_ERROR";

export const MANAGER_ERROR_CODES: readonly ManagerErrorCode[] = [
  "INVALID_JSON",
  "INVALID_REQUEST",
  "VALIDATION_ERROR",
  "VM_NOT_FOUND",
  "VM_INVALID_STATE",
  "VM_OPERATION_FAILED",
  "UNKNOWN_METHOD",
  "REQUEST_TOO_LARGE",
  "INVALID_FRAME",
  "SHUTTING_DOWN",
  "INTERNAL_ERROR",
];

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
    (MANAGER_ERROR_CODES as readonly string[]).includes(value as ManagerErrorCode)
  );
}

/**
 * Check that a value is a well-formed response frame.
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
  return candidate.vms.every((vm) => isProtocolVm(vm));
}

/** Runtime guard for a single ProtocolVm */
export function isProtocolVm(value: unknown): value is ProtocolVm {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.status === "string" &&
    typeof entry.runtime === "string" &&
    typeof entry.vcpuCount === "number" &&
    typeof entry.memSizeMib === "number" &&
    typeof entry.createdAt === "string" &&
    (entry.snapshot === null || typeof entry.snapshot === "string") &&
    (entry.timeoutAt === null || typeof entry.timeoutAt === "string") &&
    Array.isArray(entry.tunnelHostnames) &&
    entry.tunnelHostnames.every((h) => typeof h === "string")
  );
}

/** Runtime guard for VmRemoveResult */
export function isVmRemoveResult(value: unknown): value is VmRemoveResult {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return entry.removed === true && typeof entry.vmId === "string";
}

export function validateVmCreateParams(
  params: unknown
): { ok: true; value: VmCreateParams } | { ok: false; message: string } {
  if (params === undefined || params === null) {
    return { ok: true, value: {} };
  }
  if (typeof params !== "object" || Array.isArray(params)) {
    return { ok: false, message: 'Creation "params" must be a JSON object' };
  }

  const p = params as Record<string, unknown>;
  const result: VmCreateParams = {};

  if (p.vcpus !== undefined) {
    if (typeof p.vcpus !== "number" || !Number.isInteger(p.vcpus) || p.vcpus < 1 || p.vcpus > 4) {
      return { ok: false, message: 'Field "vcpus" must be an integer between 1 and 4' };
    }
    result.vcpus = p.vcpus;
  }

  if (p.memoryMib !== undefined) {
    if (
      typeof p.memoryMib !== "number" ||
      !Number.isInteger(p.memoryMib) ||
      p.memoryMib < 64 ||
      p.memoryMib > 4096
    ) {
      return { ok: false, message: 'Field "memoryMib" must be an integer between 64 and 4096' };
    }
    result.memoryMib = p.memoryMib;
  }

  if (p.diskSizeGb !== undefined) {
    if (
      typeof p.diskSizeGb !== "number" ||
      !Number.isInteger(p.diskSizeGb) ||
      p.diskSizeGb < 1 ||
      p.diskSizeGb > 20
    ) {
      return { ok: false, message: 'Field "diskSizeGb" must be an integer between 1 and 20' };
    }
    result.diskSizeGb = p.diskSizeGb;
  }

  if (p.runtime !== undefined) {
    if (typeof p.runtime !== "string" || !(VALID_RUNTIMES as readonly string[]).includes(p.runtime)) {
      return {
        ok: false,
        message: `Field "runtime" must be one of: ${VALID_RUNTIMES.join(", ")}`,
      };
    }
    result.runtime = p.runtime as RuntimeOption;
  }

  if (p.networkPolicy !== undefined) {
    if (
      typeof p.networkPolicy !== "string" ||
      !(VALID_NETWORK_POLICIES as readonly string[]).includes(p.networkPolicy)
    ) {
      return {
        ok: false,
        message: `Field "networkPolicy" must be one of: ${VALID_NETWORK_POLICIES.join(", ")}`,
      };
    }
    result.networkPolicy = p.networkPolicy as NetworkPolicyOption;
  }

  if (p.timeoutMs !== undefined) {
    if (
      typeof p.timeoutMs !== "number" ||
      !Number.isInteger(p.timeoutMs) ||
      p.timeoutMs < 60000 ||
      p.timeoutMs > 86400000
    ) {
      return {
        ok: false,
        message: 'Field "timeoutMs" must be an integer between 60000 and 86400000',
      };
    }
    result.timeoutMs = p.timeoutMs;
  }

  return { ok: true, value: result };
}

export function validateVmIdParams(
  params: unknown
): { ok: true; value: VmIdParams } | { ok: false; message: string } {
  if (params === undefined || params === null || typeof params !== "object" || Array.isArray(params)) {
    return { ok: false, message: 'Request "params" must be a JSON object containing "vmId"' };
  }

  const p = params as Record<string, unknown>;
  if (typeof p.vmId !== "string" || p.vmId.trim().length === 0) {
    return { ok: false, message: 'Field "vmId" must be a non-empty string' };
  }

  const vmId = p.vmId.trim();
  if (vmId.length > 128 || !/^[a-zA-Z0-9_-]+$/.test(vmId)) {
    return {
      ok: false,
      message: 'Field "vmId" contains invalid characters (must match ^[a-zA-Z0-9_-]+$)',
    };
  }

  return { ok: true, value: { vmId } };
}

export type FrameResult =
  | { ok: true; request: ManagerRequest }
  | { ok: false; id: string; code: ManagerErrorCode; message: string };

/**
 * Extract a usable request id from an already-parsed payload.
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

  if (method === "health") {
    return { ok: true, request: { id, method: "health" } };
  }

  if (method === "list") {
    return { ok: true, request: { id, method: "list" } };
  }

  if (method === "vm.create") {
    const validation = validateVmCreateParams((payload as Record<string, unknown>).params);
    if (!validation.ok) {
      return {
        ok: false,
        id,
        code: "VALIDATION_ERROR",
        message: validation.message,
      };
    }
    return {
      ok: true,
      request: { id, method: "vm.create", params: validation.value },
    };
  }

  if (method === "vm.start" || method === "vm.stop" || method === "vm.remove") {
    const validation = validateVmIdParams((payload as Record<string, unknown>).params);
    if (!validation.ok) {
      return {
        ok: false,
        id,
        code: "VALIDATION_ERROR",
        message: validation.message,
      };
    }
    return {
      ok: true,
      request: { id, method, params: validation.value },
    };
  }

  return {
    ok: false,
    id,
    code: "UNKNOWN_METHOD",
    message: `Unknown method "${sanitizeForMessage(method)}"`,
  };
}

const CONTROL_CHARS = /[\r\n\t]+/g;

/**
 * Strip control characters and cap the length of a value echoed back in an
 * error message.
 */
export function sanitizeForMessage(value: string): string {
  const cleaned = value.replace(CONTROL_CHARS, " ").trim();
  return cleaned.length > 64 ? `${cleaned.slice(0, 64)}...` : cleaned;
}
