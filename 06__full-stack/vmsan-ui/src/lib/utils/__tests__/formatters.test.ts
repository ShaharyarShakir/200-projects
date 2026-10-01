import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatValue, formatMemory, formatDiskSize, formatDate, formatVmCount } from "../formatters";

describe("formatters", () => {
  describe("formatValue", () => {
    it("returns string as is when defined", () => {
      assert.equal(formatValue("base"), "base");
      assert.equal(formatValue("vm-123"), "vm-123");
    });

    it("returns string representation of numbers", () => {
      assert.equal(formatValue(2), "2");
      assert.equal(formatValue(0), "0");
    });

    it("returns em dash for null and undefined", () => {
      assert.equal(formatValue(null), "—");
      assert.equal(formatValue(undefined), "—");
    });

    it("returns em dash for empty string", () => {
      assert.equal(formatValue(""), "—");
    });

    it("returns em dash for NaN", () => {
      assert.equal(formatValue(Number.NaN), "—");
    });
  });

  describe("formatMemory", () => {
    it("formats memory in MiB for valid numbers", () => {
      assert.equal(formatMemory(128), "128 MiB");
      assert.equal(formatMemory(1024), "1024 MiB");
      assert.equal(formatMemory(0), "0 MiB");
    });

    it("returns em dash for null, undefined, and NaN", () => {
      assert.equal(formatMemory(null), "—");
      assert.equal(formatMemory(undefined), "—");
      assert.equal(formatMemory(Number.NaN), "—");
    });
  });

  describe("formatDiskSize", () => {
    it("formats disk size in GB for valid numbers", () => {
      assert.equal(formatDiskSize(1), "1 GB");
      assert.equal(formatDiskSize(10), "10 GB");
      assert.equal(formatDiskSize(0), "0 GB");
    });

    it("returns em dash for null, undefined, and NaN", () => {
      assert.equal(formatDiskSize(null), "—");
      assert.equal(formatDiskSize(undefined), "—");
      assert.equal(formatDiskSize(Number.NaN), "—");
    });
  });

  describe("formatDate", () => {
    it("formats valid ISO date string", () => {
      const formatted = formatDate("2026-09-29T10:00:00.000Z");
      assert.notEqual(formatted, "—");
      assert.match(formatted, /2026/);
    });

    it("formats valid Date object", () => {
      const formatted = formatDate(new Date("2026-09-29T10:00:00.000Z"));
      assert.notEqual(formatted, "—");
      assert.match(formatted, /2026/);
    });

    it("returns em dash for null, undefined, empty string, and invalid dates", () => {
      assert.equal(formatDate(null), "—");
      assert.equal(formatDate(undefined), "—");
      assert.equal(formatDate(""), "—");
      assert.equal(formatDate("not-a-date"), "—");
    });
  });

  describe("formatVmCount", () => {
    it("returns '1 VM' for count 1", () => {
      assert.equal(formatVmCount(1), "1 VM");
    });

    it("returns '0 VMs' for count 0", () => {
      assert.equal(formatVmCount(0), "0 VMs");
    });

    it("returns 'N VMs' for plural counts", () => {
      assert.equal(formatVmCount(2), "2 VMs");
      assert.equal(formatVmCount(5), "5 VMs");
    });
  });
});

