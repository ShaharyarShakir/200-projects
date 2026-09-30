import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VmError,
  VmValidationError,
  VmNotFoundError,
  VmInvalidStateError,
  VmManagerUnavailableError,
  VmOperationFailedError,
  toApiErrorResponse,
} from "../vm-errors";

describe("VmError hierarchy", () => {
  it("instantiates VmValidationError with 400 and INVALID_REQUEST by default", () => {
    const err = new VmValidationError("Invalid input");
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, "INVALID_REQUEST");
    assert.equal(err.message, "Invalid input");
    assert.deepEqual(err.toResponse(), {
      error: {
        code: "INVALID_REQUEST",
        message: "Invalid input",
      },
    });
  });

  it("instantiates VmNotFoundError with 404 and VM_NOT_FOUND", () => {
    const err = new VmNotFoundError("vm-1");
    assert.equal(err.statusCode, 404);
    assert.equal(err.code, "VM_NOT_FOUND");
    assert.equal(err.message, "VM 'vm-1' not found");
  });

  it("instantiates VmInvalidStateError with 409 and INVALID_VM_STATE", () => {
    const err = new VmInvalidStateError("Cannot remove running VM");
    assert.equal(err.statusCode, 409);
    assert.equal(err.code, "INVALID_VM_STATE");
  });

  it("instantiates VmManagerUnavailableError with 503 and MANAGER_UNAVAILABLE", () => {
    const err = new VmManagerUnavailableError();
    assert.equal(err.statusCode, 503);
    assert.equal(err.code, "MANAGER_UNAVAILABLE");
    assert.equal(err.message, "VM manager service is unavailable");
  });

  it("instantiates VmOperationFailedError with 500 and VMSAN_COMMAND_FAILED by default", () => {
    const err = new VmOperationFailedError("Command failed");
    assert.equal(err.statusCode, 500);
    assert.equal(err.code, "VMSAN_COMMAND_FAILED");
  });
});

describe("toApiErrorResponse", () => {
  it("maps known VmError instances correctly", () => {
    const notFound = new VmNotFoundError("vm-99");
    assert.deepEqual(toApiErrorResponse(notFound), {
      status: 404,
      body: {
        error: {
          code: "VM_NOT_FOUND",
          message: "VM 'vm-99' not found",
        },
      },
    });
  });

  it("maps socket connection errors to 503 MANAGER_UNAVAILABLE without leaking paths", () => {
    const socketErrors = [
      new Error("connect ENOENT /run/user/1000/vmsan-manager.sock"),
      new Error("connect ECONNREFUSED /run/vmsan-manager.sock"),
      new Error("connect EACCES /run/vmsan-manager.sock"),
      new Error("Manager socket not found at /run/vmsan-manager.sock"),
      new Error("Socket request timed out after 5000ms"),
    ];

    for (const err of socketErrors) {
      const res = toApiErrorResponse(err);
      assert.equal(res.status, 503);
      assert.equal(res.body.error.code, "MANAGER_UNAVAILABLE");
      assert.equal(res.body.error.message, "VM manager service is unavailable");
      assert.equal(res.body.error.message.includes(".sock"), false);
      assert.equal(res.body.error.message.includes("/run"), false);
    }
  });

  it("maps unexpected errors to 500 INTERNAL_ERROR without leaking details", () => {
    const err = new Error("Unexpected null pointer in secret /var/log/sys.log");
    const res = toApiErrorResponse(err);
    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, "INTERNAL_ERROR");
    assert.equal(res.body.error.message, "An internal server error occurred");
    assert.equal(res.body.error.message.includes("/var/log"), false);
  });
});
