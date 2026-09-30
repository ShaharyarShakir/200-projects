import { SupportedRuntime, NetworkPolicy, CreateVmInput } from "./types";
import { VmValidationError } from "./vm-errors";

export const VM_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export const SUPPORTED_RUNTIMES: readonly SupportedRuntime[] = [
  "base",
  "node22",
  "node24",
  "python3.13",
] as const;

export const SUPPORTED_NETWORK_POLICIES: readonly NetworkPolicy[] = [
  "allow-all",
  "deny-all",
  "custom",
] as const;

export const RESOURCE_LIMITS = {
  vcpus: { min: 1, max: 32 },
  memoryMib: { min: 128, max: 32768 },
  diskSizeGb: { min: 1, max: 500 },
  timeoutMs: { min: 0, max: 86400000 }, // up to 24h
} as const;

/**
 * Validates a VM identifier string.
 * Strictly prevents command injection sequences, path traversal, and disallowed characters.
 *
 * @throws {VmValidationError} if the ID is invalid
 */
export function validateVmId(id: unknown): string {
  if (typeof id !== "string") {
    throw new VmValidationError("Invalid VM ID: must be a string");
  }

  const trimmed = id.trim();
  if (!trimmed) {
    throw new VmValidationError("Invalid VM ID: cannot be empty");
  }

  if (trimmed.length > 64) {
    throw new VmValidationError("Invalid VM ID: cannot exceed 64 characters");
  }

  if (!VM_ID_REGEX.test(trimmed)) {
    throw new VmValidationError(
      "Invalid VM ID: must contain only alphanumeric characters, dashes, and underscores (1-64 chars)"
    );
  }

  return trimmed;
}

/**
 * Validates and sanitizes VM creation parameters.
 * Strips any disallowed or extra properties (such as shell commands or arbitrary flags).
 *
 * @throws {VmValidationError} if any parameter violates validation rules
 */
export function validateCreateVmInput(input: unknown): CreateVmInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VmValidationError("Invalid request body: expected a JSON object");
  }

  const raw = input as Record<string, unknown>;
  const validated: CreateVmInput = {};

  // Validate runtime
  if (raw.runtime !== undefined && raw.runtime !== null) {
    if (typeof raw.runtime !== "string" || !SUPPORTED_RUNTIMES.includes(raw.runtime as SupportedRuntime)) {
      throw new VmValidationError(
        `Invalid runtime '${String(raw.runtime)}'. Supported runtimes: ${SUPPORTED_RUNTIMES.join(", ")}`
      );
    }
    validated.runtime = raw.runtime as SupportedRuntime;
  }

  // Validate vcpus
  if (raw.vcpus !== undefined && raw.vcpus !== null) {
    if (
      typeof raw.vcpus !== "number" ||
      !Number.isInteger(raw.vcpus) ||
      raw.vcpus < RESOURCE_LIMITS.vcpus.min ||
      raw.vcpus > RESOURCE_LIMITS.vcpus.max
    ) {
      throw new VmValidationError(
        `vCPUs must be an integer between ${RESOURCE_LIMITS.vcpus.min} and ${RESOURCE_LIMITS.vcpus.max}`
      );
    }
    validated.vcpus = raw.vcpus;
  }

  // Validate memory (support both memoryMib and memoryMiB for backward compatibility)
  const memoryValue = raw.memoryMib !== undefined ? raw.memoryMib : raw.memoryMiB;
  if (memoryValue !== undefined && memoryValue !== null) {
    if (
      typeof memoryValue !== "number" ||
      !Number.isInteger(memoryValue) ||
      memoryValue < RESOURCE_LIMITS.memoryMib.min ||
      memoryValue > RESOURCE_LIMITS.memoryMib.max
    ) {
      throw new VmValidationError(
        `memoryMiB must be an integer of at least ${RESOURCE_LIMITS.memoryMib.min} (between ${RESOURCE_LIMITS.memoryMib.min} and ${RESOURCE_LIMITS.memoryMib.max} MiB)`
      );
    }
    validated.memoryMib = memoryValue;
  }

  // Validate diskSizeGb
  if (raw.diskSizeGb !== undefined && raw.diskSizeGb !== null) {
    if (
      typeof raw.diskSizeGb !== "number" ||
      !Number.isInteger(raw.diskSizeGb) ||
      raw.diskSizeGb < RESOURCE_LIMITS.diskSizeGb.min ||
      raw.diskSizeGb > RESOURCE_LIMITS.diskSizeGb.max
    ) {
      throw new VmValidationError(
        `diskSizeGb must be an integer between ${RESOURCE_LIMITS.diskSizeGb.min} and ${RESOURCE_LIMITS.diskSizeGb.max} GB`
      );
    }
    validated.diskSizeGb = raw.diskSizeGb;
  }

  // Validate networkPolicy
  if (raw.networkPolicy !== undefined && raw.networkPolicy !== null) {
    if (
      typeof raw.networkPolicy !== "string" ||
      !SUPPORTED_NETWORK_POLICIES.includes(raw.networkPolicy as NetworkPolicy)
    ) {
      throw new VmValidationError(
        `Invalid network policy '${String(raw.networkPolicy)}'. Supported policies: ${SUPPORTED_NETWORK_POLICIES.join(", ")}`
      );
    }
    validated.networkPolicy = raw.networkPolicy as NetworkPolicy;
  }

  // Validate timeoutMs
  if (raw.timeoutMs !== undefined && raw.timeoutMs !== null) {
    if (
      typeof raw.timeoutMs !== "number" ||
      !Number.isInteger(raw.timeoutMs) ||
      raw.timeoutMs < RESOURCE_LIMITS.timeoutMs.min ||
      raw.timeoutMs > RESOURCE_LIMITS.timeoutMs.max
    ) {
      throw new VmValidationError(
        `timeoutMs must be an integer between ${RESOURCE_LIMITS.timeoutMs.min} and ${RESOURCE_LIMITS.timeoutMs.max}`
      );
    }
    validated.timeoutMs = raw.timeoutMs;
  }

  return validated;
}
