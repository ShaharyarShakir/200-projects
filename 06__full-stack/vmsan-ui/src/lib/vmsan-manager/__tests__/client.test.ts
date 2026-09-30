import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { chmodSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createManagerClient, defaultSocketPath, unavailableMessage } from "../client";
import { resolveSocketPath } from "../../../../vmsan-manager/src/config";
import {
  ManagerProtocolError,
  ManagerRequestError,
  ManagerUnavailableError,
} from "../errors";

/**
 * A stand-in manager that answers a single request per connection.
 *
 * The real manager is exercised by the privileged integration run; here the
 * point is the client: framing, correlation, error mapping, and the guarantee
 * that every failure path settles rather than hanging.
 */
class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private readonly received: string[] = [];
  private readonly raw: string[] = [];

  constructor(
    private readonly respond: (request: Record<string, unknown>) => string | null
  ) {
    const dir = mkdtempSync(join(tmpdir(), "vmsan-client-"));
    this.socketPath = join(dir, "vmsan-manager.sock");
  }

  /** Frames with the newline delimiter stripped, ready to JSON.parse. */
  get requests(): string[] {
    return this.received;
  }

  /** Frames exactly as they arrived on the wire, delimiter included. */
  get rawRequests(): string[] {
    return this.raw;
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
        let response: string | null;
        try {
          response = this.respond(JSON.parse(line) as Record<string, unknown>);
        } catch {
          response = null;
        }
        this.raw.push(buffer.slice(0, newline + 1));
        if (response === null) {
          socket.end();
          return;
        }
        socket.write(`${response}\n`);
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
    if (!server) {
      return;
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  cleanup(): void {
    rmSync(join(this.socketPath, ".."), { recursive: true, force: true });
  }
}

const VM_FIXTURE = {
  id: "vm-1691d65a",
  status: "running",
  runtime: "fc",
  vcpuCount: 2,
  memSizeMib: 512,
  createdAt: "2026-09-29T10:00:00.000Z",
  snapshot: null,
  timeoutAt: null,
  tunnelHostnames: ["vm-1691d65a.example"],
};

describe("manager client - successful calls", () => {
  let manager: FakeManager | null = null;

  beforeEach(() => {
    manager = null;
  });

  afterEach(async () => {
    await manager?.stop();
    manager?.cleanup();
  });

  it("returns the health result", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({ id: request.id, ok: true, result: { status: "ok" } })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    assert.deepEqual(await client.health(), { status: "ok" });
  });

  it("returns the VM list", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { vms: [VM_FIXTURE] },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    assert.deepEqual(await client.list(), [VM_FIXTURE]);
  });

  it("returns an empty list rather than failing", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({ id: request.id, ok: true, result: { vms: [] } })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    assert.deepEqual(await client.list(), []);
  });

  it("creates a VM with custom parameters", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: VM_FIXTURE,
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    const vm = await client.createVm({
      runtime: "base",
      vcpus: 2,
      memoryMib: 512,
      diskSizeGb: 5,
    });

    assert.deepEqual(vm, VM_FIXTURE);
    const frame = JSON.parse(manager.requests[0] ?? "{}") as {
      method: string;
      params: Record<string, unknown>;
    };
    assert.equal(frame.method, "vm.create");
    assert.deepEqual(frame.params, {
      runtime: "base",
      vcpus: 2,
      memoryMib: 512,
      diskSizeGb: 5,
    });
  });

  it("creates a VM with default parameters when none provided", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: VM_FIXTURE,
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    const vm = await client.createVm();

    assert.deepEqual(vm, VM_FIXTURE);
    const frame = JSON.parse(manager.requests[0] ?? "{}") as {
      method: string;
      params?: unknown;
    };
    assert.equal(frame.method, "vm.create");
    assert.equal(frame.params, undefined);
  });

  it("starts a VM by ID", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { ...VM_FIXTURE, status: "running" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    const vm = await client.startVm("vm-1691d65a");

    assert.equal(vm.id, "vm-1691d65a");
    assert.equal(vm.status, "running");
    const frame = JSON.parse(manager.requests[0] ?? "{}") as {
      method: string;
      params: { vmId: string };
    };
    assert.equal(frame.method, "vm.start");
    assert.equal(frame.params.vmId, "vm-1691d65a");
  });

  it("stops a VM by ID", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { ...VM_FIXTURE, status: "stopped" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    const vm = await client.stopVm("vm-1691d65a");

    assert.equal(vm.id, "vm-1691d65a");
    assert.equal(vm.status, "stopped");
    const frame = JSON.parse(manager.requests[0] ?? "{}") as {
      method: string;
      params: { vmId: string };
    };
    assert.equal(frame.method, "vm.stop");
    assert.equal(frame.params.vmId, "vm-1691d65a");
  });

  it("removes a VM by ID", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { removed: true, vmId: "vm-1691d65a" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    const result = await client.removeVm("vm-1691d65a");

    assert.deepEqual(result, { removed: true, vmId: "vm-1691d65a" });
    const frame = JSON.parse(manager.requests[0] ?? "{}") as {
      method: string;
      params: { vmId: string };
    };
    assert.equal(frame.method, "vm.remove");
    assert.equal(frame.params.vmId, "vm-1691d65a");
  });

  it("sends a health request frame the manager can parse", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({ id: request.id, ok: true, result: { status: "ok" } })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    await client.health();

    const frame = JSON.parse(manager.requests[0] ?? "{}") as Record<string, unknown>;
    assert.equal(frame.method, "health");
    assert.equal(typeof frame.id, "string");

    // The manager splits on a newline, so a frame without one is never served.
    assert.equal(manager.rawRequests[0]?.endsWith("\n"), true);
    assert.equal(
      manager.rawRequests[0],
      `${JSON.stringify({ id: frame.id, method: "health" })}\n`
    );
  });

  it("gives each request a distinct id", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({ id: request.id, ok: true, result: { status: "ok" } })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    await client.health();
    await client.health();

    const ids = manager.requests.map(
      (line) => (JSON.parse(line) as { id: string }).id
    );
    assert.notEqual(ids[0], ids[1]);
  });
});

