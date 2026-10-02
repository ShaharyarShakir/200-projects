# Next.js VM Management API

The VM Management API provides an unprivileged HTTP REST interface for managing microVM lifecycles. All privileged operations (such as Firecracker management, network namespace configuration, and jailer execution) are delegated over a secure Unix domain socket (`/run/vmsan-manager.sock` or `VMSAN_MANAGER_SOCKET`) to the dedicated `vmsan-manager` service.

---

## Architectural Principles & Security Model

```text
┌──────────────────────┐
│  Browser / Client    │
└──────────┬───────────┘
           │ HTTP REST (JSON)
           ▼
┌──────────────────────┐
│      Next.js         │
│  (Unprivileged App)  │
│  - Route Handlers    │
│  - Validation Layer  │
│  - VmService         │
│  - ManagerClient     │
└──────────┬───────────┘
           │ Unix Domain Socket (/run/vmsan-manager.sock)
           ▼
┌──────────────────────┐
│   vmsan-manager      │
│ (Privileged Daemon)  │
└──────────┬───────────┘
           │ Native In-Process API
           ▼
┌──────────────────────┐
│ vmsan / Firecracker  │
└──────────────────────┘
```

1. **Privilege Separation**: Next.js runs completely unprivileged without `sudo` access, child process execution (`child_process`), or direct access to `vmsan` binaries.
2. **Pre-Socket Validation**: All user inputs (VM IDs, resource parameters) are validated and sanitized before any socket interaction to prevent command injection, parameter pollution, and path traversal.
3. **Response Sanitization**: Sensitive host internals—including `agentToken`, host TAP interfaces, Jailer paths, Firecracker sockets, process IDs, and host filesystem paths—are stripped before returning responses.
4. **Error Masking**: System errors, socket paths, and internal exceptions are sanitized into high-level API error codes without leaking host environment details.

---

## Data Models

### Vm Object

```typescript
interface Vm {
  id: string;
  runtime: string;
  status: VmStatus;
  vcpus: number;
  memoryMib: number;
  memoryMiB?: number;
  diskSizeGb: number;
  createdAt?: string;
  age?: string | null;
  network?: VmNetwork;
}

type VmStatus =
  | "creating"
  | "running"
  | "stopped"
  | "stopping"
  | "starting"
  | "error"
  | "unknown";

interface VmNetwork {
  policy?: "allow-all" | "deny-all" | "custom";
  address?: string;
  publishedPorts?: number[];
}
```

### CreateVmInput

```typescript
interface CreateVmInput {
  runtime?: "base" | "node22" | "node24" | "python3.13"; // Default: "base"
  vcpus?: number;                                         // 1 to 32 (Default: 1)
  memoryMib?: number;                                     // 128 to 32768 (Default: 128)
  memoryMiB?: number;                                     // Alias for memoryMib
  diskSizeGb?: number;                                    // 1 to 500 (Default: 1)
  networkPolicy?: "allow-all" | "deny-all" | "custom";    // Default: "allow-all"
  timeoutMs?: number;                                     // 0 to 3600000 ms
}
```

---

## API Endpoints

### 1. List MicroVMs

Retrieves a list of all microVMs.

- **Method**: `GET`
- **Path**: `/api/vms`
- **Request Headers**: None required

#### Response

- **Status**: `200 OK`
- **Body**:

```json
{
  "vms": [
    {
      "id": "vm-a1b2c3",
      "status": "running",
      "runtime": "node22",
      "vcpus": 2,
      "memoryMib": 512,
      "memoryMiB": 512,
      "diskSizeGb": 10,
      "createdAt": "2026-09-30T10:00:00.000Z",
      "age": "5m",
      "network": {
        "policy": "allow-all",
        "address": "10.0.0.2",
        "publishedPorts": [8080]
      }
    }
  ]
}
```

---

### 2. Create MicroVM

Creates a new microVM instance with configured resource specifications.

- **Method**: `POST`
- **Path**: `/api/vms`
- **Request Headers**: `Content-Type: application/json`
- **Request Body** (optional fields with defaults):

