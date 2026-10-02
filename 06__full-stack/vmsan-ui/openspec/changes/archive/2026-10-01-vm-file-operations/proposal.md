# Proposal

## Why

MicroVM operators currently have interactive shell execution via the terminal (Phase 2B) but lack a safe, visual way to inspect, navigate, upload, download, and manage files inside running Firecracker microVMs. Without dedicated file operations, transferring scripts, inspecting output logs, and creating workspace structures requires complex terminal workarounds. 

Adding safe, native file management directly into the microVM detail interface (`/vms/[id]`) enables operators to browse directories, preview small text files, upload scripts and assets, download artifacts, create folders, and delete files securely through the isolated `vmsan-manager` RPC and guest `AgentClient` without host filesystem leakage.

## What Changes

- **Manager RPC Protocol Extension**: Introduce privileged filesystem RPC methods in `vmsan-manager` (`vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, `vm.fs.download`) communicating strictly via `AgentClient` over HTTP to `vmsan-agent` inside running microVMs without host filesystem traversal, host subprocess spawning, or token exposure.
- **Next.js Backend API Endpoints**: Add RESTful file endpoints under `/api/vms/:id/files` (`GET /api/vms/:id/files`, `GET /api/vms/:id/files/read`, `POST /api/vms/:id/files`, `POST /api/vms/:id/files/mkdir`, `DELETE /api/vms/:id/files`, `GET /api/vms/:id/files/download`) with strict path normalization, path traversal rejection, size boundary enforcement (preview ≤ 1 MiB, upload ≤ 50 MiB, download ≤ 100 MiB), VM status checking (`running`), and standardized JSON error mapping.
- **Client API & Domain Service**: Extend `src/lib/vms/vm-service.ts` and provide a dedicated browser client `src/lib/api/vm-files.ts` (and types) for interacting with file management routes.
- **File Browser UI on VM Detail Page**: Implement modular UI components (`VmFileBrowser`, `VmFileList`, `VmFilePreview`, `VmUploadDialog`, `VmCreateFolderDialog`) integrated into `/vms/[id]` with breadcrumb navigation, file metadata displays (name, type, size, modified time), read-only text preview, upload/download actions, single-item/empty-folder deletion with confirmation, and graceful handling of stopped VM states.

## Capabilities

### New Capabilities
- `vm-file-browser`: Interactive file management and browsing UI on the VM detail page (`/vms/[id]`) allowing directory traversal, breadcrumbs, file metadata viewing, read-only text file preview, file uploads, file downloads, directory creation, and non-recursive item deletion.

### Modified Capabilities
- `vm-api`: Expose REST API routes under `/api/vms/:id/files` for directory listing, text file preview, file upload, directory creation, file deletion, and file download, enforcing strict path normalization, size caps, and standard error mappings.
- `vmsan-manager`: Extend manager RPC protocol and dispatch handlers with `vm.fs.*` operations (`vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, `vm.fs.download`) executing via guest `AgentClient` without host filesystem access or CLI subprocesses.

## Impact

- **vmsan-manager**: Protocol definitions (`protocol.ts`), request framing and validation, error categorization, and service execution (`vmsan.ts`, `server.ts`) updated with filesystem methods.
- **Next.js API Routes**: New route handlers created under `src/app/api/vms/[id]/files/`.
- **Application Services**: `src/lib/vmsan-manager/client.ts`, `src/lib/vms/vm-service.ts`, and `src/lib/vms/validation.ts` updated with file operation abstractions and input validators.
- **Frontend Components**: New modular components under `src/components/vms/` (`vm-file-browser.tsx`, `vm-file-list.tsx`, `vm-file-preview.tsx`, `vm-upload-dialog.tsx`, `vm-create-folder-dialog.tsx`) and integration into `vm-detail-view.tsx`.
- **Documentation**: Updated `docs/api/vms.md` and `phase-report.md`.
- **No Host Filesystem Access**: Neither Next.js nor `vmsan-manager` maps VM paths to host directories.
- **No CLI Subprocesses**: Native `AgentClient` is used for guest agent communication.
