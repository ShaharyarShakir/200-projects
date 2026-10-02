import type {
  VMService,
  VmsanOptions,
  VmState,
  CreateVmOptions,
} from "vmsan";
import {
  isManagerErrorCode,
  sanitizeForMessage,
  type ManagerErrorCode,
  type ProtocolFileEntry,
  type ProtocolFileType,
  type ProtocolVm,
  type VmCreateParams,
  type VmExecParams,
  type VmExecResult,
  type VmFsDeleteParams,
  type VmFsDeleteResult,
  type VmFsDownloadParams,
  type VmFsDownloadResult,
  type VmFsListParams,
  type VmFsListResult,
  type VmFsMkdirParams,
  type VmFsMkdirResult,
  type VmFsReadParams,
  type VmFsReadResult,
  type VmFsWriteParams,
  type VmFsWriteResult,
  type VmRemoveResult,
} from "./protocol.js";
import { joinVmPath, normalizeVmPath } from "./path-utils.js";
import type { ManagerConfig } from "./config.js";

/**
 * The slice of the native vmsan `VMService` the manager uses.
 *
 * Narrowed to only the lifecycle methods the manager requires, so test doubles
 * can be lightweight and explicit.
 */
export type VmsanService = Pick<
  VMService,
  "list" | "get" | "create" | "start" | "stop" | "remove"
>;

type VmsanInitOptions = Pick<VmsanOptions, "paths">;

export type VmsanFactory = (options: VmsanInitOptions) => Promise<VmsanService>;

/**
 * The production factory.
 *
 * `vmsan` is imported dynamically so that a test which only exercises the pure
 * projection helpers never loads the native package. The static type-only
 * imports above are erased at compile time.
 */
export const realVmsanFactory: VmsanFactory = async (options) => {
  const { createVmsan } = await import("vmsan");
  return createVmsan(options);
};

/**
 * Initialize the single native vmsan service for this process.
 *
 * The explicit `paths` option matters more than it looks: vmsan's own
 * `vmsanPaths()` falls back to `$SUDO_USER` when it cannot read `$VMSAN_DIR`,
 * and this process runs as root. Passing the directory through explicitly means
 * the manager reads the location the operator configured rather than one
 * inferred from the invoking user.
 */
export function createVmsanService(
  config: ManagerConfig,
  factory: VmsanFactory = realVmsanFactory
): Promise<VmsanService> {
  return factory({ paths: config.vmsanDir });
}

/**
 * Project a native VM state record onto the manager protocol.
 *
 * This is an allow-list built field by field, so `agentToken` is absent by
 * construction: there is no code path that copies it, and host internals such
 * as `chrootDir`, `kernel`, `rootfs`, `apiSocket`, and `pid` are never read.
 */
export function toProtocolVm(state: VmState): ProtocolVm {
  return {
    id: state.id,
    status: state.status,
    runtime: state.runtime,
    vcpuCount: state.vcpuCount,
    memSizeMib: state.memSizeMib,
    createdAt: state.createdAt,
    snapshot: state.snapshot ?? null,
    timeoutAt: state.timeoutAt ?? null,
    tunnelHostnames: state.network?.tunnelHostnames ?? [],
  };
}

/**
 * Map native vmsan errors or unexpected exceptions into structured protocol error codes.
 */
