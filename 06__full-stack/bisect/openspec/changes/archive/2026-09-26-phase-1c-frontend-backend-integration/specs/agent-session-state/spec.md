# Spec Delta

## MODIFIED Requirements

### Requirement: Session State Inspection and Security Boundary
The system SHALL allow reading the full execution history and current state of an `AgentSession` from any later request, not only from within the execution that produced it. A session SHALL be retained beyond the lifetime of the execution that created it, so that its state, counts, and step records remain available to a reader that did not participate in the execution. The system SHALL ensure that API keys, tokens, or configured secrets are never exposed in serialized session representations, and this guarantee SHALL hold on every path by which session state leaves the system, including the HTTP response body and any event derived from the session's steps.

#### Scenario: Read current session state snapshot
- **WHEN** the execution loop or an external caller queries the session state
- **THEN** the system returns the current snapshot with accurate status, counts, and step records

#### Scenario: Sensitive credentials excluded from session state
- **WHEN** session actions or results contain sensitive environment values or tokens
- **THEN** the system masks or omits credentials from the session state data

#### Scenario: Session state is readable after the execution that produced it has ended
- **WHEN** a session's execution has completed, failed, terminated, or timed out, and a separate later request reads that session
- **THEN** the session is returned with the status, counters, timestamps, termination reason, and step records it held when execution ended

#### Scenario: Session state is readable while execution is still in progress
- **WHEN** a session is executing and a separate request reads that session
- **THEN** the session is returned with the status and progress recorded up to that point, rather than being unavailable until execution finishes

#### Scenario: Credentials are excluded from the HTTP response body
- **WHEN** session state is served over HTTP and a recorded step contains a sensitive environment value or token
- **THEN** the response body does not contain the unmasked value, and the redaction is applied to the full step content rather than only to fields explicitly marked sensitive

#### Scenario: Credentials are excluded from derived event content
- **WHEN** an event is derived from a session step whose content contains a sensitive environment value or token
- **THEN** the event content served over HTTP does not contain the unmasked value
