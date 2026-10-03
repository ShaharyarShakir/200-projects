# VM Metadata Specification

## Purpose

Provides local atomic persistence and validation for mapping human-friendly custom microVM names to underlying Firecracker vmsan identifiers without a database.

## Requirements

### Requirement: Custom VM Name Format Validation
The system SHALL validate custom VM names against the pattern `^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$` (1 to 63 characters starting with an alphanumeric character and containing only alphanumerics, dots, underscores, or dashes) and MUST NOT perform shell escaping as a substitute for validation.

#### Scenario: Valid custom VM names
- **WHEN** a user provides names such as `node-dev`, `python-sandbox`, `web-test-01`, `node22`, `my_vm`, or `ubuntu.test`
- **THEN** the validator accepts the name as valid

#### Scenario: Invalid custom VM names with whitespace or illegal symbols
- **WHEN** a user provides names containing spaces, slashes, or shell metacharacters such as `my vm`, `../../root`, `foo/bar`, `foo;bar`, `foo|bar`, `$(whoami)`, or `` `id` ``
- **THEN** the validator rejects the name with a validation error

#### Scenario: Empty or oversized names
- **WHEN** a user provides an empty string or a name exceeding 63 characters
- **THEN** the validator rejects the name with a validation error

### Requirement: Reserved Name Prefix Rejection
The system SHALL reject custom VM names starting with the reserved prefix `vm-` (case-insensitively) to prevent ambiguity with internal vmsan identifiers.

#### Scenario: Rejection of reserved vm- prefix
- **WHEN** a user attempts to use a name starting with `vm-` or `VM-` (e.g. `vm-test`, `vm-1234`, `VM-node`)
- **THEN** the validator rejects the name with a descriptive error indicating the prefix `vm-` is reserved

### Requirement: Case-Insensitive Name Uniqueness and Display Preservation
The system SHALL enforce uniqueness of custom VM names case-insensitively using normalized lowercase comparison while preserving the user's original casing for display and storage.

#### Scenario: Conflicting name with different casing
- **WHEN** a VM with name `Node-Dev` exists and a user attempts to create or rename a VM to `node-dev` or `NODE-DEV`
- **THEN** the system rejects the operation as a name conflict

#### Scenario: Case preservation
- **WHEN** a VM is created with name `Python-Sandbox-01`
- **THEN** the stored and returned display name retains the exact casing `Python-Sandbox-01`

### Requirement: Atomic Metadata File Persistence
The system SHALL persist VM name-to-vmsanId mappings in a JSON file at `.vmsan-ui/vms.json` using an atomic write strategy (writing to a temporary file, flushing, and renaming into place) to prevent file corruption.

#### Scenario: Writing metadata safely
- **WHEN** metadata is created, updated, or deleted
- **THEN** the store writes the updated JSON payload to a temporary file in the `.vmsan-ui` directory and atomically renames it over `vms.json`

#### Scenario: Surviving application restarts
- **WHEN** the application restarts or reloads
- **THEN** all previously persisted VM name mappings are reloaded from `.vmsan-ui/vms.json`

### Requirement: Missing and Stale VM Handling
The system SHALL handle metadata records whose corresponding `vmsanId` is no longer reported by `vmsan` by treating them as stale without silently deleting the metadata or automatically attempting to recreate the microVM.

#### Scenario: vmsan VM missing from inventory
- **WHEN** `.vmsan-ui/vms.json` contains a mapping for `vm-1234` but `vmsan` reports that `vm-1234` does not exist
- **THEN** the system does not automatically recreate the VM and does not silently delete the metadata record
