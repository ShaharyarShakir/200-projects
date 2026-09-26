# frontend-workspace-ui Specification

## Purpose

Provides a responsive frontend workspace interface and cockpit for Bisect developers to authenticate with GitHub, view workspaces and repositories, monitor agent execution lifecycle states, inspect session metrics, and review chronological activity feeds.

## Requirements

### Requirement: Application Shell and Responsive Navigation
The system SHALL provide a structured application shell featuring a top navigation bar, sidebar navigation links, a central workspace canvas, and user status indicators. The layout SHALL be responsive across desktop (primary target), laptop, and tablet viewports, adapting navigation menus accordingly.

#### Scenario: Unauthenticated user accesses application root
- **WHEN** an unauthenticated user navigates to the application URL
- **THEN** the application shell renders with an unauthenticated status and displays an option to sign in with GitHub

#### Scenario: Authenticated user views workspace navigation
- **WHEN** an authenticated user opens the application
- **THEN** the application displays the workspace navigation links (Workspace, Sessions, Activity, Settings) and user profile summary

#### Scenario: Viewport resize to tablet dimensions
- **WHEN** the browser viewport width decreases to tablet screen size (< 1024px)
- **THEN** the sidebar navigation adapts to a collapsible drawer or compact menu while preserving access to all workspace panels

### Requirement: GitHub Authentication Flow and Session State
The system SHALL integrate with the existing backend GitHub OAuth endpoints (`/api/v1/auth/github/login`, `/api/v1/auth/github/callback`, `/api/v1/auth/me`). The frontend SHALL maintain the authenticated user profile and token in client state, handle login initiation via redirect, complete callback exchange, and provide an explicit logout action that clears client authentication state. The system SHALL react to any HTTP 401 Unauthorized response by clearing stored credentials and navigating the user to the login prompt, preserving the current page as the post-login return path.

#### Scenario: Initiate GitHub OAuth login
- **WHEN** the user clicks the "Sign in with GitHub" action
- **THEN** the frontend initiates the redirect to `/api/v1/auth/github/login`

#### Scenario: Successful OAuth callback completion
- **WHEN** the user returns from GitHub authorization with code and state parameters to the callback route
- **THEN** the frontend exchanges the authorization parameters via the backend callback endpoint, stores the returned session token, loads the user profile, and transitions the UI to the authenticated workspace

#### Scenario: User triggers logout
- **WHEN** an authenticated user triggers the logout action
- **THEN** the frontend clears the stored token and user profile, resets application state, and displays the unauthenticated state

#### Scenario: Unauthorized API access handling
- **WHEN** an API request returns an HTTP 401 Unauthorized status
- **THEN** the frontend clears expired credentials and redirects the user to the login prompt, recording the current page as the post-login return path

#### Scenario: Explicit logout returns the user to the login prompt
- **WHEN** an authenticated user triggers the logout action
- **THEN** the frontend navigates the browser to the login prompt rather than leaving the user on the page they were viewing

### Requirement: Agent Workspace and Lifecycle State Visualizer
The system SHALL display an agent workspace view showing repository context, active agent session status, and execution state. The UI SHALL visibly reflect all backend lifecycle states: `created`, `running`, `completed`, `failed`, `terminated`, and `timed_out`.

#### Scenario: Display idle / created session status
- **WHEN** a session is created or in `created` status
- **THEN** the workspace displays a status indicator badge with `CREATED` / `IDLE`, along with session initialization metadata

#### Scenario: Display running agent session
- **WHEN** an agent session is actively executing (`running` status)
- **THEN** the workspace displays an active spinner/badge for `RUNNING`, showing the current iteration count and running elapsed time

#### Scenario: Display terminal completed session
- **WHEN** an agent session transitions to `completed`
- **THEN** the workspace displays a success indicator for `COMPLETED`, the final termination message, and execution summary metrics

#### Scenario: Display failed or timed out session
- **WHEN** an agent session reaches `failed` or `timed_out` status
- **THEN** the workspace displays an error badge reflecting the terminal error state and displays the backend termination reason

### Requirement: Session Details and Metric Inspection
The system SHALL render a session inspector panel displaying session ID, task prompt, creation and start timestamps, completed timestamp, iteration count, executed action count, duration, and token usage accounting (prompt tokens, completion tokens, total tokens) retrieved from the backend `AgentSession` model.

