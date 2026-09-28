# Spec Delta

## ADDED Requirements

### Requirement: Create VM Action and Dialog Trigger
The dashboard SHALL provide a prominent, accessible "+ Create VM" action in the header that opens a modal configuration dialog for creating new Firecracker microVMs.

#### Scenario: Opening the Create VM dialog
- **WHEN** the user clicks the "+ Create VM" button in the dashboard header
- **THEN** a modal dialog opens with fields for Runtime, vCPUs, and Memory (MiB)
- **AND** the form fields are initialized with default values (`runtime: "base"`, `vcpus: 1`, `memoryMiB: 128`)

#### Scenario: Accessible dialog trigger presentation
- **WHEN** the dashboard renders
- **THEN** the "+ Create VM" button is clearly positioned in the dashboard header alongside the Refresh button with accessible labels

### Requirement: Create VM Form Configuration and Client-Side Validation
The Create VM dialog SHALL provide form inputs for Runtime, vCPUs, and Memory with client-side validation and immediate feedback preventing invalid API requests.

#### Scenario: Selecting runtime options
- **WHEN** the user interacts with the Runtime selector
- **THEN** options for `Base` (`base`), `Node.js 22` (`node22`), `Node.js 24` (`node24`), and `Python 3.13` (`python3.13`) are available
- **AND** the selected runtime value matches the API enum without sending UI labels to the server

#### Scenario: Validating vCPU input
- **WHEN** the user enters a vCPU value that is not an integer or is less than 1 (e.g. `0`, `-1`, `1.5`, or non-numeric)
- **THEN** the dialog displays an inline validation error indicating vCPUs must be an integer at least 1
- **AND** submission is prevented

#### Scenario: Validating Memory input
- **WHEN** the user enters a memory value in MiB that is not an integer or is less than 128 (e.g. `0`, `64`, `-128`, `128.5`, or non-numeric)
- **THEN** the dialog displays an inline validation error indicating Memory must be an integer at least 128 MiB
- **AND** submission is prevented

#### Scenario: Valid form input state
- **WHEN** all fields have valid values (e.g. runtime `base`, vcpus `2`, memory `256`)
- **THEN** no validation error messages are displayed and the Create VM submit action is enabled

### Requirement: VM Creation Submission, Loading State, and Inventory Refresh
The Create VM dialog SHALL handle asynchronous submission via `POST /api/vms`, prevent concurrent submissions, handle errors without closing or exposing server internals, and synchronize the dashboard inventory upon success.

#### Scenario: Successful microVM creation workflow
- **WHEN** the user submits valid configuration and `POST /api/vms` succeeds
- **THEN** the dialog automatically closes
- **AND** the dashboard refreshes the microVM inventory via `GET /api/vms`
- **AND** the newly created microVM appears in the dashboard inventory list

#### Scenario: Preventing duplicate submissions during creation
- **WHEN** VM creation is in progress
- **THEN** the Create VM submit button is disabled and displays a loading state (e.g. "Creating...")
- **AND** the Cancel button is disabled to prevent inconsistent state
- **AND** repeated clicks do not trigger duplicate network requests

#### Scenario: Handling creation errors safely
- **WHEN** `POST /api/vms` fails with an HTTP error status or network error
- **THEN** the dialog remains open
- **AND** the user's entered form values are preserved
- **AND** a user-safe error message is displayed without exposing server stack traces, filesystem paths, or command internals

#### Scenario: Dialog reset on successful creation
- **WHEN** the dialog is closed after a successful VM creation and subsequently reopened
- **THEN** form inputs are reset to their default initial values (`runtime: "base"`, `vcpus: 1`, `memoryMiB: 128`)
