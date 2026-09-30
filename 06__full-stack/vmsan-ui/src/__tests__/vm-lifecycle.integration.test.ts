import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ManagerServer } from "../../vmsan-manager/src/server.js";
import { createLogger } from "../../vmsan-manager/src/logger.js";
import type { VmsanService } from "../../vmsan-manager/src/vmsan.js";
import { createVmService } from "@/lib/vms/vm-service";
import { GET as getVmsRoute, POST as createVmRoute } from "@/app/api/vms/route";
import { POST as startVmRoute } from "@/app/api/vms/[id]/start/route";
import { POST as stopVmRoute } from "@/app/api/vms/[id]/stop/route";
import { DELETE as removeVmRoute } from "@/app/api/vms/[id]/route";

type IntegrationVmStatus =
  | "creating"
  | "running"
  | "stopped"
  | "stopping"
  | "starting"
  | "error"
  | "unknown";

interface IntegrationVmState {
  id: string;
  project?: string;
  runtime: string;
  status: IntegrationVmStatus;
  pid?: number;
  apiSocket?: string;
  chrootDir?: string;
  kernel?: string;
  rootfs?: string;
  vcpuCount: number;
  memSizeMib: number;
  network?: any;
  snapshot?: any;
  timeoutMs?: number | null;
  timeoutAt?: string | null;
  createdAt: string;
  error?: any;
  agentToken?: string;
  agentPort?: number;
  stateVersion?: number;
}

function makeVmState(
  id: string,
  status: IntegrationVmStatus,
  overrides: Partial<IntegrationVmState> = {}
): IntegrationVmState {
  return {
    id,
    project: "default",
    runtime: "node22",
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
      publishedPorts: [8080],
      tunnelHostname: `${id}.example.com`,
    },
    snapshot: null,
    timeoutMs: null,
    timeoutAt: null,
    createdAt: "2026-09-29T12:00:00.000Z",
    error: null,
    agentToken: `SECRET-AGENT-TOKEN-${id}`,
    agentPort: 9119,
    stateVersion: 1,
    ...overrides,
  };
}

class InMemoryVmService implements VmsanService {
  private vms: Map<string, any> = new Map();

  constructor(initialVms: any[] = []) {
    for (const vm of initialVms) {
      this.vms.set(vm.id, { ...vm });
    }
  }

  list(): any[] {
    return Array.from(this.vms.values()).map((vm) => ({ ...vm }));
  }

  get(id: string): any | null {
    const vm = this.vms.get(id);
    return vm ? { ...vm } : null;
  }

