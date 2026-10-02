import { connect, type Socket } from "node:net";
import { defaultSocketPath } from "./client";
import {
  isManagerFailure,
  isManagerResponse,
  isManagerSuccess,
  isTerminalClientMessage,
  isTerminalServerMessage,
  type TerminalClientMessage,
  type TerminalOpenParams,
  type TerminalOpenResult,
  type TerminalServerMessage,
} from "./protocol";
import { validateVmId } from "@/lib/vms/validation";

export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: "message", listener: (data: unknown) => void): void;
  on(event: "close", listener: (code: number, reason: string) => void): void;
  on(event: "error", listener: (err: Error) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface TerminalBridgeOptions {
  vmId: string;
  sudo?: boolean;
  cols?: number;
  rows?: number;
  socketPath?: string;
  onClose?: () => void;
  onError?: (err: Error) => void;
}

export interface TerminalBridgeHandle {
  close: () => void;
  getSessionId: () => string | null;
}

/**
 * Bridges an incoming client WebSocket to the privileged vmsan-manager Unix domain socket.
 * Handles the initial `terminal.open` request, translation of client messages (input, resize, close),
 * and streaming of server frames (ready, output, exit, error).
 */
export function bridgeTerminalWebSocket(
  ws: WebSocketLike,
  options: TerminalBridgeOptions
): TerminalBridgeHandle {
  let sessionId: string | null = null;
  let socket: Socket | null = null;
  let isClosed = false;
  let reqCounter = 0;

  const nextReqId = (): string => {
    reqCounter += 1;
    return `req-term-${reqCounter}`;
  };

  const cleanup = () => {
    if (isClosed) return;
    isClosed = true;

    if (socket) {
      if (sessionId) {
        try {
          const closeReq = {
            id: nextReqId(),
            method: "terminal.close",
            params: { sessionId },
          };
          socket.write(`${JSON.stringify(closeReq)}\n`);
        } catch {
          // Socket might already be closed
        }
      }
      try {
        socket.destroy();
      } catch {
        // Ignore destroy error
      }
      socket = null;
    }

    try {
      ws.close();
    } catch {
      // Ignore ws close error
    }

    options.onClose?.();
  };

  // Validate VM ID before connecting to prevent invalid socket calls
  try {
    validateVmId(options.vmId);
  } catch (validationErr: unknown) {
    const message =
      validationErr instanceof Error ? validationErr.message : "Invalid VM ID";
    try {
      ws.send(JSON.stringify({ type: "error", message } satisfies TerminalServerMessage));
      ws.close(1008, message);
    } catch {
      // Ignore
    }
    return {
      close: cleanup,
      getSessionId: () => null,
    };
  }

  const socketPath = options.socketPath ?? defaultSocketPath();

  try {
    socket = connect(socketPath);
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    try {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to connect to vmsan-manager socket",
        } satisfies TerminalServerMessage)
      );
      ws.close(1011, "Manager unavailable");
    } catch {
      // Ignore
    }
    options.onError?.(errorObj);
    return {
      close: cleanup,
      getSessionId: () => null,
    };
  }

  let buffer = "";

  socket.on("connect", () => {
    const openParams: TerminalOpenParams = {
      vmId: options.vmId,
      cols: options.cols,
      rows: options.rows,
      sudo: options.sudo,
    };

    const openRequest = {
      id: "req-open",
      method: "terminal.open",
      params: openParams,
    };

    socket?.write(`${JSON.stringify(openRequest)}\n`);
  });

  socket.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");

    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.trim().length > 0) {
        try {
          const parsed: unknown = JSON.parse(line);

          if (sessionId === null) {
            // Awaiting terminal.open response
            if (isManagerResponse(parsed)) {
              if (isManagerSuccess(parsed)) {
                const openResult = parsed.result as TerminalOpenResult;
                sessionId = openResult.sessionId;
                const readyMsg: TerminalServerMessage = {
                  type: "ready",
                  sessionId,
                };
                ws.send(JSON.stringify(readyMsg));
              } else if (isManagerFailure(parsed)) {
                const errorMsg: TerminalServerMessage = {
                  type: "error",
                  message: parsed.error.message,
                };
                try {
                  ws.send(JSON.stringify(errorMsg));
                } catch {
                  // Ignore
                }
                cleanup();
                return;
              }
            }
          } else {
            // Streaming message or command response from manager
            if (isTerminalServerMessage(parsed)) {
              ws.send(JSON.stringify(parsed));
              if (parsed.type === "exit" || parsed.type === "error") {
                // Let the client receive the frame before closing
              }
            } else if (isManagerResponse(parsed) && isManagerFailure(parsed)) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: parsed.error.message,
                } satisfies TerminalServerMessage)
              );
            }
          }
        } catch {
          // Ignore invalid json frame
        }
      }

      newlineIndex = buffer.indexOf("\n");
    }
  });

  socket.on("error", (err: Error) => {
    if (!isClosed) {
      try {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "vmsan-manager socket error",
          } satisfies TerminalServerMessage)
        );
      } catch {
        // Ignore
      }
      options.onError?.(err);
      cleanup();
    }
  });

  socket.on("close", () => {
    cleanup();
  });

  // Handle incoming messages from the client WebSocket
  ws.on("message", (raw: unknown) => {
    if (isClosed) return;

    let text: string;
    if (typeof raw === "string") {
      text = raw;
    } else if (Buffer.isBuffer(raw)) {
      text = raw.toString("utf8");
    } else if (raw instanceof Uint8Array) {
      text = Buffer.from(raw).toString("utf8");
    } else {
      return;
    }

    try {
      const msg: unknown = JSON.parse(text);
      if (!isTerminalClientMessage(msg)) {
        return;
      }

      const clientMsg = msg as TerminalClientMessage;

      if (clientMsg.type === "close") {
        cleanup();
        return;
      }

      if (!sessionId || !socket || socket.destroyed) {
        return;
      }

      if (clientMsg.type === "input") {
        const inputReq = {
          id: nextReqId(),
          method: "terminal.input",
          params: {
            sessionId,
            data: clientMsg.data,
          },
        };
        socket.write(`${JSON.stringify(inputReq)}\n`);
      } else if (clientMsg.type === "resize") {
        const resizeReq = {
          id: nextReqId(),
          method: "terminal.resize",
          params: {
            sessionId,
            cols: clientMsg.cols,
            rows: clientMsg.rows,
          },
        };
        socket.write(`${JSON.stringify(resizeReq)}\n`);
      }
    } catch {
      // Ignore malformed message
    }
  });

  ws.on("close", () => {
    cleanup();
  });

  ws.on("error", (err: Error) => {
    options.onError?.(err);
    cleanup();
  });

  return {
    close: cleanup,
    getSessionId: () => sessionId,
  };
}
