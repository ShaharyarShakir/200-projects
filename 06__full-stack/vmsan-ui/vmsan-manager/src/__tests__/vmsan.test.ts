import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { VmState } from "vmsan";
import {
  categorizeVmsanError,
  createVm,
  createVmsanService,
  getVm,
  listVms,
  removeVm,
  startVm,
  stopVm,
  toProtocolVm,
} from "../vmsan.js";
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

function fakeService(
  states: VmState[] = [],
  overrides: Partial<VmsanService> = {}
): VmsanService {
  return {
    list: () => states,
    get: (id: string) => states.find((s) => s.id === id) ?? null,
    create: async () => ({
      state: states[0] ?? vmStateFixture(),
      config: {} as any,
      vmId: states[0]?.id ?? "vm-default",
      pid: 1234,
    }),
    start: async (id: string) => ({
      success: true,
      state: states.find((s) => s.id === id) ?? vmStateFixture({ id }),
      vmId: id,
      pid: 1234,
    }),
    stop: async (id: string) => ({
      success: true,
      alreadyStopped: false,
      vmId: id,
    }),
    remove: async (id: string) => ({
      success: true,
      vmId: id,
    }),
    ...overrides,
  };
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
    const service = fakeService([], {
      list: () => {
        listCount += 1;
        return [vmStateFixture()];
      },
    });

    await listVms(service);

    assert.equal(listCount, 1);
  });
});

describe("manager vmsan - getVm", () => {
  it("returns redacted single VM when it exists", async () => {
    const fixture = vmStateFixture({ id: "vm-target" });
    const service = fakeService([fixture]);

    const vm = await getVm(service, "vm-target");
    assert.equal(vm.id, "vm-target");
    assert.equal(JSON.stringify(vm).includes(CANARY_TOKEN), false);
  });

  it("throws ERR_VM_NOT_FOUND when VM does not exist", async () => {
    const service = fakeService([]);
    await assert.rejects(
      async () => {
        await getVm(service, "non-existent");
      },
      (err: any) => err.code === "ERR_VM_NOT_FOUND"
    );
  });
});

describe("manager vmsan - createVm", () => {
  it("maps memoryMib to memMib and passes all options", async () => {
    let passedOpts: any;
    const fixture = vmStateFixture({ id: "vm-new", memSizeMib: 512, vcpuCount: 2 });
    const service = fakeService([], {
      create: async (opts) => {
        passedOpts = opts;
        return { state: fixture, config: {} as any, vmId: "vm-new", pid: 1234 };
      },
    });

    const result = await createVm(service, {
      runtime: "node22",
      vcpus: 2,
      memoryMib: 512,
      diskSizeGb: 10,
      networkPolicy: "allow-all",
      timeoutMs: 120000,
    });

    assert.deepEqual(passedOpts, {
      runtime: "node22",
      vcpus: 2,
      memMib: 512,
      diskSizeGb: 10,
      networkPolicy: "allow-all",
      timeoutMs: 120000,
    });
    assert.equal(result.id, "vm-new");
    assert.equal(JSON.stringify(result).includes(CANARY_TOKEN), false);
  });

  it("handles undefined params gracefully", async () => {
    let passedOpts: any;
    const fixture = vmStateFixture({ id: "vm-default" });
    const service = fakeService([], {
      create: async (opts) => {
        passedOpts = opts;
        return { state: fixture, config: {} as any, vmId: "vm-default", pid: 1234 };
      },
    });

    const result = await createVm(service);
    assert.deepEqual(passedOpts, {});
    assert.equal(result.id, "vm-default");
  });
});

describe("manager vmsan - startVm", () => {
  it("starts the VM and returns redacted state", async () => {
    const fixture = vmStateFixture({ id: "vm-to-start", status: "running" });
    const service = fakeService([], {
      start: async (id) => ({
        success: true,
        state: fixture,
        vmId: id,
        pid: 1234,
      }),
    });

    const result = await startVm(service, "vm-to-start");
    assert.equal(result.id, "vm-to-start");
    assert.equal(result.status, "running");
    assert.equal(JSON.stringify(result).includes(CANARY_TOKEN), false);
  });

  it("throws error if start result fails", async () => {
    const nativeError = new Error("VM already running");
    (nativeError as any).code = "ERR_VM_NOT_STOPPED";

    const service = fakeService([], {
      start: async (id) => ({
        success: false,
        error: nativeError as any,
        vmId: id,
        pid: 0,
        state: vmStateFixture({ id }),
      }),
    });

    await assert.rejects(
      async () => {
        await startVm(service, "vm-failed");
      },
      (err: any) => err.code === "ERR_VM_NOT_STOPPED"
    );
  });
});

