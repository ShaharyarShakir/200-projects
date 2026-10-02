# Spec Delta

## ADDED Requirements

### Requirement: Filesystem Operations Protocol Framing and Validation
The manager protocol SHALL support filesystem methods `vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, and `vm.fs.download`. The manager MUST validate frame parameters, ensure `vmId` matches `^[a-zA-Z0-9_-]{1,128}$`, normalize all filesystem paths, reject traversal attempts (`..` resolving outside `/`), and enforce request size limits before dispatching to guest agents.

#### Scenario: Valid filesystem list request framing
- **WHEN** a client sends `{ "id": "req-1", "method": "vm.fs.list", "params": { "vmId": "vm-1234", "path": "/home/ubuntu" } }`
- **THEN** `validateFrame` accepts the frame and dispatches to the filesystem handler

#### Scenario: Malformed path in filesystem request
- **WHEN** a client sends `{ "id": "req-2", "method": "vm.fs.read", "params": { "vmId": "vm-1234", "path": "../../etc/shadow" } }`
- **THEN** `validateFrame` or parameter validation rejects the frame with `VALIDATION_ERROR`

### Requirement: Guest Filesystem Directory Listing Execution
The manager SHALL implement `vm.fs.list` by querying the running microVM through its guest `AgentClient`. The manager MUST return a sanitized list of directory entries conforming to `{ "path": string, "entries": Array<{ name: string, path: string, type: "file" | "directory" | "symlink" | "unknown", size?: number, mode?: string, modifiedAt?: string }> }` without exposing host paths, Firecracker jailer directories, or agent tokens.

#### Scenario: Successful directory listing via agent
- **WHEN** `vm.fs.list` is invoked for a running VM at path `/`
- **THEN** the manager uses the VM's `AgentClient` to read the directory contents from the guest and returns the sanitized entry listing

#### Scenario: Listing a missing directory on guest
- **WHEN** `vm.fs.list` is invoked for a path that does not exist in the microVM
- **THEN** the manager returns a failure frame with error code `FILE_NOT_FOUND`

### Requirement: Guest Filesystem File Read and Preview Execution
The manager SHALL implement `vm.fs.read` by reading file contents via `AgentClient.readFile()`. The manager MUST enforce a maximum file preview size of 1 MiB (1,048,576 bytes). If the file exceeds this limit, the manager MUST return a failure frame with error code `FILE_TOO_LARGE`.

#### Scenario: Successful file read within preview limit
- **WHEN** `vm.fs.read` is invoked for `/etc/hosts` (size 250 bytes) in a running VM
- **THEN** the manager reads the content via `AgentClient.readFile()`, converts the buffer to UTF-8 text, and returns `{ "path": "/etc/hosts", "content": "<text>", "size": 250 }`

#### Scenario: File read exceeds preview limit
- **WHEN** `vm.fs.read` is invoked for a file larger than 1 MiB
- **THEN** the manager aborts reading and returns error code `FILE_TOO_LARGE`

### Requirement: Guest Filesystem File Write and Upload Execution
The manager SHALL implement `vm.fs.write` by packaging the uploaded file buffer and transmitting it to the microVM via `AgentClient.writeFiles()` with the target extraction directory. The manager MUST enforce a maximum upload payload limit of 50 MiB (52,428,800 bytes). The operation MUST NOT write through any host filesystem paths or temporary host storage.

#### Scenario: Successful file write to guest
- **WHEN** `vm.fs.write` is invoked with `vmId`, `destDir: "/home/ubuntu"`, `fileName: "script.sh"`, and base64/binary content payload (≤ 50 MiB)
- **THEN** the manager calls `AgentClient.writeFiles([{ path: "script.sh", content: buffer }], "/home/ubuntu")` and returns `{ "path": "/home/ubuntu/script.sh", "size": <bytes> }`

#### Scenario: Upload exceeding size limit
- **WHEN** `vm.fs.write` is invoked with a payload exceeding 50 MiB
- **THEN** the manager rejects the request with error code `FILE_TOO_LARGE`

### Requirement: Guest Filesystem Directory Creation Execution
The manager SHALL implement `vm.fs.mkdir` by executing directory creation inside the microVM via the guest agent. The target path MUST be normalized and validated.

#### Scenario: Successful directory creation on guest
- **WHEN** `vm.fs.mkdir` is invoked with `{ "vmId": "vm-1234", "path": "/home/ubuntu/newdir" }`
- **THEN** the directory is created in the microVM via the guest agent and the manager returns `{ "path": "/home/ubuntu/newdir" }`

### Requirement: Guest Filesystem Non-Recursive Deletion Execution
The manager SHALL implement `vm.fs.delete` by executing single file or empty directory removal on the microVM filesystem via the guest agent. The manager MUST NOT perform recursive directory deletion. If the target is a directory containing files, the guest deletion failure MUST be returned without attempting recursive deletion.

#### Scenario: Successful deletion of file
- **WHEN** `vm.fs.delete` is invoked for an existing file `/tmp/sample.txt`
- **THEN** the file is unlinked on the microVM filesystem and the manager returns `{ "deleted": true, "path": "/tmp/sample.txt" }`

#### Scenario: Deletion of non-empty directory is rejected
- **WHEN** `vm.fs.delete` is invoked for a non-empty directory `/tmp/somedir`
- **THEN** the manager returns a failure frame with error code `VM_OPERATION_FAILED` indicating the directory is not empty

### Requirement: Guest Filesystem File Download Execution
The manager SHALL implement `vm.fs.download` by fetching the raw binary file from the microVM via `AgentClient.readFile()`. The manager MUST enforce a maximum download size of 100 MiB (104,857,600 bytes). The manager MUST NOT store or copy downloaded content onto the host filesystem.

#### Scenario: Successful file download retrieval
- **WHEN** `vm.fs.download` is invoked for `/var/log/app.log` (size ≤ 100 MiB)
- **THEN** the manager retrieves the binary payload via `AgentClient.readFile()` and returns base64 content or binary stream conforming to protocol limits

#### Scenario: Download exceeding size limit
- **WHEN** `vm.fs.download` is invoked for a file exceeding 100 MiB
- **THEN** the manager returns error code `FILE_TOO_LARGE`

### Requirement: VM Operational State and Security Boundary Isolation for Filesystem
All filesystem methods (`vm.fs.list`, `vm.fs.read`, `vm.fs.write`, `vm.fs.mkdir`, `vm.fs.delete`, `vm.fs.download`) SHALL verify that the target VM is in the `running` state. If the VM is stopped, starting, or in an error state, the manager MUST return error code `VM_INVALID_STATE`. All manager responses MUST redact internal host paths, Firecracker configurations, jailer paths, and `agentToken`/`agentPort` values.

#### Scenario: Filesystem request rejected on stopped VM
- **WHEN** any filesystem RPC method is sent targeting a microVM that is not running
- **THEN** the manager returns a failure frame with error code `VM_INVALID_STATE` without communicating with the guest agent

#### Scenario: Response payload sanitization
- **WHEN** any filesystem RPC response is generated
- **THEN** the response object contains only sanitized filesystem properties and never includes `agentToken`, `agentPort`, or host filesystem paths