export function categorizeVmsanError(
  error: unknown
): { code: ManagerErrorCode; message: string } {
  if (error === null || typeof error !== "object") {
    return {
      code: "INTERNAL_ERROR",
      message: "The manager could not complete this request",
    };
  }

  const err = error as { code?: unknown; message?: unknown; name?: unknown };
  const rawMessage = typeof err.message === "string" ? err.message : "An unexpected error occurred";
  const message = sanitizeForMessage(rawMessage);

  if (typeof err.code === "string") {
    if (isManagerErrorCode(err.code)) {
      return { code: err.code, message };
    }

    if (err.code === "ERR_FILE_NOT_FOUND") {
      return { code: "FILE_NOT_FOUND", message };
    }

    if (err.code === "ERR_FILE_TOO_LARGE") {
      return { code: "FILE_TOO_LARGE", message };
    }

    if (err.code === "ERR_VM_NOT_FOUND" || err.code === "ERR_VM_STATE_NOT_FOUND") {
      return { code: "VM_NOT_FOUND", message };
    }

    if (err.code === "ERR_VM_NOT_STOPPED" || err.code === "ERR_VM_NOT_RUNNING") {
      return { code: "VM_INVALID_STATE", message };
    }

    if (err.code.startsWith("ERR_VALIDATION_")) {
      return { code: "VALIDATION_ERROR", message };
    }

    if (
      err.code.startsWith("ERR_FIRECRACKER_") ||
      err.code.startsWith("ERR_TIMEOUT_") ||
      err.code.startsWith("ERR_SETUP_") ||
      err.code.startsWith("ERR_NETWORK_") ||
      err.code.startsWith("ERR_CLOUDFLARE_") ||
      err.code.startsWith("ERR_VM_")
    ) {
      return { code: "VM_OPERATION_FAILED", message };
    }
  }

  const lowerMsg = rawMessage.toLowerCase();
  if (
    lowerMsg.includes("file not found") ||
    lowerMsg.includes("no such file") ||
    lowerMsg.includes("directory not found")
  ) {
    return { code: "FILE_NOT_FOUND", message };
  }
  if (lowerMsg.includes("file too large") || lowerMsg.includes("exceeds maximum")) {
    return { code: "FILE_TOO_LARGE", message };
  }
  if (lowerMsg.includes("not found") || lowerMsg.includes("does not exist")) {
    return { code: "VM_NOT_FOUND", message };
  }
  if (
    lowerMsg.includes("not stopped") ||
    lowerMsg.includes("not running") ||
    lowerMsg.includes("already stopped") ||
    lowerMsg.includes("already running") ||
    lowerMsg.includes("invalid state")
  ) {
    return { code: "VM_INVALID_STATE", message };
  }
  if (lowerMsg.includes("invalid") || lowerMsg.includes("validation")) {
    return { code: "VALIDATION_ERROR", message };
  }

  return { code: "INTERNAL_ERROR", message: "The manager could not complete this request" };
}

/**
 * Read VM inventory from the native service and redact it for the protocol.
 */
export async function listVms(service: VmsanService): Promise<ProtocolVm[]> {
  const states = service.list();
  return states.map(toProtocolVm);
}

/**
 * Retrieve and redact a single VM's state.
 */
export async function getVm(service: VmsanService, vmId: string): Promise<ProtocolVm> {
  const state = service.get(vmId);
  if (!state) {
    const err = new Error(`VM not found: ${vmId}`);
    (err as { code?: string }).code = "ERR_VM_NOT_FOUND";
    throw err;
  }
  return toProtocolVm(state);
}

/**
 * Create a new microVM, mapping protocol parameters (`memoryMib` → `memMib`) to native options.
 */
export async function createVm(
  service: VmsanService,
  params?: VmCreateParams
): Promise<ProtocolVm> {
  const nativeOpts: CreateVmOptions = {};
  if (params?.runtime !== undefined) {
    nativeOpts.runtime = params.runtime;
  }
  if (params?.vcpus !== undefined) {
    nativeOpts.vcpus = params.vcpus;
  }
  if (params?.memoryMib !== undefined) {
    nativeOpts.memMib = params.memoryMib;
  }
  if (params?.diskSizeGb !== undefined) {
    nativeOpts.diskSizeGb = params.diskSizeGb;
  }
  if (params?.networkPolicy !== undefined) {
    nativeOpts.networkPolicy = params.networkPolicy;
  }
  if (params?.timeoutMs !== undefined) {
    nativeOpts.timeoutMs = params.timeoutMs;
  }

  const result = await service.create(nativeOpts);
  if (!result || !result.state) {
    throw new Error("VM creation returned empty state");
  }
  return toProtocolVm(result.state);
}

/**
 * Start a stopped microVM.
 */
export async function startVm(service: VmsanService, vmId: string): Promise<ProtocolVm> {
  const result = await service.start(vmId);
  if (!result.success) {
    throw result.error || new Error(`Failed to start VM ${vmId}`);
  }
  const state = result.state ?? service.get(vmId);
  if (!state) {
    throw new Error(`VM state not found after starting ${vmId}`);
  }
  return toProtocolVm(state);
}

/**
 * Stop a running microVM.
 */
export async function stopVm(service: VmsanService, vmId: string): Promise<ProtocolVm> {
  const result = await service.stop(vmId);
  if (!result.success) {
    throw result.error || new Error(`Failed to stop VM ${vmId}`);
  }
  if (result.alreadyStopped) {
    const err = new Error(`VM ${vmId} is already stopped`);
    (err as { code?: string }).code = "ERR_VM_NOT_RUNNING";
    throw err;
  }
  const state = service.get(vmId);
  if (!state) {
    throw new Error(`VM state not found after stopping ${vmId}`);
  }
  return toProtocolVm(state);
}

