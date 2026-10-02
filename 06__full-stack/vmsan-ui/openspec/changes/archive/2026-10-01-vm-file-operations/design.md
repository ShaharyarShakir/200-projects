# Design: MicroVM File Operations (Phase 2C)

## Context

MicroVMs managed by `vmsan` run isolated in Firecracker with a lightweight in-guest daemon (`vmsan-agent`) reachable via internal HTTP over private virtual interfaces. `vmsan-manager` runs as a privileged daemon with access to `AgentClient` and exposes a newline-delimited JSON-RPC socket (`vmsan-manager.sock`).

Next.js operates as an unprivileged web application communicating exclusively through this Unix socket. In Phase 2B, command execution (`vm.exec`) was added to the manager and Next.js. Phase 2C introduces comprehensive file operations (`list`, `read`, `write`, `mkdir`, `delete`, `download`) by utilizing `AgentClient` in `vmsan-manager` while keeping the host completely decoupled from the microVM filesystem.

See `proposal.md` for motivation and `specs/` for normative requirements.

## Goals / Non-Goals

**Goals:**
- Provide a responsive, modular file browser on `/vms/[id]` with breadcrumb navigation and metadata display.
- Support safe read-only text file preview (≤ 1 MiB), file uploads (≤ 50 MiB), file downloads (≤ 100 MiB), folder creation, and non-recursive item deletion.
- Enforce strict security boundaries: Next.js and the browser never access the host filesystem or map VM paths to host paths.
- Enforce path normalization and traversal rejection across both Next.js and manager boundaries.
- Utilize native `AgentClient` APIs (`readFile`, `writeFiles`, `runCommand`) without spawning host CLI subprocesses (`child_process`, `exec`, `spawn`).
- Enforce microVM `running` state verification for all filesystem operations.

**Non-Goals:**
- Recursive directory deletion (intentionally blocked to prevent accidental data loss).
- Text editing / file mutation in the browser (read-only preview only).
- Permissions / ownership editors (`chmod`/`chown` UI).
- File search, archive extraction/creation, or symlink editing.
- Host directory mounting or SSH/SFTP/WebSockets.
- Automated test suites (per explicit instructions for Phase 2C).

## Decisions

### 1. Architectural Flow and Security Boundaries

```text
Browser (React UI on /vms/[id])
   │
   │ HTTP (REST API /api/vms/:id/files/*)
   ▼
Next.js Application (Unprivileged)
   │
   │ Unix Domain Socket (vmsan-manager.sock)
   ▼
vmsan-manager (Privileged Daemon)
   │
   │ AgentClient (HTTP over internal guest IP:port)
   ▼
vmsan-agent (Inside MicroVM)
   │
   ▼
MicroVM Filesystem (/, /home, /tmp, etc.)
```

- **Next.js Role**: Validates parameters, normalizes VM paths, enforces size thresholds, authenticates/authorizes requests, and translates domain errors to HTTP status codes. Never touches host `fs` for VM operations.
- **vmsan-manager Role**: Verifies VM status (`running`), validates frames, strips host paths and tokens (`agentToken`, `agentPort`), and delegates to `AgentClient`.
- **Guest Agent Role**: Reads/writes files and manages directories inside the microVM rootfs.

### 2. Protocol and RPC Method Extensions

Extend `protocol.ts` in both `vmsan-manager` and `src/lib/vmsan-manager/`:

```ts
export type ManagerMethod =
  | "health"
  | "list"
  | "vm.create"
  | "vm.start"
  | "vm.stop"
  | "vm.remove"
  | "vm.exec"
  | "vm.fs.list"
  | "vm.fs.read"
  | "vm.fs.write"
  | "vm.fs.mkdir"
  | "vm.fs.delete"
  | "vm.fs.download";

export interface VmFsListParams {
  vmId: string;
  path: string;
}

export interface VmFsReadParams {
  vmId: string;
  path: string;
  maxBytes?: number;
}

export interface VmFsWriteParams {
  vmId: string;
  destDir: string;
  fileName: string;
  contentBase64: string;
}

export interface VmFsMkdirParams {
  vmId: string;
  path: string;
}

export interface VmFsDeleteParams {
  vmId: string;
  path: string;
}

export interface VmFsDownloadParams {
  vmId: string;
  path: string;
}
```

### 3. AgentClient Integration Strategy

- **`vm.fs.list`**: Uses `AgentClient.runCommand` to execute an in-guest directory inspection script (using standard POSIX shell / python / stat in guest) that outputs structured JSON containing entries: `name`, `path`, `type` (`file` | `directory` | `symlink` | `unknown`), `size`, `mode`, `modifiedAt`.
- **`vm.fs.read`**: Calls native `AgentClient.readFile(path)`. Checks file size against 1 MiB limit. Returns UTF-8 decoded string and size.
- **`vm.fs.write`**: Decodes base64 payload to buffer and calls `AgentClient.writeFiles([{ path: fileName, content: buffer }], destDir)` with `destDir` as destination extraction path.
- **`vm.fs.mkdir`**: Uses `AgentClient.runCommand({ cmd: "mkdir", args: ["-p", path] })` or POSIX equivalent inside the guest.
- **`vm.fs.delete`**: Uses `AgentClient.runCommand` to execute non-recursive deletion (`rm` for regular files/symlinks, `rmdir` for directories). If directory is non-empty, `rmdir` fails naturally without touching nested contents.
- **`vm.fs.download`**: Calls `AgentClient.readFile(path)`. Checks file size against 100 MiB limit. Returns base64 encoded payload and byte length.

