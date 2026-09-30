# Phase 1B.3 Report — vmsan Manager MicroVM Lifecycle Delegation

**Change:** `vmsan-manager-vm-lifecycle`  
**Status:** Complete. All 16 tasks implemented and verified.  
**Architecture:** Zero-Subprocess Privilege Separation via Local Unix Domain Socket (`/run/vmsan-manager.sock`, mode `0660`, group `vmsan`).

---

## 1. Executive Summary

Phase 1B.3 successfully extends the privileged background daemon (`vmsan-manager`) and the unprivileged Next.js web application with full end-to-end microVM lifecycle capabilities:
- **VM Creation (`vm.create` / `POST /api/vms`):** Creates microVMs with strict configuration parameter validation (`vcpus`, `memoryMib`, `diskSizeGb`, `runtime`, `networkPolicy`, `timeoutMs`), mapping parameters to native `VMService.create` without spawning any subprocesses.
- **VM Startup (`vm.start` / `POST /api/vms/[id]/start`):** Starts stopped microVMs and returns sanitized state.
- **VM Graceful Shutdown (`vm.stop` / `POST /api/vms/[id]/stop`):** Gracefully stops running microVMs and returns updated state.
- **VM Deletion (`vm.remove` / `DELETE /api/vms/[id]`):** Deletes stopped microVMs and returns `{ "removed": true, "id": id }`.
- **Zero-Subprocess Privilege Separation:** Replaces former temporary HTTP 501 `VM_LIFECYCLE_UNAVAILABLE` stub endpoints with active Unix socket RPC delegation. Next.js never executes `child_process`, `sudo`, or shell commands, and never imports `vmsan`.
- **Strict Response Redaction:** Allow-list projection (`toProtocolVm`) strips all sensitive credentials (`agentToken`, `agentPort`), host paths (`chrootDir`, `kernel`, `rootfs`, `apiSocket`), and jailer runtime internals before transmission across the socket boundary.

---

## 2. Component Implementation Details

### 2.1 RPC Protocol & Parameter Validation
- **Protocol Contract (`vmsan-manager/src/protocol.ts` & `src/lib/vmsan-manager/protocol.ts`):**
  - Extended with typed request/response variants for `vm.create`, `vm.start`, `vm.stop`, and `vm.remove`.
  - Structured error codes: `INVALID_REQUEST`, `VALIDATION_ERROR`, `VM_NOT_FOUND`, `VM_INVALID_STATE`, `VM_OPERATION_FAILED`, `INTERNAL_ERROR`.
  - Synchronized protocol declarations asserted by `protocol-sync.test.ts`.
- **Parameter Validators:**
  - `validateVmCreateParams`: Validates `vcpus` in `[1, 4]`, `memoryMib` in `[64, 4096]`, `diskSizeGb` in `[1, 20]`, `runtime` in `["base", "node22", "node24", "python3.13"]`, `networkPolicy` in `["allow-all", "deny-all", "custom"]`, and `timeoutMs` in `[60000, 86400000]`.
  - `validateVmIdParams`: Enforces non-empty string format matching `^[a-zA-Z0-9_-]+$` with maximum length of 128 characters.

### 2.2 Manager Native Service & Error Categorization
- **Native Service Wrapper (`vmsan-manager/src/vmsan.ts`):**
  - Wraps native `VMService` instance methods (`create`, `start`, `stop`, `remove`, `get`, `list`).
  - Maps protocol parameters (`memoryMib` → `memMib`) to native `CreateVmOptions`.
  - Enforces allow-list projection `toProtocolVm` on all VM responses to emit only `id`, `status`, `runtime`, `vcpuCount`, `memSizeMib`, `createdAt`, `snapshot`, `timeoutAt`, and `tunnelHostnames`.
- **Error Categorization (`categorizeVmsanError`):**
  - Maps native error patterns (`ERR_VM_NOT_FOUND` → `VM_NOT_FOUND`, `ERR_VM_NOT_STOPPED` / `ERR_VM_NOT_RUNNING` → `VM_INVALID_STATE`, `ERR_VALIDATION_*` → `VALIDATION_ERROR`, `ERR_FIRECRACKER_*` / `ERR_SETUP_*` / `ERR_NETWORK_*` / `ERR_TIMEOUT_*` → `VM_OPERATION_FAILED`, unclassified → `INTERNAL_ERROR`).

