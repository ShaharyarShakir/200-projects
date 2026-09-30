import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateVmId,
  validateCreateVmInput,
  RESOURCE_LIMITS,
} from "../validation";
import { VmValidationError } from "../vm-errors";

describe("validateVmId", () => {
  it("accepts valid alphanumeric VM IDs with dashes and underscores", () => {
    assert.equal(validateVmId("vm-123"), "vm-123");
    assert.equal(validateVmId("node_app_01"), "node_app_01");
    assert.equal(validateVmId("a"), "a");
    assert.equal(validateVmId("a".repeat(64)), "a".repeat(64));
  });

  it("trims whitespace around valid IDs", () => {
    assert.equal(validateVmId("  vm-123  "), "vm-123");
  });

  it("rejects non-string inputs", () => {
    assert.throws(() => validateVmId(null), VmValidationError);
    assert.throws(() => validateVmId(undefined), VmValidationError);
    assert.throws(() => validateVmId(123), VmValidationError);
    assert.throws(() => validateVmId({}), VmValidationError);
  });

  it("rejects empty or whitespace-only strings", () => {
    assert.throws(() => validateVmId(""), VmValidationError);
    assert.throws(() => validateVmId("   "), VmValidationError);
  });

  it("rejects IDs exceeding 64 characters", () => {
    assert.throws(() => validateVmId("a".repeat(65)), VmValidationError);
  });

  it("rejects command injection and path traversal sequences", () => {
    const dangerous = [
      "vm;rm -rf /",
      "vm&&cat /etc/passwd",
      "vm|whoami",
      "vm`id`",
      "vm$(id)",
      "../etc/shadow",
      "vm\nid",
      "vm$PATH",
      "vm>out",
      "vm<in",
      "vm space",
      "vm@host",
      "vm#1",
    ];

    for (const input of dangerous) {
      assert.throws(() => validateVmId(input), VmValidationError);
    }
  });
});

describe("validateCreateVmInput", () => {
  it("accepts an empty object and returns empty validated options", () => {
    assert.deepEqual(validateCreateVmInput({}), {});
  });

  it("rejects non-object inputs", () => {
    assert.throws(() => validateCreateVmInput(null), VmValidationError);
    assert.throws(() => validateCreateVmInput(undefined), VmValidationError);
    assert.throws(() => validateCreateVmInput("invalid"), VmValidationError);
    assert.throws(() => validateCreateVmInput([1, 2, 3]), VmValidationError);
  });

  it("validates runtime correctly", () => {
    assert.deepEqual(validateCreateVmInput({ runtime: "base" }), { runtime: "base" });
    assert.deepEqual(validateCreateVmInput({ runtime: "node22" }), { runtime: "node22" });
    assert.deepEqual(validateCreateVmInput({ runtime: "node24" }), { runtime: "node24" });
    assert.deepEqual(validateCreateVmInput({ runtime: "python3.13" }), { runtime: "python3.13" });

    assert.throws(() => validateCreateVmInput({ runtime: "ruby" }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ runtime: 123 }), VmValidationError);
  });

  it("validates vcpus bounds and integer constraints", () => {
    assert.deepEqual(validateCreateVmInput({ vcpus: 1 }), { vcpus: 1 });
    assert.deepEqual(validateCreateVmInput({ vcpus: 32 }), { vcpus: 32 });

    assert.throws(() => validateCreateVmInput({ vcpus: 0 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ vcpus: 33 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ vcpus: -1 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ vcpus: 2.5 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ vcpus: "2" }), VmValidationError);
  });

  it("validates memoryMib bounds and integer constraints", () => {
    assert.deepEqual(validateCreateVmInput({ memoryMib: 128 }), { memoryMib: 128 });
    assert.deepEqual(validateCreateVmInput({ memoryMib: 512 }), { memoryMib: 512 });
    assert.deepEqual(validateCreateVmInput({ memoryMib: 32768 }), { memoryMib: 32768 });

    assert.throws(() => validateCreateVmInput({ memoryMib: 127 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ memoryMib: 32769 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ memoryMib: -128 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ memoryMib: 128.5 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ memoryMib: "512" }), VmValidationError);
  });

  it("supports memoryMiB for backward compatibility", () => {
    assert.deepEqual(validateCreateVmInput({ memoryMiB: 512 }), { memoryMib: 512 });
  });

  it("validates diskSizeGb bounds and integer constraints", () => {
    assert.deepEqual(validateCreateVmInput({ diskSizeGb: 1 }), { diskSizeGb: 1 });
    assert.deepEqual(validateCreateVmInput({ diskSizeGb: 500 }), { diskSizeGb: 500 });

    assert.throws(() => validateCreateVmInput({ diskSizeGb: 0 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ diskSizeGb: 501 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ diskSizeGb: -5 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ diskSizeGb: 10.5 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ diskSizeGb: "10" }), VmValidationError);
  });

  it("validates networkPolicy correctly", () => {
    assert.deepEqual(validateCreateVmInput({ networkPolicy: "allow-all" }), { networkPolicy: "allow-all" });
    assert.deepEqual(validateCreateVmInput({ networkPolicy: "deny-all" }), { networkPolicy: "deny-all" });
    assert.deepEqual(validateCreateVmInput({ networkPolicy: "custom" }), { networkPolicy: "custom" });

    assert.throws(() => validateCreateVmInput({ networkPolicy: "open" }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ networkPolicy: 123 }), VmValidationError);
  });

  it("validates timeoutMs bounds and integer constraints", () => {
    assert.deepEqual(validateCreateVmInput({ timeoutMs: 0 }), { timeoutMs: 0 });
    assert.deepEqual(validateCreateVmInput({ timeoutMs: 3600000 }), { timeoutMs: 3600000 });

    assert.throws(() => validateCreateVmInput({ timeoutMs: -1 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ timeoutMs: 100.5 }), VmValidationError);
    assert.throws(() => validateCreateVmInput({ timeoutMs: "3600" }), VmValidationError);
  });

  it("strips arbitrary and disallowed properties", () => {
    const dirtyInput = {
      runtime: "node22",
      vcpus: 2,
      command: "rm -rf /",
      flags: ["--privileged"],
      shell: "/bin/sh",
      token: "secret123",
      sudo: true,
    };

    const validated = validateCreateVmInput(dirtyInput);
    assert.deepEqual(validated, {
      runtime: "node22",
      vcpus: 2,
    });
    assert.equal((validated as any).command, undefined);
    assert.equal((validated as any).flags, undefined);
    assert.equal((validated as any).shell, undefined);
    assert.equal((validated as any).token, undefined);
  });
});
