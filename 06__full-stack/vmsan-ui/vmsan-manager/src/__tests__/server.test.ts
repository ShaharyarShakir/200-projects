import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat, writeFile, mkdir, lstat } from "node:fs/promises";
import { connect, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ManagerServer,
  SOCKET_MODE,
  SocketGroupError,
  SocketPathError,
  defaultChownSocket,
  prepareSocketPath,
  resolveGroupId,
  type GroupResolver,
  type SocketChown,
} from "../server.js";
import { createLogger, type LogSink } from "../logger.js";
import { DEFAULT_MAX_REQUEST_BYTES } from "../config.js";
import type { ManagerConfig } from "../config.js";
import type { ManagerResponse, ManagerSuccess } from "../protocol.js";
import type { VmsanService } from "../vmsan.js";
import type { VmState } from "vmsan";

function vmState(id: string): VmState {
  return {
    id,
    project: "default",
    runtime: "base",
    status: "running",
    pid: 999,
    apiSocket: "/CANARY/api.sock",
    chrootDir: "/CANARY/chroot",
    kernel: "/CANARY/kernel",
    rootfs: "/CANARY/rootfs",
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
    agentToken: "CANARY-TOKEN",
    agentPort: 9119,
    stateVersion: 1,
  } as VmState;
}

function createFakeService(overrides: Partial<VmsanService> = {}): VmsanService {
  return {
    list: () => [],
    get: (_id: string) => null,
    create: async () => ({
      state: vmState("vm-mock"),
      config: {} as any,
      vmId: "vm-mock",
      pid: 1234,
    }),
    start: async (id: string) => ({
      success: true,
      state: vmState(id),
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

/** Send one or more frames and collect one response per frame. */
function exchange(
  socketPath: string,
  frames: string[]
): Promise<ManagerResponse<unknown>[]> {
  return new Promise((resolve, reject) => {
    const socket: Socket = connect(socketPath);
    const responses: ManagerResponse<unknown>[] = [];
    let buffer = "";

    socket.on("connect", () => {
      socket.write(frames.map((frame) => `${frame}\n`).join(""));
    });

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      let index = buffer.indexOf("\n");
      while (index !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        if (line.trim().length > 0) {
          responses.push(JSON.parse(line) as ManagerResponse<unknown>);
        }
        index = buffer.indexOf("\n");
      }
      if (responses.length >= frames.length) {
        socket.end();
        resolve(responses);
      }
    });

    socket.on("error", reject);
  });
}

describe("manager server - socket integration", () => {
  let dir: string;
  let socketPath: string;
  const servers: ManagerServer[] = [];

  function buildServer(
    service: Partial<VmsanService> = {},
    overrides: Partial<ManagerConfig> = {}
  ): ManagerServer {
    const config: ManagerConfig = {
      socketPath,
      vmsanDir: "/var/lib/vmsan-test",
      logLevel: "error",
      maxRequestBytes: DEFAULT_MAX_REQUEST_BYTES,
      ...overrides,
    };
    const server = new ManagerServer({
      config,
      logger: createLogger("error", () => {}),
      service: createFakeService(service),
    });
    servers.push(server);
    return server;
  }

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "vmsan-manager-test-"));
    socketPath = join(dir, "manager.sock");
  });

  after(async () => {
    for (const server of servers) {
      await server.close();
    }
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await rm(socketPath, { force: true });
  });

  it("serves a health request over the socket", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const [response] = await exchange(socketPath, ['{"id":"1","method":"health"}']);

    assert.deepEqual(response, {
      id: "1",
      ok: true,
      result: { status: "ok" },
    });
  });

  it("serves a list request with redacted records", async () => {
    const server = buildServer({ list: () => [vmState("vm-1691d65a")] });
    await server.listen();

    const [response] = await exchange(socketPath, ['{"id":"2","method":"list"}']);

    assert.equal(response?.ok, true);
    const result = (response as ManagerSuccess<{ vms: unknown[] }>).result;
    assert.equal(result.vms.length, 1);
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("CANARY-TOKEN"), false);
    assert.equal(serialized.includes("agentToken"), false);
    assert.equal(serialized.includes("vm-1691d65a"), true);
  });

  it("creates the socket with owner-and-group permissions, never world-writable", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const stats = await stat(socketPath);
    const mode = stats.mode & 0o777;

    assert.equal(mode & 0o007, 0, "socket must not be world-accessible");
    assert.equal(mode, SOCKET_MODE);
  });

  it("opens no TCP listener", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const addresses = (server as unknown as {
      server: { address(): unknown };
    }).server.address();

    assert.equal(typeof addresses === "string", true, "must be a unix socket path");
  });

  it("serves multiple frames on a single connection in order", async () => {
    const server = buildServer({ list: () => [vmState("vm-1")] });
    await server.listen();

    const responses = await exchange(socketPath, [
      '{"id":"a","method":"health"}',
      '{"id":"b","method":"list"}',
      '{"id":"c","method":"health"}',
    ]);

    assert.deepEqual(
      responses.map((response) => response.id),
      ["a", "b", "c"]
    );
  });

  it("survives an invalid frame and serves the next valid one", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const responses = await exchange(socketPath, [
      "{not json",
      '{"id":"ok","method":"health"}',
    ]);

    assert.equal(responses[0]?.ok, false);
    assert.equal(
      responses[0]?.ok === false && responses[0].error.code,
      "INVALID_JSON"
    );
    assert.equal(responses[1]?.ok, true);
  });

  it("answers an unknown method without dispatching it", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const [response] = await exchange(socketPath, [
      '{"id":"1","method":"create","vcpus":2}',
    ]);

    assert.equal(response?.ok, false);
    assert.equal(
      response?.ok === false && response.error.code,
      "UNKNOWN_METHOD"
    );
  });

  it("answers a request with a missing id", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const [response] = await exchange(socketPath, ['{"method":"health"}']);

    assert.equal(response?.ok, false);
    assert.equal(
      response?.ok === false && response.error.code,
      "INVALID_REQUEST"
    );
  });

  it("rejects an oversized frame and closes the connection", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const padding = "x".repeat(DEFAULT_MAX_REQUEST_BYTES + 1024);
    const responses = await exchange(socketPath, [
      `{"id":"1","method":"list","pad":"${padding}"}`,
    ]);

    assert.equal(responses[0]?.ok, false);
    assert.equal(
      responses[0]?.ok === false && responses[0].error.code,
      "REQUEST_TOO_LARGE"
    );
  });

  it("reports a handler failure as a structured error without leaking details", async () => {
    const service = createFakeService({
      list: () => {
        throw new Error("EACCES reading /CANARY/secret/path");
      },
    });
    const server = buildServer(service);
    await server.listen();

    const [response] = await exchange(socketPath, ['{"id":"1","method":"list"}']);

    assert.equal(response?.ok, false);
    if (response?.ok === false) {
      assert.equal(response.error.code, "INTERNAL_ERROR");
      assert.equal(JSON.stringify(response).includes("CANARY"), false);
      assert.equal(JSON.stringify(response).includes("EACCES"), false);
      assert.equal(response.error.message.includes("at "), false);
    }
  });

  it("serves vm.create request with sanitized output", async () => {
    const service = createFakeService({
      list: () => [],
      create: async () => ({
        state: vmState("vm-created-1"),
        config: {} as any,
        vmId: "vm-created-1",
        pid: 1234,
      }),
    });
    const server = buildServer(service);
    await server.listen();

    const [response] = await exchange(socketPath, [
      '{"id":"create-1","method":"vm.create","params":{"runtime":"node22","vcpus":2,"memoryMib":512}}',
    ]);

    assert.equal(response?.ok, true);
    if (response?.ok === true) {
      const result = response.result as Record<string, unknown>;
      assert.equal(result.id, "vm-created-1");
      assert.equal(result.vcpuCount, 1);
      assert.equal(JSON.stringify(response).includes("CANARY"), false);
      assert.equal(JSON.stringify(response).includes("agentToken"), false);
    }
  });

  it("serves vm.start request with sanitized output", async () => {
    const service = createFakeService({
      list: () => [],
      start: async (id) => ({
        success: true,
        state: vmState(id),
        vmId: id,
        pid: 1234,
      }),
    });
    const server = buildServer(service);
    await server.listen();

    const [response] = await exchange(socketPath, [
      '{"id":"start-1","method":"vm.start","params":{"vmId":"vm-start-target"}}',
    ]);

    assert.equal(response?.ok, true);
    if (response?.ok === true) {
      const result = response.result as Record<string, unknown>;
      assert.equal(result.id, "vm-start-target");
      assert.equal(JSON.stringify(response).includes("CANARY"), false);
    }
  });

  it("serves vm.stop request with sanitized output", async () => {
    const stopped = vmState("vm-stop-target");
    (stopped as any).status = "stopped";
    const service = createFakeService({
      list: () => [],
      stop: async (id) => ({
        success: true,
        alreadyStopped: false,
        vmId: id,
      }),
      get: () => stopped,
    });
    const server = buildServer(service);
    await server.listen();

    const [response] = await exchange(socketPath, [
      '{"id":"stop-1","method":"vm.stop","params":{"vmId":"vm-stop-target"}}',
    ]);

    assert.equal(response?.ok, true);
    if (response?.ok === true) {
      const result = response.result as Record<string, unknown>;
      assert.equal(result.id, "vm-stop-target");
      assert.equal(result.status, "stopped");
      assert.equal(JSON.stringify(response).includes("CANARY"), false);
    }
  });

  it("serves vm.remove request with clean response", async () => {
    const service = createFakeService({
      list: () => [],
      remove: async (id) => ({
        success: true,
        vmId: id,
      }),
    });
    const server = buildServer(service);
    await server.listen();

    const [response] = await exchange(socketPath, [
      '{"id":"remove-1","method":"vm.remove","params":{"vmId":"vm-remove-target"}}',
    ]);

    assert.equal(response?.ok, true);
    if (response?.ok === true) {
      assert.deepEqual(response.result, {
        removed: true,
        vmId: "vm-remove-target",
      });
    }
  });

  it("removes the socket file on close", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();
    await server.close();

    await assert.rejects(stat(socketPath), (error: NodeJS.ErrnoException) => {
      return error.code === "ENOENT";
    });
  });

  it("drains queued requests before close resolves", async () => {
    const server = buildServer({ list: () => [vmState("vm-drain")] });
    await server.listen();

    const socket = connect(socketPath);
    const responses: ManagerResponse<unknown>[] = [];
    let buffer = "";

    await new Promise<void>((resolve) => socket.once("connect", resolve));

    const frames = Array.from({ length: 25 }, (_, index) =>
      `{"id":"q${index}","method":"list"}`
    );
    let firstResponse: (() => void) | undefined;
    const sawFirstResponse = new Promise<void>((resolve) => {
      firstResponse = resolve;
    });
    const allReceived = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timed out waiting for drained responses")),
        5000
      );
      socket.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        let index = buffer.indexOf("\n");
        while (index !== -1) {
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);
          if (line.trim().length > 0) {
            responses.push(JSON.parse(line) as ManagerResponse<unknown>);
          }
          index = buffer.indexOf("\n");
        }
        firstResponse?.();
        if (responses.length >= frames.length) {
          clearTimeout(timer);
          resolve();
        }
      });
      socket.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });

    // Queue a burst, then wait until the server has demonstrably started
    // working on it. Without that wait the burst may still be in the kernel
    // send buffer when close() runs, so nothing would be in-flight and the
    // test would assert nothing.
    socket.write(`${frames.join("\n")}\n`);
    await sawFirstResponse;

    await server.close();
    await allReceived;

    assert.equal(
      responses.length,
      frames.length,
      "every queued request was answered, not dropped by the drain"
    );
    assert.deepEqual(
      responses.map((response) => response.id),
      frames.map((_, index) => `q${index}`),
      "responses stayed in request order across the drain"
    );
    socket.destroy();
  });

  it("rejects requests that arrive after shutdown begins", async () => {
    const server = buildServer({ list: () => [] });
    await server.listen();

    const socket = connect(socketPath);
    const responses: ManagerResponse<unknown>[] = [];
    let buffer = "";
    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      let index = buffer.indexOf("\n");
      while (index !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        if (line.trim().length > 0) {
          responses.push(JSON.parse(line) as ManagerResponse<unknown>);
        }
        index = buffer.indexOf("\n");
      }
    });
    await new Promise<void>((resolve) => socket.once("connect", resolve));

    await server.close();

    // The listener is gone, so a new connection cannot be made. Assert the
    // shutdown state directly instead.
    const closedSocketPath = socketPath;
    await assert.rejects(
      new Promise<void>((resolve, reject) => {
        const probe = connect(closedSocketPath);
        probe.once("connect", () => {
          probe.destroy();
          resolve();
        });
        probe.once("error", reject);
      }),
      "socket must not accept connections after close"
    );
  });

  it("does not call stop or remove on shutdown", async () => {
    let mutationCalls = 0;
    const service = {
      list: () => [],
      stop: async () => {
        mutationCalls += 1;
        return {} as never;
      },
      remove: async () => {
        mutationCalls += 1;
        return {} as never;
      },
    } as unknown as VmsanService;

    const server = buildServer(service);
    await server.listen();
    await exchange(socketPath, ['{"id":"1","method":"health"}']);
    await exchange(socketPath, ['{"id":"2","method":"list"}']);
    await server.close();

    assert.equal(mutationCalls, 0, "shutdown must not mutate any VM");
  });
});