/**
 * Remove a stopped microVM.
 */
export async function removeVm(
  service: VmsanService,
  vmId: string
): Promise<VmRemoveResult> {
  const result = await service.remove(vmId);
  if (!result.success) {
    throw result.error || new Error(`Failed to remove VM ${vmId}`);
  }
  return { removed: true, vmId };
}

/**
 * Guest agent command parameters.
 */
export interface AgentRunCommandParams {
  cmd: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  sudo?: boolean;
  signal?: AbortSignal;
}

/**
 * Guest agent command execution outcome.
 */
export interface AgentCommandFinished {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs?: number;
}

/**
 * File write descriptor for AgentClient.
 */
export interface WriteFileEntry {
  path: string;
  content: Buffer;
}

/**
 * The subset of `AgentClient` methods required by the manager.
 */
export interface AgentClientLike {
  runCommand(params: AgentRunCommandParams): Promise<AgentCommandFinished>;
  readFile(path: string): Promise<Buffer | null>;
  writeFiles(files: WriteFileEntry[], extractDir?: string): Promise<void>;
}

export type AgentClientFactory = (
  baseUrl: string,
  token: string
) => AgentClientLike | Promise<AgentClientLike>;

/**
 * The production guest agent client factory.
 */
export const realAgentClientFactory: AgentClientFactory = async (baseUrl, token) => {
  const { AgentClient } = await import("vmsan");
  return new AgentClient(baseUrl, token) as unknown as AgentClientLike;
};

/**
 * Internal helper to resolve a running VM and instantiate an AgentClient.
 */
async function getRunningAgentClient(
  service: VmsanService,
  vmId: string,
  clientFactory: AgentClientFactory
): Promise<AgentClientLike> {
  const state = service.get(vmId);
  if (!state) {
    const err = new Error(`VM not found: ${vmId}`);
    (err as { code?: string }).code = "ERR_VM_NOT_FOUND";
    throw err;
  }

  if (state.status !== "running") {
    const err = new Error(`VM ${vmId} is not running (status: ${state.status})`);
    (err as { code?: string }).code = "ERR_VM_NOT_RUNNING";
    throw err;
  }

  const guestIp = state.network?.guestIp;
  if (!guestIp) {
    const err = new Error(`VM ${vmId} has no configured guest IP address`);
    (err as { code?: string }).code = "ERR_NETWORK_NOT_CONFIGURED";
    throw err;
  }

  const agentPort = (state as { agentPort?: number }).agentPort ?? 8080;
  const agentToken = state.agentToken;
  if (!agentToken) {
    const err = new Error(`VM ${vmId} has no agent token configured`);
    (err as { code?: string }).code = "ERR_VM_NO_AGENT_TOKEN";
    throw err;
  }

  const baseUrl = `http://${guestIp}:${agentPort}`;
  return clientFactory(baseUrl, agentToken);
}

/**
 * Resolve the guest agent WebSocket URL for interactive terminal sessions.
 */
export function getAgentShellUrl(
  service: VmsanService,
  vmId: string,
  sudo?: boolean
): string {
  const state = service.get(vmId);
  if (!state) {
    const err = new Error(`VM not found: ${vmId}`);
    (err as { code?: string }).code = "ERR_VM_NOT_FOUND";
    throw err;
  }

  if (state.status !== "running") {
    const err = new Error(`VM ${vmId} is not running (status: ${state.status})`);
    (err as { code?: string }).code = "ERR_VM_NOT_RUNNING";
    throw err;
  }

  const guestIp = state.network?.guestIp;
  if (!guestIp) {
    const err = new Error(`VM ${vmId} has no configured guest IP address`);
    (err as { code?: string }).code = "ERR_NETWORK_NOT_CONFIGURED";
    throw err;
  }

  const agentPort = (state as { agentPort?: number }).agentPort ?? 8080;
  const agentToken = state.agentToken;
  if (!agentToken) {
    const err = new Error(`VM ${vmId} has no agent token configured`);
    (err as { code?: string }).code = "ERR_VM_NO_AGENT_TOKEN";
    throw err;
  }

  const url = new URL(`ws://${guestIp}:${agentPort}/ws/shell`);
  url.searchParams.set("token", agentToken);
  if (sudo === true) {
    url.searchParams.set("user", "root");
  }
  return url.toString();
}

