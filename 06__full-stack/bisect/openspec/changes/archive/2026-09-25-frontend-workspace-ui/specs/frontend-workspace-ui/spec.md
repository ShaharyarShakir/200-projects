# Spec Delta

## Purpose

Provides a responsive frontend workspace interface and cockpit for Bisect developers to authenticate with GitHub, view workspaces and repositories, monitor agent execution lifecycle states, inspect session metrics, and review chronological activity feeds.

## ADDED Requirements

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
The system SHALL integrate with the existing backend GitHub OAuth endpoints (`/api/v1/auth/github/login`, `/api/v1/auth/github/callback`, `/api/v1/auth/me`). The frontend SHALL maintain the authenticated user profile and token in client state, handle login initiation via redirect, complete callback exchange, and provide an explicit logout action that clears client authentication state.

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
- **THEN** the frontend clears expired credentials and redirects the user to the login prompt

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
The system SHALL provide a centralized, strongly-typed API client module that handles backend communication with `/api/v1/*` routes. The API layer SHALL normalize HTTP and network errors into readable user messages, provide loading state indicators during async operations, provide clear empty states when data is missing, and support periodic polling for active sessions without freezing the interface.

#### Scenario: Backend unavailable or network error
- **WHEN** an API request fails due to network disconnection or backend service unavailability (e.g. 500 or 503)
- **THEN** the frontend catches the error, displays an error notification with retry options, and prevents application crashes

#### Scenario: Polling active session status
- **WHEN** an agent session is in `running` status
- **THEN** the frontend client polls session updates at regular intervals until a terminal status is reached or the user navigates away

#### Scenario: Empty state display
- **WHEN** an authenticated user has no synchronized repositories or active sessions
- **THEN** the workspace renders informative empty states with guidance and action buttons (e.g. "Sync Repositories")

### Requirement: Human Git Ownership Safeguards
The frontend SHALL NOT trigger automated Git mutations (no commits, pushes, branches, or PR merges without explicit human initiation). All display elements reflecting code or workspace modifications SHALL be read-only and explicitly present changes for human review.

#### Scenario: Review workspace changes
- **WHEN** viewing agent modifications or workspace status
- **THEN** all actions and displays remain strictly informational and require explicit user action for any external operations
