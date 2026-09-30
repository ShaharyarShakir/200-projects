/**
 * Protocol contract shared with the unprivileged web application.
 *
 * These types are re-declared rather than imported from the manager package.
 * A cross-package import would pull the manager's `tsconfig` (no DOM, no
 * React) and its `vmsan` dependency into the Next.js build. The duplication is
 * deliberate and `src/lib/vmsan-manager/__tests__/protocol-sync.test.ts`
 * fails if the two declarations drift apart.
 */

export type ManagerMethod =
  | "health"
  | "list"
  | "vm.create"
  | "vm.start"
  | "vm.stop"
  | "vm.remove";

/**
 * Runtime list of methods, so the client can check a frame it did not build
 * itself. Kept in step with the manager's `MANAGER_METHODS` by the sync test.
 */
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

export type VmCreateResult = ManagerVm;
export type VmStartResult = ManagerVm;
export type VmStopResult = ManagerVm;

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

export function isManagerErrorCode(value: unknown): value is ManagerErrorCode {
  return (
    typeof value === "string" &&
    (MANAGER_ERROR_CODES as readonly string[]).includes(value as ManagerErrorCode)
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

/** Runtime guard for ManagerVm */
export function isManagerVm(value: unknown): value is ManagerVm {
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

/** Runtime guard for the `list` result, so a malformed payload is typed out. */
export function isListResult(value: unknown): value is ListResult {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.vms)) {
    return false;
  }
  return candidate.vms.every((vm) => isManagerVm(vm));
}

/** Runtime guard for VmRemoveResult */
export function isVmRemoveResult(value: unknown): value is VmRemoveResult {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return entry.removed === true && typeof entry.vmId === "string";
}
