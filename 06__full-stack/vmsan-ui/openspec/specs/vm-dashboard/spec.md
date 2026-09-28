# VM Dashboard Specification

## Purpose

Provides a web-based dashboard interface for viewing, monitoring, and refreshing Firecracker microVM inventory, resource allocations, and operational statuses.

## Requirements

### Requirement: VM Inventory Overview and Count
The dashboard SHALL display the current inventory of Firecracker microVMs and an accurate total count derived from the `/api/vms` endpoint.

#### Scenario: Displaying multiple microVMs
- **WHEN** the dashboard successfully fetches the VM list containing one or more microVMs
- **THEN** it renders each microVM as a distinct card with its identifier, status, and resource configuration
- **AND** displays the total count accurately (e.g. "1 VM" or "3 VMs")

### Requirement: MicroVM Resource Details and Null-Safe Formatting
The dashboard SHALL display the resource parameters (vCPUs, memory in MiB, runtime name, age) for each microVM and safely format missing, null, or undefined values without displaying literal "null", "undefined", or "NaN".

#### Scenario: Displaying complete VM resource attributes
- **WHEN** a microVM has defined values for `vcpus`, `memoryMiB`, `runtime`, and `age`
- **THEN** the card renders the vCPU count, memory value with "MiB" suffix, runtime name, and age string

#### Scenario: Handling null or missing resource fields
- **WHEN** any resource attribute (`vcpus`, `memoryMiB`, `runtime`, `age`) is `null`, `undefined`, or missing
- **THEN** the dashboard renders an em dash (`—`) placeholder in place of that value

### Requirement: Accessible Operational Status Indicator
The dashboard SHALL provide a visual and accessible status badge for each microVM supporting "running", "stopped", and "unknown" statuses.

#### Scenario: Running status display
- **WHEN** a microVM has status `"running"`
- **THEN** the badge displays "Running" with an appropriate visual indicator (e.g. green indicator) and text label

#### Scenario: Stopped status display
- **WHEN** a microVM has status `"stopped"`
- **THEN** the badge displays "Stopped" with an appropriate neutral or muted visual indicator and text label

#### Scenario: Unknown status display
- **WHEN** a microVM has status `"unknown"` or any unrecognized status
- **THEN** the badge displays "Unknown" with an appropriate fallback visual indicator and text label

### Requirement: Manual Refresh Controls
The dashboard SHALL provide a manual Refresh action that re-queries the `/api/vms` endpoint and disables duplicate in-flight requests.

#### Scenario: Triggering manual refresh
- **WHEN** the user activates the Refresh button
- **THEN** the dashboard requests the latest VM inventory from `/api/vms`
- **AND** updates the displayed VM list and count upon completion
- **AND** keeps the existing VM cards visible during the background refresh

#### Scenario: Preventing concurrent refreshes
- **WHEN** a refresh request is already pending
- **THEN** the Refresh button is disabled or visually indicates in-progress state to prevent duplicate concurrent network requests

### Requirement: Initial Loading State
The dashboard SHALL render accessible placeholder skeleton elements during initial data fetch to prevent layout shift.

#### Scenario: Initial page load
- **WHEN** the dashboard is loaded and the initial `/api/vms` request is pending
- **THEN** skeleton placeholder cards are rendered indicating that content is loading

### Requirement: Empty Inventory State
The dashboard SHALL render an informative empty state when no microVMs exist in the vmsan environment.

#### Scenario: Zero VMs returned
- **WHEN** the API returns an empty list (`[]`) of microVMs
- **THEN** the dashboard displays a clear message stating that no virtual machines currently exist

### Requirement: Error State and Retry Action
The dashboard SHALL display a user-safe error message and a Retry action when the `/api/vms` request fails, without exposing internal server stack traces, filesystem paths, or command execution details.

#### Scenario: API request failure
- **WHEN** the API request to `/api/vms` fails with an HTTP error status or network error
- **THEN** the dashboard renders an error notification with a user-safe error summary and a Retry button

#### Scenario: Retrying from error state
- **WHEN** the user clicks the Retry button on the error state
- **THEN** the dashboard re-initiates the request to `/api/vms` and clears the error state if successful

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