/**
 * Execute a command inside a running microVM via the guest agent daemon over internal HTTP.
 */
export async function execVm(
  service: VmsanService,
  params: VmExecParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmExecResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);

  const startTime = Date.now();
  const result = await client.runCommand({
    cmd: "sh",
    args: ["-c", params.command],
    cwd: params.workingDirectory,
    timeoutMs: params.timeoutMs ?? 30000,
    ...(params.sudo !== undefined ? { sudo: params.sudo } : {}),
  });
  const durationMs =
    typeof result.durationMs === "number" ? result.durationMs : Date.now() - startTime;

  return {
    exitCode: typeof result.exitCode === "number" ? result.exitCode : 0,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    durationMs,
  };
}

const IN_GUEST_LIST_SCRIPT = `
TARGET="$1"
if [ ! -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
  echo "__ERR_NOT_FOUND__" >&2
  exit 2
fi
if [ ! -d "$TARGET" ]; then
  echo "__ERR_NOT_DIR__" >&2
  exit 3
fi

if command -v node >/dev/null 2>&1; then
  node -e '
const fs = require("fs");
const path = require("path");
const target = process.argv[1];
try {
  const stat = fs.lstatSync(target);
  if (!stat.isDirectory()) {
    console.error("__ERR_NOT_DIR__");
    process.exit(3);
  }
} catch (e) {
  console.error("__ERR_NOT_FOUND__");
  process.exit(2);
}
const entries = fs.readdirSync(target, { withFileTypes: true });
const result = entries.map(e => {
  const full = path.join(target, e.name);
  let size = undefined;
  let mtime = undefined;
  let mode = undefined;
  try {
    const s = fs.lstatSync(full);
    size = s.isFile() ? s.size : undefined;
    mtime = s.mtime.toISOString();
    mode = (s.mode & 511).toString(8);
  } catch {}
  let type = "unknown";
  if (e.isDirectory()) type = "directory";
  else if (e.isFile()) type = "file";
  else if (e.isSymbolicLink()) type = "symlink";
  return { name: e.name, type, size, modifiedAt: mtime, mode };
});
console.log(JSON.stringify(result));
' "$TARGET"
elif command -v python3 >/dev/null 2>&1; then
  python3 -c '
import os, sys, json, stat, datetime
target = sys.argv[1]
try:
  st = os.lstat(target)
  if not stat.S_ISDIR(st.st_mode):
    sys.stderr.write("__ERR_NOT_DIR__\\n")
    sys.exit(3)
except FileNotFoundError:
  sys.stderr.write("__ERR_NOT_FOUND__\\n")
  sys.exit(2)
except Exception:
  sys.stderr.write("__ERR_NOT_FOUND__\\n")
  sys.exit(2)

result = []
try:
  with os.scandir(target) as it:
    for entry in it:
      size = None
      mtime = None
      mode = None
      try:
        s = entry.stat(follow_symlinks=False)
        if entry.is_file(follow_symlinks=False):
          size = s.st_size
        mtime = datetime.datetime.fromtimestamp(s.st_mtime, datetime.timezone.utc).isoformat()
        mode = oct(s.st_mode & 511)[2:]
      except Exception:
        pass
      t = "unknown"
      if entry.is_symlink():
        t = "symlink"
      elif entry.is_dir(follow_symlinks=False):
        t = "directory"
      elif entry.is_file(follow_symlinks=False):
        t = "file"
      result.append({"name": entry.name, "type": t, "size": size, "modifiedAt": mtime, "mode": mode})
except Exception as e:
  sys.stderr.write(str(e))
  sys.exit(1)
print(json.dumps(result))
' "$TARGET"
else
  cd "$TARGET" 2>/dev/null || exit 1
  echo "["
  first=1
  for name in .* *; do
    [ "$name" = "." ] && continue
    [ "$name" = ".." ] && continue
    [ "$name" = ".*" ] && [ ! -e "$name" ] && [ ! -L "$name" ] && continue
    [ "$name" = "*" ] && [ ! -e "$name" ] && [ ! -L "$name" ] && continue

    t="unknown"
    if [ -L "$name" ]; then
      t="symlink"
    elif [ -d "$name" ]; then
      t="directory"
    elif [ -f "$name" ]; then
      t="file"
    fi
    size="null"
    if [ "$t" = "file" ]; then
      s=$(wc -c < "$name" 2>/dev/null || echo 0)
      size=\${s:-0}
    fi
    [ $first -eq 0 ] && echo ","
    first=0
    esc_name=$(echo "$name" | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g')
    printf '{"name":"%s","type":"%s","size":%s}' "$esc_name" "$t" "$size"
  done
  echo ""
  echo "]"
fi
`.trim();