```json
{
  "runtime": "node22",
  "vcpus": 2,
  "memoryMib": 512,
  "diskSizeGb": 10,
  "networkPolicy": "allow-all",
  "timeoutMs": 600000
}
```

#### Validation Rules

- `runtime`: Must be one of `"base"`, `"node22"`, `"node24"`, `"python3.13"`.
- `vcpus`: Integer between `1` and `32`.
- `memoryMib` / `memoryMiB`: Integer between `128` and `32768` (MiB).
- `diskSizeGb`: Integer between `1` and `500` (GiB).
- `networkPolicy`: Must be one of `"allow-all"`, `"deny-all"`, `"custom"`.
- `timeoutMs`: Integer between `0` and `3600000` (ms).

#### Response

- **Status**: `201 Created`
- **Body**:

```json
{
  "vm": {
    "id": "vm-f8d2e1",
    "status": "creating",
    "runtime": "node22",
    "vcpus": 2,
    "memoryMib": 512,
    "memoryMiB": 512,
    "diskSizeGb": 10,
    "createdAt": "2026-09-30T10:05:00.000Z",
    "age": "0s"
  }
}
```

---

### 3. Start MicroVM

Starts an existing stopped microVM.

- **Method**: `POST`
- **Path**: `/api/vms/:id/start`
- **URL Parameters**:
  - `id`: VM Identifier (`/^[a-zA-Z0-9_-]{1,64}$/`)

#### Response

- **Status**: `200 OK`
- **Body**:

```json
{
  "vm": {
    "id": "vm-f8d2e1",
    "status": "running",
    "runtime": "node22",
    "vcpus": 2,
    "memoryMib": 512,
    "memoryMiB": 512,
    "diskSizeGb": 10,
    "createdAt": "2026-09-30T10:05:00.000Z"
  }
}
```

---

### 4. Stop MicroVM

Gracefully stops a running microVM.

- **Method**: `POST`
- **Path**: `/api/vms/:id/stop`
- **URL Parameters**:
  - `id`: VM Identifier (`/^[a-zA-Z0-9_-]{1,64}$/`)

#### Response

- **Status**: `200 OK`
- **Body**:

```json
{
  "vm": {
    "id": "vm-f8d2e1",
    "status": "stopped",
    "runtime": "node22",
    "vcpus": 2,
    "memoryMib": 512,
    "memoryMiB": 512,
    "diskSizeGb": 10,
    "createdAt": "2026-09-30T10:05:00.000Z"
  }
}
```

---

### 5. Remove MicroVM

Deletes a stopped microVM and tears down its associated resources.

- **Method**: `DELETE`
- **Path**: `/api/vms/:id`
- **URL Parameters**:
  - `id`: VM Identifier (`/^[a-zA-Z0-9_-]{1,64}$/`)

#### Response

- **Status**: `200 OK`
- **Body**:

```json
{
  "removed": true,
  "vmId": "vm-f8d2e1",
  "id": "vm-f8d2e1"
}
```

---

### 6. Execute Command in MicroVM (Phase 2B)

Executes a non-interactive command inside a running microVM via the guest agent.

