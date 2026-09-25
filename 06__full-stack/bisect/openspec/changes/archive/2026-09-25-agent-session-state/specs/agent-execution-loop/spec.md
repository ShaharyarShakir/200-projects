# Spec Delta

## MODIFIED Requirements

### Requirement: Execution Correlation and Structured Logging
The system SHALL bind every agent execution run to an `AgentSession` identified by a unique session ID. The system SHALL synchronize loop iterations, executed actions, and sandbox results to the session state, transition session status upon lifecycle events, and record structured log events for all loop state transitions, agent actions, execution results, and termination causes. The system SHALL redact sensitive secrets and credentials from all execution logs and session state.

#### Scenario: Unique execution ID assigned and propagated
- **WHEN** an agent execution loop is initiated
- **THEN** the system associates or creates an `AgentSession`, attaches the session ID to the execution context, and transitions session status from `created` to `running`

#### Scenario: Structured action and result logging
- **WHEN** the agent performs an action and receives execution results from the sandbox
- **THEN** the system records the step in the `AgentSession`, updates iteration and action counters, and emits structured log records containing the session ID, iteration number, action type, duration, exit code or status, and termination reason upon completion

#### Scenario: Secrets and credentials redacted from logs
- **WHEN** an action or result contains sensitive API keys, tokens, or configured secrets
- **THEN** the system sanitizes or masks the sensitive values before emitting structured log entries or storing them in session state
