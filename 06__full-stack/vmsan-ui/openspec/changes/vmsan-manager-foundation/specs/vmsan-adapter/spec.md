# Spec Delta

## MODIFIED Requirements

### Requirement: Privileged Command Execution
The system SHALL NOT reach Firecracker by escalating privileges from the unprivileged web process. The sanctioned path to privileged microVM operations SHALL be the separate `vmsan-manager` process, which runs as the privileged user, holds a single native vmsan service, and is reached over a Unix domain socket. The adapter MUST NOT request passwordless sudo, MUST NOT spawn `sudo`, and MUST NOT construct shell command lines, and no sudoers rule pointing at the vmsan executable SHALL be required or documented. The adapter's existing `sudo -n` escalation and `VMSAN_SUDO` switch remain in the codebase only as an unexercised migration path until a later change removes them; the web process SHALL be run as an unprivileged user (`uid != 0`) and the manager SHALL be the only privileged process.

#### Scenario: No sudo invocation on the request path
- **WHEN** any microVM operation is invoked through the adapter
- **THEN** the adapter performs no `sudo` invocation and requests no passwordless privilege escalation, regardless of the `VMSAN_SUDO` setting

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
