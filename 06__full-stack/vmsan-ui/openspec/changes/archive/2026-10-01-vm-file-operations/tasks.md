# Tasks

## 1. Manager Protocol & Path Handling

- [x] 1.1 Implement POSIX VM path normalization and traversal rejection utilities (`path-utils.ts`) in `vmsan-manager` and `src/lib/vms/` and verify unit path resolution against traversal attempts
- [x] 1.2 Extend `vmsan-manager/src/protocol.ts` and `src/lib/vmsan-manager/protocol.ts` with filesystem methods (`vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, `vm.fs.download`), parameter interfaces, response types, error codes (`FILE_NOT_FOUND`, `FILE_TOO_LARGE`), and frame validators
- [x] 1.3 Extend `AgentClientLike` interface and implement filesystem operations (`listVmFiles`, `readVmFile`, `writeVmFile`, `mkdirVmDirectory`, `deleteVmFile`, `downloadVmFile`) in `vmsan-manager/src/vmsan.ts` using native `AgentClient` (no host filesystem access or subprocess execution)
- [x] 1.4 Implement filesystem method handlers and dispatch logic in `vmsan-manager/src/server.ts` verifying frame execution over Unix socket and VM running-state enforcement

## 2. Next.js Service Layer & API Client

- [x] 2.1 Update `src/lib/vmsan-manager/client.ts` to implement `listVmFiles`, `readVmFile`, `writeVmFile`, `mkdirVmDirectory`, `deleteVmFile`, and `downloadVmFile` on `ManagerClient`
- [x] 2.2 Add validation helpers in `src/lib/vms/validation.ts` for directory paths, single entry filenames, and size thresholds (preview ≤ 1 MiB, upload ≤ 50 MiB, download ≤ 100 MiB)
- [x] 2.3 Extend `src/lib/vms/vm-service.ts` with domain methods for filesystem operations and error categorization (`FILE_NOT_FOUND` → 404, `FILE_TOO_LARGE` → 413, `INVALID_REQUEST` → 400, `VM_INVALID_STATE` → 409)
- [x] 2.4 Create `src/lib/api/vm-files.ts` and update `src/lib/api/types.ts` exposing frontend API client functions (`listVmFiles`, `readVmFile`, `uploadVmFile`, `downloadVmFile`, `createVmDirectory`, `deleteVmFile`)

## 3. Next.js REST API Endpoints

- [x] 3.1 Implement `GET /api/vms/[id]/files/route.ts` for directory listing with path query parameter, normalization, and VM running-state validation
- [x] 3.2 Implement `GET /api/vms/[id]/files/read/route.ts` for text file preview with 1 MiB size limit enforcement
- [x] 3.3 Implement `POST /api/vms/[id]/files/route.ts` for file upload with 50 MiB size limit and single entry filename validation
- [x] 3.4 Implement `POST /api/vms/[id]/files/mkdir/route.ts` for directory creation with path validation
- [x] 3.5 Implement `DELETE /api/vms/[id]/files/route.ts` for non-recursive file/directory deletion with confirmation error handling
- [x] 3.6 Implement `GET /api/vms/[id]/files/download/route.ts` for binary file downloads with 100 MiB limit and attachment headers

## 4. Frontend File Browser UI

- [x] 4.1 Create `src/components/vms/vm-file-list.tsx` for displaying directory entries with file/folder icons, formatted sizes, modified timestamps, and action buttons
- [x] 4.2 Create `src/components/vms/vm-file-preview.tsx` for read-only text preview modal and large/binary file notices
- [x] 4.3 Create `src/components/vms/vm-upload-dialog.tsx` for local file selection, destination path display, and upload progress status
- [x] 4.4 Create `src/components/vms/vm-create-folder-dialog.tsx` for folder name input and validation
- [x] 4.5 Create `src/components/vms/vm-file-browser.tsx` integrating breadcrumbs, toolbar actions (Refresh, Upload, New Folder), file listing, preview modal, dialogs, and non-running VM status banner
- [x] 4.6 Integrate `VmFileBrowser` into `src/components/vms/vm-detail-view.tsx` on `/vms/[id]` below the terminal component

## 5. Security Review, Documentation & Verification

- [x] 5.1 Perform security inspection verifying no VM path-to-host path mapping, no `child_process`/`exec`/`spawn`, and no sensitive tokens/ports exposed in API responses
- [x] 5.2 Update `docs/api/vms.md` documenting file endpoints, path semantics, preview/upload/download limits, running-VM requirement, and non-recursive deletion
- [x] 5.3 Update `phase-report.md` for Phase 2C with manual verification results and architecture alignment
