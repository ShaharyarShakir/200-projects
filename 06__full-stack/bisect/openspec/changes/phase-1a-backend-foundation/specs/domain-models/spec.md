# Spec Delta: domain-models

## Purpose

Defines the relational data schemas and database migration structure for core entities representing users, repositories, agentic repair runs, and chronological run steps in Bisect.

## ADDED Requirements

### Requirement: User Entity Schema
The system SHALL persist user profiles with unique GitHub identification, GitHub username, encrypted access token storage placeholder, and creation/update timestamps.

#### Scenario: User creation with valid fields
- **WHEN** a user record is inserted with GitHub user ID `12345` and username `octocat`
- **THEN** the system generates a unique UUID primary key, stores the attributes, and sets the creation timestamp

#### Scenario: Duplicate GitHub ID rejected
- **WHEN** an attempt is made to insert a user with a GitHub user ID that already exists
- **THEN** the database enforces uniqueness and rejects the duplicate record

### Requirement: Repository Entity Schema
The system SHALL persist connected Git repositories with GitHub repository ID, full name, owner foreign key, default branch name, clone URL, and timestamp tracking.

#### Scenario: Repository registration linked to User
- **WHEN** a repository is inserted with reference to an existing User primary key
- **THEN** the system creates the repository record linked to the owner user with foreign key constraints

### Requirement: Run Entity Schema and State Tracking
The system SHALL persist test repair jobs (Runs) associated with a repository, tracking its current lifecycle state, targeted branch, base commit SHA, generated pull request URL, retry counts, error summaries, and execution timestamps.

#### Scenario: Run created in initial pending state
- **WHEN** a new repair run is instantiated for a repository
- **THEN** the system sets its status to `PENDING`, initializes retry count to 0, sets max retries (default 3), and records start timestamps

#### Scenario: Run status transition tracking
- **WHEN** a run progresses through lifecycle stages (`CLONING`, `RUNNING_TESTS`, `ANALYZING`, `PATCHING`, `APPLYING`, `CREATING_PR`, `COMPLETED`, `FAILED`)
- **THEN** the status field updates accordingly and terminal states (`COMPLETED`, `FAILED`) capture completion timestamps

### Requirement: RunStep Entity Schema
The system SHALL record discrete, chronological steps belonging to a Run, including step name/type, status, execution duration, stdout/stderr output logs, patch diffs, and token usage metrics.

#### Scenario: Step recorded for a run
- **WHEN** a run executes an operation (e.g. `RUN_TESTS` or `GENERATE_PATCH`)
- **THEN** a `RunStep` entry is inserted with a foreign key referencing the parent `Run`, recording status, step sequence number, execution duration, and text output

### Requirement: Automated Database Migrations
The system SHALL maintain version-controlled schema migrations using Alembic configured to reflect SQLModel definitions.

#### Scenario: Migration version generation
- **WHEN** schema definitions in SQLModel models are updated
- **THEN** Alembic detects schema differences and applies forward migrations cleanly to PostgreSQL