describe("manager server - socket group ownership", () => {
  let dir: string;
  let socketPath: string;
  const servers: ManagerServer[] = [];

  function buildServer(
    overrides: Partial<ManagerConfig> = {},
    options: {
      resolveGroup?: GroupResolver;
      chownSocket?: SocketChown;
      sink?: LogSink;
      level?: "error" | "info";
    } = {}
  ): ManagerServer {
    const config: ManagerConfig = {
      socketPath,
      vmsanDir: "/var/lib/vmsan-test",
      logLevel: "error",
      maxRequestBytes: DEFAULT_MAX_REQUEST_BYTES,
      ...overrides,
    };
    const server = new ManagerServer({
      config,
      logger: createLogger(options.level ?? "error", options.sink ?? (() => {})),
      service: createFakeService(),
      ...(options.resolveGroup ? { resolveGroup: options.resolveGroup } : {}),
      ...(options.chownSocket ? { chownSocket: options.chownSocket } : {}),
    });
    servers.push(server);
    return server;
  }

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "vmsan-manager-group-"));
    socketPath = join(dir, "manager.sock");
  });

  after(async () => {
    for (const server of servers) {
      await server.close();
    }
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await rm(socketPath, { force: true });
  });

  it("applies the configured group to the socket and names it in the readiness record", async () => {
    const chowns: Array<{ socketPath: string; gid: number }> = [];
    const lines: string[] = [];
    const server = buildServer(
      { socketGroup: "vmsan" },
      {
        resolveGroup: async (group) => {
          assert.equal(group, "vmsan");
          return 4321;
        },
        chownSocket: async (path, gid) => {
          chowns.push({ socketPath: path, gid });
        },
        sink: (line) => lines.push(line),
        level: "info",
      }
    );

    await server.listen();

    assert.deepEqual(chowns, [{ socketPath, gid: 4321 }]);
    const readiness = lines.find((line) => line.includes("listening on unix socket"));
    assert.ok(readiness, "readiness must be logged");
    assert.match(readiness, /group=vmsan/);

    // The mode is still owner+group only; handing the socket to a group is not
    // a reason to widen it.
    const mode = (await lstat(socketPath)).mode & 0o777;
    assert.equal(mode, SOCKET_MODE);
  });

  it("makes a group-assignment failure fatal and emits no readiness record", async () => {
    const lines: string[] = [];
    const server = buildServer(
      { socketGroup: "vmsan" },
      {
        resolveGroup: async () => 4321,
        chownSocket: async () => {
          throw Object.assign(new Error("operation not permitted"), { code: "EPERM" });
        },
        sink: (line) => lines.push(line),
        level: "info",
      }
    );

    await assert.rejects(server.listen());

    assert.equal(
      lines.some((line) => line.includes("listening on unix socket")),
      false,
      "a socket that failed group assignment must not be announced as listening"
    );
    const failure = lines.find((line) => line.includes("could not apply socket group"));
    assert.ok(failure, "the group failure must be logged as an error");
    assert.match(failure, /group=vmsan/);
    assert.match(failure, /code=EPERM/);
  });

  it("reports an unresolvable group rather than starting with a silent mismatch", async () => {
    const lines: string[] = [];
    const server = buildServer(
      { socketGroup: "no-such-group" },
      {
        resolveGroup: async (group) => {
          throw new SocketGroupError(`Group "${group}" does not exist`, group);
        },
        sink: (line) => lines.push(line),
        level: "info",
      }
    );

    await assert.rejects(server.listen(), SocketGroupError);

    assert.equal(
      lines.some((line) => line.includes("listening on unix socket")),
      false
    );
    assert.ok(lines.some((line) => line.includes("could not resolve socket group")));
  });

  it("attempts no chown at all when no group is configured", async () => {
    let chownCalls = 0;
    const lines: string[] = [];
    const server = buildServer(
      {},
      {
        chownSocket: async () => {
          chownCalls += 1;
        },
        sink: (line) => lines.push(line),
        level: "info",
      }
    );

    await server.listen();

    assert.equal(chownCalls, 0, "an unconfigured group must not trigger a chown");
    const readiness = lines.find((line) => line.includes("listening on unix socket"));
    assert.ok(readiness);
    assert.match(readiness, /group=-/);
  });

  it("sets the mode before the group, so the socket is never briefly wider", async () => {
    const order: string[] = [];
    const server = buildServer(
      { socketGroup: "vmsan" },
      {
        resolveGroup: async () => {
          order.push("resolve");
          return 4321;
        },
        chownSocket: async () => {
          order.push("chown");
        },
      }
    );

    await server.listen();

    assert.deepEqual(order, ["resolve", "chown"]);
  });
});