/**
 * List files and directories in a microVM guest directory.
 */
export async function listVmFiles(
  service: VmsanService,
  params: VmFsListParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmFsListResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);
  const normalizedPath = normalizeVmPath(params.path);

  const result = await client.runCommand({
    cmd: "sh",
    args: ["-c", IN_GUEST_LIST_SCRIPT, "sh", normalizedPath],
    timeoutMs: 15000,
  });

  if (
    result.exitCode === 2 ||
    result.stderr.includes("__ERR_NOT_FOUND__") ||
    result.stdout.includes("__ERR_NOT_FOUND__")
  ) {
    const err = new Error(`Directory not found: ${normalizedPath}`);
    (err as { code?: string }).code = "ERR_FILE_NOT_FOUND";
    throw err;
  }

  if (
    result.exitCode === 3 ||
    result.stderr.includes("__ERR_NOT_DIR__") ||
    result.stdout.includes("__ERR_NOT_DIR__")
  ) {
    const err = new Error(`Path is not a directory: ${normalizedPath}`);
    (err as { code?: string }).code = "ERR_VALIDATION_NOT_A_DIRECTORY";
    throw err;
  }

  if (result.exitCode !== 0) {
    const err = new Error(
      `Failed to list directory contents at ${normalizedPath}: ${result.stderr || result.stdout}`
    );
    (err as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
    throw err;
  }

  let rawEntries: Array<{
    name?: string;
    type?: string;
    size?: number | null;
    modifiedAt?: string | null;
    mode?: string | null;
  }> = [];

  try {
    const jsonText = result.stdout.trim();
    if (jsonText.length > 0) {
      rawEntries = JSON.parse(jsonText);
    }
  } catch {
    const err = new Error(`Malformed directory listing output from guest`);
    (err as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
    throw err;
  }

  const entries: ProtocolFileEntry[] = [];
  for (const raw of rawEntries) {
    if (typeof raw.name !== "string" || raw.name.length === 0) continue;
    const typeStr = raw.type;
    let type: ProtocolFileType = "unknown";
    if (
      typeStr === "file" ||
      typeStr === "directory" ||
      typeStr === "symlink" ||
      typeStr === "unknown"
    ) {
      type = typeStr;
    }

    const entry: ProtocolFileEntry = {
      name: raw.name,
      path: joinVmPath(normalizedPath, raw.name),
      type,
    };

    if (typeof raw.size === "number" && !isNaN(raw.size)) {
      entry.size = raw.size;
    }
    if (typeof raw.mode === "string" && raw.mode.length > 0) {
      entry.mode = raw.mode;
    }
    if (typeof raw.modifiedAt === "string" && raw.modifiedAt.length > 0) {
      entry.modifiedAt = raw.modifiedAt;
    }

    entries.push(entry);
  }

  // Sort directories first, then files alphabetically
  entries.sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    path: normalizedPath,
    entries,
  };
}

/** Maximum text preview size: 1 MiB (1,048,576 bytes) */
export const MAX_PREVIEW_BYTES = 1024 * 1024;

/**
 * Read text file content from a microVM for preview.
 */
export async function readVmFile(
  service: VmsanService,
  params: VmFsReadParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmFsReadResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);
  const normalizedPath = normalizeVmPath(params.path);
  const maxBytes = params.maxBytes ?? MAX_PREVIEW_BYTES;

  const buffer = await client.readFile(normalizedPath);
  if (buffer === null) {
    const err = new Error(`File not found: ${normalizedPath}`);
    (err as { code?: string }).code = "ERR_FILE_NOT_FOUND";
    throw err;
  }

  if (buffer.length > maxBytes) {
    const err = new Error(
      `File exceeds maximum preview size of ${maxBytes} bytes (file size: ${buffer.length} bytes)`
    );
    (err as { code?: string }).code = "ERR_FILE_TOO_LARGE";
    throw err;
  }

  return {
    path: normalizedPath,
    content: buffer.toString("utf8"),
    size: buffer.length,
  };
}

