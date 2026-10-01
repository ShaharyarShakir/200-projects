import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST } from "../route";

class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(join(tmpdir(), "vmsan-route-term-"));
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

describe("POST /api/vms/[id]/terminal route handler", () => {
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

  it("returns 200 with execution result when command succeeds", async () => {
    await serve((request) => {
      assert.equal(request.method, "vm.exec");
      const params = request.params as Record<string, unknown>;
      assert.equal(params.vmId, "vm-1691d65a");
      assert.equal(params.command, "uname -a");
      return JSON.stringify({
        id: request.id,
        ok: true,
        result: {
          exitCode: 0,
          stdout: "Linux microvm 6.1.0\n",
          stderr: "",
          durationMs: 42,
        },
      });
    });

    const request = new Request("http://localhost/api/vms/vm-1691d65a/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "uname -a" }),
    });
    const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    assert.deepEqual(body.data, {
      exitCode: 0,
      stdout: "Linux microvm 6.1.0\n",
      stderr: "",
      durationMs: 42,
    });
  });

  it("returns 400 when body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/vms/vm-1691d65a/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("returns 400 when VM ID is malformed", async () => {
    const request = new Request("http://localhost/api/vms/invalid!id/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "echo test" }),
    });
    const context = { params: Promise.resolve({ id: "invalid!id" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("returns 400 when command is empty", async () => {
    const request = new Request("http://localhost/api/vms/vm-1691d65a/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "   " }),
    });
    const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("returns 404 when manager reports VM_NOT_FOUND", async () => {
    await serve((request) => {
      return JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_NOT_FOUND", message: "MicroVM not found" },
      });
    });

    const request = new Request("http://localhost/api/vms/vm-not-found/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "echo hi" }),
    });
    const context = { params: Promise.resolve({ id: "vm-not-found" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 404);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "VM_NOT_FOUND");
  });

  it("returns 409 when manager reports VM_INVALID_STATE (e.g. VM is stopped)", async () => {
    await serve((request) => {
      return JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_INVALID_STATE", message: "MicroVM is not running" },
      });
    });

    const request = new Request("http://localhost/api/vms/vm-1691d65a/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "echo hi" }),
    });
    const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "INVALID_VM_STATE");
  });

  it("returns 503 when manager socket is unreachable", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "absent-socket.sock");

    const request = new Request("http://localhost/api/vms/vm-1691d65a/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "echo hi" }),
    });
    const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 503);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
  });

  it("returns 502 when manager returns malformed protocol response", async () => {
    await serve((request) => {
      return JSON.stringify({
        id: request.id,
        ok: true,
        // missing result
      });
    });

    const request = new Request("http://localhost/api/vms/vm-1691d65a/terminal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "echo hi" }),
    });
    const context = { params: Promise.resolve({ id: "vm-1691d65a" }) };
    const response = await POST(request, context);

    assert.equal(response.status, 502);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "MANAGER_PROTOCOL_ERROR");
  });
});
