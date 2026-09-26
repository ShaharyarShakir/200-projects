# agent-artifacts Specification

## Purpose

Covers the two reviewable artifacts an agent run produces — a unified patch and a commit bisect timeline — including the agent actions required to create them and the owner-scoped reads that expose them.

## Requirements

### Requirement: Agent Patch Generation

The system SHALL allow the agent to request generation of a unified diff from the sandboxed repository, and SHALL record the resulting patch against the session. The patch SHALL be scoped to the session that produced it and SHALL be readable only by that session's owner.

#### Scenario: Agent requests a patch

- **WHEN** the agent emits a patch generation action during a session
- **THEN** the system collects a unified diff from the sandbox and stores it against the session

#### Scenario: No changes produce an empty patch

- **WHEN** the agent requests a patch and the sandboxed repository has no modifications
- **THEN** the system records an empty patch rather than failing the action

#### Scenario: Patch generation fails

- **WHEN** the diff cannot be collected from the sandbox
- **THEN** the action reports a structured failure and the session records an error event without aborting the run

### Requirement: Agent Bisect Timeline Recording

The system SHALL allow the agent to run an automated bisect over the sandboxed repository's commit history, and SHALL record each commit tested with its verdict and execution outcome. Recorded commits SHALL be returned in the order the bisect evaluated them.

#### Scenario: Bisect run completes

- **WHEN** the agent runs a bisect and the run terminates
- **THEN** the system records every evaluated commit with its verdict, in evaluation order

#### Scenario: Bisect isolates a culprit

- **WHEN** a bisect run identifies a first bad commit
- **THEN** that commit is recorded as the culprit and is distinguishable from the commits that tested good or bad

#### Scenario: Bisect is inconclusive

- **WHEN** a bisect run terminates without identifying a culprit
- **THEN** the recorded timeline is still returned with no commit marked as the culprit

#### Scenario: Bisect exceeds its commit budget

- **WHEN** a bisect run evaluates more commits than its configured limit
- **THEN** the run stops at the limit and the timeline records the commits evaluated so far

### Requirement: Owner-Scoped Artifact Retrieval

The system SHALL expose a session's patch and bisect timeline through owner-scoped read endpoints. A request for a session that does not exist, or that belongs to another user, SHALL return the same not-found response. Artifact content SHALL pass through the same secret redaction applied to session events before it is returned.

#### Scenario: Owner reads their own session artifacts

- **WHEN** the owner requests the patch or timeline for a session they own
- **THEN** the system returns that session's stored artifact

#### Scenario: Artifacts requested for a session with none

- **WHEN** the owner requests a patch or timeline for a session that produced no such artifact
- **THEN** the system returns an empty artifact rather than a null or an error

#### Scenario: Another user requests the artifacts

- **WHEN** a user requests the patch or timeline for a session owned by a different user
- **THEN** the system returns a not-found response that does not reveal the session exists

#### Scenario: Artifact contains a secret

- **WHEN** stored artifact content contains a value matching a redaction rule
- **THEN** the returned artifact has that value redacted

### Requirement: Unauthenticated Artifact Access

The system SHALL reject artifact read requests that carry no valid session credential, and SHALL NOT return any artifact content in that response.

#### Scenario: Artifact requested without credentials

- **WHEN** a patch or timeline is requested without a valid access token
- **THEN** the request is rejected as unauthorized and no artifact content is returned
