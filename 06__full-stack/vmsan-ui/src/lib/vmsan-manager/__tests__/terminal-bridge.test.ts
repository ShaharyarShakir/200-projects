import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EventEmitter } from "node:events";
import {
  bridgeTerminalWebSocket,
  type WebSocketLike,
} from "../terminal-bridge";

class MockWebSocket extends EventEmitter implements WebSocketLike {
  public sent: string[] = [];
  public closed = false;
  public closeCode?: number;
  public closeReason?: string;

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.closed = true;
    this.closeCode = code;
    this.closeReason = reason;
    this.emit("close", code ?? 1000, reason ?? "");
  }

  simulateMessage(data: string): void {
    this.emit("message", data);
  }

  simulateError(err: Error): void {
    this.emit("error", err);
  }
}

class FakeManagerServer {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;
  public activeSocket: Socket | null = null;
  public receivedLines: string[] = [];

  constructor(
    private readonly onLine?: (
      line: string,
      socket: Socket
    ) => void
  ) {
    this.dir = mkdtempSync(join(tmpdir(), "term-bridge-test-"));
    this.socketPath = join(this.dir, "vmsan-manager.sock");
  }

  async start(): Promise<void> {
    this.server = createServer((socket: Socket) => {
      this.activeSocket = socket;
      let buffer = "";

      socket.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        let newlineIndex = buffer.indexOf("\n");
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          this.receivedLines.push(line);
          this.onLine?.(line, socket);
          newlineIndex = buffer.indexOf("\n");
        }
      });
    });

    await new Promise<void>((resolve) => {
      this.server?.listen(this.socketPath, resolve);
    });
  }

  async stop(): Promise<void> {
    if (this.activeSocket) {
      this.activeSocket.destroy();
      this.activeSocket = null;
    }
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve());
      });
      this.server = null;
    }
    rmSync(this.dir, { recursive: true, force: true });
  }
}

