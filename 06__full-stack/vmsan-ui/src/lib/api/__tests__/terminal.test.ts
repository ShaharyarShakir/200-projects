import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  TerminalConnectionManager,
  type TerminalConnectionState,
} from "../terminal";

class FakeClientWebSocket extends EventEmitter {
  public static instances: FakeClientWebSocket[] = [];
  public url: string;
  public readyState = 1; // OPEN
  public sent: string[] = [];
  public closed = false;

  constructor(url: string) {
    super();
    this.url = url;
    FakeClientWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3; // CLOSED
    this.closed = true;
    this.emit("close");
    this.onclose?.();
  }

  // Event handler properties
  onopen?: () => void;
  onmessage?: (event: unknown) => void;
  onerror?: (event: unknown) => void;
  onclose?: () => void;

  simulateOpen(): void {
    this.readyState = 1;
    this.emit("open");
    this.onopen?.();
  }

  simulateMessage(data: string): void {
    const event = { data };
    this.emit("message", event);
    this.onmessage?.(event);
  }

  simulateError(message: string): void {
    const event = { message };
    this.emit("error", event);
    this.onerror?.(event);
  }
}

describe("TerminalConnectionManager", () => {
  it("transitions connection state on connect, ready, and disconnect", () => {
    FakeClientWebSocket.instances = [];
    const states: TerminalConnectionState[] = [];
    let readySession: string | null = null;

    const manager = new TerminalConnectionManager({
      vmId: "vm-123",
      sudo: false,
      WebSocketClass: FakeClientWebSocket,
      onStateChange: (state) => states.push(state),
      onReady: (sessionId) => {
        readySession = sessionId;
      },
    });

    assert.equal(manager.getState(), "disconnected");

    manager.connect();
    assert.equal(manager.getState(), "connecting");
    assert.equal(FakeClientWebSocket.instances.length, 1);

    const ws = FakeClientWebSocket.instances[0];
    ws.simulateOpen();

    // Send ready message from server
    ws.simulateMessage(JSON.stringify({ type: "ready", sessionId: "term-999" }));
    assert.equal(manager.getState(), "connected");
    assert.equal(manager.getSessionId(), "term-999");
    assert.equal(readySession, "term-999");

    manager.disconnect();
    assert.equal(manager.getState(), "disconnected");
    assert.equal(manager.getSessionId(), null);

    assert.deepEqual(states, ["connecting", "connected", "disconnected"]);
  });

  it("sends input frames when connected", () => {
    FakeClientWebSocket.instances = [];
    const manager = new TerminalConnectionManager({
      vmId: "vm-123",
      WebSocketClass: FakeClientWebSocket,
    });

    manager.connect();
    const ws = FakeClientWebSocket.instances[0];
    ws.simulateOpen();
    ws.simulateMessage(JSON.stringify({ type: "ready", sessionId: "term-123" }));

    manager.sendInput("uptime\n");

    assert.equal(ws.sent.length, 1);
    const frame = JSON.parse(ws.sent[0]);
    assert.deepEqual(frame, {
      type: "input",
      data: "uptime\n",
    });

    manager.disconnect();
  });

  it("debounces resize frames", async () => {
    FakeClientWebSocket.instances = [];
    const manager = new TerminalConnectionManager({
      vmId: "vm-123",
      WebSocketClass: FakeClientWebSocket,
    });

    manager.connect();
    const ws = FakeClientWebSocket.instances[0];
    ws.simulateOpen();
    ws.simulateMessage(JSON.stringify({ type: "ready", sessionId: "term-123" }));

    // Rapid resizes with 20ms debounce
    manager.resize(80, 24, 20);
    manager.resize(90, 25, 20);
    manager.resize(100, 30, 20);

    // Should not have sent yet
    assert.equal(ws.sent.length, 0);

    // Wait for debounce timer
    await new Promise<void>((resolve) => setTimeout(resolve, 35));

    // Only the latest resize frame is sent
    assert.equal(ws.sent.length, 1);
    const frame = JSON.parse(ws.sent[0]);
    assert.deepEqual(frame, {
      type: "resize",
      cols: 100,
      rows: 30,
    });

    manager.disconnect();
  });

  it("routes output, exit, and error frames to registered callbacks", () => {
    FakeClientWebSocket.instances = [];
    const outputs: string[] = [];
    let exitCodeResult: number | undefined;
    let errorResult: string | undefined;

    const manager = new TerminalConnectionManager({
      vmId: "vm-123",
      WebSocketClass: FakeClientWebSocket,
      onOutput: (data) => outputs.push(data),
      onExit: (code) => {
        exitCodeResult = code;
      },
      onError: (err) => {
        errorResult = err;
      },
    });

    manager.connect();
    const ws = FakeClientWebSocket.instances[0];
    ws.simulateOpen();
    ws.simulateMessage(JSON.stringify({ type: "ready", sessionId: "term-123" }));

    ws.simulateMessage(JSON.stringify({ type: "output", data: "Hello World\r\n" }));
    ws.simulateMessage(JSON.stringify({ type: "exit", exitCode: 0 }));
    ws.simulateMessage(JSON.stringify({ type: "error", message: "Process terminated" }));

    assert.deepEqual(outputs, ["Hello World\r\n"]);
    assert.equal(exitCodeResult, 0);
    assert.equal(errorResult, "Process terminated");

    manager.disconnect();
  });

  it("reconnects when connection is unexpectedly lost if configured", async () => {
    FakeClientWebSocket.instances = [];
    const manager = new TerminalConnectionManager({
      vmId: "vm-123",
      reconnect: true,
      reconnectIntervalMs: 15,
      maxReconnectAttempts: 2,
      WebSocketClass: FakeClientWebSocket,
    });

    manager.connect();
    assert.equal(FakeClientWebSocket.instances.length, 1);

    const ws1 = FakeClientWebSocket.instances[0];
    ws1.simulateOpen();

    // Trigger unexpected close
    ws1.close();

    // Wait for reconnect delay
    await new Promise<void>((resolve) => setTimeout(resolve, 30));

    assert.equal(FakeClientWebSocket.instances.length, 2);
    manager.disconnect();
  });
});
