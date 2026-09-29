# Vmsan Adapter Specification

## Purpose

Provides a secure, strongly-typed server-side adapter for managing Firecracker microVM lifecycles via the host vmsan CLI with strict parameter validation and robust output parsing.

## Requirements

### Requirement: Command Execution and Injection Prevention
The system SHALL execute the `vmsan` binary using safe process spawning with argument arrays and MUST NOT invoke shell interpreters or perform string interpolation on command arguments.

#### Scenario: Safe process spawning without shell evaluation
- **WHEN** a command operation is invoked with parameters
- **THEN** the adapter executes the binary via argument array without passing arguments through a shell

#### Scenario: Rejection of invalid VM identifiers
- **WHEN** a VM lifecycle operation is requested with an invalid VM identifier containing shell metacharacters or malformed syntax
- **THEN** the adapter rejects the request with a validation error before invoking any child process

### Requirement: Resource Parameter Validation
The system SHALL validate all microVM resource and runtime parameters against permitted types and bounds before constructing creation command arguments.

#### Scenario: Valid creation options
- **WHEN** a VM creation request specifies valid options (e.g. `runtime: "node22"`, `vcpus: 2`, `memoryMiB: 512`)
- **THEN** the adapter translates the parameters to safe CLI flags (`--runtime=node22`, `--vcpus=2`, `--memory=512`)

#### Scenario: Invalid resource bounds
- **WHEN** a VM creation request specifies `vcpus < 1` or `memoryMiB < 128` or an unsupported runtime
- **THEN** the adapter rejects the request with a descriptive validation error

### Requirement: Structured Output Parsing
The system SHALL parse JSON output from `vmsan --json list` and normalize the microVM records into standardized data objects containing id, status, memory, vCPUs, runtime, and age.

#### Scenario: Parsing valid JSON VM list
- **WHEN** `vmsan --json list` returns a valid JSON payload containing VM entries
- **THEN** the adapter parses and returns an array of normalized VM objects

#### Scenario: Handling empty VM list
- **WHEN** `vmsan --json list` returns an empty VM list or zero VMs
- **THEN** the adapter returns an empty array

#### Scenario: Malformed CLI output
- **WHEN** `vmsan` produces invalid JSON or corrupted text
- **THEN** the adapter throws a `VmsanError` indicating a parsing failure without crashing the process

### Requirement: Typed Error Handling
The system SHALL encapsulate non-zero exit codes, command execution timeouts, or process failures into a typed `VmsanError` preserving command name, arguments, exit code, stdout, and stderr while redacting sensitive environment variables.

#### Scenario: Command failure with exit code
- **WHEN** a `vmsan` command exits with a non-zero exit code
- **THEN** the adapter throws a `VmsanError` containing the exit code, command arguments, and captured stderr

#### Scenario: Command execution timeout
- **WHEN** a `vmsan` process exceeds the configured timeout threshold
- **THEN** the process is terminated and a `VmsanError` indicating a timeout is thrown

### Requirement: MicroVM Lifecycle Operations
The system SHALL provide programmatic lifecycle operations including listing VMs (`listVMs`), creating VMs (`createVM`), starting VMs (`startVM`), stopping VMs (`stopVM`), and removing VMs (`removeVM`).

#### Scenario: List microVMs
- **WHEN** `listVMs` is called
- **THEN** it executes `vmsan --json list` and returns the normalized list of microVMs

#### Scenario: Start microVM
- **WHEN** `startVM` is called with a validated VM ID
- **THEN** it executes `vmsan start <vmId>` and returns the execution result

#### Scenario: Stop microVM
- **WHEN** `stopVM` is called with a validated VM ID
- **THEN** it executes `vmsan stop <vmId>` and returns the execution result

#### Scenario: Remove microVM
- **WHEN** `removeVM` is called with a validated VM ID
- **THEN** it executes `vmsan remove <vmId>` and returns the execution result

### Requirement: No In-Process Privilege Escalation
The system SHALL NOT reach Firecracker by escalating privileges from the unprivileged web process, and the adapter SHALL contain no mechanism to do so. The adapter MUST NOT spawn `sudo`, MUST NOT build a `sudo -n` argument vector, MUST NOT read a setting that enables passwordless privilege escalation, and MUST NOT accept a caller-supplied executable path or privilege flag. The sanctioned path to privileged microVM operations SHALL be the separate `vmsan-manager` process, which runs as the privileged user, holds a single native vmsan service, and is reached over a Unix domain socket. No sudoers rule pointing at the vmsan executable SHALL be required or documented as part of the supported setup.

#### Scenario: No sudo invocation on the request path
- **WHEN** any microVM operation is invoked through the adapter
- **THEN** the adapter performs no `sudo` invocation and requests no passwordless privilege escalation

#### Scenario: No sudo branch remains in the adapter
- **WHEN** the adapter's source is inspected for an escalation path
- **THEN** it contains no code path that selects a `sudo` executable, builds a non-interactive sudo argument list, or branches on a setting that enables privilege escalation

#### Scenario: No caller-selectable privilege or executable
- **WHEN** an operation is invoked with options that name an executable, a privilege flag, or an escalation setting
- **THEN** those options are not part of the adapter's accepted surface and have no effect on how the command is executed

#### Scenario: No sudoers rule is required
- **WHEN** the application is deployed without any `/etc/sudoers.d` entry for vmsan
- **THEN** privileged microVM operations remain reachable through the manager process over its Unix socket

#### Scenario: Web process runs unprivileged
- **WHEN** the web application server is running
- **THEN** it runs under a non-root user and the manager process is the only privileged process in the architecture

#### Scenario: No executable path selected by configuration
- **WHEN** a privileged operation is requested
- **THEN** no configuration value, request field, or environment variable selects an executable path to run as a privileged operation; the privileged surface is fixed to the manager process and the native vmsan API it imports

#### Scenario: Privilege boundary verified explicitly
- **WHEN** the architecture is validated during development
- **THEN** the effective user id of the web process and of the manager are recorded and shown to differ, with the manager at `uid = 0` and the web process at `uid != 0`
