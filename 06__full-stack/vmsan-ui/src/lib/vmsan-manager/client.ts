import { connect } from "node:net";
import {
  ManagerProtocolError,
  ManagerRequestError,
  ManagerUnavailableError,
} from "./errors";
import {
  isListResult,
  isManagerFailure,
  isManagerResponse,
  isManagerSuccess,
  isManagerVm,
  isVmRemoveResult,
  type HealthResult,
  type ListResult,
  type ManagerMethod,
  type ManagerRequest,
  type ManagerResponse,
  type ManagerVm,
  type VmCreateParams,
  type VmRemoveResult,
} from "./protocol";

const SOCKET_FILE_NAME = "vmsan-manager.sock";
const DEFAULT_TIMEOUT_MS = 30000;

export interface ManagerClientOptions {
  /**
   * Defaults to the resolved default: `$VMSAN_MANAGER_SOCKET`, then
   * `$XDG_RUNTIME_DIR/vmsan-manager.sock`, then `/run/user/<uid>/…`.
   */
  socketPath?: string;
  timeoutMs?: number;
}

/**
 * Resolve the manager socket path.
 *
 * The order matches the manager's own resolution so a development socket and
 * the production socket are both reachable by configuration alone:
 * an explicit `VMSAN_MANAGER_SOCKET` wins, then the per-user runtime directory,
 * then a `/run/user/<uid>` fallback for environments without
 * `XDG_RUNTIME_DIR` such as a service manager or a container.
 */
/**
 * A minimal environment shape rather than `NodeJS.ProcessEnv`.
 *
 * The web app's `ProcessEnv` is augmented with a required `NODE_ENV`, which
 * would make every call site in a test have to fake it to pass an override.
 */
export type SocketEnv = Record<string, string | undefined>;

export function defaultSocketPath(
  env: SocketEnv = process.env,
  uid: number = process.getuid?.() ?? 0
): string {
  const override = env.VMSAN_MANAGER_SOCKET;
  if (override && override.length > 0) {
    return override;
  }

  const runtimeDir = env.XDG_RUNTIME_DIR;
  if (runtimeDir && runtimeDir.length > 0) {
    return `${runtimeDir}/${SOCKET_FILE_NAME}`;
  }
  return `/run/user/${uid}/${SOCKET_FILE_NAME}`;
}

/**
 * The errnos that all mean the same thing to a user: nothing is serving the
 * control socket, or this process is not allowed to reach it.
 *
 * They are deliberately collapsed into one message. The dashboard shows this
 * text, and the actionable response is identical in all three cases — start the
 * service, or join the `vmsan` group and start a new login session. Naming the
 * distinguishing errno would tell a user to debug a problem that does not exist
 * for them, so the message names no path and no errno.
 */
const UNREACHABLE_ERRNOS = new Set(["ENOENT", "ECONNREFUSED", "EACCES"]);

export function unavailableMessage(error: NodeJS.ErrnoException): string {
  return UNREACHABLE_ERRNOS.has(error.code ?? "")
    ? "vmsan manager socket is not reachable"
    : "vmsan manager connection failed";
}

/**
 * Send one request frame and await one response frame.
 *
 * The connection is per-request. The manager serializes frames on a connection
 * and this client only ever sends one, so there is no multiplexing to share a
 * socket over, and a fresh connection means a stale-socket reconnect needs no
 * special handling.
 */
function send(
  socketPath: string,
  request: ManagerRequest,
  timeoutMs: number
): Promise<ManagerResponse<unknown>> {
  return new Promise((resolve, reject) => {
    const socket = connect(socketPath);
    let buffer = "";
    let settled = false;

    const finish = (fn: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      fn();
    };

    const timer = setTimeout(() => {
      finish(() =>
        reject(
          new ManagerUnavailableError(
            `vmsan manager did not respond within ${timeoutMs}ms`
          )
        )
      );
    }, timeoutMs);

    socket.on("connect", () => {
      socket.write(`${JSON.stringify(request)}\n`);
    });

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex === -1) {
        return;
      }
      const line = buffer.slice(0, newlineIndex);
      finish(() => {
        try {
          const parsed: unknown = JSON.parse(line);
          if (!isManagerResponse(parsed)) {
            reject(
              new ManagerProtocolError(
                "vmsan manager response did not match the protocol contract"
              )
            );
            return;
          }
          resolve(parsed);
        } catch (error) {
          reject(
            new ManagerProtocolError(
              "vmsan manager response was not valid JSON",
              { cause: error }
            )
          );
        }
      });
    });

    socket.on("error", (error: NodeJS.ErrnoException) => {
      finish(() =>
        reject(
          new ManagerUnavailableError(unavailableMessage(error), { cause: error })
        )
      );
    });

    socket.on("close", () => {
      finish(() =>
        reject(
          new ManagerUnavailableError(
            "vmsan manager closed the connection before responding"
          )
        )
      );
    });
  });
}

