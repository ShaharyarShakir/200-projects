# Spec Delta

## ADDED Requirements

### Requirement: Privileged Command Execution
The system SHALL support optional privileged execution via `sudo -n` targeting the absolute path of the `vmsan` binary when `VMSAN_SUDO=true` or `{ sudo: true }`, without invoking the `env` intermediary or relying on shell PATH resolution, and MUST fail fast when passwordless sudo is not configured.

#### Scenario: Direct privileged execution with VMSAN_SUDO enabled
- **WHEN** a microVM operation is invoked with `VMSAN_SUDO=true` or `{ sudo: true }`
- **THEN** the adapter spawns `sudo` with arguments `["-n", "<absolute-vmsan-path>", ...args]` as a pure array without invoking `env` or shell interpreters

#### Scenario: Unprivileged execution when sudo is disabled
- **WHEN** a microVM operation is invoked with `VMSAN_SUDO=false` (or unset) and `{ sudo: false }`
- **THEN** the adapter executes the resolved `vmsan` binary directly without `sudo`

#### Scenario: Fail fast when passwordless sudo is not configured
- **WHEN** a privileged command fails because `sudo -n` requires a password or non-interactive sudo is denied
- **THEN** the adapter throws a `VmsanError` indicating privilege escalation is required without hanging on interactive terminal prompts or leaking raw host environment details
