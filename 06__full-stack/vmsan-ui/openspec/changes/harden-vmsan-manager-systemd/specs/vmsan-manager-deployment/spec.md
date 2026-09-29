# Spec Delta

## Purpose

Defines how the privileged `vmsan-manager` process is installed, owned, and supervised on the host so that its privilege over Firecracker rests on root-controlled code under an init system, rather than on a user-writable executable tree and a sudoers rule.

## ADDED Requirements

### Requirement: Root-Controlled Manager Installation
The system SHALL provide an installation procedure that places the manager's executable code, its production dependencies, and its compiled output in a system directory owned by root, and MUST NOT leave any part of that tree writable by an unprivileged user. The procedure MUST be idempotent, so re-running it over an existing installation converges to the same ownership and permissions rather than accumulating drift.

#### Scenario: Executable tree is root-owned
- **WHEN** the installation completes
- **THEN** the manager's installation directory, its compiled entry point, and its production dependency tree are owned by `root:root` and are not writable by any non-root user

#### Scenario: Re-running the installation is safe
- **WHEN** the installation procedure is run a second time over an existing installation
- **THEN** it completes successfully and the resulting ownership and permissions match those produced by the first run

#### Scenario: No privileged command is executed by the application tooling
- **WHEN** the installation artifacts are inspected
- **THEN** the procedure is delivered as a script and unit file committed to the repository, and no build, test, or development command in the project requires elevated privileges to run

### Requirement: Root-Controlled Node Runtime
The production service SHALL execute the manager with an absolute path to a Node runtime that is owned by root. The service MUST NOT depend on a version manager, a login shell, a shell profile, a dotfile, or any other per-user environment to locate its interpreter, and MUST NOT execute the manager's code through a TypeScript loader at runtime.

#### Scenario: Interpreter is a root-owned absolute path
- **WHEN** the service definition is inspected
- **THEN** the manager's `ExecStart` names an absolute path to a Node executable that is owned by root

#### Scenario: No user-scoped runtime is referenced
- **WHEN** the service definition and the installed tree are inspected
- **THEN** no path under a user's home directory, no version-manager directory, and no shell startup file is referenced by the service, and the manager's runtime dependencies are production dependencies only

#### Scenario: Manager code is compiled ahead of execution
- **WHEN** the manager is built for installation
- **THEN** the build emits plain JavaScript into a build output directory, and the installed service runs that compiled output rather than a transpiler over source files

### Requirement: Service Supervision with Explicit Paths
The system SHALL run the manager under a system service manager as a supervised process, and the service definition SHALL state its vmsan data directory, its control socket path, and its working directory explicitly rather than relying on inherited or inferred defaults. The service SHALL restart automatically after an unexpected exit and SHALL only be enabled for automatic start at boot after it has been observed running successfully.

#### Scenario: Service starts and stays running
- **WHEN** the service is started
- **THEN** it reaches an active running state and creates its control socket at the configured path with the configured vmsan data directory

#### Scenario: Unexpected exit is recovered
- **WHEN** the manager process terminates unexpectedly
- **THEN** the service manager restarts it and the control socket becomes reachable again without operator action

#### Scenario: Boot-time start is only enabled after verification
- **WHEN** the service has been started and verified serving requests
- **THEN** it is enabled for automatic start at boot; it is not enabled as a side effect of installing the unit

#### Scenario: Graceful stop leaves VM state untouched
- **WHEN** the service is stopped and later started again
- **THEN** every microVM that existed before the restart still exists with its prior state, and the stop performs no VM deletion, cleanup, or mutation

### Requirement: Group-Gated Control Socket
The production control socket SHALL be created in a system runtime directory that is not inside any user's home directory and not in a world-writable temporary directory. Its access SHALL be governed by filesystem ownership: owned by the service user, group-owned by a dedicated group whose only members are the principals permitted to drive microVMs, and mode `0660`. The socket MUST NOT be world-readable, world-writable, or owned by a group that grants access to unrelated users. A principal's access SHALL be granted by membership in that group, and the manager SHALL NOT grant the web process direct filesystem access to the vmsan data directory as a substitute.

#### Scenario: Socket is owner-and-group only
- **WHEN** the manager has created its control socket
- **THEN** the socket's mode is `0660`, its owner is the service user, and its group is the dedicated access group

#### Scenario: Group member can connect
- **WHEN** a process running as a member of the dedicated access group connects to the control socket
- **THEN** the connection is accepted and requests over it are served