  async create(options?: any): Promise<{
    state: any;
    config: any;
    vmId: string;
    pid: number;
  }> {
    const id = `vm-integration-${Math.random().toString(16).slice(2, 8)}`;
    const state = makeVmState(id, "creating", {
      runtime: (options?.runtime as string) ?? "base",
      vcpuCount: (options?.vcpus as number) ?? 1,
      memSizeMib: (options?.memMib as number) ?? 128,
      createdAt: new Date().toISOString(),
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
    state: any | null;
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

describe("Integration: Next.js API Routes & VmService against Manager Unix Socket", () => {
  let tmpDir: string;
  let socketPath: string;
  let server: ManagerServer | null = null;
  let inMemoryService: InMemoryVmService;
  const originalSocketEnv = process.env.VMSAN_MANAGER_SOCKET;

  beforeEach(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), "vmsan-nextjs-integration-"));
    socketPath = join(tmpDir, "vmsan-manager.sock");
    process.env.VMSAN_MANAGER_SOCKET = socketPath;

    const seedVm = makeVmState("vm-seed-1", "stopped", {
      runtime: "python3.13",
      vcpuCount: 2,
      memSizeMib: 512,
      createdAt: "2026-09-30T00:00:00.000Z",
    });

    inMemoryService = new InMemoryVmService([seedVm]);

    server = new ManagerServer({
      config: {
        socketPath,
        vmsanDir: "/tmp/vmsan",
        logLevel: "error",
        maxRequestBytes: 65536,
      },
      logger: createLogger("error", () => {}),
      service: inMemoryService,
    });
    await server.listen();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
    if (originalSocketEnv !== undefined) {
      process.env.VMSAN_MANAGER_SOCKET = originalSocketEnv;
    } else {
      delete process.env.VMSAN_MANAGER_SOCKET;
    }
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("Application VmService layer", () => {
    it("completes full lifecycle: list -> create -> start -> stop -> remove", async () => {
      const service = createVmService();

      // 1. Initial list
      const initialVms = await service.listVms();
      assert.equal(initialVms.length, 1);
      assert.equal(initialVms[0].id, "vm-seed-1");
      assert.equal(initialVms[0].status, "stopped");
      assert.equal(initialVms[0].runtime, "python3.13");

      // 2. Create VM
      const created = await service.createVm({
        runtime: "node22",
        vcpus: 4,
        memoryMib: 1024,
        diskSizeGb: 10,
        networkPolicy: "allow-all",
      });
      assert.ok(created.id.startsWith("vm-integration-"));
      assert.equal(created.runtime, "node22");
      assert.equal(created.vcpus, 4);
      assert.equal(created.memoryMib, 1024);
      assert.equal(created.status, "creating");
      const newVmId = created.id;

      // 3. List should show both VMs
      const vmsAfterCreate = await service.listVms();
      assert.equal(vmsAfterCreate.length, 2);
      assert.ok(vmsAfterCreate.some((v) => v.id === newVmId));

      // 4. Start VM
      const started = await service.startVm(newVmId);
      assert.equal(started.id, newVmId);
      assert.equal(started.status, "running");

      // 5. Stop VM
      const stopped = await service.stopVm(newVmId);
      assert.equal(stopped.id, newVmId);
      assert.equal(stopped.status, "stopped");

      // 6. Remove VM
      const removeResult = await service.removeVm(newVmId);
      assert.deepEqual(removeResult, { removed: true, vmId: newVmId });

      // 7. List should only show seed VM
      const vmsAfterRemove = await service.listVms();
      assert.equal(vmsAfterRemove.length, 1);
      assert.equal(vmsAfterRemove[0].id, "vm-seed-1");
    });
  });

  describe("Next.js HTTP API Route Handlers", () => {
    it("completes full HTTP REST lifecycle with sanitized responses", async () => {
      // 1. GET /api/vms
      const getRes = await getVmsRoute();
      assert.equal(getRes.status, 200);
      const getBody = (await getRes.json()) as { vms: any[] };
      assert.equal(getBody.vms.length, 1);
      assert.equal(getBody.vms[0].id, "vm-seed-1");
      assert.equal(getBody.vms[0].agentToken, undefined);
      assert.equal(getBody.vms[0].pid, undefined);

      // 2. POST /api/vms (Create)
      const postReq = new Request("http://localhost/api/vms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runtime: "node24",
          vcpus: 2,
          memoryMib: 512,
        }),
      });
      const postRes = await createVmRoute(postReq);
      assert.equal(postRes.status, 201);
      const postBody = (await postRes.json()) as { vm: any };
      assert.ok(postBody.vm.id.startsWith("vm-integration-"));
      assert.equal(postBody.vm.runtime, "node24");
      assert.equal(postBody.vm.vcpus, 2);
      assert.equal(postBody.vm.memoryMib, 512);
      assert.equal(postBody.vm.agentToken, undefined);
      const createdId = postBody.vm.id;

      // 3. POST /api/vms/:id/start
      const startReq = new Request(`http://localhost/api/vms/${createdId}/start`, {
        method: "POST",
      });
      const startRes = await startVmRoute(startReq, { params: Promise.resolve({ id: createdId }) });
      assert.equal(startRes.status, 200);
      const startBody = (await startRes.json()) as { vm: any };
      assert.equal(startBody.vm.id, createdId);
      assert.equal(startBody.vm.status, "running");

      // 4. POST /api/vms/:id/stop
      const stopReq = new Request(`http://localhost/api/vms/${createdId}/stop`, {
        method: "POST",
      });
      const stopRes = await stopVmRoute(stopReq, { params: Promise.resolve({ id: createdId }) });
      assert.equal(stopRes.status, 200);
      const stopBody = (await stopRes.json()) as { vm: any };
      assert.equal(stopBody.vm.id, createdId);
      assert.equal(stopBody.vm.status, "stopped");

      // 5. DELETE /api/vms/:id
      const deleteReq = new Request(`http://localhost/api/vms/${createdId}`, {
        method: "DELETE",
      });
      const deleteRes = await removeVmRoute(deleteReq, { params: Promise.resolve({ id: createdId }) });
      assert.equal(deleteRes.status, 200);
      const deleteBody = (await deleteRes.json()) as { removed: boolean; vmId: string };
      assert.equal(deleteBody.removed, true);
      assert.equal(deleteBody.vmId, createdId);

      // 6. Verify GET /api/vms returns only initial seed VM
      const finalGetRes = await getVmsRoute();
      const finalGetBody = (await finalGetRes.json()) as { vms: any[] };
      assert.equal(finalGetBody.vms.length, 1);
      assert.equal(finalGetBody.vms[0].id, "vm-seed-1");
    });

    it("handles error responses gracefully over socket", async () => {
      // 1. Not Found (404)
      const startReq = new Request("http://localhost/api/vms/vm-nonexistent/start", {
        method: "POST",
      });
      const startRes = await startVmRoute(startReq, {
        params: Promise.resolve({ id: "vm-nonexistent" }),
      });
      assert.equal(startRes.status, 404);
      const startErrBody = await startRes.json();
      assert.equal(startErrBody.error.code, "VM_NOT_FOUND");

      // 2. Conflict / Invalid State (409) - Start already running VM
      // Start seed VM first
      await inMemoryService.start("vm-seed-1");
      const conflictReq = new Request("http://localhost/api/vms/vm-seed-1/start", {
        method: "POST",
      });
      const conflictRes = await startVmRoute(conflictReq, {
        params: Promise.resolve({ id: "vm-seed-1" }),
      });
      assert.equal(conflictRes.status, 409);
      const conflictErrBody = await conflictRes.json();
      assert.equal(conflictErrBody.error.code, "INVALID_VM_STATE");

      // 3. Manager Unavailable (503) when server is stopped
      await server?.close();
      server = null;

      const getRes = await getVmsRoute();
      assert.equal(getRes.status, 503);
      const getErrBody = await getRes.json();
      assert.equal(getErrBody.error.code, "MANAGER_UNAVAILABLE");
      assert.equal(getErrBody.error.message.includes(".sock"), false);
    });
  });
});
