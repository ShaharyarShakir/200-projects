import type { ManagerVm } from "./protocol";
import type { VM, VMStatus } from "@/lib/vmsan/types";

/**
 * Map a manager VM record onto the shape the dashboard already consumes.
 *
 * The manager projects a fixed, allow-listed set of fields, so this is a rename
 * rather than a parse. Doing it in one place keeps `/api/vms` independent of
 * how the records are sourced: a future lifecycle RPC will return the same
 * `ManagerVm` and this mapping stays as it is.
 *
 * Status is the one field that needs interpretation. vmsan reports intermediate
 * states the dashboard has no badge for, and the existing adapter already
 * collapsed anything unrecognised to "unknown" rather than guessing.
 */
function normalizeStatus(status: string): VMStatus {
  const value = status.toLowerCase().trim();
  if (value === "running" || value === "active") {
    return "running";
  }
  if (value === "stopped" || value === "inactive") {
    return "stopped";
  }
  return "unknown";
}

/**
 * Render how long ago a VM was created, e.g. `2m` or `3d`.
 *
 * The dashboard displays this as a label, so the raw ISO timestamp the manager
 * sends would be a regression in the UI. An unparseable or future timestamp
 * returns null rather than a wrong duration.
 */
export function formatAge(createdAt: string, now: number = Date.now()): string | null {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) {
    return null;
  }

  const elapsedSeconds = Math.floor((now - created) / 1000);
  if (elapsedSeconds < 0) {
    return null;
  }
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`;
  }
  if (elapsedSeconds < 3600) {
    return `${Math.floor(elapsedSeconds / 60)}m`;
  }
  if (elapsedSeconds < 86400) {
    return `${Math.floor(elapsedSeconds / 3600)}h`;
  }
  return `${Math.floor(elapsedSeconds / 86400)}d`;
}

export function toVm(vm: ManagerVm, now: number = Date.now()): VM {
  return {
    id: vm.id,
    status: normalizeStatus(vm.status),
    memoryMiB: vm.memSizeMib,
    vcpus: vm.vcpuCount,
    runtime: vm.runtime,
    age: formatAge(vm.createdAt, now),
  };
}
