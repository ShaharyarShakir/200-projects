# Spec Delta

## Purpose

Defines standard interfaces and implementations for orchestrating isolated Podman sandbox containers via the host Podman socket, managing container lifecycles, and executing commands safely with resource limits and timeout handling.

## ADDED Requirements

### Requirement: Sandbox Interface and Execution Result Contracts
The system SHALL define an abstract `Sandbox` interface providing container lifecycle methods (`start`, `stop`, `cleanup`, `execute`) and structured `CommandResult` models containing `stdout` (str), `stderr` (str), `exit_code` (int), `duration_seconds` (float), and `timed_out` (bool).

#### Scenario: Successful command execution
- **WHEN** a valid command is executed in a running sandbox
- **THEN** the system returns a `CommandResult` with `exit_code=0`, populated `stdout`, `duration_seconds >= 0`, and `timed_out=False`

#### Scenario: Command failure with non-zero exit code
- **WHEN** a command fails during execution inside the sandbox
- **THEN** the system captures the non-zero exit code, error output in `stderr`, and returns a `CommandResult` without throwing an unhandled exception

### Requirement: Host Podman Socket Client Communication
The system SHALL communicate with the host Podman daemon via the Unix socket path specified by `PODMAN_SOCKET` (or default rootless/system socket paths). The system SHALL verify socket connectivity and raise `SandboxConnectionError` if the socket is unreachable, invalid, or permission-denied.

#### Scenario: Successful host Podman daemon connection
- **WHEN** the Podman client initiates a connection to an active host Podman socket
- **THEN** the connection succeeds and daemon health/version is confirmed

#### Scenario: Unreachable or missing Podman socket
- **WHEN** the configured `PODMAN_SOCKET` path does not exist or the daemon is not running
- **THEN** the system raises a `SandboxConnectionError` describing the connection failure

### Requirement: Sandbox Container Provisioning and Workspace Isolation
The system SHALL create isolated Podman containers configured with a designated `/workspace` working directory, non-root execution permissions where appropriate, configurable resource limits (memory and CPU constraints), and network restrictions.

#### Scenario: Container provisioned with workspace
- **WHEN** a sandbox is created
- **THEN** a new Podman container is provisioned with `/workspace` configured as the working directory

#### Scenario: Resource limits and isolation enforcement
- **WHEN** a sandbox is started
- **THEN** memory limits and network constraints specified in configuration are applied to the container

### Requirement: Command Execution Timeout Handling
The system SHALL enforce execution timeouts on commands run inside the sandbox. When a command execution exceeds the configured timeout duration, the system SHALL interrupt or abort the execution and return a `CommandResult` with `timed_out=True`.

#### Scenario: Execution completes within timeout
- **WHEN** a command finishes running before the timeout limit
- **THEN** the system returns a `CommandResult` with `timed_out=False` and accurate duration timing

#### Scenario: Execution exceeds timeout limit
- **WHEN** a command execution exceeds the specified timeout duration
- **THEN** the system terminates the command process, marks `timed_out=True` on the result, and captures any partial output

### Requirement: Sandbox Lifecycle Management and Cleanup
The system SHALL provide reliable container teardown and removal mechanisms, including asynchronous context manager support (`async with`), ensuring containers are stopped and deleted even when errors occur during execution.

#### Scenario: Automatic cleanup via context manager
- **WHEN** a sandbox context block finishes execution or raises an error
- **THEN** the container is stopped and removed from the host Podman system

#### Scenario: Explicit cleanup call
- **WHEN** `cleanup()` is called on a sandbox instance
- **THEN** the container is stopped and removed from the host Podman daemon
