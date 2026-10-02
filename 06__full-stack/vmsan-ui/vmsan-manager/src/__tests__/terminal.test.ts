import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { connect, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { VmState } from "vmsan";
import {
  MSG_DATA,
  MSG_READY,
  MSG_RESIZE,
  TerminalSessionService,
  parseBinaryMessage,
  serializeData,
  serializeReady,
  serializeResize,
  type TerminalWebSocketLike,
} from "../terminal-service.js";
import { ManagerServer } from "../server.js";
import { createLogger } from "../logger.js";
import { DEFAULT_MAX_REQUEST_BYTES, type ManagerConfig } from "../config.js";
import type { VmsanService } from "../vmsan.js";

class MockWebSocket extends EventEmitter implements TerminalWebSocketLike {
  public readyState = 1; // OPEN
  public sent: Buffer[] = [];
  public closed = false;
  public url: string;

  constructor(url: string) {
    super();
    this.url = url;
    // Auto-open on next tick
    process.nextTick(() => {
      this.emit("open");
    });
  }

  send(data: unknown, cb?: (err?: Error) => void): void {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
    this.sent.push(buf);
    if (cb) cb();
  }

  close(code = 1000, reason = ""): void {
    this.closed = true;
    this.readyState = 3; // CLOSED
    this.emit("close", code, Buffer.from(reason));
  }

  terminate(): void {
    this.close(1006, "terminated");
  }
}

function fakeVmState(id: string, status: "running" | "stopped" = "running"): VmState {
  return {
    id,
    project: "default",
    runtime: "base",
    status,
    pid: 999,
    apiSocket: "/tmp/api.sock",
    chrootDir: "/tmp/chroot",
    kernel: "/tmp/kernel",
    rootfs: "/tmp/rootfs",
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
    agentToken: "CANARY-TOKEN-123",
    agentPort: 8080,
    stateVersion: 1,
  } as VmState;
}

function createFakeService(overrides: Partial<VmsanService> = {}): VmsanService {
  return {
    list: () => [],
    get: () => null,
    create: async () => ({
      state: fakeVmState("vm-mock"),
      config: {} as any,
      vmId: "vm-mock",
      pid: 1234,
    }),
    start: async (id: string) => ({
      success: true,
      state: fakeVmState(id),
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

describe("terminal framing & binary protocol", () => {
  it("serializes and parses data messages", () => {
    const raw = "echo hello\n";
    const serialized = serializeData(raw);
    assert.equal(serialized[0], MSG_DATA);

    const parsed = parseBinaryMessage(serialized);
    assert.ok(parsed);
    assert.equal(parsed.type, MSG_DATA);
    assert.equal(parsed.data?.toString("utf8"), raw);
  });

  it("serializes and parses resize messages", () => {
    const serialized = serializeResize(120, 40);
    assert.equal(serialized[0], MSG_RESIZE);

    const parsed = parseBinaryMessage(serialized);
    assert.ok(parsed);
    assert.equal(parsed.type, MSG_RESIZE);
    assert.equal(parsed.cols, 120);
    assert.equal(parsed.rows, 40);
  });

  it("serializes and parses ready messages", () => {
    const serialized = serializeReady();
    assert.equal(serialized[0], MSG_READY);

    const parsed = parseBinaryMessage(serialized);
    assert.ok(parsed);
    assert.equal(parsed.type, MSG_READY);
  });

  it("returns null on empty or invalid messages", () => {
    assert.equal(parseBinaryMessage(Buffer.alloc(0)), null);
    assert.equal(parseBinaryMessage(Buffer.from([0x99])), null);
    assert.equal(parseBinaryMessage(Buffer.from([MSG_RESIZE, 0, 1])), null); // too short
  });
});

describe("TerminalSessionService", () => {
  let createdSockets: MockWebSocket[] = [];
  let service: TerminalSessionService;

  beforeEach(() => {
    createdSockets = [];
    service = new TerminalSessionService((url) => {
      const ws = new MockWebSocket(url);
      createdSockets.push(ws);
      return ws;
    });
  });

  it("opens a terminal session and sends ready + resize frames", async () => {
    const vmsanService = createFakeService({
      get: (id) => (id === "vm-1" ? fakeVmState("vm-1") : null),
    });

    const outputs: string[] = [];
    const exits: number[] = [];
    const errors: Error[] = [];

    const result = await service.openSession(
      vmsanService,
      { vmId: "vm-1", cols: 80, rows: 24 },
      {
        onOutput: (d) => outputs.push(d),
        onExit: (code) => exits.push(code ?? 0),
        onError: (err) => errors.push(err),
      }
    );

    assert.ok(result.sessionId.startsWith("term-"));
    assert.equal(result.vmId, "vm-1");
    assert.equal(service.activeSessionCount, 1);
    assert.ok(service.hasSession(result.sessionId));

    const ws = createdSockets[0];
    assert.ok(ws);
    assert.ok(ws.url.includes("ws://10.0.0.2:8080/ws/shell"));
    assert.ok(ws.url.includes("token=CANARY-TOKEN-123"));

    // Check ready and resize frames sent
    assert.equal(ws.sent[0]?.[0], MSG_READY);
    const resizeMsg = parseBinaryMessage(ws.sent[1]!);
    assert.equal(resizeMsg?.type, MSG_RESIZE);
    assert.equal(resizeMsg?.cols, 80);
    assert.equal(resizeMsg?.rows, 24);

    // Simulate guest output
    ws.emit("message", serializeData("prompt$ "), true);
    assert.deepEqual(outputs, ["prompt$ "]);

    // Send input from client
    await service.sendInput({ sessionId: result.sessionId, data: "ls\n" });
    const inputMsg = parseBinaryMessage(ws.sent[2]!);
    assert.equal(inputMsg?.type, MSG_DATA);
    assert.equal(inputMsg?.data?.toString("utf8"), "ls\n");

    // Send resize from client
    await service.resizeTerminal({ sessionId: result.sessionId, cols: 100, rows: 30 });
    const newResize = parseBinaryMessage(ws.sent[3]!);
    assert.equal(newResize?.type, MSG_RESIZE);
    assert.equal(newResize?.cols, 100);
    assert.equal(newResize?.rows, 30);

    // Close session
    const closeRes = await service.closeSession({ sessionId: result.sessionId });
    assert.equal(closeRes.closed, true);
    assert.equal(service.activeSessionCount, 0);
  });

  it("sets user=root when sudo is requested", async () => {
    const vmsanService = createFakeService({
      get: (id) => (id === "vm-root" ? fakeVmState("vm-root") : null),
    });

    await service.openSession(
      vmsanService,
      { vmId: "vm-root", sudo: true },
      { onOutput: () => {}, onExit: () => {}, onError: () => {} }
    );

    const ws = createdSockets[0];
    assert.ok(ws);
    assert.ok(ws.url.includes("user=root"));
  });

  it("rejects opening session if VM is not found or not running", async () => {
    const vmsanService = createFakeService({
      get: (id) => {
        if (id === "vm-stopped") return fakeVmState("vm-stopped", "stopped");
        return null;
      },
    });

    await assert.rejects(
      () =>
        service.openSession(
          vmsanService,
          { vmId: "vm-missing" },
          { onOutput: () => {}, onExit: () => {}, onError: () => {} }
        ),
      (err: any) => err.code === "ERR_VM_NOT_FOUND"
    );

    await assert.rejects(
      () =>
        service.openSession(
          vmsanService,
          { vmId: "vm-stopped" },
          { onOutput: () => {}, onExit: () => {}, onError: () => {} }
        ),
      (err: any) => err.code === "ERR_VM_NOT_RUNNING"
    );
  });

  it("cleans up sessions on closeSessionsForVm", async () => {
    const vmsanService = createFakeService({
      get: (id) => fakeVmState(id),
    });

    const s1 = await service.openSession(
      vmsanService,
      { vmId: "vm-a" },
      { onOutput: () => {}, onExit: () => {}, onError: () => {} }
    );
    const s2 = await service.openSession(
      vmsanService,
      { vmId: "vm-b" },
      { onOutput: () => {}, onExit: () => {}, onError: () => {} }
    );

    assert.equal(service.activeSessionCount, 2);

    service.closeSessionsForVm("vm-a");
    assert.equal(service.activeSessionCount, 1);
    assert.equal(service.hasSession(s1.sessionId), false);
    assert.equal(service.hasSession(s2.sessionId), true);
  });
});

describe("ManagerServer terminal RPC & streaming integration", () => {
  let tempDir: string;
  let socketPath: string;
  let server: ManagerServer;
  let vmsanService: VmsanService;
  let createdSockets: MockWebSocket[];

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "vmsan-manager-term-test-"));
    socketPath = join(tempDir, "manager.sock");
    createdSockets = [];

    vmsanService = createFakeService({
      get: (id) => (id === "vm-live" ? fakeVmState("vm-live") : null),
      list: () => [fakeVmState("vm-live")],
    });

    const config: ManagerConfig = {
      socketPath,
      vmsanDir: tempDir,
      logLevel: "error",
      maxRequestBytes: DEFAULT_MAX_REQUEST_BYTES,
    };

    server = new ManagerServer({
      config,
      logger: createLogger("error", () => {}),
      service: vmsanService,
      preparePath: async () => {},
      resolveGroup: async () => 1000,
      chownSocket: async () => {},
      wsFactory: (url) => {
        const ws = new MockWebSocket(url);
        createdSockets.push(ws);
        return ws;
      },
    });

    await server.listen();
  });

  afterEach(async () => {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("handles terminal.open, terminal.input, and streams stdout over unix socket", async () => {
    const client: Socket = connect(socketPath);
    const receivedFrames: any[] = [];

    let buffer = "";
    client.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let idx = buffer.indexOf("\n");
      while (idx !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.trim()) {
          receivedFrames.push(JSON.parse(line));
        }
        idx = buffer.indexOf("\n");
      }
    });

    // Send terminal.open
    client.write(
      JSON.stringify({
        id: "req-1",
        method: "terminal.open",
        params: { vmId: "vm-live", cols: 80, rows: 24 },
      }) + "\n"
    );

    // Wait for response
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (receivedFrames.some((f) => f.id === "req-1")) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    const openResp = receivedFrames.find((f) => f.id === "req-1");
    assert.equal(openResp.ok, true);
    const sessionId = openResp.result.sessionId;
    assert.ok(sessionId);

    // Simulate agent sending output
    const ws = createdSockets[0];
    assert.ok(ws);
    ws.emit("message", serializeData("welcome to microvm\n"), true);

    // Wait for streamed output frame
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (receivedFrames.some((f) => f.type === "output")) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    const outputFrame = receivedFrames.find((f) => f.type === "output");
    assert.equal(outputFrame.data, "welcome to microvm\n");

    // Send terminal.input
    client.write(
      JSON.stringify({
        id: "req-2",
        method: "terminal.input",
        params: { sessionId, data: "uptime\n" },
      }) + "\n"
    );

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (receivedFrames.some((f) => f.id === "req-2")) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    const inputResp = receivedFrames.find((f) => f.id === "req-2");
    assert.equal(inputResp.ok, true);

    // Send terminal.close
    client.write(
      JSON.stringify({
        id: "req-3",
        method: "terminal.close",
        params: { sessionId },
      }) + "\n"
    );

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (receivedFrames.some((f) => f.id === "req-3")) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    const closeResp = receivedFrames.find((f) => f.id === "req-3");
    assert.equal(closeResp.ok, true);

    client.end();
  });
});
