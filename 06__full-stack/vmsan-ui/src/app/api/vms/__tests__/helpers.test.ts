import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleApiError,
  parseJsonBody,
  createErrorResponse,
} from "../helpers";
import { VmsanError, VmsanValidationError } from "@/lib/vmsan";
import {
  ManagerProtocolError,
  ManagerRequestError,
  ManagerUnavailableError,
} from "@/lib/vmsan-manager/errors";
import {
  VMMetadataConflictError,
  VMMetadataValidationError,
} from "@/lib/vm-metadata";

describe("API Helpers - createErrorResponse", () => {
  it("should create standard error response with specified status and code", async () => {
    const response = createErrorResponse(403, "FORBIDDEN", "Access denied");
    assert.equal(response.status, 403);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "FORBIDDEN");
    assert.equal(body.error.message, "Access denied");
  });
});

describe("API Helpers - handleApiError", () => {
  it("should map VMMetadataConflictError to 409 VM_NAME_ALREADY_EXISTS", async () => {
    const error = new VMMetadataConflictError("A VM with name 'node-dev' already exists");
    const response = handleApiError(error);
    assert.equal(response.status, 409);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VM_NAME_ALREADY_EXISTS");
    assert.equal(body.error.message, "A VM with name 'node-dev' already exists");
  });

  it("should map VMMetadataValidationError to 400 INVALID_REQUEST", async () => {
    const error = new VMMetadataValidationError("VM name cannot start with reserved prefix 'vm-'");
    const response = handleApiError(error);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "VM name cannot start with reserved prefix 'vm-'");
  });

  it("should map VmsanValidationError to 400 INVALID_REQUEST", async () => {
    const error = new VmsanValidationError("Invalid runtime", "runtime", "bad-runtime");
    const response = handleApiError(error);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "Invalid runtime");
  });

  it("should map SyntaxError to 400 INVALID_REQUEST", async () => {
    const error = new SyntaxError("Unexpected token in JSON");
    const response = handleApiError(error);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "Malformed JSON payload in request body");
  });

  it("should map VmsanError with ENOENT or spawn failure to 503 VMSAN_UNAVAILABLE", async () => {
    const error = new VmsanError({
      message: "Failed to execute 'vmsan': spawn vmsan ENOENT",
      command: "vmsan",
      args: ["list"],
      exitCode: null,
      stdout: "",
      stderr: "",
    });
    const response = handleApiError(error);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_UNAVAILABLE");
    assert.equal(
      body.error.message,
      "vmsan executable is not available or cannot be executed on the host"
    );
  });

  it("should map ManagerUnavailableError to 503 MANAGER_UNAVAILABLE", async () => {
    const error = new ManagerUnavailableError("vmsan manager socket is not reachable");
    const response = handleApiError(error);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
    assert.equal(body.error.message, "vmsan manager socket is not reachable");
  });

  it("should map ManagerProtocolError to 502 MANAGER_PROTOCOL_ERROR", async () => {
    const error = new ManagerProtocolError(
      "vmsan manager response did not match the protocol contract"
    );
    const response = handleApiError(error);
    assert.equal(response.status, 502);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_PROTOCOL_ERROR");
  });

  it("should map ManagerRequestError to 500 carrying the manager's own code", async () => {
    const error = new ManagerRequestError("INTERNAL_ERROR", "manager rejected the request");
    const response = handleApiError(error);
    assert.equal(response.status, 500);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INTERNAL_ERROR");
    assert.equal(body.error.message, "manager rejected the request");
  });

  it("names no socket path, errno, or stack in any manager error response", async () => {
    const causes = [
      new ManagerUnavailableError("vmsan manager socket is not reachable", {
        cause: Object.assign(new Error("connect EACCES /run/vmsan-manager.sock"), {
          code: "EACCES",
        }),
      }),
      new ManagerProtocolError("vmsan manager returned an invalid response", {
        cause: new SyntaxError("Unexpected token } in JSON at position 12"),
      }),
      new ManagerRequestError("UNKNOWN_METHOD", 'Unknown method "create"'),
    ];

    for (const error of causes) {
      const response = handleApiError(error);
      const serialized = JSON.stringify(await response.json());

      assert.equal(serialized.includes("/run/"), false, "no socket path in the body");
      assert.equal(serialized.includes(".sock"), false);
      assert.equal(/EACCES|ECONNREFUSED|ENOENT/.test(serialized), false, "no errno");
      assert.equal(serialized.includes("at "), false, "no stack frame");
      assert.equal(serialized.includes("cause"), false);
    }
  });

  it("does not treat a vmsan privilege message as an escalation problem", async () => {
    // The old branch translated any password-shaped stderr into "configure
    // passwordless sudo". There is no escalation left to configure, so the
    // same text now falls through to the ordinary command-failure mapping.
    const error = new VmsanError({
      command: "vmsan",
      args: ["list"],
      exitCode: 1,
      stdout: "",
      stderr: "sudo: a password is required",
    });
    const response = handleApiError(error);
    assert.equal(response.status, 500);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_COMMAND_FAILED");
    assert.equal(body.error.message.includes("passwordless sudo"), false);
  });

  it("should map VmsanError indicating VM not found to 404 VM_NOT_FOUND", async () => {
    const error = new VmsanError({
      command: "vmsan",
      args: ["start", "vm-not-exist"],
      exitCode: 1,
      stdout: "",
      stderr: "Error: VM 'vm-not-exist' not found",
    });
    const response = handleApiError(error);
    assert.equal(response.status, 404);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VM_NOT_FOUND");
    assert.ok(body.error.message.includes("not found"));
  });

  it("should map VmsanError indicating conflict to 409 OPERATION_CONFLICT", async () => {
    const error = new VmsanError({
      command: "vmsan",
      args: ["remove", "vm-123"],
      exitCode: 1,
      stdout: "",
      stderr: "Error: cannot remove active VM vm-123",
    });
    const response = handleApiError(error);
    assert.equal(response.status, 409);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "OPERATION_CONFLICT");
  });

  it("should map VmsanError indicating invalid state to 409 INVALID_VM_STATE", async () => {
    const error = new VmsanError({
      command: "vmsan",
      args: ["start", "vm-123"],
      exitCode: 1,
      stdout: "",
      stderr: "Error: VM vm-123 is already running",
    });
    const response = handleApiError(error);
    assert.equal(response.status, 409);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_VM_STATE");
  });

  it("should map generic VmsanError to 500 VMSAN_COMMAND_FAILED", async () => {
    const error = new VmsanError({
      command: "vmsan",
      args: ["list"],
      exitCode: 1,
      stdout: "",
      stderr: "Unknown driver error",
    });
    const response = handleApiError(error);
    assert.equal(response.status, 500);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_COMMAND_FAILED");
    assert.equal(body.error.message, "Unknown driver error");
  });

  it("should map unexpected Error to 500 INTERNAL_ERROR", async () => {
    const error = new Error("Database timeout");
    const response = handleApiError(error);
    assert.equal(response.status, 500);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INTERNAL_ERROR");
  });
});