describe("manager vmsan - stopVm", () => {
  it("stops the VM and returns redacted state from get", async () => {
    const stoppedState = vmStateFixture({ id: "vm-to-stop", status: "stopped" });
    const service = fakeService([stoppedState], {
      stop: async (id) => ({
        success: true,
        alreadyStopped: false,
        vmId: id,
      }),
      get: () => stoppedState,
    });

    const result = await stopVm(service, "vm-to-stop");
    assert.equal(result.id, "vm-to-stop");
    assert.equal(result.status, "stopped");
    assert.equal(JSON.stringify(result).includes(CANARY_TOKEN), false);
  });

  it("throws ERR_VM_NOT_RUNNING if alreadyStopped is true", async () => {
    const service = fakeService([], {
      stop: async (id) => ({
        success: true,
        alreadyStopped: true,
        vmId: id,
      }),
    });

    await assert.rejects(
      async () => {
        await stopVm(service, "vm-already-stopped");
      },
      (err: any) => err.code === "ERR_VM_NOT_RUNNING"
    );
  });

  it("throws error if stop result fails", async () => {
    const nativeError = new Error("VM not found");
    (nativeError as any).code = "ERR_VM_NOT_FOUND";

    const service = fakeService([], {
      stop: async (id) => ({
        success: false,
        error: nativeError as any,
        vmId: id,
      }),
    });

    await assert.rejects(
      async () => {
        await stopVm(service, "vm-missing");
      },
      (err: any) => err.code === "ERR_VM_NOT_FOUND"
    );
  });
});

describe("manager vmsan - removeVm", () => {
  it("removes the VM and returns VmRemoveResult", async () => {
    const service = fakeService([], {
      remove: async (id) => ({
        success: true,
        vmId: id,
      }),
    });

    const result = await removeVm(service, "vm-to-remove");
    assert.deepEqual(result, {
      removed: true,
      vmId: "vm-to-remove",
    });
  });

  it("throws error if remove result fails", async () => {
    const nativeError = new Error("VM is running");
    (nativeError as any).code = "ERR_VM_NOT_STOPPED";

    const service = fakeService([], {
      remove: async (id) => ({
        success: false,
        error: nativeError as any,
        vmId: id,
      }),
    });

    await assert.rejects(
      async () => {
        await removeVm(service, "vm-running");
      },
      (err: any) => err.code === "ERR_VM_NOT_STOPPED"
    );
  });
});

describe("manager vmsan - categorizeVmsanError", () => {
  it("preserves existing valid ManagerErrorCode", () => {
    const err = { code: "VM_NOT_FOUND", message: "Not found" };
    assert.deepEqual(categorizeVmsanError(err), {
      code: "VM_NOT_FOUND",
      message: "Not found",
    });
  });

  it("maps ERR_VM_NOT_FOUND and ERR_VM_STATE_NOT_FOUND to VM_NOT_FOUND", () => {
    assert.equal(
      categorizeVmsanError({ code: "ERR_VM_NOT_FOUND", message: "VM does not exist" }).code,
      "VM_NOT_FOUND"
    );
    assert.equal(
      categorizeVmsanError({ code: "ERR_VM_STATE_NOT_FOUND", message: "State missing" }).code,
      "VM_NOT_FOUND"
    );
  });

  it("maps ERR_VM_NOT_STOPPED and ERR_VM_NOT_RUNNING to VM_INVALID_STATE", () => {
    assert.equal(
      categorizeVmsanError({ code: "ERR_VM_NOT_STOPPED", message: "VM is running" }).code,
      "VM_INVALID_STATE"
    );
    assert.equal(
      categorizeVmsanError({ code: "ERR_VM_NOT_RUNNING", message: "VM is stopped" }).code,
      "VM_INVALID_STATE"
    );
  });

  it("maps ERR_VALIDATION_* to VALIDATION_ERROR", () => {
    assert.equal(
      categorizeVmsanError({ code: "ERR_VALIDATION_RUNTIME", message: "Invalid runtime" }).code,
      "VALIDATION_ERROR"
    );
  });

  it("maps ERR_FIRECRACKER_*, ERR_SETUP_*, ERR_NETWORK_*, ERR_VM_* to VM_OPERATION_FAILED", () => {
    assert.equal(
      categorizeVmsanError({ code: "ERR_FIRECRACKER_API", message: "FC failed" }).code,
      "VM_OPERATION_FAILED"
    );
    assert.equal(
      categorizeVmsanError({ code: "ERR_NETWORK_TAP", message: "TAP failed" }).code,
      "VM_OPERATION_FAILED"
    );
    assert.equal(
      categorizeVmsanError({ code: "ERR_TIMEOUT_START", message: "Timeout" }).code,
      "VM_OPERATION_FAILED"
    );
  });

  it("maps messages with 'not found' to VM_NOT_FOUND", () => {
    assert.equal(
      categorizeVmsanError(new Error("VM vm-123 was not found")).code,
      "VM_NOT_FOUND"
    );
  });

  it("maps messages with 'already running' or 'not stopped' to VM_INVALID_STATE", () => {
    assert.equal(
      categorizeVmsanError(new Error("VM vm-123 is already running")).code,
      "VM_INVALID_STATE"
    );
    assert.equal(
      categorizeVmsanError(new Error("VM is in invalid state")).code,
      "VM_INVALID_STATE"
    );
  });

  it("maps unclassified errors to INTERNAL_ERROR", () => {
    assert.equal(
      categorizeVmsanError(new Error("Unexpected low-level failure")).code,
      "INTERNAL_ERROR"
    );
    assert.equal(categorizeVmsanError("raw string error").code, "INTERNAL_ERROR");
    assert.equal(categorizeVmsanError(null).code, "INTERNAL_ERROR");
  });
});
