import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET } from "../route";

/**
 * A stand-in manager, so the route is tested against the real socket transport
 * rather than a stubbed client object.
 *
 * The production route has no seam for injecting a client — it resolves the
 * socket from the environment on every request — so a fake listening socket is
 * both the honest and the only way to exercise it here. What is under test is
 * the mapping from manager records to the response shape; the framing and error
 * mapping are covered by the client and helpers suites.
 */
class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(join(tmpdir(), "vmsan-route-"));
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

describe("GET /api/vms route handler", () => {
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

  it("returns 200 and the VM list from the manager", async () => {
    await serve(
      listResponse([
        vm({ id: "vm-1691d65a", status: "running", vcpuCount: 2, memSizeMib: 512, runtime: "base" }),
        vm({ id: "vm-c5c6c204", status: "stopped", vcpuCount: 1, memSizeMib: 128 }),
      ])
    );

    const response = await GET();
    assert.equal(response.status, 200);

    const body = (await response.json()) as { vms: Record<string, unknown>[] };
    assert.equal(body.vms.length, 2);
    assert.deepEqual(body.vms[0], {
      id: "vm-1691d65a",
      status: "running",
      memoryMiB: 512,
      vcpus: 2,
      runtime: "base",
      age: body.vms[0]?.age,
    });
    // Age is computed from the wall clock, so its exact value belongs in the
    // presenter's own suite where `now` can be injected.
    assert.match(String(body.vms[0]?.age), /^\d+[smhd]$/);
    assert.equal(body.vms[1]?.id, "vm-c5c6c204");
    assert.equal(body.vms[1]?.status, "stopped");
  });

  it("reports an intermediate vmsan status as unknown rather than guessing", async () => {
    await serve(listResponse([vm({ status: "creating" })]));

    const response = await GET();
    const body = (await response.json()) as { vms: Record<string, unknown>[] };

    assert.equal(body.vms[0]?.status, "unknown");
  });

  it("renders createdAt as an age label", async () => {
    await serve(listResponse([vm({ createdAt: "2026-09-29T10:00:00.000Z" })]));

    const response = await GET();
    const body = (await response.json()) as { vms: Record<string, unknown>[] };

    assert.match(String(body.vms[0]?.age), /^\d+[smhd]$/);
  });

  it("returns an empty list rather than an error when no VMs exist", async () => {
    await serve(listResponse([]));

    const response = await GET();
    assert.equal(response.status, 200);

    const body = (await response.json()) as { vms: unknown[] };
    assert.deepEqual(body.vms, []);
  });

  it("never forwards a host path, pid, or token from the manager", async () => {
    await serve(
      listResponse([
        vm({
          pid: 22187,
          chrootDir: "/home/someone/.vmsan/vms/vm-1691d65a/rootfs",
          apiSocket: "/home/someone/.vmsan/vms/vm-1691d65a/api.sock",
          agentToken: "a-secret-token-value",
        }),
      ])
    );

    const response = await GET();
    const serialized = JSON.stringify(await response.json());

    assert.equal(serialized.includes("agentToken"), false);
    assert.equal(serialized.includes("a-secret-token-value"), false);
    assert.equal(serialized.includes("/home/someone"), false);
    assert.equal(serialized.includes("22187"), false);
  });

  it("returns 503 MANAGER_UNAVAILABLE when no manager is listening", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const response = await GET();
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
    assert.equal(body.error.message.includes("vmsan-manager-absent.sock"), false);
  });

  it("returns 502 MANAGER_PROTOCOL_ERROR when the manager answers off-contract", async () => {
    await serve((request) => JSON.stringify({ id: request.id, ok: true }));

    const response = await GET();
    assert.equal(response.status, 502);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_PROTOCOL_ERROR");
  });

  it("returns 500 carrying the manager's own error code", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "manager could not read VM records" },
      })
    );

    const response = await GET();
    assert.equal(response.status, 500);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INTERNAL_ERROR");
  });
});