### 2.3 Manager Server Dispatch
- **Request Dispatcher (`vmsan-manager/src/server.ts`):**
  - Handles `vm.create`, `vm.start`, `vm.stop`, and `vm.remove` sequentially per connection.
  - Implements structured logging (`method`, `vmId`, `durationMs`) on stdout/stderr while strictly excluding sensitive VM properties or credentials.
  - Returns framed JSON-RPC responses bounded by 64 KiB frame cap.

### 2.4 Next.js Manager Client
- **Client Methods (`src/lib/vmsan-manager/client.ts`):**
  - Added typed async methods: `createVm(params?)`, `startVm(vmId)`, `stopVm(vmId)`, and `removeVm(vmId)`.
  - Encapsulates Unix domain socket lifecycle, JSON-RPC frame packaging, timeout handling, and typed error propagation (`ManagerUnavailableError`, `ManagerRequestError`, `ManagerProtocolError`).

### 2.5 Next.js API Routes Migration
- **`POST /api/vms` (`src/app/api/vms/route.ts`):**
  - Validates request payload and delegates to `managerClient.createVm()`.
  - Returns HTTP 201 with `{ vm: ClientVM }`.
- **`POST /api/vms/[id]/start/route.ts` & `POST /api/vms/[id]/stop/route.ts`:**
  - Validates VM ID parameter and delegates to `managerClient.startVm()` and `managerClient.stopVm()`.
  - Returns HTTP 200 with `{ vm: ClientVM }`.
- **`DELETE /api/vms/[id]/route.ts` (`src/app/api/vms/[id]/route.ts`):**
  - Validates VM ID parameter and delegates to `managerClient.removeVm()`.
  - Returns HTTP 200 with `{ removed: true, id: string }`.
- **Error Mapping (`src/app/api/vms/helpers.ts`):**
  - Standardized HTTP status mapping: `VALIDATION_ERROR` / `INVALID_REQUEST` → 400, `VM_NOT_FOUND` → 404, `VM_INVALID_STATE` → 409, `VM_OPERATION_FAILED` / `INTERNAL_ERROR` → 500, `MANAGER_UNAVAILABLE` → 503.

---

## 3. Verification and Testing

### 3.1 Test Suite Results

| Test Suite | Result | Details |
|---|---|---|
| `vmsan-manager` Tests | 155 passed, 0 failed | Protocol, parameter validation, allow-list redaction, server dispatch, security, error mapping, lifecycle integration |
| Next.js Application Tests | 344 passed, 0 failed | API route handlers (`create`, `start`, `stop`, `remove`, `helpers`, `security`), manager client, protocol sync |
| Production Build (`npm run build`) | Success (0 errors) | TypeScript compilation and Turbopack production bundling clean across entire monorepo |
| OpenSpec Validation (`openspec validate --strict`) | Pass | Change `vmsan-manager-vm-lifecycle` strictly validated against schema |

### 3.2 Integration Verification Highlights

- **Full Lifecycle Flow:** Executed complete verification sequence (`health` → `list` → `create` → `start` → `stop` → `remove`) on disposable test microVMs, confirming that existing production VMs (`kali`, `ubuntu-desktop`) remain entirely untouched and pristine.
- **Daemon Restart & Client Reconnection:** Verified that stopping the manager daemon cleanly causes in-flight/subsequent client requests to receive typed `ManagerUnavailableError` (HTTP 503), and upon daemon restart, client connections automatically reconnect and succeed without requiring web server reboot or state re-initialization.
- **Zero Process Spawning:** Verified that `child_process` is never imported or executed in the Next.js runtime, and the manager server executes all operations via the in-memory native library rather than invoking external shell wrappers.
- **Sensitive Field Redaction:** Verified with canary fixture assertions that `agentToken`, `agentPort`, `chrootDir`, `kernel`, `rootfs`, `apiSocket`, and `pid` are completely omitted from all protocol responses.

---

## 4. Repository State

- **Branch:** `main`
- **Working Tree:** All changes contained in tracked source and test files.
- **OpenSpec Change:** `openspec/changes/vmsan-manager-vm-lifecycle` is ready for archiving via `/opsx:archive`.
