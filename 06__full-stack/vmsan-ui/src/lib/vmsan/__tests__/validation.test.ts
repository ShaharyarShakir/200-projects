import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateVmId, validateCreateOptions } from "../client";
import { VmsanValidationError } from "../errors";

describe("validateVmId", () => {
  it("should accept valid VM IDs", () => {
    const validIds = [
      "vm-6ce50edc",
      "vm_123",
      "testVM",
      "a",
      "12345",
      "a".repeat(64),
      "VM-alpha_01",
    ];

    for (const id of validIds) {
      assert.equal(validateVmId(id), id);
    }
  });

  it("should reject non-string and empty inputs", () => {
    const invalidInputs = [
      "",
      null,
      undefined,
      123,
      {},
      [],
      true,
    ];

    for (const input of invalidInputs) {
      assert.throws(
        () => validateVmId(input),
        (err: unknown) => {
          assert.ok(err instanceof VmsanValidationError);
          assert.equal(err.field, "id");
          return true;
        }
      );
    }
  });

  it("should reject malicious and invalid characters", () => {
    const maliciousInputs = [
      "vm-1; rm -rf /",
      "vm`whoami`",
      "$(whoami)",
      "vm|pipe",
      "vm&background",
      "vm>redirect",
      "../relative/path",
      "vm with spaces",
      "vm@special!",
      "a".repeat(65), // > 64 chars
    ];

    for (const input of maliciousInputs) {
      assert.throws(
        () => validateVmId(input),
        (err: unknown) => {
          assert.ok(err instanceof VmsanValidationError);
          assert.equal(err.field, "id");
          return true;
        }
      );
    }
  });
});

describe("validateCreateOptions", () => {
  it("should accept valid create options", () => {
    assert.doesNotThrow(() => validateCreateOptions({}));
    assert.doesNotThrow(() =>
      validateCreateOptions({
        runtime: "base",
        vcpus: 1,
        memoryMiB: 128,
      })
    );
    assert.doesNotThrow(() =>
      validateCreateOptions({
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
      })
    );
    assert.doesNotThrow(() =>
      validateCreateOptions({
        runtime: "node24",
        vcpus: 4,
        memoryMiB: 1024,
      })
    );
    assert.doesNotThrow(() =>
      validateCreateOptions({
        runtime: "python3.13",
        vcpus: 8,
        memoryMiB: 4096,
      })
    );
  });

  it("should reject invalid runtimes", () => {
    const invalidRuntimes = [
      "ruby",
      "python2",
      "node20",
      "base; rm -rf /",
      "",
      "NODE22",
    ];

    for (const runtime of invalidRuntimes) {
      assert.throws(
        // @ts-expect-error testing runtime validation
        () => validateCreateOptions({ runtime }),
        (err: unknown) => {
          assert.ok(err instanceof VmsanValidationError);
          assert.equal(err.field, "runtime");
          return true;
        }
      );
    }
  });

  it("should reject invalid vCPUs", () => {
    const invalidVcpus = [0, -1, 1.5, "2", NaN, null, undefined];

    for (const vcpus of invalidVcpus) {
      if (vcpus === undefined) continue;
      assert.throws(
        // @ts-expect-error testing vcpus validation
        () => validateCreateOptions({ vcpus }),
        (err: unknown) => {
          assert.ok(err instanceof VmsanValidationError);
          assert.equal(err.field, "vcpus");
          return true;
        }
      );
    }
  });

  it("should reject invalid memoryMiB", () => {
    const invalidMemory = [0, 127, -512, 256.5, "512", NaN, null, undefined];

    for (const memoryMiB of invalidMemory) {
      if (memoryMiB === undefined) continue;
      assert.throws(
        // @ts-expect-error testing memoryMiB validation
        () => validateCreateOptions({ memoryMiB }),
        (err: unknown) => {
          assert.ok(err instanceof VmsanValidationError);
          assert.equal(err.field, "memoryMiB");
          return true;
        }
      );
    }
  });
});
