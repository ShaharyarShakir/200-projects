import { homedir } from "node:os";
import { join } from "node:path";

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface ManagerConfig {
  socketPath: string;
  vmsanDir: string;
  logLevel: LogLevel;
  maxRequestBytes: number;
  /**
   * Group the control socket is handed to after bind, so an unprivileged
   * client can reach it without the socket being world-accessible. Undefined
   * means the socket keeps the service user's primary group.
   */
  socketGroup?: string;
}

export type ManagerEnv = Record<string, string | undefined>;

/** 64 KiB. The control protocol has no reason to accept larger frames. */
export const DEFAULT_MAX_REQUEST_BYTES = 64 * 1024;

export const SOCKET_FILE_NAME = "vmsan-manager.sock";

const LOG_LEVELS: readonly LogLevel[] = ["error", "warn", "info", "debug"];

export const DEFAULT_VMSAN_DIR_NAME = ".vmsan";

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * Resolve the Unix socket path.
 *
 * An explicit override always wins, which is how a production deployment
 * points at `/run/vmsan-manager.sock`. Otherwise prefer the per-user runtime
 * directory, falling back to `/run/user/<uid>` when XDG_RUNTIME_DIR is absent.
 */
export function resolveSocketPath(env: ManagerEnv, uid: number): string {
  const override = env.VMSAN_MANAGER_SOCKET;
  if (override && override.length > 0) {
    return override;
  }

  const runtimeDir = env.XDG_RUNTIME_DIR;
  if (runtimeDir && runtimeDir.length > 0) {
    return join(runtimeDir, SOCKET_FILE_NAME);
  }

  return join("/run/user", String(uid), SOCKET_FILE_NAME);
}

/**
 * Resolve the vmsan data directory.
 *
 * The default is derived from the current user's home directory at runtime so
 * that no specific user's home path is embedded in this source. Note that the
 * manager normally runs as root: passing this value through to the native API
 * as an explicit `paths` option is what keeps the manager and the operator
 * reading the same directory, instead of leaving it to vmsan's `$SUDO_USER`
 * environment sniffing.
 */
export function resolveVmsanDir(env: ManagerEnv, home: string): string {
  const override = env.VMSAN_DIR;
  if (override && override.length > 0) {
    return override;
  }
  return join(home, DEFAULT_VMSAN_DIR_NAME);
}

export function resolveLogLevel(env: ManagerEnv): LogLevel {
  const raw = env.VMSAN_MANAGER_LOG_LEVEL;
  if (raw && isLogLevel(raw)) {
    return raw;
  }
  return "info";
}

/**
 * Resolve the group the control socket is handed to after bind.
 *
 * Empty is treated as unset: a systemd `Environment=` line with an empty value
 * is a configuration mistake, and the safe reading of "no group configured" is
 * to leave the socket with the service user's primary group.
 */
export function resolveSocketGroup(env: ManagerEnv): string | undefined {
  const raw = env.VMSAN_MANAGER_SOCKET_GROUP;
  if (raw && raw.length > 0) {
    return raw;
  }
  return undefined;
}

export function resolveMaxRequestBytes(env: ManagerEnv): number {
  const raw = env.VMSAN_MANAGER_MAX_REQUEST_BYTES;
  if (!raw) {
    return DEFAULT_MAX_REQUEST_BYTES;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_MAX_REQUEST_BYTES;
  }
  return parsed;
}

export type LoadConfigOptions = {
  env?: ManagerEnv;
  home?: string;
  uid?: number;
};

export function loadConfig(options: LoadConfigOptions = {}): ManagerConfig {
  const env = options.env ?? process.env;
  const home = options.home ?? homedir();
  const uid = options.uid ?? process.getuid?.() ?? 0;

  return {
    socketPath: resolveSocketPath(env, uid),
    vmsanDir: resolveVmsanDir(env, home),
    logLevel: resolveLogLevel(env),
    maxRequestBytes: resolveMaxRequestBytes(env),
    socketGroup: resolveSocketGroup(env),
  };
}