#### Scenario: Inspect session metrics
- **WHEN** a user selects or loads an agent session in the inspector
- **THEN** the UI displays the session ID, task prompt, cumulative token usage, elapsed execution duration, and iteration count

#### Scenario: Inspect session with termination reason
- **WHEN** an agent session has terminated with a recorded reason
- **THEN** the session inspector displays the termination reason text prominently

### Requirement: Chronological Activity and Event Feed
The system SHALL present a chronological activity feed of steps recorded in the agent session. The feed SHALL visually categorize each step by event type: command executions (`run_command`), file inspections (`inspect_file`), task completions (`finish`), warnings, and errors.

#### Scenario: Display command execution step
- **WHEN** a session contains a `run_command` loop step
- **THEN** the activity feed renders a command entry showing the executed command, exit code, duration, and collapsible stdout/stderr output

#### Scenario: Display file inspection step
- **WHEN** a session contains an `inspect_file` loop step
- **THEN** the activity feed renders an inspection entry showing the inspected file path, file existence status, and size/content preview

#### Scenario: Display action error step
- **WHEN** a loop step contains an error or failure result
- **THEN** the activity feed highlights the step with an error alert styling and displays the error message and details

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

### Requirement: Human Git Ownership Safeguards
The frontend SHALL NOT trigger automated Git mutations (no commits, pushes, branches, or PR merges without explicit human initiation). All display elements reflecting code or workspace modifications SHALL be read-only and explicitly present changes for human review.

#### Scenario: Review workspace changes
- **WHEN** viewing agent modifications or workspace status
- **THEN** all actions and displays remain strictly informational and require explicit user action for any external operations

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

### Requirement: Authenticated Route Protection
The system SHALL prevent unauthenticated visitors from rendering any page that
requires an authenticated session. Requests to a protected page made without a
valid session SHALL result in navigation to the login prompt instead of
rendering the protected content or rendering it in a broken unauthenticated
state. The system SHALL maintain an explicit classification of application
pages as public or protected, and a page absent from that classification SHALL
be treated as protected by default so that newly added pages are not
accidentally exposed.

The authentication check SHALL complete before the protected page's data is
requested, and while the session is being validated the system SHALL render a
loading state rather than a redirect or an error.

#### Scenario: Unauthenticated visitor opens a protected page
- **WHEN** an unauthenticated visitor navigates directly to a protected page such as the workspace, sessions, activity, or settings page
- **THEN** the system does not render the protected page content and instead navigates the browser to the login page

#### Scenario: Protected page does not request data before authentication resolves
- **WHEN** a protected page is opened and the session state is still being validated
- **THEN** the system renders a loading state and issues no authenticated API request until the session is known to be absent or present

#### Scenario: Authenticated visitor opens a protected page
- **WHEN** an authenticated user navigates directly to a protected page
- **THEN** the system renders the page normally without an intervening login redirect

#### Scenario: Public pages remain reachable
- **WHEN** an unauthenticated visitor navigates to the login page or the OAuth callback page
- **THEN** the system renders that page without redirecting to login

#### Scenario: Newly added page is protected by default
- **WHEN** an application page is added that is not listed as public
- **THEN** the system treats that page as protected and does not render its content for an unauthenticated visitor

### Requirement: Post-Authentication Return Path
The system SHALL preserve the page an unauthenticated visitor originally
requested, so that completing sign-in returns the visitor to that page. If no
originally requested page is available, the system SHALL return the visitor to
the default post-login landing page. A return path SHALL only be honored for
paths within the application, and a supplied return path that points outside
the application SHALL be discarded.

#### Scenario: Visitor is returned to the originally requested page
- **WHEN** an unauthenticated visitor is redirected to login from a protected page and then completes sign-in successfully
- **THEN** the system navigates the browser back to the protected page the visitor originally requested

#### Scenario: Direct login with no prior request
- **WHEN** a visitor signs in without having been redirected from a protected page
- **THEN** the system navigates the browser to the default post-login landing page

#### Scenario: External return path is discarded
- **WHEN** the requested return path does not belong to the application
- **THEN** the system discards it and navigates to the default post-login landing page instead

#### Scenario: Return path survives a failed sign-in attempt
- **WHEN** a visitor's sign-in attempt fails and they retry from the login page
- **THEN** the originally requested page is still preserved for the successful attempt
