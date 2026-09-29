# Spec Delta: vm-dashboard

## ADDED Requirements

### Requirement: VM Lifecycle Action Visibility and Controls
The dashboard SHALL provide context-sensitive lifecycle action buttons on each microVM card based on its operational status.

#### Scenario: Running microVM actions
- **WHEN** a microVM card has status `"running"`
- **THEN** it displays a **Stop** action button and a **Delete** action button
- **AND** the Start action button is not rendered

#### Scenario: Stopped microVM actions
- **WHEN** a microVM card has status `"stopped"`
- **THEN** it displays a **Start** action button and a **Delete** action button
- **AND** the Stop action button is not rendered

#### Scenario: Unknown status microVM actions
- **WHEN** a microVM card has status `"unknown"`
- **THEN** it displays a **Refresh** action button and a **Delete** action button
- **AND** neither Start nor Stop action buttons are rendered

### Requirement: Destructive VM Deletion Confirmation
The dashboard SHALL require explicit user confirmation via an accessible confirmation dialog before executing a destructive VM deletion request.

#### Scenario: Triggering delete opens confirmation dialog
- **WHEN** the user clicks the Delete action button on a microVM card
- **THEN** an accessible confirmation dialog is displayed with the VM ID and a warning that the action is irreversible
- **AND** no `DELETE` HTTP request is dispatched until confirmed

#### Scenario: Canceling deletion confirmation
- **WHEN** the user dismisses or clicks Cancel in the delete confirmation dialog
- **THEN** the dialog closes
- **AND** no deletion request is sent to the server
- **AND** the VM remains unchanged on the dashboard

#### Scenario: Confirming VM deletion
- **WHEN** the user confirms the deletion inside the confirmation dialog
- **THEN** a `DELETE /api/vms/:id` request is dispatched to the server
- **AND** the confirmation dialog controls indicate loading state (`Deleting...`) and are disabled

### Requirement: Per-VM Action State and Concurrency Guard
The dashboard SHALL isolate action loading states to the specific microVM being mutated and prevent concurrent conflicting operations on that microVM.

#### Scenario: Starting a stopped VM
- **WHEN** the user clicks Start on a stopped microVM
- **THEN** a `POST /api/vms/:id/start` request is dispatched
- **AND** the Start button indicates in-progress state (e.g. "Starting...") and is disabled
- **AND** the Delete button for that VM is disabled
- **AND** other VM cards remain fully interactive

#### Scenario: Stopping a running VM
- **WHEN** the user clicks Stop on a running microVM
- **THEN** a `POST /api/vms/:id/stop` request is dispatched
- **AND** the Stop button indicates in-progress state (e.g. "Stopping...") and is disabled
- **AND** the Delete button for that VM is disabled
- **AND** other VM cards remain fully interactive

#### Scenario: Preventing duplicate requests during in-flight action
- **WHEN** any lifecycle action (`starting`, `stopping`, `deleting`) is in progress for a microVM
- **THEN** repeated clicks or attempts to trigger conflicting lifecycle actions for that microVM are ignored and disabled

### Requirement: Post-Mutation Inventory Synchronization
The dashboard SHALL synchronize its VM inventory from the server via `GET /api/vms` following every successful lifecycle mutation, without fabricating state changes client-side.

#### Scenario: Successful start mutation synchronization
- **WHEN** a `POST /api/vms/:id/start` request completes successfully
- **THEN** the dashboard fetches the latest inventory via `GET /api/vms`
- **AND** updates the card status to Running once confirmed by the server response

#### Scenario: Successful stop mutation synchronization
- **WHEN** a `POST /api/vms/:id/stop` request completes successfully
- **THEN** the dashboard fetches the latest inventory via `GET /api/vms`
- **AND** updates the card status to Stopped once confirmed by the server response

#### Scenario: Successful delete mutation synchronization
- **WHEN** a `DELETE /api/vms/:id` request completes successfully
- **THEN** the dashboard fetches the latest inventory via `GET /api/vms`
- **AND** the deleted VM card is removed from the list when omitted by the server response

### Requirement: Safe Error Handling and Presentation for VM Lifecycle Actions
The dashboard SHALL display a user-safe error message and retain the VM card if a lifecycle action fails, without fabricating VM status or exposing internal server details.

#### Scenario: Action failure presentation
- **WHEN** a lifecycle mutation (`start`, `stop`, or `delete`) fails with a server or network error
- **THEN** the loading state for that VM is cleared
- **AND** the VM card remains visible with its current status and details intact
- **AND** a user-safe error message is presented near the affected VM
- **AND** no internal stack traces, shell commands, or host paths are exposed in the UI

#### Scenario: Retrying a failed lifecycle action
- **WHEN** an action error message is displayed on a VM card and the user retries the action
- **THEN** the dashboard dispatches the lifecycle request again and clears previous error feedback upon success
