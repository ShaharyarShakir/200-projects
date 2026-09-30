import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST } from "../[id]/start/route";

/**
 * Start is a privileged operation and goes through the manager socket.
 *
 * The route validates the id first so an invalid request never opens a
 * connection, then forwards the id and returns the projected VM record.
 */

class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;
  readonly received: string[] = [];

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(join(tmpdir(), "vmsan-start-"));
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
        this.received.push(line);
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
    id: "vm-mock1",
    status: "running",
    runtime: "base",
    vcpuCount: 1,
    memSizeMib: 128,
    createdAt: "2026-09-29T10:00:00.000Z",
    snapshot: null,
    timeoutAt: null,
    tunnelHostnames: [],
    ...overrides,
  };
}

type ErrorBody = { error: { code: string; message: string } };

function startRequest(id: string): {
  request: Request;
  context: { params: Promise<{ id: string }> };
} {
  return {
    request: new Request(`http://localhost/api/vms/${encodeURIComponent(id)}/start`, {
      method: "POST",
    }),
    context: { params: Promise.resolve({ id }) },
  };
}

describe("POST /api/vms/:id/start route handler", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;
  const originalSocket = process.env.VMSAN_MANAGER_SOCKET;
  let manager: FakeManager | null = null;

  afterEach(async () => {
    await manager?.stop();
    manager = null;
    if (originalBinPath !== undefined) {
      process.env.VMSAN_BIN_PATH = originalBinPath;
    } else {
      delete process.env.VMSAN_BIN_PATH;
    }
    if (originalSocket !== undefined) {
      process.env.VMSAN_MANAGER_SOCKET = originalSocket;
    } else {
      delete process.env.VMSAN_MANAGER_SOCKET;
    }
  });

  async function serve(
    respond: (request: Record<string, unknown>) => string
  ): Promise<FakeManager> {
    manager = new FakeManager(respond);
    await manager.start();
    process.env.VMSAN_MANAGER_SOCKET = manager.socketPath;
    return manager;
  }

  it("returns 200 and the updated VM presentation model", async () => {
    const fake = await serve((request) =>
      JSON.stringify({ id: request.id, ok: true, result: vm() })
    );

    const { request, context } = startRequest("vm-mock1");
    const response = await POST(request, context);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { vm: Record<string, unknown> };
    assert.equal(body.vm.id, "vm-mock1");
    assert.equal(body.vm.status, "running");

    const frame = JSON.parse(fake.received[0] ?? "{}") as {
      method: string;
      params: { vmId: string };
    };
    assert.equal(frame.method, "vm.start");
    assert.equal(frame.params.vmId, "vm-mock1");
  });

  it("rejects an invalid VM ID with 400 INVALID_REQUEST, without contacting the manager", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const { request, context } = startRequest("bad;id");
    const response = await POST(request, context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid VM ID"));
  });

  for (const id of ["", "a".repeat(65), "vm 123", "$(whoami)", "../../etc/passwd"]) {
    it(`rejects ${JSON.stringify(id)} as an invalid VM ID`, async () => {
      const { request, context } = startRequest(id);

      const response = await POST(request, context);

      assert.equal(response.status, 400);
      const body = (await response.json()) as ErrorBody;
      assert.equal(body.error.code, "INVALID_REQUEST");
    });
  }

  it("returns 404 VM_NOT_FOUND when the manager cannot find the VM", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_NOT_FOUND", message: "VM not found: vm-missing" },
      })
    );

    const { request, context } = startRequest("vm-missing");
    const response = await POST(request, context);

    assert.equal(response.status, 404);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_NOT_FOUND");
  });

  it("returns 409 INVALID_VM_STATE when the VM is already running", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_INVALID_STATE", message: "VM vm-mock1 is already running" },
      })
    );

    const { request, context } = startRequest("vm-mock1");
    const response = await POST(request, context);

    assert.equal(response.status, 409);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_VM_STATE");
  });

  it("returns 503 MANAGER_UNAVAILABLE when no manager is listening", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const { request, context } = startRequest("vm-mock1");
    const response = await POST(request, context);

    assert.equal(response.status, 503);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
  });

  it("invokes no vmsan command", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";
    await serve((request) =>
      JSON.stringify({ id: request.id, ok: true, result: vm() })
    );

    const { request, context } = startRequest("vm-mock1");
    const response = await POST(request, context);

    assert.equal(response.status, 200);
  });

  it("names no socket path or errno in the message", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const { request, context } = startRequest("vm-mock1");
    const response = await POST(request, context);
    const serialized = JSON.stringify(await response.json());

    assert.equal(serialized.includes(".sock"), false);
    assert.equal(serialized.includes("/run/"), false);
    assert.equal(serialized.includes("ENOENT"), false);
  });
});
