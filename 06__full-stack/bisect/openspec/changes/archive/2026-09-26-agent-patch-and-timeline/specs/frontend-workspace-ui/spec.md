# Spec Delta

## ADDED Requirements

### Requirement: Bisect Timeline and Patch Review Data States

The system SHALL populate the bisect timeline and patch diff panels from the
backend artifacts for the selected session, and SHALL NOT display invented
commit or diff content when no artifact exists. When an artifact is absent the
panel SHALL state that this session recorded none, distinguishing a missing
artifact from one that exists but is empty, and SHALL NOT imply the data is
still on its way.

#### Scenario: Timeline populated from a real run

- **WHEN** the selected session has a recorded bisect timeline
- **THEN** the timeline panel renders each evaluated commit in evaluation order with its verdict, and highlights an identified culprit

#### Scenario: Timeline has no recorded run

- **WHEN** the selected session has no recorded bisect timeline
- **THEN** the timeline panel states that the timeline is not available and renders no commit entries

#### Scenario: Diff populated from a real patch

- **WHEN** the selected session has a recorded patch
- **THEN** the diff panel renders the changed files with their additions and deletions, and supports unified and split views

#### Scenario: Patch contains no changes

- **WHEN** the selected session recorded a patch with no changed files
- **THEN** the diff panel states that there is nothing to review rather than rendering placeholder files

#### Scenario: Commit selected in the timeline

- **WHEN** a user selects a commit in the timeline
- **THEN** the panel displays that commit's message, author, and recorded test output

#### Scenario: Session reopened from a link

- **WHEN** the workspace is opened with a `session_id` the signed-in user owns
- **THEN** that session becomes the selected session and its patch and timeline artifacts load into the panels

#### Scenario: Linked session is not the caller's

- **WHEN** the workspace is opened with a `session_id` that does not exist or belongs to another account
- **THEN** the workspace reports that the session is unavailable and does not present an empty workspace as if it were a new run

#### Scenario: Session id that cannot be a session

- **WHEN** the `session_id` is not a well-formed session identifier
- **THEN** it is ignored without issuing a request, and the workspace opens with no session selected

### Requirement: Cross-Session Activity Aggregation

The system SHALL provide an activity view that aggregates events across the
signed-in user's sessions, and SHALL allow the user to filter that aggregate to
a single session. Aggregated events SHALL be ordered chronologically across
session boundaries, and each event SHALL remain attributable to its session.

#### Scenario: Aggregate across all sessions

- **WHEN** a user opens the activity view without selecting a specific session
- **THEN** the feed shows events from the user's sessions merged in chronological order, each labelled with its session

#### Scenario: Filter the aggregate to one session

- **WHEN** a user selects a single session in the activity view
- **THEN** the feed shows only that session's events in chronological order

#### Scenario: Aggregate with no sessions

- **WHEN** the user has no sessions
- **THEN** the activity view renders an empty state explaining that no activity has been recorded

#### Scenario: Aggregate request fails

- **WHEN** the aggregate request fails
- **THEN** the view renders an error state with a retry control rather than a blank feed
