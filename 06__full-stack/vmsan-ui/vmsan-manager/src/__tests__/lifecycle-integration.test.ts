import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { CreateVmOptions, VmState } from "vmsan";
import { ManagerServer } from "../server.js";
import { createLogger } from "../logger.js";
import type { VmsanService } from "../vmsan.js";
import { createManagerClient } from "../../../src/lib/vmsan-manager/client.js";
import { ManagerUnavailableError } from "../../../src/lib/vmsan-manager/errors.js";

function makeVmState(id: string, status: VmState["status"], overrides: Partial<VmState> = {}): VmState {
  return {
    id,
    project: "default",
    runtime: "base",
    status,
    pid: 1000 + Math.floor(Math.random() * 9000),
    apiSocket: `/var/run/vmsan/${id}/fc.sock`,
    chrootDir: `/var/lib/vmsan/${id}/root`,
    kernel: "/var/lib/vmsan/kernel.bin",
    rootfs: `/var/lib/vmsan/${id}/rootfs.ext4`,
    vcpuCount: 2,
    memSizeMib: 512,
    network: {
      tapDevice: `tap-${id.slice(0, 4)}`,
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
    createdAt: "2026-09-28T06:00:00.000Z",
    error: null,
    agentToken: `SECRET-AGENT-TOKEN-${id}`,
    agentPort: 9119,
    stateVersion: 1,
    ...overrides,
  } as VmState;
}

class InMemoryVmService implements VmsanService {
  private vms: Map<string, VmState> = new Map();

  constructor(initialVms: VmState[] = []) {
    for (const vm of initialVms) {
      this.vms.set(vm.id, { ...vm });
    }
  }

  list(): VmState[] {
    return Array.from(this.vms.values()).map((vm) => ({ ...vm }));
  }

  get(id: string): VmState | null {
    const vm = this.vms.get(id);
    return vm ? { ...vm } : null;
  }

  async create(options?: CreateVmOptions): Promise<{
    state: VmState;
    config: any;
    vmId: string;
    pid: number;
  }> {
    const id = `vm-disposable-${Math.random().toString(16).slice(2, 8)}`;
    const state = makeVmState(id, "creating", {
      runtime: (options?.runtime as string) ?? "base",
      vcpuCount: (options?.vcpus as number) ?? 1,
      memSizeMib: (options?.memMib as number) ?? 128,
    });
    this.vms.set(id, state);
    return {
      state: { ...state },
      config: {} as any,
      vmId: id,
      pid: state.pid ?? 1234,
    };
  }

  async start(id: string): Promise<{
    success: boolean;
    state: VmState | null;
    error?: any;
    vmId: string;
    pid: number;
  }> {
    const vm = this.vms.get(id);
    if (!vm) {
      const err = new Error(`VM ${id} not found`);
      (err as any).code = "ERR_VM_NOT_FOUND";
      throw err;
    }
    if (vm.status === "running") {
      const err = new Error(`VM ${id} is already running`);
      (err as any).code = "ERR_VM_NOT_STOPPED";
      throw err;
    }
    vm.status = "running";
    return {
      success: true,
      state: { ...vm },
      vmId: id,
      pid: vm.pid ?? 1234,
    };
  }

  async stop(id: string): Promise<{
    success: boolean;
    alreadyStopped: boolean;
    error?: any;
    vmId: string;
  }> {
    const vm = this.vms.get(id);
    if (!vm) {
      const err = new Error(`VM ${id} not found`);
      (err as any).code = "ERR_VM_NOT_FOUND";
      throw err;
    }
    if (vm.status === "stopped") {
      return {
        success: true,
        alreadyStopped: true,
        vmId: id,
      };
    }
    vm.status = "stopped";
    return {
      success: true,
      alreadyStopped: false,
      vmId: id,
    };
  }

  async remove(id: string, _opts?: { force?: boolean }): Promise<{
    success: boolean;
    alreadyStopped?: boolean;
    error?: any;
    vmId: string;
  }> {
    const vm = this.vms.get(id);
    if (!vm) {
      const err = new Error(`VM ${id} not found`);
      (err as any).code = "ERR_VM_NOT_FOUND";
      throw err;
    }
    if (vm.status === "running") {
      const err = new Error(`VM ${id} is running and cannot be removed`);
      (err as any).code = "ERR_VM_NOT_STOPPED";
      throw err;
    }
    this.vms.delete(id);
    return {
      success: true,
      vmId: id,
    };
  }
}

describe("manager lifecycle integration verification", () => {
  let tmpDir: string;
  let socketPath: string;
  let server: ManagerServer | null = null;
  let service: InMemoryVmService;
  let existingKali: VmState;
  let existingUbuntu: VmState;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "vmsan-lifecycle-int-"));
    socketPath = join(tmpDir, "vmsan-manager.sock");

    existingKali = makeVmState("kali", "running", {
      runtime: "base",
      vcpuCount: 4,
      memSizeMib: 2048,
      createdAt: "2026-09-01T12:00:00.000Z",
    });

    existingUbuntu = makeVmState("ubuntu-desktop", "stopped", {
      runtime: "base",
      vcpuCount: 2,
      memSizeMib: 4096,
      createdAt: "2026-09-15T08:30:00.000Z",
    });

    service = new InMemoryVmService([existingKali, existingUbuntu]);
  });

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("executes full lifecycle flow (health -> list -> create -> start -> stop -> remove) preserving existing VMs", async () => {
    server = new ManagerServer({
      config: {
        socketPath,
        vmsanDir: "/tmp/vmsan",
        logLevel: "error",
        maxRequestBytes: 65536,
      },
      logger: createLogger("error", () => {}),
      service,
    });
    await server.listen();

    const client = createManagerClient({ socketPath });

    // 1. Health check
    const health = await client.health();
    assert.deepEqual(health, { status: "ok" });

    // 2. Initial list check
    const initialList = await client.list();
    assert.equal(initialList.length, 2);
    const kali = initialList.find((v) => v.id === "kali");
    const ubuntu = initialList.find((v) => v.id === "ubuntu-desktop");
    assert.ok(kali);
    assert.ok(ubuntu);
    assert.equal(kali.status, "running");
    assert.equal(ubuntu.status, "stopped");
    assert.equal(JSON.stringify(initialList).includes("SECRET-AGENT-TOKEN"), false);

    // 3. Create disposable VM
    const created = await client.createVm({
      runtime: "node22",
      vcpus: 2,
      memoryMib: 512,
      diskSizeGb: 5,
      networkPolicy: "allow-all",
    });
    assert.ok(created.id.startsWith("vm-disposable-"));
    assert.equal(created.runtime, "node22");
    assert.equal(created.vcpuCount, 2);
    assert.equal(created.memSizeMib, 512);
    assert.equal(created.status, "creating");
    assert.equal(JSON.stringify(created).includes("SECRET-AGENT-TOKEN"), false);
    const disposableId = created.id;

    // Verify list contains 3 VMs
    const afterCreateList = await client.list();
    assert.equal(afterCreateList.length, 3);
    assert.ok(afterCreateList.some((v) => v.id === disposableId));

    // 4. Start disposable VM
    const started = await client.startVm(disposableId);
    assert.equal(started.id, disposableId);
    assert.equal(started.status, "running");

    // Verify existing VMs remain untouched
    const afterStartList = await client.list();
    const kaliAfterStart = afterStartList.find((v) => v.id === "kali");
    const ubuntuAfterStart = afterStartList.find((v) => v.id === "ubuntu-desktop");
    assert.equal(kaliAfterStart?.status, "running");
    assert.equal(kaliAfterStart?.vcpuCount, 4);
    assert.equal(ubuntuAfterStart?.status, "stopped");
    assert.equal(ubuntuAfterStart?.memSizeMib, 4096);

    // 5. Stop disposable VM
    const stopped = await client.stopVm(disposableId);
    assert.equal(stopped.id, disposableId);
    assert.equal(stopped.status, "stopped");

    // Verify existing VMs remain untouched
    const afterStopList = await client.list();
    const kaliAfterStop = afterStopList.find((v) => v.id === "kali");
    assert.equal(kaliAfterStop?.status, "running");

    // 6. Remove disposable VM
    const removed = await client.removeVm(disposableId);
    assert.deepEqual(removed, { removed: true, vmId: disposableId });

    // 7. Final list verification: only existing VMs remain in pristine state
    const finalList = await client.list();
    assert.equal(finalList.length, 2);
    assert.deepEqual(
      finalList.map((v) => v.id).sort(),
      ["kali", "ubuntu-desktop"]
    );
    const finalKali = finalList.find((v) => v.id === "kali");
    const finalUbuntu = finalList.find((v) => v.id === "ubuntu-desktop");
    assert.equal(finalKali?.status, "running");
    assert.equal(finalKali?.createdAt, "2026-09-01T12:00:00.000Z");
    assert.equal(finalUbuntu?.status, "stopped");
    assert.equal(finalUbuntu?.createdAt, "2026-09-15T08:30:00.000Z");
  });

  it("handles manager server restart and client automatic reconnection", async () => {
    // 1. Initial server startup
    server = new ManagerServer({
      config: {
        socketPath,
        vmsanDir: "/tmp/vmsan",
        logLevel: "error",
        maxRequestBytes: 65536,
      },
      logger: createLogger("error", () => {}),
      service,
    });
    await server.listen();

    const client = createManagerClient({ socketPath, timeoutMs: 500 });
    const list1 = await client.list();
    assert.equal(list1.length, 2);

    // 2. Stop server (simulating daemon restart / maintenance)
    await server.close();
    server = null;

    // 3. Client call during downtime fails cleanly with typed ManagerUnavailableError
    await assert.rejects(
      async () => {
        await client.health();
      },
      ManagerUnavailableError
    );

    // 4. Restart server on the same socket path with persisted service state
    server = new ManagerServer({
      config: {
        socketPath,
        vmsanDir: "/tmp/vmsan",
        logLevel: "error",
        maxRequestBytes: 65536,
      },
      logger: createLogger("error", () => {}),
      service,
    });
    await server.listen();

    // 5. Client reconnects immediately on the next call without needing client instance rebuild
    const health = await client.health();
    assert.deepEqual(health, { status: "ok" });

    const list2 = await client.list();
    assert.equal(list2.length, 2);
    assert.deepEqual(
      list2.map((v) => v.id).sort(),
      ["kali", "ubuntu-desktop"]
    );
  });
});