/** Maximum upload payload size: 50 MiB (52,428,800 bytes) */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/**
 * Write a file directly into the microVM filesystem.
 */
export async function writeVmFile(
  service: VmsanService,
  params: VmFsWriteParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmFsWriteResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);
  const destDir = normalizeVmPath(params.destDir);
  const buffer = Buffer.from(params.contentBase64, "base64");

  if (buffer.length > MAX_UPLOAD_BYTES) {
    const err = new Error(
      `Uploaded file exceeds maximum limit of 50MB (${buffer.length} bytes)`
    );
    (err as { code?: string }).code = "ERR_FILE_TOO_LARGE";
    throw err;
  }

  await client.writeFiles([{ path: params.fileName, content: buffer }], destDir);

  return {
    path: joinVmPath(destDir, params.fileName),
    size: buffer.length,
  };
}

/**
 * Create a directory inside the microVM filesystem.
 */
export async function mkdirVmDirectory(
  service: VmsanService,
  params: VmFsMkdirParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmFsMkdirResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);
  const normalizedPath = normalizeVmPath(params.path);

  const result = await client.runCommand({
    cmd: "mkdir",
    args: ["-p", normalizedPath],
    timeoutMs: 15000,
  });

  if (result.exitCode !== 0) {
    const err = new Error(
      `Failed to create directory ${normalizedPath}: ${result.stderr || result.stdout}`
    );
    (err as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
    throw err;
  }

  return {
    path: normalizedPath,
  };
}

const IN_GUEST_DELETE_SCRIPT = `
TARGET="$1"
if [ ! -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
  echo "__ERR_NOT_FOUND__" >&2
  exit 2
fi
if [ -d "$TARGET" ] && [ ! -L "$TARGET" ]; then
  rmdir "$TARGET"
else
  rm -f "$TARGET"
fi
`.trim();

/**
 * Delete a file or empty directory from the microVM filesystem (non-recursive).
 */
export async function deleteVmFile(
  service: VmsanService,
  params: VmFsDeleteParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmFsDeleteResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);
  const normalizedPath = normalizeVmPath(params.path);

  if (normalizedPath === "/") {
    const err = new Error("Cannot delete the root directory (/)");
    (err as { code?: string }).code = "ERR_VALIDATION_ROOT_DELETE";
    throw err;
  }

  const result = await client.runCommand({
    cmd: "sh",
    args: ["-c", IN_GUEST_DELETE_SCRIPT, "sh", normalizedPath],
    timeoutMs: 15000,
  });

  if (
    result.exitCode === 2 ||
    result.stderr.includes("__ERR_NOT_FOUND__") ||
    result.stdout.includes("__ERR_NOT_FOUND__")
  ) {
    const err = new Error(`File or directory not found: ${normalizedPath}`);
    (err as { code?: string }).code = "ERR_FILE_NOT_FOUND";
    throw err;
  }

  if (result.exitCode !== 0) {
    const err = new Error(
      `Failed to delete ${normalizedPath}: ${result.stderr || result.stdout || "directory not empty or delete failed"}`
    );
    (err as { code?: string }).code = "ERR_VM_OPERATION_FAILED";
    throw err;
  }

  return {
    deleted: true,
    path: normalizedPath,
  };
}

/** Maximum download payload size: 100 MiB (104,857,600 bytes) */
export const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

/**
 * Download a file from the microVM filesystem.
 */
export async function downloadVmFile(
  service: VmsanService,
  params: VmFsDownloadParams,
  clientFactory: AgentClientFactory = realAgentClientFactory
): Promise<VmFsDownloadResult> {
  const client = await getRunningAgentClient(service, params.vmId, clientFactory);
  const normalizedPath = normalizeVmPath(params.path);

  const buffer = await client.readFile(normalizedPath);
  if (buffer === null) {
    const err = new Error(`File not found: ${normalizedPath}`);
    (err as { code?: string }).code = "ERR_FILE_NOT_FOUND";
    throw err;
  }

  if (buffer.length > MAX_DOWNLOAD_BYTES) {
    const err = new Error(
      `File exceeds maximum download size of 100MB (${buffer.length} bytes)`
    );
    (err as { code?: string }).code = "ERR_FILE_TOO_LARGE";
    throw err;
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] || "download";

  return {
    path: normalizedPath,
    fileName,
    contentBase64: buffer.toString("base64"),
    size: buffer.length,
  };
}
