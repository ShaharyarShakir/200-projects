# Spec Delta: agent-execution-loop

## ADDED Requirements

### Requirement: Execution Correlation and Structured Logging
The system SHALL assign a unique execution ID (`execution_id`) to every agent execution run and record structured log events for all loop state transitions, agent actions, execution results, and termination causes. The system SHALL redact sensitive secrets and credentials from all execution logs.

#### Scenario: Unique execution ID assigned and propagated
- **WHEN** an agent execution loop is initiated
- **THEN** the system generates a unique execution ID, attaches it to the execution context, and associates it with every recorded loop step and the final loop result

#### Scenario: Structured action and result logging
- **WHEN** the agent performs an action and receives execution results from the sandbox
- **THEN** the system emits structured log records containing the execution ID, iteration number, action type, duration, exit code or status, and termination reason upon completion

#### Scenario: Secrets and credentials redacted from logs
- **WHEN** an action or result contains sensitive API keys, tokens, or configured secrets
- **THEN** the system sanitizes or masks the sensitive values before emitting structured log entries

### Requirement: Deterministic Sandbox Cleanup and Lifecycle Teardown
The system SHALL ensure that all provisioned sandbox container resources are cleanly stopped and removed upon any termination event, including successful completion, limit exhaustion, command timeout, or unhandled exceptions.

#### Scenario: Sandbox cleaned up on normal finish
- **WHEN** an agent completes execution by emitting a valid `finish` action
- **THEN** the system executes sandbox cleanup and destroys the container resources before returning the final result

#### Scenario: Sandbox cleaned up on limit exhaustion or timeout
- **WHEN** the agent loop halts due to reaching max iterations, max commands, or total execution duration timeout
- **THEN** the system immediately tears down the sandbox container and marks the run with the respective termination status

#### Scenario: Sandbox cleaned up on unhandled exception
- **WHEN** an unexpected exception occurs during loop orchestration or provider communication
- **THEN** the system executes sandbox cleanup in a failure recovery block before bubbling the failure or returning a `FAILED` result

### Requirement: Strict Sandbox Isolation and Host Protection
The system SHALL guarantee that all agent-requested actions, shell commands, and file inspections execute strictly within the isolated Podman sandbox container, prohibiting direct execution on the Bisect host or development container.

#### Scenario: Agent commands isolated from host environment
- **WHEN** the agent requests a `run_command` or `inspect_file` action
- **THEN** the command or file read is dispatched exclusively to the Podman sandbox container without spawning host processes or accessing host filesystems

#### Scenario: Unauthorized or host-targeting actions rejected
- **WHEN** an action payload requests unsupported operations or attempts to bypass sandbox boundaries
- **THEN** the system rejects the action prior to dispatch, logs the security violation with the execution ID, and returns a structured validation error

## MODIFIED Requirements

### Requirement: Bounded Loop Termination and Limit Enforcement
The system SHALL enforce deterministic bounds on the execution loop, halting execution when the agent signals completion, when maximum iteration limits are reached, when maximum command execution limits are reached, when the overall execution duration is exceeded, or when consecutive error thresholds are reached.

#### Scenario: Normal termination on finish action
- **WHEN** the agent emits a valid `finish` action
- **THEN** the loop terminates cleanly with status `COMPLETED` and returns the final run summary

#### Scenario: Max iterations limit reached
- **WHEN** the loop reaches the configured maximum iteration count without the agent finishing
- **THEN** the loop halts execution, sets status to `MAX_ITERATIONS_REACHED`, and returns the accumulated run history

#### Scenario: Max commands limit reached
- **WHEN** the cumulative number of sandbox commands executed reaches the configured `max_commands` limit
- **THEN** the loop halts execution, sets status to `MAX_COMMANDS_EXCEEDED`, and returns the accumulated run history

#### Scenario: Overall execution duration timeout reached
- **WHEN** the total elapsed time of the execution loop exceeds the configured `max_duration_seconds` limit
- **THEN** the loop halts execution, sets status to `TIMEOUT`, and returns the accumulated run history

#### Scenario: Consecutive failure threshold reached
- **WHEN** the agent produces consecutive invalid or failed actions exceeding the allowed failure limit
- **THEN** the loop halts execution, sets status to `CONSECUTIVE_ERRORS_EXCEEDED`, and records the error details
