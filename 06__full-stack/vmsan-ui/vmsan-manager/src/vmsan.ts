import type {
  VMService,
  VmsanOptions,
  VmState,
  CreateVmOptions,
} from "vmsan";
import {
  isManagerErrorCode,
  sanitizeForMessage,
  type ManagerErrorCode,
  type ProtocolVm,
  type VmCreateParams,
  type VmRemoveResult,
} from "./protocol.js";
import type { ManagerConfig } from "./config.js";

/**
 * The slice of the native vmsan `VMService` the manager uses.
 *
 * Narrowed to only the lifecycle methods the manager requires, so test doubles
 * can be lightweight and explicit.
 */
export type VmsanService = Pick<
  VMService,
  "list" | "get" | "create" | "start" | "stop" | "remove"
>;

type VmsanInitOptions = Pick<VmsanOptions, "paths">;

export type VmsanFactory = (options: VmsanInitOptions) => Promise<VmsanService>;

/**
 * The production factory.
 *
 * `vmsan` is imported dynamically so that a test which only exercises the pure
 * projection helpers never loads the native package. The static type-only
 * imports above are erased at compile time.
 */
export const realVmsanFactory: VmsanFactory = async (options) => {
  const { createVmsan } = await import("vmsan");
  return createVmsan(options);
};

/**
 * Initialize the single native vmsan service for this process.
 *
 * The explicit `paths` option matters more than it looks: vmsan's own
 * `vmsanPaths()` falls back to `$SUDO_USER` when it cannot read `$VMSAN_DIR`,
 * and this process runs as root. Passing the directory through explicitly means
 * the manager reads the location the operator configured rather than one
 * inferred from the invoking user.
 */
export function createVmsanService(
  config: ManagerConfig,
  factory: VmsanFactory = realVmsanFactory
): Promise<VmsanService> {
  return factory({ paths: config.vmsanDir });
}

/**
 * Project a native VM state record onto the manager protocol.
 *
 * This is an allow-list built field by field, so `agentToken` is absent by
 * construction: there is no code path that copies it, and host internals such
 * as `chrootDir`, `kernel`, `rootfs`, `apiSocket`, and `pid` are never read.
 */
export function toProtocolVm(state: VmState): ProtocolVm {
  return {
    id: state.id,
    status: state.status,
    runtime: state.runtime,
    vcpuCount: state.vcpuCount,
    memSizeMib: state.memSizeMib,
    createdAt: state.createdAt,
    snapshot: state.snapshot ?? null,
    timeoutAt: state.timeoutAt ?? null,
    tunnelHostnames: state.network?.tunnelHostnames ?? [],
  };
}

/**
 * Map native vmsan errors or unexpected exceptions into structured protocol error codes.
 */
export function categorizeVmsanError(
  error: unknown
): { code: ManagerErrorCode; message: string } {
  if (error === null || typeof error !== "object") {
    return {
      code: "INTERNAL_ERROR",
      message: "The manager could not complete this request",
    };
  }

  const err = error as { code?: unknown; message?: unknown; name?: unknown };
  const rawMessage = typeof err.message === "string" ? err.message : "An unexpected error occurred";
  const message = sanitizeForMessage(rawMessage);

  if (typeof err.code === "string") {
    if (isManagerErrorCode(err.code)) {
      return { code: err.code, message };
    }

    if (err.code === "ERR_VM_NOT_FOUND" || err.code === "ERR_VM_STATE_NOT_FOUND") {
      return { code: "VM_NOT_FOUND", message };
    }

    if (err.code === "ERR_VM_NOT_STOPPED" || err.code === "ERR_VM_NOT_RUNNING") {
      return { code: "VM_INVALID_STATE", message };
    }

    if (err.code.startsWith("ERR_VALIDATION_")) {
      return { code: "VALIDATION_ERROR", message };
    }

    if (
      err.code.startsWith("ERR_FIRECRACKER_") ||
      err.code.startsWith("ERR_TIMEOUT_") ||
      err.code.startsWith("ERR_SETUP_") ||
      err.code.startsWith("ERR_NETWORK_") ||
      err.code.startsWith("ERR_CLOUDFLARE_") ||
      err.code.startsWith("ERR_VM_")
    ) {
      return { code: "VM_OPERATION_FAILED", message };
    }
  }

  const lowerMsg = rawMessage.toLowerCase();
  if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist")) {
    return { code: "VM_NOT_FOUND", message };
  }
  if (
    lowerMsg.includes("not stopped") ||
    lowerMsg.includes("not running") ||
    lowerMsg.includes("already stopped") ||
    lowerMsg.includes("already running") ||
    lowerMsg.includes("invalid state")
  ) {
    return { code: "VM_INVALID_STATE", message };
  }
  if (lowerMsg.includes("invalid") || lowerMsg.includes("validation")) {
    return { code: "VALIDATION_ERROR", message };
  }

  return { code: "INTERNAL_ERROR", message: "The manager could not complete this request" };
}

