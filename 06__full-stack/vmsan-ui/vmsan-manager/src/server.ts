import { createServer, type Server, type Socket } from "node:net";
import { connect } from "node:net";
import { chmod, chown, lstat, readFile, unlink } from "node:fs/promises";
import type { ManagerConfig } from "./config.js";
import type { Logger } from "./logger.js";
import { describeError } from "./logger.js";
import {
  failure,
  success,
  validateFrame,
  type HealthResult,
  type ListResult,
  type ManagerRequest,
  type ManagerResponse,
} from "./protocol.js";
import { listVms, type VmsanService } from "./vmsan.js";

/** Owner read/write, group read/write, nothing for others. Never 0o777. */
export const SOCKET_MODE = 0o660;

const GROUP_FILE = "/etc/group";

export class SocketGroupError extends Error {
  readonly group: string;

  constructor(message: string, group: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SocketGroupError";
    this.group = group;
  }
}

/**
 * Resolve a group name to its numeric id.
 *
 * Node exposes no `getgrnam`, and shelling out to `getent` would put a child
 * process on the manager's startup path, which the manager's own security scan
 * forbids. `/etc/group` is the only lookup a local system group needs: the
 * manager's own service user and the `vmsan` group are both local, created by
 * the install script, and never LDAP-backed.
 */
export async function resolveGroupId(group: string): Promise<number> {
  let contents: string;
  try {
    contents = await readFile(GROUP_FILE, "utf8");
  } catch (error) {
    throw new SocketGroupError(
      `Could not read ${GROUP_FILE} to resolve group "${group}"`,
      group,
      { cause: error }
    );
  }

  for (const line of contents.split("\n")) {
    const fields = line.split(":");
    if (fields[0] !== group) {
      continue;
    }
    const gid = Number.parseInt(fields[2] ?? "", 10);
    if (Number.isInteger(gid) && gid >= 0) {
      return gid;
    }
    throw new SocketGroupError(
      `Group "${group}" has no usable numeric id`,
      group
    );
  }

  throw new SocketGroupError(`Group "${group}" does not exist`, group);
}

const SHUTDOWN_GRACE_MS = 5000;

/** Time allowed for written responses to flush before sockets are destroyed. */
const FLUSH_MS = 50;

export class SocketPathError extends Error {
  readonly socketPath: string;

  constructor(message: string, socketPath: string) {
    super(message);
    this.name = "SocketPathError";
    this.socketPath = socketPath;
  }
}

export type SocketProbe = (socketPath: string) => Promise<boolean>;

/**
 * Probe whether something is currently listening on a socket path.
 *
 * A successful connection means a live manager; a connection refusal or a
 * missing file means the socket is a leftover.
 */
export const defaultSocketProbe: SocketProbe = (socketPath) =>
  new Promise((resolve) => {
    const socket = connect(socketPath);
    const settle = (result: boolean): void => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.once("connect", () => settle(true));
    socket.once("error", () => settle(false));
  });

/**
 * Decide whether the configured socket path is safe to bind.
 *
 * Classification, never blind unlink: a non-socket file is refused outright, a
 * live listener is refused as "already running", and only a socket with no
 * listener is removed as a stale leftover.
 */