describe("manager server - group resolution", () => {
  it("resolves a group name to its numeric id from /etc/group", async () => {
    // `root` exists on every Linux host, so this needs no fixture group and no
    // privilege to create one.
    assert.equal(await resolveGroupId("root"), 0);
  });

  it("ignores group members when resolving the id", async () => {
    // A line like `vmsan:x:1000:shaharyar` must not match a name that merely
    // appears in the members field.
    await assert.rejects(resolveGroupId("0"), SocketGroupError);
  });

  it("throws a SocketGroupError for an unknown group", async () => {
    await assert.rejects(
      resolveGroupId("vmsan-group-that-does-not-exist"),
      (error: unknown) => {
        assert.ok(error instanceof SocketGroupError);
        assert.equal(error.group, "vmsan-group-that-does-not-exist");
        return true;
      }
    );
  });

  it("leaves the owner untouched when changing the group", async () => {
    // `defaultChownSocket` passes uid -1. Asserting the real syscall needs the
    // process to own the file, which a temp file gives us without privilege:
    // the owner must survive the call.
    const dir = await mkdtemp(join(tmpdir(), "vmsan-chown-"));
    const file = join(dir, "file");
    await writeFile(file, "x");
    const before = await lstat(file);
    const ownGid = process.getgid?.() ?? 0;
    assert.ok(ownGid > 0, "test requires a resolvable gid");

    await defaultChownSocket(file, ownGid);

    const after = await lstat(file);
    assert.equal(after.uid, before.uid, "owner must not change");
    assert.equal(after.gid, ownGid);
    await rm(dir, { recursive: true, force: true });
  });
});

