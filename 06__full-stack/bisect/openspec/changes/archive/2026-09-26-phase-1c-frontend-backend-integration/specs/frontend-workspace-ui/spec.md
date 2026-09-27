# Spec Delta

## ADDED Requirements

### Requirement: Backend-Backed Session and Activity Views
The session list, workspace session inspector, and activity feed SHALL render data retrieved from the backend for the authenticated user. No view SHALL display placeholder, sample, or seeded records as though they were real. Each of these views SHALL distinguish four states — loading, populated, empty, and error — and SHALL show the state that matches the request currently in progress rather than a previously fetched result presented as current.

#### Scenario: Session list reflects the backend
- **WHEN** an authenticated user opens the sessions view
- **THEN** the rows shown are the sessions the backend reports for that user, and the list can be narrowed by status and searched by session identifier, prompt, or repository

#### Scenario: Session list shows an empty state rather than samples
- **WHEN** the backend reports that the authenticated user has no sessions
- **THEN** the view renders an empty state with guidance, and no sample or placeholder session rows are rendered

#### Scenario: Activity feed reflects backend events
- **WHEN** a user views the activity feed for a session
- **THEN** the entries shown are the events the backend reports for that session, presented in chronological order, and each entry is visually distinguished by the category the backend assigned it

#### Scenario: Activity feed shows an empty state before execution begins
- **WHEN** the backend reports no events for a session
- **THEN** the feed renders an empty state explaining that no activity has been recorded yet, rather than a blank or erroring region

#### Scenario: Views show a loading state before data arrives
- **WHEN** a view has requested backend data and no response has been received yet
- **THEN** the view renders a loading placeholder in place of the content region, and does not render an empty state or an error

#### Scenario: A pending request does not present stale data as current
- **WHEN** a view re-requests data for a different session or with different filters while a previous result is still displayed
- **THEN** the previously displayed result is either held as visibly stale or replaced by a loading state, and is not presented as the current result

#### Scenario: A failed view request shows an error state
- **WHEN** the backend cannot be reached or responds with an error for a view's request
- **THEN** the view renders an error state that explains the failure in user-facing terms and offers a way to retry, and the rest of the application remains usable

#### Scenario: Events are not exposed with internal provider detail
- **WHEN** the activity feed renders a backend event
- **THEN** it shows the event's human-readable summary and its outcome, and does not display raw provider responses, stack traces, or environment values

### Requirement: Manual Refresh of Workspace and Session State
The system SHALL provide the user an explicit way to refresh the workspace and session state currently on screen, and SHALL do so without requiring the user to reload the page or navigate away. The refresh control SHALL be available whenever there is state that could be stale — including before any session has been created — and SHALL indicate while a refresh is in progress so the user can tell a slow backend from a broken one.

#### Scenario: User refreshes the current state
- **WHEN** the user activates the refresh control
- **THEN** the frontend re-requests the workspace and session state currently displayed and renders the result

#### Scenario: Refresh is available before a session exists
- **WHEN** no agent session has been created yet and the user is viewing the workspace
- **THEN** the refresh control is still present and refreshes the workspace state

#### Scenario: Refresh indicates progress
- **WHEN** a refresh is in progress
- **THEN** the control communicates that a request is in flight, and stops communicating it once the request settles

#### Scenario: Refresh failure leaves the previous state visible and reports the error
- **WHEN** a manual refresh fails
- **THEN** the previously displayed state remains visible, the failure is reported, and the refresh control becomes usable again so the user can retry

## MODIFIED Requirements

### Requirement: Frontend API Layer, Error Normalization, and Polling
The system SHALL provide a centralized, strongly-typed API client module that handles backend communication with `/api/v1/*` routes. UI components SHALL NOT issue raw HTTP requests; all backend communication SHALL go through this layer. The API layer SHALL normalize HTTP and network errors into readable user messages, provide loading state indicators during async operations, provide clear empty states when data is missing, and support periodic polling for active sessions without freezing the interface.

Every backend failure mode the client can encounter SHALL be distinguishable without inspecting message text: unauthenticated, forbidden, not found, conflict, validation failure, server error, network failure, and timeout SHALL each map to a distinct client-side error state. A request that receives no response within a bounded time SHALL fail as a timeout rather than remaining pending indefinitely. The transport used to obtain updates SHALL be substitutable, so that introducing a pushed transport later does not require changing how components consume state.

#### Scenario: Backend unavailable or network error
- **WHEN** an API request fails due to network disconnection or backend service unavailability (e.g. 500 or 503)
- **THEN** the frontend catches the error, displays an error notification with retry options, and prevents application crashes

#### Scenario: Polling active session status
- **WHEN** an agent session is in `running` status
- **THEN** the frontend client polls session updates at regular intervals until a terminal status is reached or the user navigates away

#### Scenario: Empty state display
- **WHEN** an authenticated user has no synchronized repositories or active sessions
- **THEN** the workspace renders informative empty states with guidance and action buttons (e.g. "Sync Repositories")

#### Scenario: Components do not call the backend directly
- **WHEN** a UI component needs data from the backend
- **THEN** it obtains that data through the centralized API layer, and contains no direct HTTP invocation of its own

#### Scenario: Each failure mode is distinguishable
- **WHEN** the backend responds with a forbidden, not-found, conflict, or validation-failure status
- **THEN** the client surfaces a distinct error state for each, and the message shown to the user describes the condition in user-facing terms rather than echoing raw backend internals

#### Scenario: A hung request becomes a timeout
- **WHEN** a backend request receives no response within the configured time bound
- **THEN** the client abandons the request, surfaces a timeout error state, and stops presenting it as an in-progress load

#### Scenario: Transport can be replaced without changing consumers
- **WHEN** the mechanism used to obtain updates is changed
- **THEN** components that display the resulting state require no change to how they obtain or render it
