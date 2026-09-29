# Spec Delta

## REMOVED Requirements

### Requirement: Privileged Command Execution
**Reason**: The sudo-based escalation model is unsound. The rule it required granted NOPASSWD access to a vmsan executable installed under a user-writable path (`~/.local/share/fnm/...`), so anyone able to write that path controlled what executed as root. The `sudo -n` spawning and `VMSAN_SUDO` switch in the adapter are superseded by a privileged `vmsan-manager` process that imports the native vmsan API and is reached over a Unix domain socket.

**Migration**: Remove the `/etc/sudoers.d/vmsan` NOPASSWD rule and unset `VMSAN_SUDO`. Privileged microVM operations are reached through the manager process instead. The adapter's `sudo` code path remains in the codebase but is no longer a supported mechanism and is not exercised on the request path; a later change deletes it once the `/api/vms` routes migrate to the manager client.

## ADDED Requirements

### Requirement: No In-Process Privilege Escalation
The system SHALL NOT reach Firecracker by escalating privileges from the unprivileged web process. The sanctioned path to privileged microVM operations SHALL be the separate `vmsan-manager` process, which runs as the privileged user, holds a single native vmsan service, and is reached over a Unix domain socket. The web process SHALL NOT request passwordless sudo, SHALL NOT spawn `sudo`, SHALL NOT construct shell command lines, and no sudoers rule pointing at the vmsan executable SHALL be required or documented as part of the supported setup.

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