*Alternatives considered:*
- *Spawning host CLI subprocess (`vmsan upload`)*: Rejected. Violates security requirements and introduces host process overhead.
- *Host filesystem mounting / chroot read*: Rejected. Violates privilege separation and security boundary.

### 4. Path Normalization and Traversal Defense

Create a dedicated POSIX VM path normalizer (`src/lib/vms/path-utils.ts` and `vmsan-manager/src/path-utils.ts`):
- All paths must be absolute within the VM (`/` anchored).
- Relative segments (`.` and `..`) are resolved logically within the virtual path tree (e.g., `/tmp/../etc` -> `/etc`).
- Paths attempting to traverse above `/` (e.g. `../../etc`) are clamped to `/etc` or rejected if malformed.
- Filenames for upload and mkdir are strictly checked to ensure they contain no `/` or `\0` characters.

### 5. Next.js REST API Design

| Endpoint | Method | Params / Body | Success Status & Response | Error Codes |
|---|---|---|---|---|
| `/api/vms/:id/files` | GET | `?path=/...` | 200 `{ path: string, entries: VmFile[] }` | `INVALID_REQUEST`, `VM_NOT_FOUND`, `VM_INVALID_STATE`, `FILE_NOT_FOUND`, `SERVICE_UNAVAILABLE` |
| `/api/vms/:id/files/read` | GET | `?path=/...` | 200 `{ path: string, content: string, size: number }` | `FILE_TOO_LARGE` (413), `FILE_NOT_FOUND` (404), `INVALID_REQUEST` |
| `/api/vms/:id/files` | POST | JSON `{ destDir: string, fileName: string, contentBase64: string }` | 201 `{ path: string, size: number }` | `UPLOAD_TOO_LARGE` (413), `INVALID_REQUEST` (400) |
| `/api/vms/:id/files/mkdir` | POST | JSON `{ path: string }` | 201 `{ path: string }` | `INVALID_REQUEST` (400), `VM_OPERATION_FAILED` (500) |
| `/api/vms/:id/files` | DELETE | `?path=/...` | 200 `{ deleted: true, path: string }` | `INVALID_REQUEST` (400), `VM_OPERATION_FAILED` (500) |
| `/api/vms/:id/files/download` | GET | `?path=/...` | 200 Binary Stream with `Content-Disposition: attachment; filename="..."` | `FILE_TOO_LARGE` (413), `FILE_NOT_FOUND` (404) |

### 6. Frontend Component Hierarchy

```text
src/components/vms/
├── vm-detail-view.tsx            # Hosts overview, terminal, specs, metadata, and file browser
├── vm-file-browser.tsx           # Container: state, breadcrumbs, toolbar (Refresh, Upload, New Folder)
├── vm-file-list.tsx              # Table: entry icon, name (clickable dirs), type, size, modified, actions
├── vm-file-preview.tsx           # Modal / Sheet: read-only text viewer or large/binary notice + download
├── vm-upload-dialog.tsx          # Dialog: file picker, destination path, progress state
└── vm-create-folder-dialog.tsx   # Dialog: folder name input, validation
```

**State Management**:
- `currentPath: string` (starts at `/`)
- `entries: VmFile[]`
- `isLoading: boolean`, `isRefreshing: boolean`, `error: string | null`
- Dialog visibility state for Upload, Create Folder, and Delete Confirmation.
- Preview modal state holding `previewPath`, `previewContent`, `previewLoading`, `previewError`.

## Risks / Trade-offs

- **[Risk: High memory usage during large file transfers]**
  → *Mitigation*: Hard limits enforced: preview ≤ 1 MiB, upload ≤ 50 MiB, download ≤ 100 MiB. Buffer allocation checked before reading or sending.
- **[Risk: Path traversal exposing unauthorized VM files]**
  → *Mitigation*: Both Next.js and manager normalize paths and strip relative traversal segments before executing guest agent operations.
- **[Risk: Accidental deletion of non-empty folders]**
  → *Mitigation*: Non-recursive deletion primitive (`rmdir`) ensures non-empty directories fail safely without recursive file removal.
- **[Risk: Socket payload limits in vmsan-manager]**
  → *Mitigation*: Configure `maxRequestBytes` in manager config (e.g. 128 MiB) to accommodate base64-encoded 50 MiB file uploads over the Unix socket.
- **[Risk: Guest Agent unavailability or timeout]**
  → *Mitigation*: Standard error categorization maps agent timeouts and unreachable socket states to standard 502/503 HTTP responses.
