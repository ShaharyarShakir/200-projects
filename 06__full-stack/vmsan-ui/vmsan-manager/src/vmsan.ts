import type { VMService, VmsanOptions, VmState } from "vmsan";
import type { ProtocolVm } from "./protocol.js";
import type { ManagerConfig } from "./config.js";

/**
 * The slice of the native vmsan `VMService` this phase actually needs.
 *
 * Narrowing to `list` keeps the seam small: tests supply an object with one
 * method, and the manager cannot accidentally reach `create`/`stop`/`remove`
 * through a typed handle in this phase.
 */
export type VmsanService = Pick<VMService, "list">;

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
 * Read VM inventory from the native service and redact it for the protocol.
 *
 * The underlying `list()` is synchronous in vmsan 0.3.0; this stays async so
 * callers are uniform and a future async `list` needs no call-site change.
 */
export async function listVms(service: VmsanService): Promise<ProtocolVm[]> {
  const states = service.list();
  return states.map(toProtocolVm);
}