describe("TerminalBridge - WebSocket to Manager Socket Bridge", () => {
  let fakeManager: FakeManagerServer | null = null;

  afterEach(async () => {
    await fakeManager?.stop();
    fakeManager = null;
  });

  it("rejects invalid VM ID immediately without opening socket", () => {
    const ws = new MockWebSocket();
    const handle = bridgeTerminalWebSocket(ws, {
      vmId: "invalid!id;rm -rf /",
    });

    assert.equal(handle.getSessionId(), null);
    assert.equal(ws.closed, true);
    assert.equal(ws.closeCode, 1008);
    assert.equal(ws.sent.length, 1);
    const sentMsg = JSON.parse(ws.sent[0]);
    assert.equal(sentMsg.type, "error");
  });

  it("sends terminal.open and forwards ready frame to WebSocket client", async () => {
    fakeManager = new FakeManagerServer((line, socket) => {
      const parsed = JSON.parse(line);
      if (parsed.method === "terminal.open") {
        const response = {
          id: parsed.id,
          ok: true,
          result: {
            sessionId: "session-abc-123",
            vmId: "vm-123",
            createdAt: new Date().toISOString(),
          },
        };
        socket.write(`${JSON.stringify(response)}\n`);
      }
    });
    await fakeManager.start();

    const ws = new MockWebSocket();
    const handle = bridgeTerminalWebSocket(ws, {
      vmId: "vm-123",
      sudo: true,
      cols: 100,
      rows: 30,
      socketPath: fakeManager.socketPath,
    });

    // Wait for connection and exchange
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (ws.sent.length > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    assert.equal(handle.getSessionId(), "session-abc-123");
    assert.equal(ws.sent.length, 1);
    const readyFrame = JSON.parse(ws.sent[0]);
    assert.deepEqual(readyFrame, {
      type: "ready",
      sessionId: "session-abc-123",
    });

    // Verify manager received open frame
    assert.ok(fakeManager.receivedLines.length >= 1);
    const openReq = JSON.parse(fakeManager.receivedLines[0]);
    assert.equal(openReq.method, "terminal.open");
    assert.deepEqual(openReq.params, {
      vmId: "vm-123",
      cols: 100,
      rows: 30,
      sudo: true,
    });

    handle.close();
  });

  it("routes input and resize client messages to manager socket", async () => {
    fakeManager = new FakeManagerServer((line, socket) => {
      const parsed = JSON.parse(line);
      if (parsed.method === "terminal.open") {
        const response = {
          id: parsed.id,
          ok: true,
          result: {
            sessionId: "session-xyz",
            vmId: "vm-123",
            createdAt: new Date().toISOString(),
          },
        };
        socket.write(`${JSON.stringify(response)}\n`);
      }
    });
    await fakeManager.start();

    const ws = new MockWebSocket();
    const handle = bridgeTerminalWebSocket(ws, {
      vmId: "vm-123",
      socketPath: fakeManager.socketPath,
    });

    // Wait until ready
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (handle.getSessionId() === "session-xyz") {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    // Send input from client
    ws.simulateMessage(JSON.stringify({ type: "input", data: "ls -la\n" }));

    // Send resize from client
    ws.simulateMessage(JSON.stringify({ type: "resize", cols: 120, rows: 40 }));

    // Wait for manager to receive lines
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (fakeManager?.receivedLines.length === 3) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    const inputReq = JSON.parse(fakeManager.receivedLines[1]);
    assert.equal(inputReq.method, "terminal.input");
    assert.deepEqual(inputReq.params, {
      sessionId: "session-xyz",
      data: "ls -la\n",
    });

    const resizeReq = JSON.parse(fakeManager.receivedLines[2]);
    assert.equal(resizeReq.method, "terminal.resize");
    assert.deepEqual(resizeReq.params, {
      sessionId: "session-xyz",
      cols: 120,
      rows: 40,
    });

    handle.close();
  });

  it("streams output and exit frames from manager socket to client WebSocket", async () => {
    fakeManager = new FakeManagerServer((line, socket) => {
      const parsed = JSON.parse(line);
      if (parsed.method === "terminal.open") {
        socket.write(
          `${JSON.stringify({
            id: parsed.id,
            ok: true,
            result: {
              sessionId: "session-stream",
              vmId: "vm-123",
              createdAt: new Date().toISOString(),
            },
          })}\n`
        );
      }
    });
    await fakeManager.start();

    const ws = new MockWebSocket();
    const handle = bridgeTerminalWebSocket(ws, {
      vmId: "vm-123",
      socketPath: fakeManager.socketPath,
    });

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (handle.getSessionId() === "session-stream") {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    // Emit streaming messages from manager socket
    fakeManager.activeSocket?.write(
      `${JSON.stringify({ type: "output", data: "total 0\n" })}\n`
    );
    fakeManager.activeSocket?.write(
      `${JSON.stringify({ type: "exit", exitCode: 0 })}\n`
    );

    // Wait for messages to arrive at client WS
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (ws.sent.length === 3) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    assert.equal(ws.sent.length, 3);
    assert.deepEqual(JSON.parse(ws.sent[0]), {
      type: "ready",
      sessionId: "session-stream",
    });
    assert.deepEqual(JSON.parse(ws.sent[1]), {
      type: "output",
      data: "total 0\n",
    });
    assert.deepEqual(JSON.parse(ws.sent[2]), {
      type: "exit",
      exitCode: 0,
    });

    handle.close();
  });

  it("handles manager terminal.open error and propagates to client WebSocket", async () => {
    fakeManager = new FakeManagerServer((line, socket) => {
      const parsed = JSON.parse(line);
      if (parsed.method === "terminal.open") {
        socket.write(
          `${JSON.stringify({
            id: parsed.id,
            ok: false,
            error: {
              code: "VM_INVALID_STATE",
              message: "VM is not running",
            },
          })}\n`
        );
      }
    });
    await fakeManager.start();

    const ws = new MockWebSocket();
    bridgeTerminalWebSocket(ws, {
      vmId: "vm-123",
      socketPath: fakeManager.socketPath,
    });

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (ws.sent.length > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });

    assert.equal(ws.sent.length, 1);
    const errorFrame = JSON.parse(ws.sent[0]);
    assert.equal(errorFrame.type, "error");
    assert.equal(errorFrame.message, "VM is not running");
    assert.equal(ws.closed, true);
  });
});