describe("API Helpers - parseJsonBody", () => {
  it("should parse valid JSON body", async () => {
    const request = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({ runtime: "node22", vcpus: 2 }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseJsonBody<{ runtime: string; vcpus: number }>(request);
    assert.ok("data" in result);
    assert.equal(result.data.runtime, "node22");
    assert.equal(result.data.vcpus, 2);
  });

  it("should return 400 error response for empty body", async () => {
    const request = new Request("http://localhost/api/vms", {
      method: "POST",
      body: "",
    });

    const result = await parseJsonBody(request);
    assert.ok("errorResponse" in result);
    assert.equal(result.errorResponse.status, 400);

    const body = (await result.errorResponse.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("should return 400 error response for malformed JSON", async () => {
    const request = new Request("http://localhost/api/vms", {
      method: "POST",
      body: "{ invalid json",
    });

    const result = await parseJsonBody(request);
    assert.ok("errorResponse" in result);
    assert.equal(result.errorResponse.status, 400);

    const body = (await result.errorResponse.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("should return 400 error response for non-object JSON (array)", async () => {
    const request = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify(["runtime", "node22"]),
    });

    const result = await parseJsonBody(request);
    assert.ok("errorResponse" in result);
    assert.equal(result.errorResponse.status, 400);

    const body = (await result.errorResponse.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });
});