/**
 * Read VM inventory from the native service and redact it for the protocol.
 */
export async function listVms(service: VmsanService): Promise<ProtocolVm[]> {
  const states = service.list();
  return states.map(toProtocolVm);
}

/**
 * Retrieve and redact a single VM's state.
 */
export async function getVm(service: VmsanService, vmId: string): Promise<ProtocolVm> {
  const state = service.get(vmId);
  if (!state) {
    const err = new Error(`VM not found: ${vmId}`);
    (err as { code?: string }).code = "ERR_VM_NOT_FOUND";
    throw err;
  }
  return toProtocolVm(state);
}

/**
 * Create a new microVM, mapping protocol parameters (`memoryMib` → `memMib`) to native options.
 */
export async function createVm(
  service: VmsanService,
  params?: VmCreateParams
): Promise<ProtocolVm> {
  const nativeOpts: CreateVmOptions = {};
  if (params?.runtime !== undefined) {
    nativeOpts.runtime = params.runtime;
  }
  if (params?.vcpus !== undefined) {
    nativeOpts.vcpus = params.vcpus;
  }
  if (params?.memoryMib !== undefined) {
    nativeOpts.memMib = params.memoryMib;
  }
  if (params?.diskSizeGb !== undefined) {
    nativeOpts.diskSizeGb = params.diskSizeGb;
  }
  if (params?.networkPolicy !== undefined) {
    nativeOpts.networkPolicy = params.networkPolicy;
  }
  if (params?.timeoutMs !== undefined) {
    nativeOpts.timeoutMs = params.timeoutMs;
  }

  const result = await service.create(nativeOpts);
  if (!result || !result.state) {
    throw new Error("VM creation returned empty state");
  }
  return toProtocolVm(result.state);
}

/**
 * Start a stopped microVM.
 */
export async function startVm(service: VmsanService, vmId: string): Promise<ProtocolVm> {
  const result = await service.start(vmId);
  if (!result.success) {
    throw result.error || new Error(`Failed to start VM ${vmId}`);
  }
  const state = result.state ?? service.get(vmId);
  if (!state) {
    throw new Error(`VM state not found after starting ${vmId}`);
  }
  return toProtocolVm(state);
}

/**
 * Stop a running microVM.
 */
export async function stopVm(service: VmsanService, vmId: string): Promise<ProtocolVm> {
  const result = await service.stop(vmId);
  if (!result.success) {
    throw result.error || new Error(`Failed to stop VM ${vmId}`);
  }
  if (result.alreadyStopped) {
    const err = new Error(`VM ${vmId} is already stopped`);
    (err as { code?: string }).code = "ERR_VM_NOT_RUNNING";
    throw err;
  }
  const state = service.get(vmId);
  if (!state) {
    throw new Error(`VM state not found after stopping ${vmId}`);
  }
  return toProtocolVm(state);
}

/**
 * Remove a stopped microVM.
 */
export async function removeVm(
  service: VmsanService,
  vmId: string
): Promise<VmRemoveResult> {
  const result = await service.remove(vmId);
  if (!result.success) {
    throw result.error || new Error(`Failed to remove VM ${vmId}`);
  }
  return { removed: true, vmId };
}