export interface ManagerClient {
  health(): Promise<HealthResult>;
  list(): Promise<ManagerVm[]>;
  createVm(params?: VmCreateParams): Promise<ManagerVm>;
  startVm(vmId: string): Promise<ManagerVm>;
  stopVm(vmId: string): Promise<ManagerVm>;
  removeVm(vmId: string): Promise<VmRemoveResult>;
  request(method: ManagerMethod, params?: unknown): Promise<unknown>;
}

export function createManagerClient(
  options: ManagerClientOptions = {}
): ManagerClient {
  const getSocketPath = (): string => options.socketPath ?? defaultSocketPath();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let counter = 0;
  const nextId = (): string => {
    counter += 1;
    return `req-${counter}`;
  };

  const call = async (request: ManagerRequest): Promise<unknown> => {
    const response = await send(getSocketPath(), request, timeoutMs);

    if (isManagerFailure(response)) {
      throw new ManagerRequestError(
        response.error.code,
        response.error.message
      );
    }
    if (!isManagerSuccess(response)) {
      throw new ManagerProtocolError("vmsan manager response was not a success");
    }
    return response.result;
  };

  return {
    async health(): Promise<HealthResult> {
      const result = await call({ id: nextId(), method: "health" });
      if (
        result === null ||
        typeof result !== "object" ||
        (result as { status?: unknown }).status !== "ok"
      ) {
        throw new ManagerProtocolError("vmsan manager returned an invalid health result");
      }
      return result as HealthResult;
    },

    async list(): Promise<ManagerVm[]> {
      const result = await call({ id: nextId(), method: "list" });
      if (!isListResult(result)) {
        throw new ManagerProtocolError("vmsan manager returned an invalid list result");
      }
      return (result as ListResult).vms;
    },

    async createVm(params?: VmCreateParams): Promise<ManagerVm> {
      const request: ManagerRequest = {
        id: nextId(),
        method: "vm.create",
        ...(params !== undefined ? { params } : {}),
      };
      const result = await call(request);
      if (!isManagerVm(result)) {
        throw new ManagerProtocolError(
          "vmsan manager returned an invalid create result"
        );
      }
      return result;
    },

    async startVm(vmId: string): Promise<ManagerVm> {
      const result = await call({
        id: nextId(),
        method: "vm.start",
        params: { vmId },
      });
      if (!isManagerVm(result)) {
        throw new ManagerProtocolError(
          "vmsan manager returned an invalid start result"
        );
      }
      return result;
    },

    async stopVm(vmId: string): Promise<ManagerVm> {
      const result = await call({
        id: nextId(),
        method: "vm.stop",
        params: { vmId },
      });
      if (!isManagerVm(result)) {
        throw new ManagerProtocolError(
          "vmsan manager returned an invalid stop result"
        );
      }
      return result;
    },

    async removeVm(vmId: string): Promise<VmRemoveResult> {
      const result = await call({
        id: nextId(),
        method: "vm.remove",
        params: { vmId },
      });
      if (!isVmRemoveResult(result)) {
        throw new ManagerProtocolError(
          "vmsan manager returned an invalid remove result"
        );
      }
      return result;
    },

    request(method: ManagerMethod, params?: unknown): Promise<unknown> {
      const req = {
        id: nextId(),
        method,
        ...(params !== undefined ? { params } : {}),
      } as ManagerRequest;
      return call(req);
    },
  };
}

export const manager = createManagerClient();
