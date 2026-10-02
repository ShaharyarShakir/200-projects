import { randomUUID } from "node:crypto";
import type { Socket } from "node:net";
import WebSocket from "ws";
import type {
  TerminalCloseParams,
  TerminalCloseResult,
  TerminalInputParams,
  TerminalInputResult,
  TerminalOpenParams,
  TerminalOpenResult,
  TerminalResizeParams,
  TerminalResizeResult,
} from "./protocol.js";
import { getAgentShellUrl, type VmsanService } from "./vmsan.js";

export const MSG_DATA = 0x00;
export const MSG_RESIZE = 0x01;
export const MSG_READY = 0x02;

export function serializeData(data: string | Uint8Array): Buffer {
  const payload = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  const out = Buffer.allocUnsafe(1 + payload.length);
  out[0] = MSG_DATA;
  payload.copy(out, 1);
  return out;
}

export function serializeResize(cols: number, rows: number): Buffer {
  const out = Buffer.allocUnsafe(5);
  out[0] = MSG_RESIZE;
  out.writeUInt16BE(cols, 1);
  out.writeUInt16BE(rows, 3);
  return out;
}

export function serializeReady(): Buffer {
  return Buffer.from([MSG_READY]);
}

export function parseBinaryMessage(
  buf: Buffer
): { type: number; data?: Buffer; cols?: number; rows?: number } | null {
  if (buf.length === 0) return null;
  switch (buf[0]) {
    case MSG_DATA:
      return { type: MSG_DATA, data: buf.subarray(1) };
    case MSG_RESIZE:
      if (buf.length < 5) return null;
      return {
        type: MSG_RESIZE,
        cols: buf.readUInt16BE(1),
        rows: buf.readUInt16BE(3),
      };
    case MSG_READY:
      return { type: MSG_READY };
    default:
      return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WebSocketEventListener = (...args: any[]) => void;

export interface TerminalWebSocketLike {
  send(data: unknown, cb?: (err?: Error) => void): void;
  close(code?: number, reason?: string): void;
  terminate?(): void;
  on(event: string, listener: WebSocketEventListener): this;
  once(event: string, listener: WebSocketEventListener): this;
  removeListener(event: string, listener: WebSocketEventListener): this;
  readyState: number;
}

export type TerminalWebSocketFactory = (url: string) => TerminalWebSocketLike;

export const defaultWebSocketFactory: TerminalWebSocketFactory = (url: string) =>
  new WebSocket(url) as unknown as TerminalWebSocketLike;

export interface ActiveTerminalSession {
  sessionId: string;
  vmId: string;
  ws: TerminalWebSocketLike;
  createdAt: string;
  socket?: Socket;
  onOutput: (data: string) => void;
  onExit: (exitCode?: number) => void;
  onError: (err: Error) => void;
}

export interface TerminalSessionCallbacks {
  onOutput: (data: string) => void;
  onExit: (exitCode?: number) => void;
  onError: (err: Error) => void;
}

export class TerminalSessionService {
  private readonly sessions = new Map<string, ActiveTerminalSession>();
  private readonly wsFactory: TerminalWebSocketFactory;

  constructor(wsFactory: TerminalWebSocketFactory = defaultWebSocketFactory) {
    this.wsFactory = wsFactory;
  }

  get activeSessionCount(): number {
    return this.sessions.size;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  getSession(sessionId: string): ActiveTerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  async openSession(
    service: VmsanService,
    params: TerminalOpenParams,
    callbacks: TerminalSessionCallbacks,
    socket?: Socket
  ): Promise<TerminalOpenResult> {
    const url = getAgentShellUrl(service, params.vmId, params.sudo);

    const sessionId = `term-${randomUUID()}`;
    const createdAt = new Date().toISOString();

    const ws = this.wsFactory(url);

    return new Promise<TerminalOpenResult>((resolve, reject) => {
      let isSettled = false;
      const timeoutMs = 8000;
      let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        this.sessions.delete(sessionId);
      };

      timeoutTimer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          cleanup();
          try {
            ws.terminate?.();
            ws.close();
          } catch {
            // Ignore
          }
          const timeoutErr = new Error(
            `Failed to connect to VM terminal: connection timed out after ${timeoutMs}ms`
          );
          (timeoutErr as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
          reject(timeoutErr);
        }
      }, timeoutMs);

      const onOpen = () => {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        // Send initial ready and resize frames
        ws.send(serializeReady());
        if (params.cols !== undefined && params.rows !== undefined) {
          ws.send(serializeResize(params.cols, params.rows));
        }

        const session: ActiveTerminalSession = {
          sessionId,
          vmId: params.vmId,
          ws,
          createdAt,
          socket,
          onOutput: callbacks.onOutput,
          onExit: callbacks.onExit,
          onError: callbacks.onError,
        };

        this.sessions.set(sessionId, session);

        if (!isSettled) {
          isSettled = true;
          resolve({
            sessionId,
            vmId: params.vmId,
            createdAt,
          });
        }
      };

      const onMessage = (data: unknown, isBinary?: boolean) => {
        if (!isBinary && typeof data === "string") {
          return;
        }
        const buf = Buffer.isBuffer(data)
          ? data
          : data instanceof ArrayBuffer
          ? Buffer.from(data)
          : Array.isArray(data)
          ? Buffer.concat(data)
          : Buffer.from(String(data));

        const msg = parseBinaryMessage(buf);
        if (msg && msg.type === MSG_DATA && msg.data) {
          callbacks.onOutput(msg.data.toString("utf8"));
        }
      };

      const onClose = (code?: number) => {
        cleanup();
        callbacks.onExit(code === 1000 ? 0 : code ?? 0);
      };

      const onError = (err: Error) => {
        cleanup();
        if (!isSettled) {
          isSettled = true;
          const failureErr = new Error(`Failed to connect to VM terminal: ${err.message}`);
          (failureErr as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
          reject(failureErr);
        } else {
          callbacks.onError(err);
        }
      };

      const onUnexpectedResponse = (
        _req: unknown,
        res: { statusCode: number; on: (event: string, listener: (chunk?: unknown) => void) => void }
      ) => {
        cleanup();
        const maxBytes = 4096;
        let body = "";
        res.on("data", (chunk?: unknown) => {
          if (body.length < maxBytes && chunk) {
            body += String(chunk).slice(0, maxBytes - body.length);
          }
        });
        res.on("end", () => {
          const detail = body.trim() || "no response body";
          const err = new Error(`Shell connection failed (HTTP ${res.statusCode}): ${detail}`);
          (err as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
          if (!isSettled) {
            isSettled = true;
            reject(err);
          } else {
            callbacks.onError(err);
          }
        });
      };

      ws.once("open", onOpen);
      ws.on("message", onMessage);
      ws.once("close", onClose);
      ws.once("error", onError);
      ws.once("unexpected-response", onUnexpectedResponse);
    });
  }

  async sendInput(params: TerminalInputParams): Promise<TerminalInputResult> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      const err = new Error(`Terminal session not found: ${params.sessionId}`);
      (err as { code?: string }).code = "ERR_FILE_NOT_FOUND";
      throw err;
    }

    if (session.ws.readyState !== WebSocket.OPEN && session.ws.readyState !== 1) {
      const err = new Error(`Terminal session is closed: ${params.sessionId}`);
      (err as { code?: string }).code = "ERR_VM_NOT_RUNNING";
      throw err;
    }

    session.ws.send(serializeData(params.data));
    return { ok: true };
  }

  async resizeTerminal(params: TerminalResizeParams): Promise<TerminalResizeResult> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      const err = new Error(`Terminal session not found: ${params.sessionId}`);
      (err as { code?: string }).code = "ERR_FILE_NOT_FOUND";
      throw err;
    }

    if (session.ws.readyState !== WebSocket.OPEN && session.ws.readyState !== 1) {
      const err = new Error(`Terminal session is closed: ${params.sessionId}`);
      (err as { code?: string }).code = "ERR_VM_NOT_RUNNING";
      throw err;
    }

    session.ws.send(serializeResize(params.cols, params.rows));
    return { ok: true };
  }

  async closeSession(params: TerminalCloseParams): Promise<TerminalCloseResult> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      return { closed: true, sessionId: params.sessionId };
    }

    this.sessions.delete(params.sessionId);
    try {
      session.ws.close();
    } catch {
      // Ignore errors on close
    }
    return { closed: true, sessionId: params.sessionId };
  }

  closeSessionsForVm(vmId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.vmId === vmId) {
        this.sessions.delete(sessionId);
        try {
          session.ws.close();
        } catch {
          // Ignore errors
        }
      }
    }
  }

  closeSessionsForSocket(socket: Socket): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.socket === socket) {
        this.sessions.delete(sessionId);
        try {
          session.ws.close();
        } catch {
          // Ignore errors
        }
      }
    }
  }

  destroyAll(): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      this.sessions.delete(sessionId);
      try {
        session.ws.close();
      } catch {
        // Ignore errors
      }
    }
  }
}