describe("manager client - socket path resolution", () => {
  it("prefers an explicit VMSAN_MANAGER_SOCKET", () => {
    assert.equal(
      defaultSocketPath({
        VMSAN_MANAGER_SOCKET: "/run/vmsan-manager.sock",
        XDG_RUNTIME_DIR: "/run/user/1000",
      }),
      "/run/vmsan-manager.sock"
    );
  });

  it("falls back to XDG_RUNTIME_DIR when no override is set", () => {
    assert.equal(
      defaultSocketPath({ XDG_RUNTIME_DIR: "/run/user/1000" }, 1000),
      "/run/user/1000/vmsan-manager.sock"
    );
  });

  it("falls back to a uid-based runtime path when XDG_RUNTIME_DIR is absent", () => {
    assert.equal(defaultSocketPath({}, 1000), "/run/user/1000/vmsan-manager.sock");
  });

  it("treats an empty override as unset rather than connecting to nothing", () => {
    assert.equal(
      defaultSocketPath({ VMSAN_MANAGER_SOCKET: "", XDG_RUNTIME_DIR: "/run/user/1000" }, 1000),
      "/run/user/1000/vmsan-manager.sock"
    );
  });

  it("resolves the same order the manager uses", () => {
    // Both sides must agree or the web app silently talks to nothing. The
    // manager resolves override, then XDG_RUNTIME_DIR, then the uid path.
    const withOverride = { VMSAN_MANAGER_SOCKET: "/run/vmsan-manager.sock" };
    const withRuntimeDir = { XDG_RUNTIME_DIR: "/run/user/1000" };

    for (const env of [withOverride, withRuntimeDir, {}]) {
      assert.equal(
        defaultSocketPath(env, 1000),
        resolveSocketPath(env, 1000),
        `client and manager disagree for ${JSON.stringify(env)}`
      );
    }
  });

  it("embeds no user home path or production socket path in the resolution code", () => {
    const source = readFileSync(new URL("../client.ts", import.meta.url), "utf8");
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");
    assert.equal(
      /\/home\/[A-Za-z0-9._-]+/.test(code),
      false,
      "client.ts must not embed a user home path"
    );
    assert.equal(
      /\/run\/vmsan-manager\.sock/.test(code),
      false,
      "client.ts must not embed a production socket path; it is configured"
    );
  });
});