#### Scenario: Non-member is refused
- **WHEN** a process running as a user that is not a member of the dedicated access group attempts to connect to the control socket
- **THEN** the connection is refused by filesystem permissions and the refusal is not worked around by relaxing the socket's mode

#### Scenario: Web process has no direct state directory access
- **WHEN** the ownership and permissions of the vmsan data directory are inspected
- **THEN** the directory is not writable by the unprivileged web process's user, and the web process reaches VM state only through the control socket

#### Scenario: Socket is not in a temporary directory
- **WHEN** the configured control socket path is inspected
- **THEN** it resides under the system runtime directory and not under a world-writable temporary directory or any user home directory

### Requirement: No Sudoers Dependency
The system SHALL NOT require a sudoers rule to reach Firecracker. No sudoers drop-in SHALL be created, documented as required, or referenced by the application, and the privileged path SHALL be the supervised manager process only. The web application SHALL run as an unprivileged user at all times, including during development, and no project command SHALL instruct or require running the web application as root.

#### Scenario: No vmsan sudoers rule exists
- **WHEN** the system's sudoers configuration is inspected
- **THEN** no rule grants the application user passwordless execution of the vmsan executable or of any other executable on the application's request path

#### Scenario: Documentation no longer instructs passwordless sudo
- **WHEN** the project's setup documentation is read
- **THEN** it describes the supervised manager and group membership, and does not instruct the reader to create a passwordless sudo rule

#### Scenario: Web application is never started as root
- **WHEN** any documented command that starts the web application is inspected
- **THEN** none of them runs the web application as root

### Requirement: Verifiable Privilege Boundary
The system SHALL make the privilege relationship between the web application and the manager externally verifiable. The manager SHALL run as uid 0, the web application SHALL run as a non-root user, and the two SHALL communicate only over the control socket. This MUST be demonstrable by inspecting running processes rather than only by asserting it in documentation.

#### Scenario: Process users differ
- **WHEN** the running process list is inspected
- **THEN** the manager process runs as root and the web application process runs as a non-root user

#### Scenario: Single privileged boundary in the request path
- **WHEN** a VM list request is traced from the web application to the native vmsan state
- **THEN** the path is the web application, then the control socket, then the manager process, then the native vmsan state, with no other privileged process or command execution in between

### Requirement: Deployment Leaves Existing VM State Intact
The deployment SHALL be strictly non-destructive with respect to microVM state. It MUST NOT create, start, stop, remove, move, copy, or rewrite any existing VM record, and it MUST NOT relocate the vmsan data directory as part of installing the service.

#### Scenario: Installation does not migrate state
- **WHEN** the installation procedure runs
- **THEN** the vmsan data directory is neither moved nor copied, and the manager is pointed at the directory the existing VM records already reference

#### Scenario: Existing VMs are listed after deployment
- **WHEN** a list request is served after the service is running under the service manager
- **THEN** the result reflects the pre-existing VM records, and the same set is returned before and after a service restart

### Requirement: Service-Level Hardening With Verified Compatibility
The service SHALL apply process isolation that does not interfere with the privileged Firecracker, Jailer, and network operations the manager performs, and each isolation directive SHALL be validated against a real request before being kept. Isolation that would remove capabilities or namespace access the runtime requires MUST NOT be enabled.

#### Scenario: Conservative hardening is applied and verified
- **WHEN** the service definition is inspected
- **THEN** it applies filesystem and process isolation directives that have each been verified to leave health and list requests working

#### Scenario: Capability-removing isolation is not enabled
- **WHEN** the service definition is inspected
- **THEN** it does not enable device isolation, namespace restriction, or a no-new-privileges policy that would block the manager's privileged operations

### Requirement: Install Script Is Operator-Driven and Non-Destructive
The privileged installation SHALL be delivered as a documented, idempotent procedure that the host operator executes with their own credentials. The procedure MUST NOT be triggered as a side effect of an ordinary build, test, or development command, and it MUST NOT modify unrelated sudoers files or unrelated system configuration.

#### Scenario: Operator runs the procedure explicitly
- **WHEN** the manager is built and tested as an ordinary user
- **THEN** no system directory is created or modified, and system changes occur only when the operator runs the installation procedure

#### Scenario: Unrelated system configuration is untouched
- **WHEN** the procedure completes
- **THEN** only the manager's installation directory, its service definition, its access group, and the operator's group membership have changed

#### Scenario: Procedure reports what it changed
- **WHEN** the procedure completes
- **THEN** it prints the installed path, the service name, and the next commands the operator should run, and it states that the service is not yet enabled at boot