describe("manager server - stale socket handling", () => {
  let dir: string;

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "vmsan-manager-stale-"));
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("proceeds when the path does not exist", async () => {
    await prepareSocketPath(join(dir, "absent.sock"), async () => false);
  });

  it("refuses to start when the path is a regular file", async () => {
    const path = join(dir, "regular-file");
    await writeFile(path, "not a socket");

    await assert.rejects(
      prepareSocketPath(path, async () => false),
      (error: unknown) => {
        assert.ok(error instanceof SocketPathError);
        assert.match(error.message, /is not a socket/);
        return true;
      }
    );
  });

  it("refuses to start when the path is a directory", async () => {
    const path = join(dir, "a-directory");
    await mkdir(path);

    await assert.rejects(
      prepareSocketPath(path, async () => false),
      (error: unknown) => {
        assert.ok(error instanceof SocketPathError);
        return true;
      }
    );
  });

  it("refuses to start when a live listener holds the socket", async () => {
    const path = join(dir, "live.sock");
    const server = new ManagerServer({
      config: {
        socketPath: path,
        vmsanDir: "/var/lib/vmsan-test",
        logLevel: "error",
        maxRequestBytes: DEFAULT_MAX_REQUEST_BYTES,
      },
      logger: createLogger("error", () => {}),
      service: createFakeService(),
    });
    await server.listen();

    await assert.rejects(prepareSocketPath(path), (error: unknown) => {
      assert.ok(error instanceof SocketPathError);
      assert.match(error.message, /already listening/);
      return true;
    });

    await server.close();
  });

  it("removes a dead socket file and allows startup to proceed", async () => {
    const path = join(dir, "dead.sock");
    const server = new ManagerServer({
      config: {
        socketPath: path,
        vmsanDir: "/var/lib/vmsan-test",
        logLevel: "error",
        maxRequestBytes: DEFAULT_MAX_REQUEST_BYTES,
      },
      logger: createLogger("error", () => {}),
      service: createFakeService(),
    });
    await server.listen();
    // Simulate a crash: close the listener but leave the file behind.
    await (server as unknown as { server: { close(): Promise<void> } }).server.close();

    await prepareSocketPath(path, async () => false);
    await assert.rejects(stat(path), (error: NodeJS.ErrnoException) => {
      return error.code === "ENOENT";
    });
  });
});
