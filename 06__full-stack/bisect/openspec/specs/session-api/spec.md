# session-api Specification

## Purpose
Provides the durable storage and owner-scoped REST surface for agent execution sessions and their chronological event feed, so that a session created by one request is observable by every later request and by the frontend's polling clients.

## Requirements

### Requirement: Durable Agent Session Records
The system SHALL persist an agent session so that it outlives the request that created it. A persisted session SHALL record the session identifier, the owning user, the repository it targets when one was selected, the task prompt, the lifecycle status, the iteration count, the executed action count, the creation, start, and completion timestamps, the termination reason, the cumulative token accounting, and the recorded execution steps. A session SHALL be readable through the API by any later request, without requiring the original execution to still be running.

#### Scenario: Session survives the request that created it
- **WHEN** a session is created by one API request and that request has completed
- **THEN** a subsequent, separate API request for the same session identifier returns the session with the status, counters, and timestamps recorded at creation

#### Scenario: Persisted session records its owning user
- **WHEN** a session is created through the API
- **THEN** the stored session is associated with the authenticated user who created it and with the repository that was selected, if any

#### Scenario: Session records its execution steps
- **WHEN** a session's execution records one or more steps
- **THEN** each recorded step is retrievable with the session in the order it was recorded, preserving its iteration, action, result, error, and duration

#### Scenario: Session timestamps reflect lifecycle transitions
- **WHEN** a session moves from created to running and later reaches a terminal status
- **THEN** the persisted session reports a start timestamp once execution began and a completion timestamp and termination reason once it became terminal

### Requirement: Session Creation and Ownership Enforcement
The system SHALL expose a session creation operation that accepts a task prompt and an optional repository identifier. Creation SHALL require an authenticated user. A session SHALL be readable only by the user who owns it: a request for a session owned by a different user SHALL be reported as not found rather than as forbidden, so that the existence of another user's session is not disclosed.

#### Scenario: Authenticated user creates a session
- **WHEN** an authenticated user submits a valid task prompt to create a session
- **THEN** the system stores the session against that user, returns the created session with status `created`, and reports the result as newly created

#### Scenario: Unauthenticated session creation is rejected
- **WHEN** a request to create a session is made without valid authentication credentials
- **THEN** the system rejects the request as unauthorized and stores nothing

#### Scenario: Submission with an empty task prompt is rejected
- **WHEN** a request to create a session supplies an empty or whitespace-only task prompt
- **THEN** the system rejects the request as a validation failure and stores no session

#### Scenario: Session referencing an unknown repository is rejected
- **WHEN** a request to create a session supplies a repository identifier that does not exist or is not owned by the authenticated user
- **THEN** the system rejects the request as a validation failure and stores no session

#### Scenario: Another user's session is not readable
- **WHEN** an authenticated user requests a session by an identifier belonging to a different user
- **THEN** the system responds as not found and reveals no session data, including no indication that the session exists

### Requirement: Paginated Session Listing and Filtering
The system SHALL expose a session listing operation scoped to the authenticated user, supporting a page size and offset, and optional filters by lifecycle status and by repository. The response SHALL report the returned page together with the total number of matching sessions so a client can determine whether more pages exist. Sessions owned by other users SHALL never appear in the listing.

#### Scenario: Listing returns the caller's sessions
- **WHEN** an authenticated user lists sessions
- **THEN** the response contains only sessions owned by that user, along with the total count of their sessions

#### Scenario: Listing is paginated
- **WHEN** an authenticated user lists sessions with a page size smaller than their total session count
- **THEN** the response contains at most the requested number of sessions, reports the requested offset, and reports a total greater than the number returned, indicating more pages exist

#### Scenario: Listing filtered by status
- **WHEN** an authenticated user lists sessions filtered to a specific lifecycle status
- **THEN** every returned session has that status and the reported total counts only sessions matching the filter

#### Scenario: Listing filtered by repository
- **WHEN** an authenticated user lists sessions filtered to a specific repository
- **THEN** every returned session targets that repository and the reported total counts only that user's sessions for that repository

#### Scenario: User with no sessions receives an empty listing
- **WHEN** an authenticated user who has never created a session lists sessions
- **THEN** the response reports an empty collection with a total of zero and does not report an error

#### Scenario: Unauthenticated listing is rejected
- **WHEN** a request to list sessions is made without valid authentication credentials
- **THEN** the system rejects the request as unauthorized and returns no session data

### Requirement: Chronological Session Event Feed
The system SHALL record discrete events against a session and expose them as a chronological feed. Each event SHALL carry a stable identifier, a monotonically increasing sequence number, a timestamp, and a severity level. The feed SHALL be ordered by sequence number, SHALL support requesting only events after a given sequence number so a polling client can fetch incrementally without re-reading the whole feed, and SHALL support a page size limit. Reading the event feed SHALL require the same ownership check as reading the session itself.

