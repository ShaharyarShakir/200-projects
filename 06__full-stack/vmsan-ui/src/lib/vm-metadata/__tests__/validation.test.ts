import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateVMName,
  isValidVMName,
  normalizeVMName,
  VM_NAME_REGEX,
  RESERVED_PREFIX_REGEX,
} from "../validation";

describe("VM Name Validation", () => {
  describe("validateVMName - valid names", () => {
    const validNames = [
      "node-dev",
      "python-sandbox",
      "web-test-01",
      "node22",
      "my_vm",
      "ubuntu.test",
      "a",
      "A",
      "1",
      "VM1",
      "vm1",
      "vm_test",
      "vm.test",
      "a".repeat(63),
      "App-Server.prod_01",
    ];

    for (const name of validNames) {
      it(`should accept valid name: "${name}"`, () => {
        const result = validateVMName(name);
        assert.equal(result.valid, true);
        assert.equal(result.name, name.trim());
        assert.equal(isValidVMName(name), true);
      });
    }

    it("should preserve original casing and trim surrounding whitespace", () => {
      const result = validateVMName("  Python-Sandbox-01  ");
      assert.equal(result.valid, true);
      assert.equal(result.name, "Python-Sandbox-01");
    });
  });

  describe("validateVMName - reserved prefix rejection", () => {
    const reservedNames = [
      "vm-",
      "vm-1",
      "vm-test",
      "vm-1234",
      "VM-node",
      "Vm-foo",
      "vM-bar",
      "VM-a83f19c2",
      "  vm-spaces  ",
    ];

    for (const name of reservedNames) {
      it(`should reject reserved prefix in "${name}"`, () => {
        const result = validateVMName(name);
        assert.equal(result.valid, false);
        assert.ok(result.error?.includes("reserved prefix"));
        assert.equal(isValidVMName(name), false);
      });
    }
  });

  describe("validateVMName - invalid characters and shell metacharacters", () => {
    const invalidNames = [
      "my vm",
      "../../root",
      "foo/bar",
      "foo;bar",
      "foo|bar",
      "$(whoami)",
      "`id`",
      "foo&&bar",
      "-starts-with-dash",
      "_starts-with-underscore",
      ".starts-with-dot",
      "foo@bar",
      "foo#bar",
      "foo$bar",
      "foo*bar",
    ];

    for (const name of invalidNames) {
      it(`should reject invalid characters in "${name}"`, () => {
        const result = validateVMName(name);
        assert.equal(result.valid, false);
        assert.ok(result.error);
        assert.equal(isValidVMName(name), false);
      });
    }
  });

  describe("validateVMName - length and type checks", () => {
    it("should reject empty strings and whitespace-only strings", () => {
      assert.equal(validateVMName("").valid, false);
      assert.equal(validateVMName("   ").valid, false);
    });

    it("should reject names longer than 63 characters", () => {
      const longName = "a".repeat(64);
      const result = validateVMName(longName);
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes("63 characters"));
    });

    it("should reject non-string inputs", () => {
      assert.equal(validateVMName(null).valid, false);
      assert.equal(validateVMName(undefined).valid, false);
      assert.equal(validateVMName(123).valid, false);
      assert.equal(validateVMName({}).valid, false);
      assert.equal(validateVMName([]).valid, false);
    });
  });

  describe("normalizeVMName", () => {
    it("should lowercase and trim strings for case-insensitive uniqueness check", () => {
      assert.equal(normalizeVMName("  Node-Dev  "), "node-dev");
      assert.equal(normalizeVMName("PYTHON-SANDBOX"), "python-sandbox");
      assert.equal(normalizeVMName("my-vm-01"), "my-vm-01");
    });
  });

  describe("regex constants", () => {
    it("should export correct regex patterns", () => {
      assert.ok(VM_NAME_REGEX.test("valid-name"));
      assert.ok(!VM_NAME_REGEX.test("invalid name"));
      assert.ok(RESERVED_PREFIX_REGEX.test("vm-test"));
      assert.ok(RESERVED_PREFIX_REGEX.test("VM-TEST"));
      assert.ok(!RESERVED_PREFIX_REGEX.test("my-vm"));
    });
  });
});
