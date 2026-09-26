# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
