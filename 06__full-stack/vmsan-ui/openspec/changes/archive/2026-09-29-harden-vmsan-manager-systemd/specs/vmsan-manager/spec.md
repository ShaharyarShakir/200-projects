# Spec Delta

## ADDED Requirements

### Requirement: Socket Group Ownership
The system SHALL accept a configured access group and, after creating its control socket, set that socket's group to the configured group while keeping owner-and-group-only permissions. If no group is configured, the socket MUST retain the owner-and-group-restricted mode with the service user's primary group. A failure to set the group MUST NOT cause the manager to fall back to a more permissive mode, and the manager MUST NOT continue listening with a world-accessible socket.

#### Scenario: Configured group is applied to the socket
- **WHEN** the manager starts with an access group configured
- **THEN** the created socket is owned by the service user and the configured group, and its mode is `0660`

#### Scenario: No configured group leaves the socket owner-restricted
- **WHEN** the manager starts with no access group configured
- **THEN** the socket keeps the owner-and-group-restricted mode and no group change is attempted

#### Scenario: Group assignment failure is reported, not widened
- **WHEN** the manager cannot set the configured group on the socket
- **THEN** it reports the failure and does not broaden the socket's permissions to compensate

#### Scenario: Socket permissions are applied before readiness
- **WHEN** the manager finishes binding and applying socket ownership and mode
- **THEN** it announces readiness only after both the mode and the group have been applied

### Requirement: Configurable Socket Path From the Environment
The manager and the web application client SHALL both resolve their control socket path from configuration, and an explicitly configured value SHALL take precedence over any derived default. Neither side SHALL embed a specific user's home directory or socket path in source, and a socket path MUST NOT be settable per request.

#### Scenario: Explicit socket path wins
- **WHEN** a socket path is supplied through configuration
- **THEN** both the manager and the client use that exact path

#### Scenario: No configured path falls back to a per-user runtime directory
- **WHEN** no socket path is configured
- **THEN** the client falls back to a per-user runtime directory, and the manager falls back to the same derivation for its own use

#### Scenario: No home path is embedded in application code
- **WHEN** the manager's and the client's socket resolution code is inspected
- **THEN** neither contains a specific user's home directory or an absolute socket path

#### Scenario: A request cannot redirect the socket
- **WHEN** a request attempts to supply or change a socket path
- **THEN** the value is ignored and the process keeps using the socket it bound at startup

### Requirement: Deployable Compiled Build
The manager package SHALL produce compiled JavaScript output suitable for installation as a standalone program, and the installed program SHALL run that compiled output without a TypeScript loader present at runtime. Development execution MAY still use a TypeScript runner, but the production dependency set SHALL contain no development-only tooling.

#### Scenario: Build emits runnable JavaScript
- **WHEN** the manager is built
- **THEN** the build output directory contains the compiled entry point and its modules as plain JavaScript

#### Scenario: Production install has no transpiler dependency
- **WHEN** the manager's production-only dependencies are installed for deployment
- **THEN** no TypeScript runner or compiler is among them, and the installed entry point runs directly

#### Scenario: Development runner still works
- **WHEN** the manager is started through its development command
- **THEN** it runs from source as before

#### Scenario: Build output is not part of the type-check configuration
- **WHEN** type checking and the build are run
- **THEN** they use separate configurations, and emitting build output does not change the type-check result