export async function prepareSocketPath(
  socketPath: string,
  probe: SocketProbe = defaultSocketProbe
): Promise<void> {
  let stats;
  try {
    stats = await lstat(socketPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }

  if (!stats.isSocket()) {
    throw new SocketPathError(
      `Refusing to start: ${socketPath} exists and is not a socket`,
      socketPath
    );
  }

  if (await probe(socketPath)) {
    throw new SocketPathError(
      `Refusing to start: another manager is already listening on ${socketPath}`,
      socketPath
    );
  }

  await unlink(socketPath);
}

export type GroupResolver = (group: string) => Promise<number>;
export type SocketChown = (socketPath: string, gid: number) => Promise<void>;

/**
 * Hand the socket to a group without changing its owner.
 *
 * uid `-1` is POSIX for "leave the owner alone", so the running manager stays
 * the owner and only the group moves. This needs privilege, which is why a
 * failure here is terminal rather than a reason to widen the mode.
 */
export const defaultChownSocket: SocketChown = (socketPath, gid) =>
  chown(socketPath, -1, gid);

export type ManagerServerOptions = {
  config: ManagerConfig;
  logger: Logger;
  service: VmsanService;
  /** Injectable for tests; defaults to the real filesystem-backed check. */
  preparePath?: (socketPath: string) => Promise<void>;
  /** Injectable for tests; defaults to reading /etc/group. */
  resolveGroup?: GroupResolver;
  /** Injectable for tests; defaults to chown keeping the current owner. */
  chownSocket?: SocketChown;
};

export class ManagerServer {
  private readonly config: ManagerConfig;
  private readonly logger: Logger;
  private readonly service: VmsanService;
  private readonly preparePath: (socketPath: string) => Promise<void>;
  private readonly resolveGroup: GroupResolver;
  private readonly chownSocket: SocketChown;
  private server: Server | null = null;
  private shuttingDown = false;
  private readonly inFlight = new Set<Promise<void>>();
  private readonly connections = new Set<Socket>();

  constructor(options: ManagerServerOptions) {
    this.config = options.config;
    this.logger = options.logger;
    this.service = options.service;
    this.preparePath = options.preparePath ?? prepareSocketPath;
    this.resolveGroup = options.resolveGroup ?? resolveGroupId;
    this.chownSocket = options.chownSocket ?? defaultChownSocket;
  }

  async listen(): Promise<void> {
    await this.preparePath(this.config.socketPath);

    this.server = createServer((socket) => this.handleConnection(socket));

    await new Promise<void>((resolve, reject) => {
      const server = this.server;
      if (!server) {
        reject(new Error("server was not created"));
        return;
      }
      server.once("error", reject);
      server.listen(this.config.socketPath, () => {
        server.removeListener("error", reject);
        resolve();
      });
    });

    // Create the socket with restricted permissions before announcing readiness.
    await chmod(this.config.socketPath, SOCKET_MODE);

    // Order matters: mode, then group, then readiness. The socket is never
    // announced in a wider state than the one it ends in, and a group failure
    // aborts startup rather than falling back to a more permissive mode.
    await this.applySocketGroup();

    this.logger.info("listening on unix socket", {
      mode: SOCKET_MODE.toString(8),
      group: this.config.socketGroup,
    });
  }

  /**
   * Hand the bound socket to the configured group.
   *
   * No configured group is the inert case: the socket keeps the service user's
   * primary group and no chown is attempted. A failure to resolve or apply the
   * group is fatal to startup. The alternative — starting with a socket the
   * intended clients cannot reach, or widening the mode to compensate — would
   * report readiness for a boundary that is not the one that was asked for.
   */
  private async applySocketGroup(): Promise<void> {
    const group = this.config.socketGroup;
    if (group === undefined) {
      return;
    }

    let gid: number;
    try {
      gid = await this.resolveGroup(group);
    } catch (error) {
      this.logger.error("could not resolve socket group", {
        group,
        ...describeError(error),
      });
      throw error;
    }

    try {
      await this.chownSocket(this.config.socketPath, gid);
    } catch (error) {
      this.logger.error("could not apply socket group", {
        group,
        gid,
        mode: SOCKET_MODE.toString(8),
        ...describeError(error),
      });
      throw error;
    }
  }

  private handleConnection(socket: Socket): void {
    this.connections.add(socket);
    let buffer = "";
    // Frames on one connection are processed strictly in order. Without this
    // chain an awaiting `list` could be overtaken by a later `health` and the
    // client would see responses out of order on a multiplexed stream.
    let queue: Promise<void> = Promise.resolve();

    socket.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");

      if (Buffer.byteLength(buffer, "utf8") > this.config.maxRequestBytes) {
        this.logger.warn("request frame exceeds maximum size; closing connection");
        this.writeFrame(
          socket,
          failure(
            "unknown",
            "REQUEST_TOO_LARGE",
            `Request exceeds the maximum of ${this.config.maxRequestBytes} bytes`
          )
        );
        socket.end();
        this.connections.delete(socket);
        return;
      }

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        const next = queue.then(() => this.processLine(socket, line));
        this.inFlight.add(next);
        queue = next.catch(() => {}).finally(() => {
          this.inFlight.delete(next);
        });
        newlineIndex = buffer.indexOf("\n");
      }
    });

    socket.on("error", () => {
      this.connections.delete(socket);
    });

    socket.on("close", () => {
      this.connections.delete(socket);
    });
  }

  private async processLine(socket: Socket, line: string): Promise<void> {
    await this.dispatch(socket, line);
  }

  private async dispatch(socket: Socket, line: string): Promise<void> {
    if (this.shuttingDown) {
      this.logger.warn("rejecting request during shutdown");
      this.writeFrame(
        socket,
        failure("unknown", "SHUTTING_DOWN", "Manager is shutting down")
      );
      return;
    }

    const frame = validateFrame(line, this.config.maxRequestBytes);
    if (!frame.ok) {
      this.logger.error("request failed", { code: frame.code, id: frame.id });
      this.writeFrame(socket, failure(frame.id, frame.code, frame.message));
      return;
    }

    const request = frame.request;
    this.logger.debug("request method=" + request.method, { id: request.id });

    const response = await this.execute(request);
    this.writeFrame(socket, response);
  }

  private async execute(
    request: ManagerRequest
  ): Promise<ManagerResponse<HealthResult | ListResult>> {
    try {
      switch (request.method) {
        case "health": {
          const result: HealthResult = { status: "ok" };
          return success(request.id, result);
        }
        case "list": {
          const vms = await listVms(this.service);
          const result: ListResult = { vms };
          this.logger.debug("list served", { count: vms.length, id: request.id });
          return success(request.id, result);
        }
      }
    } catch (error) {
      // Log the code, request id, and a capped cause for the operator. The
      // detail stays in the manager's root-owned stderr and is never echoed to
      // the client, which only sees the generic message below.
      this.logger.error("request failed", {
        code: "INTERNAL_ERROR",
        id: request.id,
        ...describeError(error),
      });
      return failure(
        request.id,
        "INTERNAL_ERROR",
        "The manager could not complete this request"
      );
    }
  }

  private writeFrame(socket: Socket, response: ManagerResponse<unknown>): void {
    if (socket.destroyed || !socket.writable) {
      return;
    }
    socket.write(`${JSON.stringify(response)}\n`);
  }

  /**
   * Stop accepting work, let in-flight requests finish, then release the socket.
   *
   * No VM is stopped or removed here: the service owns no VM state, and
   * destroying VMs on exit would be exactly the failure this design avoids.
   */
  async close(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }
    this.shuttingDown = true;
    this.logger.info("manager shutting down");

    const server = this.server;
    // `close()` stops accepting but its callback only fires once every open
    // connection ends, so it must not be awaited before the drain below or a
    // still-open client deadlocks shutdown.
    const closed = server
      ? new Promise<void>((resolve) => server.close(() => resolve()))
      : Promise.resolve();

    if (this.inFlight.size > 0) {
      await Promise.race([
        Promise.allSettled([...this.inFlight]),
        new Promise<void>((resolve) => setTimeout(resolve, SHUTDOWN_GRACE_MS)),
      ]);
    }

    // Half-close first so already-written responses flush to the peer;
    // `destroy()` alone discards pending writes and resets the connection.
    for (const socket of this.connections) {
      socket.end();
    }
    await new Promise<void>((resolve) => setTimeout(resolve, FLUSH_MS));
    for (const socket of this.connections) {
      socket.destroy();
    }
    this.connections.clear();

    await closed;

    try {
      await unlink(this.config.socketPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        this.logger.warn("could not remove socket file on shutdown");
      }
    }
  }
}
