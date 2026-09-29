import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { VmState } from "vmsan";
import { createVmsanService, listVms, toProtocolVm } from "../vmsan.js";
import type { VmsanService } from "../vmsan.js";
import type { ManagerConfig } from "../config.js";

const CANARY_TOKEN = "CANARY-AGENT-TOKEN-abc123";
const CANARY_CHROOT = "/CANARY/chroot/dir";
const CANARY_KERNEL = "/CANARY/kernel/image";
const CANARY_ROOTFS = "/CANARY/rootfs/ext4";
const CANARY_SOCKET = "/CANARY/api/fc.sock";

/**
 * A VM state record with a distinct canary value in every field the manager
 * must never emit. If a change starts spreading the raw object instead of
 * projecting it, these canaries show up in the serialized response.
 */
function vmStateFixture(overrides: Partial<VmState> = {}): VmState {
  return {
    id: "vm-1691d65a",
    project: "default",
    runtime: "base",
    status: "running",
    pid: 31337,
    apiSocket: CANARY_SOCKET,
    chrootDir: CANARY_CHROOT,
    kernel: CANARY_KERNEL,
    rootfs: CANARY_ROOTFS,
    vcpuCount: 1,
    memSizeMib: 128,
    network: {
      tapDevice: "tap0",
      hostIp: "10.0.0.1",
      guestIp: "10.0.0.2",
      subnetMask: "255.255.255.0",
      macAddress: "AA:BB:CC:DD:EE:FF",
      networkPolicy: "allow-all",
      allowedDomains: [],
      allowedCidrs: [],
      deniedCidrs: [],
      publishedPorts: [],
      tunnelHostname: null,
    },
    snapshot: null,
    timeoutMs: null,
    timeoutAt: null,
    createdAt: "2026-09-28T06:37:52.370Z",
    error: null,
    agentToken: CANARY_TOKEN,
    agentPort: 9119,
    stateVersion: 1,
    ...overrides,
  } as VmState;
}

function fakeService(states: VmState[]): VmsanService {
  return { list: () => states };
}

const config: ManagerConfig = {
  socketPath: "/tmp/vmsan-manager-test.sock",
  vmsanDir: "/var/lib/vmsan-test",
  logLevel: "error",
  maxRequestBytes: 65536,
};

describe("manager vmsan service - single initialization", () => {
  it("passes the configured vmsan directory through as paths", async () => {
    const calls: Array<{ paths?: unknown }> = [];
    const factory = async (options: { paths?: unknown }) => {
      calls.push(options);
      return fakeService([]);
    };

    await createVmsanService(config, factory);

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.paths, config.vmsanDir);
  });

  it("is created once and reused across requests", async () => {
    let createCount = 0;
    const factory = async () => {
      createCount += 1;
      return fakeService([vmStateFixture()]);
    };

    const service = await createVmsanService(config, factory);
    await listVms(service);
    await listVms(service);
    await listVms(service);

    assert.equal(createCount, 1);
  });

  it("ignores SUDO_USER when resolving paths, so root reads the configured directory", async () => {
    const previousSudoUser = process.env.SUDO_USER;
    process.env.SUDO_USER = "some-other-user";
    try {
      const calls: Array<{ paths?: unknown }> = [];
      await createVmsanService(config, async (options) => {
        calls.push(options);
        return fakeService([]);
      });
      assert.equal(calls[0]?.paths, config.vmsanDir);
    } finally {
      if (previousSudoUser === undefined) {
        delete process.env.SUDO_USER;
      } else {
        process.env.SUDO_USER = previousSudoUser;
      }
    }
  });
});

describe("manager vmsan - field redaction", () => {
  it("emits only allow-listed fields", () => {
    const projected = toProtocolVm(vmStateFixture());
    assert.deepEqual(Object.keys(projected).sort(), [
      "createdAt",
      "id",
      "memSizeMib",
      "runtime",
      "snapshot",
      "status",
      "timeoutAt",
      "tunnelHostnames",
      "vcpuCount",
    ]);
  });

  it("excludes the agent token and its value from the projection", () => {
    const serialized = JSON.stringify(toProtocolVm(vmStateFixture()));
    assert.equal(serialized.includes("agentToken"), false);
    assert.equal(serialized.includes(CANARY_TOKEN), false);
  });

  it("excludes host paths and pids from the projection", () => {
    const serialized = JSON.stringify(toProtocolVm(vmStateFixture()));
    for (const canary of [
      CANARY_CHROOT,
      CANARY_KERNEL,
      CANARY_ROOTFS,
      CANARY_SOCKET,
    ]) {
      assert.equal(serialized.includes(canary), false, `must not expose ${canary}`);
    }
    for (const key of ["chrootDir", "kernel", "rootfs", "apiSocket", "pid"]) {
      assert.equal(serialized.includes(`"${key}"`), false, `must not expose ${key}`);
    }
  });

  it("does not spread the source object, so future VmState fields cannot leak", () => {
    const state = vmStateFixture({
      someBrandNewSecret: "CANARY-FUTURE-SECRET",
    } as Partial<VmState>);
    const serialized = JSON.stringify(toProtocolVm(state));
    assert.equal(serialized.includes("CANARY-FUTURE-SECRET"), false);
  });

  it("carries through the values the dashboard needs", () => {
    const projected = toProtocolVm(
      vmStateFixture({
        id: "vm-c5c6c204",
        status: "creating",
        runtime: "node22",
        vcpuCount: 2,
        memSizeMib: 512,
        snapshot: "snap-1",
        timeoutAt: "2026-09-30T00:00:00.000Z",
      })
    );
    assert.deepEqual(projected, {
      id: "vm-c5c6c204",
      status: "creating",
      runtime: "node22",
      vcpuCount: 2,
      memSizeMib: 512,
      createdAt: "2026-09-28T06:37:52.370Z",
      snapshot: "snap-1",
      timeoutAt: "2026-09-30T00:00:00.000Z",
      tunnelHostnames: [],
    });
  });

  it("tolerates a missing tunnel hostnames array", () => {
    const state = vmStateFixture();
    (state as { network?: { tunnelHostnames?: string[] } }).network = {};
    assert.deepEqual(toProtocolVm(state).tunnelHostnames, []);
  });
});

describe("manager vmsan - listVms", () => {
  it("returns an empty collection rather than an error when no VMs exist", async () => {
    assert.deepEqual(await listVms(fakeService([])), []);
  });

  it("returns one redacted entry per VM", async () => {
    const vms = await listVms(
      fakeService([
        vmStateFixture({ id: "vm-1691d65a" }),
        vmStateFixture({ id: "vm-c5c6c204", status: "creating" }),
      ])
    );

    assert.equal(vms.length, 2);
    assert.deepEqual(
      vms.map((vm) => vm.id),
      ["vm-1691d65a", "vm-c5c6c204"]
    );
    assert.equal(JSON.stringify(vms).includes(CANARY_TOKEN), false);
  });

  it("reads from the service rather than executing anything", async () => {
    let listCount = 0;
    const service: VmsanService = {
      list: () => {
        listCount += 1;
        return [vmStateFixture()];
      },
    };

    await listVms(service);

    assert.equal(listCount, 1);
  });
});
