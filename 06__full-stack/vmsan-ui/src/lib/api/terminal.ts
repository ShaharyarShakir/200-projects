import type {
  TerminalClientMessage,
  TerminalServerMessage,
} from "@/lib/vmsan-manager/protocol";

export type TerminalConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface TerminalClientOptions {
  vmId: string;
  sudo?: boolean;
  cols?: number;
  rows?: number;
  wsUrl?: string;
  reconnect?: boolean;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  onOutput?: (data: string) => void;
  onStateChange?: (state: TerminalConnectionState) => void;
  onError?: (error: string) => void;
  onExit?: (exitCode?: number) => void;
  onReady?: (sessionId: string) => void;
  /** Injectable WebSocket class for unit tests or non-browser environments */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  WebSocketClass?: any;
}

export class TerminalConnectionManager {
  private state: TerminalConnectionState = "disconnected";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ws: any = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;
  private isDisposed = false;
  private options: TerminalClientOptions;

  constructor(options: TerminalClientOptions) {
    this.options = { ...options };
  }

  public updateOptions(newOptions: Partial<TerminalClientOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  public getState(): TerminalConnectionState {
    return this.state;
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  private setState(nextState: TerminalConnectionState): void {
    if (this.state !== nextState) {
      this.state = nextState;
      this.options.onStateChange?.(nextState);
    }
  }

  private buildWsUrl(): string {
    if (this.options.wsUrl) {
      return this.options.wsUrl;
    }

    const sudoQuery = this.options.sudo ? "?sudo=true" : "";
    const encodedId = encodeURIComponent(this.options.vmId);

    if (typeof window !== "undefined" && window.location) {
      const isSecure = window.location.protocol === "https:";
      const protocol = isSecure ? "wss:" : "ws:";
      const host = window.location.host;
      return `${protocol}//${host}/api/vms/${encodedId}/terminal/ws${sudoQuery}`;
    }

    return `ws://localhost/api/vms/${encodedId}/terminal/ws${sudoQuery}`;
  }

  public connect(): void {
    if (this.isDisposed) return;

    this.manuallyClosed = false;
    this.clearTimers();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }

    this.setState("connecting");

    const WS =
      this.options.WebSocketClass ??
      (typeof WebSocket !== "undefined" ? WebSocket : null);

    if (!WS) {
      this.setState("error");
      this.options.onError?.("WebSocket is not supported in this environment");
      return;
    }

    const url = this.buildWsUrl();

    try {
      this.ws = new WS(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState("error");
      this.options.onError?.(msg);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      if (this.isDisposed) return;
      this.reconnectAttempts = 0;
      // If cols and rows are already defined, send initial resize
      if (this.options.cols && this.options.rows) {
        this.resize(this.options.cols, this.options.rows, 0);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ws.onmessage = (event: any) => {
      if (this.isDisposed) return;

      const rawData = typeof event.data === "string" ? event.data : event.data?.toString?.();
      if (!rawData) return;

      try {
        const msg: TerminalServerMessage = JSON.parse(rawData);

        switch (msg.type) {
          case "ready": {
            this.sessionId = msg.sessionId;
            this.setState("connected");
            this.options.onReady?.(msg.sessionId);
            break;
          }
          case "output": {
            this.options.onOutput?.(msg.data);
            break;
          }
          case "exit": {
            this.options.onExit?.(msg.exitCode);
            break;
          }
          case "error": {
            this.setState("error");
            this.options.onError?.(msg.message);
            break;
          }
        }
      } catch {
        // Ignore non-JSON frame
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ws.onerror = (event: any) => {
      if (this.isDisposed) return;
      const errorMsg = event?.message ?? "WebSocket connection error";
      this.setState("error");
      this.options.onError?.(errorMsg);
    };

    this.ws.onclose = () => {
      if (this.isDisposed) return;
      this.sessionId = null;
      if (this.state !== "error") {
        this.setState("disconnected");
      }

      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  public sendInput(data: string): void {
    if (this.isDisposed || !this.ws || this.state !== "connected") {
      return;
    }

    const payload: TerminalClientMessage = {
      type: "input",
      data,
    };

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.options.onError?.(msg);
    }
  }

  public resize(cols: number, rows: number, debounceMs: number = 50): void {
    this.options.cols = cols;
    this.options.rows = rows;

    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }

    const sendResize = () => {
      if (this.isDisposed || !this.ws) {
        return;
      }

      // Check readyState if available (1 = OPEN)
      if ("readyState" in this.ws && this.ws.readyState !== 1) {
        return;
      }

      const payload: TerminalClientMessage = {
        type: "resize",
        cols,
        rows,
      };

      try {
        this.ws.send(JSON.stringify(payload));
      } catch {
        // Ignore send errors during resize
      }
    };

    if (debounceMs <= 0) {
      sendResize();
    } else {
      this.resizeDebounceTimer = setTimeout(sendResize, debounceMs);
    }
  }

  public disconnect(): void {
    this.manuallyClosed = true;
    this.clearTimers();

    if (this.ws) {
      try {
        const closeMsg: TerminalClientMessage = { type: "close" };
        this.ws.send(JSON.stringify(closeMsg));
      } catch {
        // Ignore
      }

      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }

    this.sessionId = null;
    this.setState("disconnected");
  }

  public reconnect(): void {
    this.disconnect();
    this.connect();
  }

  public dispose(): void {
    this.isDisposed = true;
    this.disconnect();
  }

  private scheduleReconnect(): void {
    if (this.manuallyClosed || this.isDisposed || !this.options.reconnect) {
      return;
    }

    const maxAttempts = this.options.maxReconnectAttempts ?? 5;
    if (this.reconnectAttempts >= maxAttempts) {
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.options.reconnectIntervalMs ?? 2000;

    this.reconnectTimer = setTimeout(() => {
      if (!this.manuallyClosed && !this.isDisposed) {
        this.connect();
      }
    }, delay);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }
  }
}
