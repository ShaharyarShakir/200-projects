import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST } from "../route";

/**
 * Create is a privileged operation and goes through the manager socket.
 *
 * Two properties matter and are easy to get backwards. The route must not run
 * any vmsan command, because doing so would need privilege the web app does not
 * have. And it must still validate first, so an invalid request reports the
 * invalid request rather than a manager failure that hides the real problem.
 */

class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;
  readonly received: string[] = [];

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(join(tmpdir(), "vmsan-create-"));
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
    id: "vm-1691d65a",
    status: "stopped",
    runtime: "node22",
    vcpuCount: 2,
    memSizeMib: 512,
    createdAt: "2026-09-29T10:00:00.000Z",
    snapshot: null,
    timeoutAt: null,
    tunnelHostnames: [],
    ...overrides,
  };
}

function createRequest(body: unknown | string): Request {
  return new Request("http://localhost/api/vms", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

type ErrorBody = { error: { code: string; message: string } };

describe("POST /api/vms route handler", () => {
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

  it("returns 201 and the created VM presentation model", async () => {
    await serve((request) =>
      JSON.stringify({ id: request.id, ok: true, result: vm() })
    );

    const response = await POST(
      createRequest({ runtime: "node22", vcpus: 2, memoryMiB: 512 })
    );

    assert.equal(response.status, 201);
    const body = (await response.json()) as { vm: Record<string, unknown> };
    assert.equal(body.vm.id, "vm-1691d65a");
    assert.equal(body.vm.status, "stopped");
    assert.equal(body.vm.runtime, "node22");
    assert.equal(body.vm.vcpus, 2);
    assert.equal(body.vm.memoryMiB, 512);
    assert.match(String(body.vm.age), /^\d+[smhd]$/);
  });

  it("forwards only the validated create options over the socket", async () => {
    const fake = await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: vm({ runtime: "node22", vcpuCount: 2, memSizeMib: 512 }),
      })
    );

    const response = await POST(
      createRequest({
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
        command: "rm -rf /",
        flags: ["--danger"],
      })
    );

    assert.equal(response.status, 201);
    const frame = JSON.parse(fake.received[0] ?? "{}") as {
      method: string;
      params: Record<string, unknown>;
    };
    assert.equal(frame.method, "vm.create");
    assert.deepEqual(frame.params, {
      runtime: "node22",
      vcpus: 2,
      memoryMib: 512,
    });
    assert.equal("command" in frame.params, false);
    assert.equal("flags" in frame.params, false);
  });

  it("creates a VM with default options when the body is empty", async () => {
    const fake = await serve((request) =>
      JSON.stringify({ id: request.id, ok: true, result: vm({ runtime: "base" }) })
    );

    const response = await POST(createRequest({}));

    assert.equal(response.status, 201);
    const frame = JSON.parse(fake.received[0] ?? "{}") as {
      method: string;
      params?: unknown;
    };
    assert.equal(frame.method, "vm.create");
    assert.equal(frame.params, undefined);
  });

  it("rejects an invalid runtime before contacting the manager", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const response = await POST(createRequest({ runtime: "ruby3.2" }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid runtime"));
  });

  it("rejects vCPUs below 1 before contacting the manager", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const response = await POST(createRequest({ vcpus: 0 }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("vCPUs must be an integer"));
  });

  it("rejects memory below 128 MiB before contacting the manager", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const response = await POST(createRequest({ memoryMiB: 64 }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("memoryMiB must be an integer of at least 128"));
  });

  it("rejects a malformed body before contacting the manager", async () => {
    const response = await POST(createRequest("{ not-json"));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "Malformed JSON payload in request body");
  });

  it("rejects an empty body before contacting the manager", async () => {
    const response = await POST(createRequest(""));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("returns 503 MANAGER_UNAVAILABLE when no manager is listening", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const response = await POST(createRequest({ runtime: "node22" }));

    assert.equal(response.status, 503);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
    assert.equal(body.error.message.includes("vmsan-manager-absent.sock"), false);
  });

  it("returns 400 INVALID_REQUEST when the manager rejects the parameters", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "vcpus must be between 1 and 4" },
      })
    );

    const response = await POST(createRequest({ runtime: "node22", vcpus: 2 }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("returns 500 carrying the manager's own error code", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_OPERATION_FAILED", message: "jailer could not start" },
      })
    );

    const response = await POST(createRequest({ runtime: "node22" }));

    assert.equal(response.status, 500);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_OPERATION_FAILED");
  });

  it("invokes no vmsan command, even when a binary is configured", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";
    await serve((request) =>
      JSON.stringify({ id: request.id, ok: true, result: vm() })
    );

    const response = await POST(createRequest({ runtime: "node22" }));

    assert.equal(response.status, 201);
  });

  it("names no socket path, errno, or internal detail", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(tmpdir(), "vmsan-manager-absent.sock");

    const response = await POST(createRequest({ runtime: "node22" }));
    const serialized = JSON.stringify(await response.json());

    assert.equal(serialized.includes(".sock"), false);
    assert.equal(serialized.includes("/run/"), false);
    assert.equal(serialized.includes("ENOENT"), false);
  });
});
