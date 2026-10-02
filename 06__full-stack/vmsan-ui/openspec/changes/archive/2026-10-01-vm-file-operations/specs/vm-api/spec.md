# Spec Delta

## ADDED Requirements

### Requirement: MicroVM Directory Listing Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id/files` that accepts a query parameter `path` (defaulting to `/`), validates the VM ID and path parameter against path traversal attempts, and queries the manager over its Unix socket via `vm.fs.list`. The endpoint MUST return HTTP 200 with `{ "path": string, "entries": VmFile[] }`, HTTP 400 for malformed/traversal paths, HTTP 404 for missing VMs or non-existent directories, HTTP 409 for non-running VMs, HTTP 503 when manager is unavailable, and HTTP 500 for internal errors.

#### Scenario: Successful directory listing
- **WHEN** a client performs a `GET /api/vms/:id/files?path=/home/ubuntu` on a running VM
- **THEN** the endpoint returns HTTP 200 with `{ "path": "/home/ubuntu", "entries": [{ "name": "projects", "path": "/home/ubuntu/projects", "type": "directory" }] }`

#### Scenario: Path traversal attempt rejected on listing
- **WHEN** a client performs a `GET /api/vms/:id/files?path=../../etc`
- **THEN** the endpoint rejects the request with HTTP 400 and error code `INVALID_REQUEST` without forwarding the path to the manager

#### Scenario: Listing non-existent directory on VM
- **WHEN** a client performs a `GET /api/vms/:id/files?path=/does/not/exist`
- **THEN** the endpoint returns HTTP 404 with error code `FILE_NOT_FOUND`

#### Scenario: Listing on stopped VM
- **WHEN** a client performs a `GET /api/vms/:id/files?path=/` for a stopped VM
- **THEN** the endpoint returns HTTP 409 with error code `VM_INVALID_STATE`

### Requirement: MicroVM Text File Preview Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id/files/read` that accepts a query parameter `path`, validates path constraints, and fetches file content via `vm.fs.read`. The endpoint MUST enforce a maximum preview size limit of 1 MiB. If the requested file exceeds 1 MiB, the endpoint MUST return HTTP 413 with error code `FILE_TOO_LARGE`.

#### Scenario: Successful text file read
- **WHEN** a client performs a `GET /api/vms/:id/files/read?path=/README.md` on a running VM for a 1.4 KB text file
- **THEN** the endpoint returns HTTP 200 with `{ "path": "/README.md", "content": "<file content>", "size": 1400 }`

#### Scenario: Reading file exceeding preview size limit
- **WHEN** a client performs a `GET /api/vms/:id/files/read?path=/large.iso` for a file > 1 MiB
- **THEN** the endpoint returns HTTP 413 with error code `FILE_TOO_LARGE` and a descriptive message

#### Scenario: Reading non-existent file
- **WHEN** a client performs a `GET /api/vms/:id/files/read?path=/missing.txt`
- **THEN** the endpoint returns HTTP 404 with error code `FILE_NOT_FOUND`

### Requirement: MicroVM File Upload Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/files` that accepts file uploads targeted to a specified destination directory on the microVM. The endpoint MUST enforce a maximum upload payload limit of 50 MiB. The filename MUST represent a single entry name without path separators or directory traversal sequences (`..`, `/`). The file payload MUST be forwarded to `vmsan-manager` over the Unix socket via `vm.fs.write` without reading or writing through the host filesystem.

#### Scenario: Successful file upload to microVM
- **WHEN** a client sends a valid `POST /api/vms/:id/files` with destination `/home/ubuntu`, filename `app.py`, and content payload (≤ 50 MiB)
- **THEN** the file is forwarded to the manager, written to the microVM filesystem via `AgentClient.writeFiles`, and the endpoint returns HTTP 201 with `{ "path": "/home/ubuntu/app.py", "size": <bytes> }`

