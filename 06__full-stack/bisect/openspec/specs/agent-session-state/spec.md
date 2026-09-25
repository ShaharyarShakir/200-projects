# agent-session-state Specification

## Purpose

Defines the data models, explicit lifecycle state machine, deterministic state transition validation, and action/result recording contracts for agent execution sessions in Bisect.

## Requirements

### Requirement: Agent Session Lifecycle States and Data Model
The system SHALL maintain a structured `AgentSession` model tracking an agent execution from start to finish. The model SHALL track session ID, task request description, current lifecycle status, iteration count, executed action count, creation/start/completion timestamps, termination reason, and associated execution steps. The lifecycle status SHALL be one of: `created`, `running`, `completed`, `failed`, `terminated`, or `timed_out`.

#### Scenario: Session initialized with created status
- **WHEN** a new `AgentSession` is instantiated with a task request
- **THEN** the session is assigned a unique session ID, has status `created`, zero iterations, zero executed actions, and records the creation timestamp

#### Scenario: Session model serialized cleanly
- **WHEN** an `AgentSession` is serialized to a dictionary or JSON model
- **THEN** all session fields including ID, status, counts, timestamps, and steps are accurately represented

### Requirement: Strict State Transition Enforcement
The system SHALL strictly validate and enforce allowed lifecycle state transitions for an `AgentSession`, rejecting any invalid or illegal status modifications. The allowed transitions SHALL be: `created` -> `running`, and `running` -> (`completed` | `failed` | `terminated` | `timed_out`). Transitions from terminal states SHALL be prohibited.

#### Scenario: Valid transition from created to running
- **WHEN** a session in `created` status transitions to `running`
- **THEN** the system updates the status to `running`, records the start timestamp, and allows execution to proceed

#### Scenario: Valid transition from running to terminal status
- **WHEN** a session in `running` status transitions to `completed`, `failed`, `terminated`, or `timed_out`
- **THEN** the system updates the status, records the completion timestamp, and sets the termination reason

#### Scenario: Invalid state transition rejected
- **WHEN** an attempt is made to transition a session directly from `created` to `completed`, or from a terminal status back to `running`
- **THEN** the system rejects the transition and raises an invalid state transition error without mutating session status

### Requirement: Session Action and Execution Result Recording
The system SHALL record discrete agent actions, execution results, errors, token usage, and durations against the `AgentSession`, incrementing iteration and executed action counters accordingly.

#### Scenario: Action and result appended to session
- **WHEN** an agent action executes and produces an execution result
- **THEN** the system appends the step record to the session history and increments the executed action count

#### Scenario: Action failure recorded against session
- **WHEN** an action parsing, validation, or sandbox execution fails
- **THEN** the system records the failure details in the session step history and maintains accurate error context

### Requirement: Session State Inspection and Security Boundary
The system SHALL allow reading the full execution history and current state of an `AgentSession` while ensuring that API keys, tokens, or configured secrets are never exposed in serialized session representations.

#### Scenario: Read current session state snapshot
- **WHEN** the execution loop or an external caller queries the session state
- **THEN** the system returns the current snapshot with accurate status, counts, and step records

#### Scenario: Sensitive credentials excluded from session state
- **WHEN** session actions or results contain sensitive environment values or tokens
- **THEN** the system masks or omits credentials from the session state data
