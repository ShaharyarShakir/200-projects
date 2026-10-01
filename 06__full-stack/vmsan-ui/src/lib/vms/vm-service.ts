import { type ManagerClient, createManagerClient } from "../vmsan-manager/client";
import {
  ManagerProtocolError,
  ManagerRequestError,
  ManagerUnavailableError,
} from "../vmsan-manager/errors";
import type { VmCreateParams } from "../vmsan-manager/protocol";
import type { Vm, RemoveVmResult, ExecVmResult } from "./types";
import { validateVmId, validateCreateVmInput, validateVmExecInput } from "./validation";
import { toVmDto } from "./vm-mapper";
import {
  VmError,
  VmValidationError,
  VmNotFoundError,
  VmInvalidStateError,
  VmManagerUnavailableError,
  VmOperationFailedError,
} from "./vm-errors";

export interface VmServiceOptions {
  client?: ManagerClient;
}

/**
 * Application VM Service.
 *
 * Encapsulates all microVM business operations and acts as the single domain
 * abstraction over `ManagerClient`. Performs validation, parameter forwarding,
 * presentation mapping, and error translation without exposing host internals
 * or socket specifics to route handlers.
 */
export class VmService {
  private readonly client: ManagerClient;

  constructor(options: VmServiceOptions = {}) {
    this.client = options.client ?? createManagerClient();
  }

  private mapError(error: unknown, vmId?: string): never {
    if (error instanceof VmError) {
      throw error;
    }

    if (error instanceof ManagerUnavailableError) {
      throw new VmManagerUnavailableError(error.message);
    }

    if (error instanceof ManagerProtocolError) {
      throw new VmOperationFailedError(error.message, "MANAGER_PROTOCOL_ERROR", 502);
    }

    if (error instanceof ManagerRequestError) {
      const code = error.managerCode;
      if (code === "VALIDATION_ERROR" || code === "INVALID_REQUEST") {
        throw new VmValidationError(error.message, "INVALID_REQUEST");
      }
      if (code === "VM_NOT_FOUND") {
        throw new VmNotFoundError(vmId ?? "", error.message);
      }
      if (
        code === "VM_INVALID_STATE" ||
        code === "INVALID_VM_STATE"
      ) {
        throw new VmInvalidStateError(error.message);
      }
      throw new VmOperationFailedError(error.message, code || "VM_OPERATION_FAILED", 500);
    }

    if (error instanceof Error) {
      const msg = error.message;
      if (
        msg.includes("ENOENT") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("EACCES") ||
        msg.includes("socket") ||
        msg.includes("connect") ||
        msg.includes("MANAGER_UNAVAILABLE") ||
        msg.includes("Manager socket") ||
        msg.includes("timed out")
      ) {
        throw new VmManagerUnavailableError("VM manager service is unavailable");
      }
      throw new VmOperationFailedError(msg, "INTERNAL_ERROR", 500);
    }

    throw new VmOperationFailedError("An unexpected error occurred", "INTERNAL_ERROR", 500);
  }

  /**
   * List all microVMs.
   */
  async listVms(): Promise<Vm[]> {
    try {
      const vms = await this.client.list();
      return vms.map((vm) => toVmDto(vm));
    } catch (error) {
      this.mapError(error);
    }
  }

  /**
   * Get a single microVM by ID.
   */
  async getVm(id: unknown): Promise<Vm> {
    const validatedId = validateVmId(id);
    try {
      const vms = await this.client.list();
      const vm = vms.find((v) => v.id === validatedId);
      if (!vm) {
        throw new VmNotFoundError(validatedId, `Virtual machine not found: ${validatedId}`);
      }
      return toVmDto(vm);
    } catch (error) {
      this.mapError(error, validatedId);
    }
  }

  /**
   * Create a new microVM.
   */
  async createVm(input: unknown = {}): Promise<Vm> {
    const validated = validateCreateVmInput(input);
    const params: VmCreateParams = {};

    if (validated.runtime !== undefined) {
      params.runtime = validated.runtime;
    }
    if (validated.vcpus !== undefined) {
      params.vcpus = validated.vcpus;
    }
    if (validated.memoryMib !== undefined) {
      params.memoryMib = validated.memoryMib;
    }
    if (validated.diskSizeGb !== undefined) {
      params.diskSizeGb = validated.diskSizeGb;
    }
    if (validated.networkPolicy !== undefined) {
      params.networkPolicy = validated.networkPolicy;
    }
    if (validated.timeoutMs !== undefined) {
      params.timeoutMs = validated.timeoutMs;
    }

    try {
      const managerVm = await this.client.createVm(
        Object.keys(params).length > 0 ? params : undefined
      );
      return toVmDto(managerVm);
    } catch (error) {
      this.mapError(error);
    }
  }

  /**
   * Start a microVM.
   */
  async startVm(id: unknown): Promise<Vm> {
    const validatedId = validateVmId(id);
    try {
      const managerVm = await this.client.startVm(validatedId);
      return toVmDto(managerVm);
    } catch (error) {
      this.mapError(error, validatedId);
    }
  }

  /**
   * Stop a microVM.
   */
  async stopVm(id: unknown): Promise<Vm> {
    const validatedId = validateVmId(id);
    try {
      const managerVm = await this.client.stopVm(validatedId);
      return toVmDto(managerVm);
    } catch (error) {
      this.mapError(error, validatedId);
    }
  }

  /**
   * Remove a microVM.
   */
  async removeVm(id: unknown): Promise<RemoveVmResult> {
    const validatedId = validateVmId(id);
    try {
      const result = await this.client.removeVm(validatedId);
      return {
        removed: result.removed,
        vmId: result.vmId,
      };
    } catch (error) {
      this.mapError(error, validatedId);
    }
  }

  /**
   * Execute a command inside a running microVM.
   */
  async execVm(id: unknown, input: unknown): Promise<ExecVmResult> {
    const validatedId = validateVmId(id);
    const validatedInput = validateVmExecInput(input);
    try {
      const result = await this.client.execVm({
        vmId: validatedId,
        command: validatedInput.command,
        timeoutMs: validatedInput.timeoutMs,
        workingDirectory: validatedInput.workingDirectory,
      });
      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
      };
    } catch (error) {
      this.mapError(error, validatedId);
    }
  }
}

/**
 * Factory function to create a new VmService instance.
 */
export function createVmService(options: VmServiceOptions = {}): VmService {
  return new VmService(options);
}