#### Scenario: Events are returned in chronological order
- **WHEN** a client reads the event feed for a session that has recorded several events
- **THEN** the events are returned in ascending sequence order, corresponding to the order in which they were recorded

#### Scenario: Client requests only new events
- **WHEN** a client requests the event feed with a sequence number it has already seen
- **THEN** the response contains only events recorded after that sequence number, and does not repeat previously returned events

#### Scenario: Event feed is paginated
- **WHEN** a session has more recorded events than the requested page size
- **THEN** the response returns at most the requested number of events, ordered by sequence number, and the client can retrieve the remainder by passing the highest sequence number received

#### Scenario: Session with no events returns an empty feed
- **WHEN** a client reads the event feed for a session that has recorded no events
- **THEN** the response reports an empty collection rather than an error

#### Scenario: Event feed of another user's session is not readable
- **WHEN** an authenticated user requests the event feed for a session owned by a different user
- **THEN** the system responds as not found and reveals no event data

#### Scenario: Event feed of an unknown session is not readable
- **WHEN** a client requests the event feed for a session identifier that does not exist
- **THEN** the system responds as not found

### Requirement: Session Event Categories
The system SHALL assign each recorded event exactly one category from a fixed set: `system`, `agent`, `execution`, `validation`, `success`, `warning`, and `error`. Categorization SHALL be performed by the system at the point the event is recorded, and SHALL be derived from what actually happened rather than supplied by the caller, so that a client cannot mislabel a recorded event. Each event SHALL carry a short human-readable summary describing what occurred, and SHALL NOT expose raw provider responses, stack traces, or environment values in that summary.

#### Scenario: Recorded event receives a single category
- **WHEN** an event is recorded against a session
- **THEN** the stored event carries exactly one category drawn from the fixed set and a human-readable summary

#### Scenario: Action execution is categorized as execution
- **WHEN** a command execution or file inspection action is recorded against a session
- **THEN** the resulting event is categorized as `execution` and its summary identifies the action performed

#### Scenario: Successful completion is categorized as success
- **WHEN** a session's action completes successfully
- **THEN** the resulting event is categorized as `success` rather than as a generic system event

#### Scenario: Recoverable anomaly is categorized as warning
- **WHEN** an action fails in a way the agent loop treats as recoverable and continues from
- **THEN** the resulting event is categorized as `warning`

#### Scenario: Unrecoverable failure is categorized as error
- **WHEN** a session fails, terminates, or times out
- **THEN** the resulting event is categorized as `error` and its summary states the reason recorded on the session

#### Scenario: Caller cannot supply the category
- **WHEN** a client attempts to record an event with a category of its own choosing
- **THEN** the system rejects the caller-supplied category and derives the category from the recorded occurrence

### Requirement: Secret Redaction on the Session HTTP Surface
The system SHALL ensure that credentials, tokens, and other sensitive values never appear in a session or event response. This SHALL apply to the full contents of recorded execution steps, including command output, inspected file content, and any provider response text, and not only to explicitly labelled fields.

#### Scenario: Recorded step containing a secret is redacted in the response
- **WHEN** a session has recorded a step whose content contains a credential or token value
- **THEN** the session returned by the API shows the sensitive value masked or omitted, and the unmasked value is absent from the response body

#### Scenario: Event summary does not leak sensitive values
- **WHEN** an event is recorded for an occurrence whose underlying content contains a credential
- **THEN** the event's summary and any included detail returned by the API do not contain the credential value

#### Scenario: Redaction is applied on every read path
- **WHEN** a session is retrieved individually, listed, or read through its event feed
- **THEN** sensitive values are redacted consistently on all three paths

### Requirement: Session API Error Contract
The system SHALL return a consistent machine-readable error envelope for every failure of the session API, containing a human-readable detail and a stable error code. Failures SHALL be distinguishable by the client without parsing message text: unauthenticated requests, resources absent or not owned by the caller, invalid input, and unexpected server faults SHALL each produce their own status and code. Error responses SHALL NOT include stack traces or internal exception detail.

#### Scenario: Unauthenticated request returns unauthorized
- **WHEN** any session operation is requested without valid authentication credentials
- **THEN** the system responds with an unauthorized status and an error envelope identifying authentication as the cause

#### Scenario: Absent or unowned resource returns not found
- **WHEN** a session or event feed is requested for an identifier that does not exist or belongs to another user
- **THEN** the system responds with a not-found status and an error envelope, and the two cases are not distinguishable by the client

#### Scenario: Invalid input returns a validation failure
- **WHEN** a request supplies input that violates the session operation's constraints
- **THEN** the system responds with a validation-failure status and an envelope naming the invalid field

#### Scenario: Unexpected fault returns a sanitized server error
- **WHEN** a session operation fails due to an unexpected internal fault
- **THEN** the system responds with a server-error status and a fixed generic detail that contains no stack trace or internal exception text, and the fault is recorded in the application log instead