- **Method**: `POST`
- **Path**: `/api/vms/:id/exec`
- **URL Parameters**:
  - `id`: VM Identifier (`/^[a-zA-Z0-9_-]{1,64}$/`)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "command": "uname -a",
  "timeoutMs": 30000,
  "workingDirectory": "/home/ubuntu"
}
```

#### Response

- **Status**: `200 OK`
- **Body**:

```json
{
  "stdout": "Linux vmsan-guest 6.1.0 #1 SMP ... x86_64 GNU/Linux\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 42
}
```

---

### 7. MicroVM Filesystem Operations (Phase 2C)

All filesystem operations operate within the virtual filesystem of a **running** microVM via the guest `AgentClient`. Next.js never accesses microVM files through host filesystem APIs (`fs.readFile` or `/var/lib/vmsan/...`).

#### 7.1 List Files & Directories

Lists entries within a microVM directory.

- **Method**: `GET`
- **Path**: `/api/vms/:id/files?path=:path`
- **Query Parameters**:
  - `path`: POSIX absolute path inside the VM (default: `/`)

##### Response (`200 OK`)

```json
{
  "path": "/home/ubuntu",
  "entries": [
    {
      "name": "projects",
      "path": "/home/ubuntu/projects",
      "type": "directory"
    },
    {
      "name": "app.log",
      "path": "/home/ubuntu/app.log",
      "type": "file",
      "size": 1024,
      "modifiedAt": "2026-10-01T12:00:00.000Z"
    }
  ]
}
```

#### 7.2 Read / Preview Text File

Reads text contents of a file for in-browser preview. Files exceeding **1 MiB** are rejected with `413 FILE_TOO_LARGE`.

- **Method**: `GET`
- **Path**: `/api/vms/:id/files/read?path=:path`
- **Query Parameters**:
  - `path`: POSIX path to text file inside the VM

##### Response (`200 OK`)

```json
{
  "path": "/etc/hosts",
  "content": "127.0.0.1 localhost\n",
  "size": 20
}
```

#### 7.3 Upload File

Uploads a file directly into a microVM directory. Maximum allowed upload size is **50 MiB**.

- **Method**: `POST`
- **Path**: `/api/vms/:id/files`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "destDir": "/home/ubuntu",
  "fileName": "config.json",
  "contentBase64": "eyAiZW52IjogInByb2R1Y3Rpb24iIH0="
}
```

##### Response (`201 Created`)

```json
{
  "path": "/home/ubuntu/config.json",
  "size": 24
}
```

#### 7.4 Create Directory

Creates a directory inside the microVM filesystem.

- **Method**: `POST`
- **Path**: `/api/vms/:id/files/mkdir`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "path": "/home/ubuntu/logs"
}
```

*Alternative payload format:* `{ "parentPath": "/home/ubuntu", "name": "logs" }`

##### Response (`201 Created`)

```json
{
  "path": "/home/ubuntu/logs"
}
```

#### 7.5 Delete File or Empty Directory

Deletes a file or empty directory in the microVM. Deletion is **strictly non-recursive** (`rm` for files, `rmdir` for directories).

- **Method**: `DELETE`
- **Path**: `/api/vms/:id/files?path=:path`
- **Query Parameters**:
  - `path`: POSIX path inside the VM

##### Response (`200 OK`)

```json
{
  "deleted": true,
  "path": "/home/ubuntu/app.log"
}
```

#### 7.6 Download File

Downloads a binary file from the microVM to the browser as a streaming attachment. Maximum allowed download size is **100 MiB**.

- **Method**: `GET`
- **Path**: `/api/vms/:id/files/download?path=:path`
- **Response Headers**:
  - `Content-Type`: `application/octet-stream`
  - `Content-Disposition`: `attachment; filename="app.log"`
  - `Content-Length`: `1024`

---

## Error Handling & Standard Status Codes

All errors return a structured JSON response with the following schema:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable sanitized message"
  }
}
```

| HTTP Status | Error Code | Description |
|:---|:---|:---|
| `400 Bad Request` | `INVALID_REQUEST` | Malformed JSON, invalid VM ID syntax, malformed path/filename, or resource bounds exceeded. |
| `404 Not Found` | `VM_NOT_FOUND` | Target microVM ID does not exist. |
| `404 Not Found` | `FILE_NOT_FOUND` | Target file or directory does not exist in the microVM filesystem. |
| `409 Conflict` | `INVALID_VM_STATE` | Operation conflicts with current state (e.g., executing commands or file operations on a non-running VM). |
| `409 Conflict` | `VM_NAME_ALREADY_EXISTS` | A VM with the specified identifier or name conflict already exists. |
| `413 Payload Too Large` | `FILE_TOO_LARGE` | File exceeds maximum size limits (preview > 1 MiB, upload > 50 MiB, download > 100 MiB). |
| `502 Bad Gateway` | `MANAGER_PROTOCOL_ERROR` | Received an invalid frame or malformed response from the manager socket. |
| `503 Service Unavailable` | `MANAGER_UNAVAILABLE` | Next.js cannot connect to the manager Unix domain socket (daemon is stopped or inaccessible). |
| `500 Internal Server Error` | `INTERNAL_ERROR` | An unexpected internal error occurred on the host. |
