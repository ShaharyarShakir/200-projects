import type { ManagerVm } from "../vmsan-manager/protocol";
import type { Vm, VmStatus, VmNetwork, NetworkPolicy } from "./types";

/**
 * Normalizes manager status strings into application VmStatus enum.
 */
export function normalizeVmStatus(status: string): VmStatus {
  const value = status.toLowerCase().trim();
  switch (value) {
    case "creating":
      return "creating";
    case "running":
    case "active":
      return "running";
    case "stopped":
    case "inactive":
      return "stopped";
    case "stopping":
      return "stopping";
    case "starting":
      return "starting";
    case "error":
    case "failed":
      return "error";
    default:
      return "unknown";
  }
}

/**
 * Render how long ago a VM was created, e.g. `2m` or `3d`.
 * Returns null for unparseable or future timestamps.
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

/**
 * Safely maps network information into application VmNetwork,
 * stripping internal TAP device details or host namespace paths.
 */
export function toVmNetwork(network: unknown): VmNetwork | undefined {
  if (!network || typeof network !== "object" || Array.isArray(network)) {
    return undefined;
  }

  const raw = network as Record<string, unknown>;
  const net: VmNetwork = {};

  if (
    typeof raw.policy === "string" &&
    (raw.policy === "allow-all" || raw.policy === "deny-all" || raw.policy === "custom")
  ) {
    net.policy = raw.policy as NetworkPolicy;
  }

  if (typeof raw.address === "string" && raw.address.trim()) {
    net.address = raw.address.trim();
  }

  if (Array.isArray(raw.publishedPorts)) {
    const validPorts = raw.publishedPorts.filter(
      (port): port is number => typeof port === "number" && Number.isInteger(port) && port >= 1 && port <= 65535
    );
    if (validPorts.length > 0) {
      net.publishedPorts = validPorts;
    }
  }

  return Object.keys(net).length > 0 ? net : undefined;
}

/**
 * Converts a manager VM record or raw object into a sanitized application `Vm` DTO.
 * Explicitly constructs the DTO with allow-listed properties only, stripping
 * sensitive host internals (`agentToken`, TAP interfaces, host paths, Jailer paths, PIDs).
 */
export function toVmDto(vm: ManagerVm | Record<string, unknown>, now: number = Date.now()): Vm {
  const raw = vm as Record<string, unknown>;

  const id = typeof raw.id === "string" ? raw.id : "";
  const runtime = typeof raw.runtime === "string" ? raw.runtime : "base";
  const rawStatus = typeof raw.status === "string" ? raw.status : "unknown";
  const status = normalizeVmStatus(rawStatus);

  const vcpus =
    typeof raw.vcpuCount === "number"
      ? raw.vcpuCount
      : typeof raw.vcpus === "number"
        ? raw.vcpus
        : 1;

  const memoryMib =
    typeof raw.memSizeMib === "number"
      ? raw.memSizeMib
      : typeof raw.memoryMib === "number"
        ? raw.memoryMib
        : typeof raw.memoryMiB === "number"
          ? raw.memoryMiB
          : 128;

  const diskSizeGb =
    typeof raw.diskSizeGb === "number"
      ? raw.diskSizeGb
      : 1;

  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : undefined;
  const age = createdAt ? formatAge(createdAt, now) : null;
  const network = toVmNetwork(raw.network);

  const dto: Vm = {
    id,
    runtime,
    status,
    vcpus,
    memoryMib,
    memoryMiB: memoryMib,
    diskSizeGb,
  };

  if (createdAt !== undefined) {
    dto.createdAt = createdAt;
  }
  if (age !== null && age !== undefined) {
    dto.age = age;
  }
  if (network !== undefined) {
    dto.network = network;
  }

  return dto;
}