describe("manager client - error mapping", () => {
  let manager: FakeManager | null = null;

  afterEach(async () => {
    await manager?.stop();
    manager?.cleanup();
  });

  it("raises ManagerUnavailableError when the socket does not exist", async () => {
    const client = createManagerClient({
      socketPath: join(tmpdir(), "vmsan-manager-absent.sock"),
      timeoutMs: 500,
    });

    await assert.rejects(client.health(), ManagerUnavailableError);
  });

  it("raises ManagerUnavailableError when the manager never answers", async () => {
    manager = new FakeManager(() => null);
    await manager.start();

    const client = createManagerClient({
      socketPath: manager.socketPath,
      timeoutMs: 200,
    });

    await assert.rejects(client.health(), ManagerUnavailableError);
  });

  it("raises ManagerProtocolError on a malformed JSON response", async () => {
    manager = new FakeManager(() => "not json at all");
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    await assert.rejects(client.health(), ManagerProtocolError);
  });

  it("raises ManagerProtocolError on a well-formed but off-contract response", async () => {
    manager = new FakeManager(() => JSON.stringify({ id: "1", ok: true }));
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    await assert.rejects(client.health(), ManagerProtocolError);
  });

  it("raises ManagerProtocolError when health returns the wrong status", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({ id: request.id, ok: true, result: { status: "degraded" } })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    await assert.rejects(client.health(), ManagerProtocolError);
  });

  it("raises ManagerProtocolError when the list payload is not VM records", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { vms: [{ id: "vm-1", secret: "should not be trusted" }] },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    await assert.rejects(client.list(), ManagerProtocolError);
  });

  it("raises ManagerProtocolError when create result is invalid", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { status: "not-a-vm" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    await assert.rejects(client.createVm(), ManagerProtocolError);
  });

  it("raises ManagerProtocolError when start result is invalid", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { status: "not-a-vm" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    await assert.rejects(client.startVm("vm-1"), ManagerProtocolError);
  });

  it("raises ManagerProtocolError when stop result is invalid", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { status: "not-a-vm" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    await assert.rejects(client.stopVm("vm-1"), ManagerProtocolError);
  });

  it("raises ManagerProtocolError when remove result is invalid", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { removed: "not-a-boolean" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });
    await assert.rejects(client.removeVm("vm-1"), ManagerProtocolError);
  });

  it("raises ManagerRequestError on a manager failure response", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "UNKNOWN_METHOD", message: 'Unknown method "stop"' },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    await assert.rejects(client.list(), (error: unknown) => {
      assert.ok(error instanceof ManagerRequestError);
      assert.equal(error.managerCode, "UNKNOWN_METHOD");
      return true;
    });
  });

  it("maps every unreachable errno to one message that names no path", async () => {
    const messages = ["ENOENT", "ECONNREFUSED", "EACCES"].map((code) =>
      unavailableMessage({ code } as NodeJS.ErrnoException)
    );

    assert.equal(
      new Set(messages).size,
      1,
      `one message for all three errnos, got ${JSON.stringify(messages)}`
    );
    for (const message of messages) {
      assert.equal(message.includes("/"), false, "message must not name a socket path");
      assert.equal(
        /ENOENT|ECONNREFUSED|EACCES/.test(message),
        false,
        "message must not name an errno"
      );
    }
  });

  it("still distinguishes an unexpected connection failure", () => {
    assert.equal(
      unavailableMessage({ code: "ECONNRESET" } as NodeJS.ErrnoException),
      "vmsan manager connection failed"
    );
  });

  it("raises the same unavailable error for an unreachable socket as for a missing one", async () => {
    // A socket file with no listener is the "service installed but not
    // running" case, which is the one an operator actually hits.
    const dead = join(mkdtempSync(join(tmpdir(), "vmsan-dead-")), "vmsan-manager.sock");
    const holder = createServer();
    await new Promise<void>((resolve) => holder.listen(dead, resolve));
    await new Promise<void>((resolve) => holder.close(() => resolve()));

    const client = createManagerClient({ socketPath: dead, timeoutMs: 500 });

    await assert.rejects(client.health(), (error: unknown) => {
      assert.ok(error instanceof ManagerUnavailableError);
      assert.equal(error.message, "vmsan manager socket is not reachable");
      assert.equal(error.message.includes(dead), false, "must not name the socket path");
      return true;
    });

    rmSync(join(dead, ".."), { recursive: true, force: true });
  });

  it("raises the same unavailable error when the socket is not accessible", async () => {
    // The mode the manager hands the socket in production is what a group
    // member gets. Removing every permission bit reproduces the not-a-member
    // case, which is the other thing an operator can get wrong.
    const dir = mkdtempSync(join(tmpdir(), "vmsan-eacces-"));
    const path = join(dir, "vmsan-manager.sock");
    const holder = createServer();
    await new Promise<void>((resolve) => holder.listen(path, resolve));
    chmodSync(path, 0o000);

    try {
      const client = createManagerClient({ socketPath: path, timeoutMs: 500 });
      await assert.rejects(client.health(), (error: unknown) => {
        assert.ok(error instanceof ManagerUnavailableError);
        assert.equal(error.message, "vmsan manager socket is not reachable");
        assert.equal(error.message.includes(path), false);
        return true;
      });
    } finally {
      chmodSync(path, 0o600);
      await new Promise<void>((resolve) => holder.close(() => resolve()));
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not leak host detail in an error message", async () => {
    manager = new FakeManager((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "manager rejected the request" },
      })
    );
    await manager.start();

    const client = createManagerClient({ socketPath: manager.socketPath });

    await assert.rejects(client.health(), (error: unknown) => {
      assert.ok(error instanceof ManagerRequestError);
      assert.equal(error.message, "manager rejected the request");
      assert.equal(error.stack?.includes("root"), false);
      return true;
    });
  });
});
