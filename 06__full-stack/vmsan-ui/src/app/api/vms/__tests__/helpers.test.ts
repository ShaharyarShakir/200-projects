import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  handleApiError,
  parseJsonBody,
  createErrorResponse,
} from "../helpers";
import { VmsanError, VmsanValidationError } from "@/lib/vmsan";

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
