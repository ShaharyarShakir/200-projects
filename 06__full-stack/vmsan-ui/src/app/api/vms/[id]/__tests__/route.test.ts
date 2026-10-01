import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET, DELETE } from "../route";

class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(join(tmpdir(), "vmsan-route-id-"));
    this.socketPath = join(this.dir, "vmsan-manager.sock");
  }

  async start(): Promise<void> {
    this.server = createServer((socket: Socket) => {
      let buffer = "";
      socket.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const newline = buffer.indexOf("\n");
        if (newline === -1) {
          return;
        }
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        let response: string;
        try {
          response = this.respond(JSON.parse(line) as Record<string, unknown>);
        } catch {
          response = "";
        }
        if (response.length > 0) {
          socket.write(`${response}\n`);
        } else {
          socket.end();
        }
      });
      socket.on("error", () => undefined);
    });
    await new Promise<void>((resolve) => {
      this.server?.listen(this.socketPath, resolve);
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    rmSync(this.dir, { recursive: true, force: true });
  }
}

function vm(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "vm-1691d65a",
    status: "running",
    runtime: "fc",
    vcpuCount: 2,
    memSizeMib: 512,
    createdAt: "2026-09-29T10:00:00.000Z",
    snapshot: null,
    timeoutAt: null,
    tunnelHostnames: [],
    ...overrides,
  };
}

function listResponse(vms: unknown[]): (request: Record<string, unknown>) => string {
  return (request) =>
    JSON.stringify({ id: request.id, ok: true, result: { vms } });
}

describe("/api/vms/[id] route handler", () => {
  const originalSocket = process.env.VMSAN_MANAGER_SOCKET;
  let manager: FakeManager | null = null;

  afterEach(async () => {
    await manager?.stop();
    manager = null;
    if (originalSocket !== undefined) {
      process.env.VMSAN_MANAGER_SOCKET = originalSocket;
    } else {
      delete process.env.VMSAN_MANAGER_SOCKET;
    }
  });

  async function serve(
    respond: (request: Record<string, unknown>) => string
  ): Promise<void> {
    manager = new FakeManager(respond);
    await manager.start();
    process.env.VMSAN_MANAGER_SOCKET = manager.socketPath;
  }

  describe("GET /api/vms/[id]", () => {
    it("returns 200 and the requested VM presentation model", async () => {
      await serve(
        listResponse([
          vm({ id: "vm-1691d65a", status: "running", vcpuCount: 2, memSizeMib: 512, runtime: "node22" }),
          vm({ id: "vm-other-123", status: "stopped" }),
        ])
      );

      const request = new Request("http://localhost/api/vms/vm-1691d65a");
      const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
      const response = await GET(request, context);

      assert.equal(response.status, 200);
      const body = (await response.json()) as { vm: Record<string, unknown> };
      assert.equal(body.vm.id, "vm-1691d65a");
      assert.equal(body.vm.status, "running");
      assert.equal(body.vm.runtime, "node22");
      assert.equal(body.vm.vcpus, 2);
      assert.equal(body.vm.memoryMib, 512);
      assert.equal(body.vm.createdAt, "2026-09-29T10:00:00.000Z");
      assert.match(String(body.vm.age), /^\d+[smhd]$/);
    });

    it("returns 404 VM_NOT_FOUND when the requested VM does not exist", async () => {
      await serve(listResponse([vm({ id: "vm-1691d65a" })]));

      const request = new Request("http://localhost/api/vms/vm-not-found");
      const context = { params: Promise.resolve({ id: "vm-not-found" }) };
      const response = await GET(request, context);

      assert.equal(response.status, 404);
      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "VM_NOT_FOUND");
      assert.equal(body.error.message.includes("vm-not-found"), true);
    });

    it("returns 400 INVALID_REQUEST when ID is malformed before querying manager", async () => {
      const request = new Request("http://localhost/api/vms/bad-id;injection");
      const context = { params: Promise.resolve({ id: "bad-id;injection" }) };
      const response = await GET(request, context);

      assert.equal(response.status, 400);
      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
    });

    it("returns 503 MANAGER_UNAVAILABLE when manager socket is unreachable", async () => {
      process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "absent-socket.sock");

      const request = new Request("http://localhost/api/vms/vm-1691d65a");
      const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
      const response = await GET(request, context);

      assert.equal(response.status, 503);
      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
      assert.equal(body.error.message.includes("absent-socket.sock"), false);
    });
  });

  describe("DELETE /api/vms/[id]", () => {
    it("returns 200 with removal confirmation", async () => {
      await serve((request) => {
        if (request.method === "vm.remove") {
          return JSON.stringify({
            id: request.id,
            ok: true,
            result: { removed: true, vmId: "vm-1691d65a" },
          });
        }
        return JSON.stringify({ id: request.id, ok: false });
      });

      const request = new Request("http://localhost/api/vms/vm-1691d65a", { method: "DELETE" });
      const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
      const response = await DELETE(request, context);

      assert.equal(response.status, 200);
      const body = (await response.json()) as { removed: boolean; vmId: string; id: string };
      assert.equal(body.removed, true);
      assert.equal(body.vmId, "vm-1691d65a");
    });

    it("returns 400 on invalid VM ID", async () => {
      const request = new Request("http://localhost/api/vms/bad-id!@#", { method: "DELETE" });
      const context = { params: Promise.resolve({ id: "bad-id!@#" }) };
      const response = await DELETE(request, context);

      assert.equal(response.status, 400);
      const body = (await response.json()) as { error: { code: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
    });
  });
});
