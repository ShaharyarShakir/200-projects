export type VmErrorCode =
  | "INVALID_REQUEST"
  | "VALIDATION_ERROR"
  | "VM_NOT_FOUND"
  | "INVALID_VM_STATE"
  | "MANAGER_UNAVAILABLE"
  | "MANAGER_PROTOCOL_ERROR"
  | "VM_OPERATION_FAILED"
  | "VMSAN_COMMAND_FAILED"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export class VmError extends Error {
  readonly code: VmErrorCode | string;
  readonly statusCode: number;

  constructor(message: string, code: VmErrorCode | string = "INTERNAL_ERROR", statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }

  toResponse(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

export class VmValidationError extends VmError {
  constructor(message: string, code: VmErrorCode = "INVALID_REQUEST") {
    super(message, code, 400);
  }
}

export class VmNotFoundError extends VmError {
  readonly vmId: string;

  constructor(vmId: string, message?: string) {
    super(message || `VM '${vmId}' not found`, "VM_NOT_FOUND", 404);
    this.vmId = vmId;
  }
}

export class VmInvalidStateError extends VmError {
  constructor(message: string) {
    super(message, "INVALID_VM_STATE", 409);
  }
}

export class VmManagerUnavailableError extends VmError {
  constructor(message: string = "VM manager service is unavailable") {
    super(message, "MANAGER_UNAVAILABLE", 503);
  }
}

export class VmOperationFailedError extends VmError {
  constructor(message: string, code: VmErrorCode | string = "VMSAN_COMMAND_FAILED", statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Maps any error into a safe, uniform API error response with status code.
 * Ensures no sensitive internal host paths, socket paths, or stack traces leak.
 */
export function toApiErrorResponse(error: unknown): { status: number; body: ApiErrorResponse } {
  if (error instanceof VmError) {
    return {
      status: error.statusCode,
      body: error.toResponse(),
    };
  }

  const message = error instanceof Error ? error.message : String(error);

  // Check for socket / manager connection failures
  if (
    message.includes("ENOENT") ||
    message.includes("ECONNREFUSED") ||
    message.includes("EACCES") ||
    message.includes("socket") ||
    message.includes("connect") ||
    message.includes("MANAGER_UNAVAILABLE") ||
    message.includes("Manager socket") ||
    message.includes("timed out")
  ) {
    return {
      status: 503,
      body: {
        error: {
          code: "MANAGER_UNAVAILABLE",
          message: "VM manager service is unavailable",
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred",
      },
    },
  };
}
