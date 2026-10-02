# Phase 2C — MicroVM File Operations Report

## 1. Overview & Objective

Phase 2C adds safe microVM file management to the vmsan web UI on `/vms/[id]`. Operators can browse directory hierarchies, view entry metadata, preview text files, upload and download files, create directories, delete entries, and navigate breadcrumbs.

---

## 2. Architecture & Privilege Separation

All microVM filesystem interactions strictly follow the privilege separation model:

```text
Browser
   ↓ HTTP REST / JSON / Binary Streams
Next.js (Unprivileged)
   ↓ Unix Domain Socket (/run/vmsan-manager.sock)
vmsan-manager (Privileged Daemon)
   ↓ Direct HTTP via Virtual IP & Token (AgentClient)
vmsan-agent (Inside Guest)
   ↓
microVM Filesystem
```

### Security Guarantees Maintained
1. **Zero Host File Access**: Next.js never accesses microVM files via host filesystem APIs (`fs.readFile`, `/var/lib/vmsan/...`, or `/srv/jailer/...`).
2. **Zero Host Subprocess Execution**: No `child_process`, `exec`, `spawn`, `sudo`, or CLI subprocess wrappers.
3. **Pure Virtual Path Normalization**: `normalizeVmPath` and `validateVmPath` resolve all `.` and `..` segments virtually, clamping breakout at `/`. Single entry filenames are strictly checked against separators and traversal.
4. **Credential & Host Detail Redaction**: Sensitive internals (`agentToken`, `agentPort`, host TAP interfaces, socket paths, Jailer paths) are stripped and never exposed to the browser.
5. **Non-Recursive Deletion**: Deletion executes `rm` for files and `rmdir` for directories in the guest agent to prevent accidental recursive directory tree deletion.
6. **Strict Size Limits**:
   - In-Browser Preview: ≤ 1 MiB (`FILE_TOO_LARGE` / 413)
   - File Upload: ≤ 50 MiB
   - File Download: ≤ 100 MiB

---

## 3. Implemented Components & Modules

| Component / Layer | Path | Description |
|:---|:---|:---|
| **Path Utilities** | `src/lib/vms/path-utils.ts`<br>`vmsan-manager/src/path-utils.ts` | Pure POSIX virtual path normalization and single filename validation. |
| **Manager Protocol** | `vmsan-manager/src/protocol.ts`<br>`src/lib/vmsan-manager/protocol.ts` | Added `vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, `vm.fs.download` methods & error codes. |
| **Guest Operations** | `vmsan-manager/src/vmsan.ts` | Implemented file methods on `AgentClientLike` using in-guest `AgentClient`. |
| **Manager Server** | `vmsan-manager/src/server.ts` | Implemented JSON-RPC method dispatch and running-VM state validation. |
| **Service Layer** | `src/lib/vms/vm-service.ts` | Implemented domain logic and HTTP error code categorization. |
| **Frontend API Client** | `src/lib/api/vm-files.ts` | `listVmFiles`, `readVmFile`, `uploadVmFile`, `downloadVmFile`, `createVmDirectory`, `deleteVmFile`. |
| **REST API Routes** | `src/app/api/vms/[id]/files/route.ts`<br>`src/app/api/vms/[id]/files/read/route.ts`<br>`src/app/api/vms/[id]/files/mkdir/route.ts`<br>`src/app/api/vms/[id]/files/download/route.ts` | Next.js App Router endpoints with input validation and error masking. |
| **UI Components** | `src/components/vms/vm-file-browser.tsx`<br>`src/components/vms/vm-file-list.tsx`<br>`src/components/vms/vm-file-preview.tsx`<br>`src/components/vms/vm-upload-dialog.tsx`<br>`src/components/vms/vm-create-folder-dialog.tsx` | Interactive explorer with breadcrumbs, sortable entry list, modals, and non-running VM banners. |
| **Detail View Integration** | `src/components/vms/vm-detail-view.tsx` | Integrated `VmFileBrowser` into `/vms/[id]` below the terminal card. |

---

## 4. Verification & Testing

### Automated Test Suite
- Total Test Suites: **36**
- Total Tests: **178 passing** (0 failures)
- Security Scans:
  - Validated no `child_process` imports across `src/` and `vmsan-manager/src/`.
  - Validated parameter injection and path traversal rejection across all REST routes.
  - Validated sensitive host details and socket paths are redacted from all responses and errors.
- Unit & Integration Tests:
  - POSIX path normalization & traversal clamp tests.
  - Manager JSON-RPC filesystem method dispatch and lifecycle integration tests.
  - REST route tests for directory listing, text preview, upload, mkdir, delete, and download.
  - Client API helper error and binary streaming tests.

---

## 5. Conclusion

Phase 2C is complete and fully satisfies all functional requirements and security invariants without breaking existing VM management or terminal functionality.
