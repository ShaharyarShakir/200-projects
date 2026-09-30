import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeVmStatus, formatAge, toVmNetwork, toVmDto } from "../vm-mapper";
import type { ManagerVm } from "../../vmsan-manager/protocol";

describe("normalizeVmStatus", () => {
  it("maps valid status strings directly", () => {
    assert.equal(normalizeVmStatus("creating"), "creating");
    assert.equal(normalizeVmStatus("running"), "running");
    assert.equal(normalizeVmStatus("stopped"), "stopped");
    assert.equal(normalizeVmStatus("stopping"), "stopping");
    assert.equal(normalizeVmStatus("starting"), "starting");
    assert.equal(normalizeVmStatus("error"), "error");
  });

  it("normalizes alias statuses", () => {
    assert.equal(normalizeVmStatus("active"), "running");
    assert.equal(normalizeVmStatus("ACTIVE"), "running");
    assert.equal(normalizeVmStatus("inactive"), "stopped");
    assert.equal(normalizeVmStatus("failed"), "error");
  });

  it("maps unrecognised statuses to unknown", () => {
    assert.equal(normalizeVmStatus("something-else"), "unknown");
    assert.equal(normalizeVmStatus(""), "unknown");
  });
});

describe("formatAge", () => {
  it("formats durations accurately", () => {
    const now = 1000000000000;
    assert.equal(formatAge(new Date(now - 30 * 1000).toISOString(), now), "30s");
    assert.equal(formatAge(new Date(now - 120 * 1000).toISOString(), now), "2m");
    assert.equal(formatAge(new Date(now - 7200 * 1000).toISOString(), now), "2h");
    assert.equal(formatAge(new Date(now - 86400 * 2 * 1000).toISOString(), now), "2d");
  });

  it("returns null for invalid or future timestamps", () => {
    const now = 1000000000000;
    assert.equal(formatAge("invalid-date", now), null);
    assert.equal(formatAge(new Date(now + 10000).toISOString(), now), null);
  });
});

describe("toVmNetwork", () => {
  it("maps valid network options", () => {
    const net = toVmNetwork({
      policy: "deny-all",
      address: "192.168.1.100",
      publishedPorts: [80, 443],
    });
    assert.deepEqual(net, {
      policy: "deny-all",
      address: "192.168.1.100",
      publishedPorts: [80, 443],
    });
  });

  it("filters out invalid ports", () => {
    const net = toVmNetwork({
      publishedPorts: [80, -1, 70000, 3.14, "8080" as any],
    });
    assert.deepEqual(net, {
      publishedPorts: [80],
    });
  });

  it("returns undefined for null or empty network structures", () => {
    assert.equal(toVmNetwork(null), undefined);
    assert.equal(toVmNetwork({}), undefined);
  });
});

describe("toVmDto", () => {
  it("maps ManagerVm to clean Vm DTO", () => {
    const managerVm: ManagerVm = {
      id: "vm-42",
      status: "running",
      runtime: "node22",
      vcpuCount: 4,
      memSizeMib: 1024,
      createdAt: "2026-09-29T10:00:00.000Z",
      snapshot: null,
      timeoutAt: null,
      tunnelHostnames: ["vm-42.example.com"],
    };

    const fixedNow = Date.parse("2026-09-29T10:05:00.000Z");
    const dto = toVmDto(managerVm, fixedNow);

    assert.deepEqual(dto, {
      id: "vm-42",
      status: "running",
      runtime: "node22",
      vcpus: 4,
      memoryMib: 1024,
      memoryMiB: 1024,
      diskSizeGb: 1,
      createdAt: "2026-09-29T10:00:00.000Z",
      age: "5m",
    });
  });

  it("strips sensitive host internals completely", () => {
    const rawInternalData = {
      id: "vm-secret",
      status: "running",
      runtime: "python3.13",
      vcpuCount: 2,
      memSizeMib: 512,
      diskSizeGb: 10,
      createdAt: "2026-09-29T12:00:00.000Z",
      agentToken: "super-secret-token-xyz",
      hostTap: "tap-vmsan-01",
      tapInterface: "veth1234",
      tapName: "tap42",
      pid: 12345,
      hostPath: "/var/lib/vmsan/vms/vm-secret",
      jailerPath: "/srv/jailer/firecracker/vm-secret",
      jailerRoot: "/srv/jailer",
      socketPath: "/run/vmsan-manager.sock",
      sudoersPath: "/etc/sudoers.d/vmsan",
    };

    const dto = toVmDto(rawInternalData);

    assert.equal(dto.id, "vm-secret");
    assert.equal(dto.status, "running");
    assert.equal(dto.runtime, "python3.13");
    assert.equal(dto.vcpus, 2);
    assert.equal(dto.memoryMib, 512);
    assert.equal(dto.diskSizeGb, 10);

    // Verify sensitive keys are completely absent
    const keys = Object.keys(dto);
    assert.equal(keys.includes("agentToken"), false);
    assert.equal(keys.includes("hostTap"), false);
    assert.equal(keys.includes("tapInterface"), false);
    assert.equal(keys.includes("tapName"), false);
    assert.equal(keys.includes("pid"), false);
    assert.equal(keys.includes("hostPath"), false);
    assert.equal(keys.includes("jailerPath"), false);
    assert.equal(keys.includes("jailerRoot"), false);
    assert.equal(keys.includes("socketPath"), false);
    assert.equal(keys.includes("sudoersPath"), false);
  });
});
