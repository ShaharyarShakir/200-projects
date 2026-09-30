import { NextResponse } from "next/server";
import {
  ManagerProtocolError,
  ManagerRequestError,
  ManagerUnavailableError,
} from "@/lib/vmsan-manager/errors";
import {
  VMMetadataConflictError,
  VMMetadataValidationError,
} from "@/lib/vm-metadata";

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "VM_NOT_FOUND"
  | "INVALID_VM_STATE"
  | "OPERATION_CONFLICT"
  | "VM_NAME_ALREADY_EXISTS"
  | "MANAGER_UNAVAILABLE"
  | "MANAGER_PROTOCOL_ERROR"
  | "VMSAN_UNAVAILABLE"
  | "VMSAN_COMMAND_FAILED"
  | "VM_OPERATION_FAILED"
  | "INTERNAL_ERROR";

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
};

export function createErrorResponse(
  status: number,
  code: ApiErrorCode | string,
  message: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * Map a manager client error to a status and a code.
 *
 * The manager is the privileged process, so the three failure classes mean
 * three different things to an operator: nothing is listening (start the
 * service), something answered that is not the manager (a version mismatch or
 * a wrong socket), and the manager itself rejected the request (its own code is
 * the actionable one). Request rejections are then mapped onto the HTTP codes
 * the dashboard already understands. Messages already name no socket path,
 * errno, or stack, and are passed through unchanged.
 */
function mapManagerError(
  error: ManagerUnavailableError | ManagerProtocolError | ManagerRequestError
): NextResponse<ApiErrorResponse> {
  if (error instanceof ManagerUnavailableError) {
    return createErrorResponse(503, "MANAGER_UNAVAILABLE", error.message);
  }

  if (error instanceof ManagerProtocolError) {
    return createErrorResponse(502, "MANAGER_PROTOCOL_ERROR", error.message);
  }

  if (
    error.managerCode === "VALIDATION_ERROR" ||
    error.managerCode === "INVALID_REQUEST"
  ) {
    return createErrorResponse(400, "INVALID_REQUEST", error.message);
  }

  if (error.managerCode === "VM_NOT_FOUND") {
    return createErrorResponse(404, "VM_NOT_FOUND", error.message);
  }

  if (error.managerCode === "VM_INVALID_STATE") {
    return createErrorResponse(409, "INVALID_VM_STATE", error.message);
  }

  return createErrorResponse(500, error.managerCode, error.message);
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (
    error instanceof ManagerUnavailableError ||
    error instanceof ManagerProtocolError ||
    error instanceof ManagerRequestError
  ) {
    return mapManagerError(error);
  }

  if (
    (error && typeof error === "object" && "name" in error && (error as { name: string }).name === "VmsanValidationError") ||
    error instanceof VMMetadataValidationError
  ) {
    return createErrorResponse(400, "INVALID_REQUEST", (error as Error).message);
  }

  if (error instanceof VMMetadataConflictError) {
    return createErrorResponse(409, "VM_NAME_ALREADY_EXISTS", error.message);
  }

  if (error instanceof SyntaxError) {
    return createErrorResponse(
      400,
      "INVALID_REQUEST",
      "Malformed JSON payload in request body"
    );
  }

  if (
    error &&
    typeof error === "object" &&
    "command" in error &&
    "stderr" in error &&
    "message" in error
  ) {
    const vmsanErr = error as unknown as { stderr: string; message: string; exitCode: number | null };
    const errText = `${vmsanErr.stderr} ${vmsanErr.message}`.toLowerCase();

    // 1. Missing binary / execution failure (ENOENT or cannot spawn)
    if (
      errText.includes("enoent") ||
      errText.includes("failed to execute") ||
      (errText.includes("not found") && vmsanErr.exitCode === null)
    ) {
      return createErrorResponse(
        503,
        "VMSAN_UNAVAILABLE",
        "vmsan executable is not available or cannot be executed on the host"
      );
    }

    // 2. VM Not Found
    if (
      errText.includes("not found") ||
      errText.includes("does not exist") ||
      errText.includes("no such vm") ||
      errText.includes("unknown vm")
    ) {
      return createErrorResponse(
        404,
        "VM_NOT_FOUND",
        vmsanErr.stderr.trim() || vmsanErr.message || "Target microVM was not found"
      );
    }

    // 3. Operation Conflict (e.g., cannot remove active VM)
    if (
      errText.includes("cannot remove") ||
      (errText.includes("active") && errText.includes("remove")) ||
      errText.includes("conflict")
    ) {
      return createErrorResponse(
        409,
        "OPERATION_CONFLICT",
        vmsanErr.stderr.trim() || vmsanErr.message || "Operation conflict on target microVM"
      );
    }

    // 4. Invalid VM State (e.g., already running, already stopped)
    if (
      errText.includes("already running") ||
      errText.includes("already stopped") ||
      errText.includes("invalid state") ||
      errText.includes("running") ||
      errText.includes("stopped")
    ) {
      return createErrorResponse(
        409,
        "INVALID_VM_STATE",
        vmsanErr.stderr.trim() || vmsanErr.message || "Invalid microVM state for requested operation"
      );
    }

    // 5. General vmsan command failure
    const sanitizedMsg =
      vmsanErr.stderr.trim() ||
      (vmsanErr.message.startsWith("Command '")
        ? "vmsan command execution failed"
        : vmsanErr.message) ||
      "vmsan command failed";

    return createErrorResponse(500, "VMSAN_COMMAND_FAILED", sanitizedMsg);
  }

  if (error instanceof Error) {
    return createErrorResponse(500, "INTERNAL_ERROR", error.message);
  }

  return createErrorResponse(
    500,
    "INTERNAL_ERROR",
    "An unexpected internal error occurred"
  );
}

export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<{ data: T } | { errorResponse: NextResponse<ApiErrorResponse> }> {
  try {
    const text = await request.text();
    if (!text || !text.trim()) {
      return {
        errorResponse: createErrorResponse(
          400,
          "INVALID_REQUEST",
          "Request body is required and cannot be empty"
        ),
      };
    }
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {
        errorResponse: createErrorResponse(
          400,
          "INVALID_REQUEST",
          "Request body must be a valid JSON object"
        ),
      };
    }
    return { data: parsed as T };
  } catch {
    return {
      errorResponse: createErrorResponse(
        400,
        "INVALID_REQUEST",
        "Malformed JSON payload in request body"
      ),
    };
  }
}
