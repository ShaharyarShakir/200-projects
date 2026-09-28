# Spec Delta

## Purpose

Provides a web-based dashboard interface for viewing, monitoring, and refreshing Firecracker microVM inventory, resource allocations, and operational statuses.

## ADDED Requirements

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