#### Scenario: Upload exceeding size limit
- **WHEN** a client attempts to upload a file exceeding 50 MiB
- **THEN** the endpoint returns HTTP 413 with error code `FILE_TOO_LARGE` or `UPLOAD_TOO_LARGE`

#### Scenario: Upload with malformed or traversal filename
- **WHEN** a client attempts to upload with filename `../file.txt` or `foo/bar.txt`
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

### Requirement: MicroVM Directory Creation Endpoint
The system SHALL expose an HTTP POST endpoint at `/api/vms/:id/files/mkdir` that accepts `{ "path": string }` or `{ "parentPath": string, "name": string }`, validates the target path and directory name, and delegates to the manager via `vm.fs.mkdir`. The endpoint MUST reject directory names containing path separators or traversal characters.

#### Scenario: Successful directory creation
- **WHEN** a client sends a valid `POST /api/vms/:id/files/mkdir` with path `/home/ubuntu/projects`
- **THEN** the directory is created on the microVM filesystem and the endpoint returns HTTP 201 with `{ "path": "/home/ubuntu/projects" }`

#### Scenario: Invalid directory path rejection
- **WHEN** a client sends a directory creation request with path `/home/../etc` or invalid characters
- **THEN** the endpoint returns HTTP 400 with error code `INVALID_REQUEST`

### Requirement: MicroVM File Deletion Endpoint
The system SHALL expose an HTTP DELETE endpoint at `/api/vms/:id/files` that accepts a query parameter `path`, validates the target path, and calls `vm.fs.delete` on the manager. The deletion MUST be non-recursive. If the target is a non-empty directory, the operation MUST fail with an explicit error.

#### Scenario: Successful file deletion
- **WHEN** a client sends `DELETE /api/vms/:id/files?path=/tmp/test.txt` for an existing file
- **THEN** the file is deleted on the microVM filesystem and the endpoint returns HTTP 200 with `{ "deleted": true, "path": "/tmp/test.txt" }`

#### Scenario: Deleting non-empty directory fails without recursion
- **WHEN** a client sends `DELETE /api/vms/:id/files?path=/home/ubuntu/projects` for a directory containing files
- **THEN** the endpoint returns HTTP 400 or HTTP 409 with an error indicating the directory is not empty and cannot be recursively deleted

### Requirement: MicroVM File Download Endpoint
The system SHALL expose an HTTP GET endpoint at `/api/vms/:id/files/download` that accepts a query parameter `path`, validates the path, retrieves the file payload from `vmsan-manager` via `vm.fs.download`, and streams the raw binary payload with appropriate `Content-Disposition`, `Content-Type`, and `Content-Length` headers. The endpoint MUST enforce a maximum download size of 100 MiB.

#### Scenario: Successful file download
- **WHEN** a client performs a `GET /api/vms/:id/files/download?path=/tmp/archive.tar` for a file ≤ 100 MiB
- **THEN** the endpoint streams the binary content with `Content-Disposition: attachment; filename="archive.tar"` and HTTP 200

#### Scenario: Downloading file exceeding size limit
- **WHEN** a client requests download for a file exceeding 100 MiB
- **THEN** the endpoint returns HTTP 413 with error code `FILE_TOO_LARGE`

### Requirement: Path Normalization and Traversal Defense for Filesystem Endpoints
All filesystem endpoints SHALL normalize target paths (e.g., resolving `/tmp/../etc` to `/etc`) and strictly reject paths attempting to escape the root `/` or containing invalid character sequences before communicating with `vmsan-manager`.

#### Scenario: Normalization of relative segments
- **WHEN** a client performs a filesystem request with path `/tmp/../etc/hosts`
- **THEN** the path is normalized to `/etc/hosts` before validating and executing the request

#### Scenario: Rejection of root breakout traversal
- **WHEN** a client performs a filesystem request with path `/../../../etc/shadow`
- **THEN** the request is rejected with HTTP 400 and error code `INVALID_REQUEST`
