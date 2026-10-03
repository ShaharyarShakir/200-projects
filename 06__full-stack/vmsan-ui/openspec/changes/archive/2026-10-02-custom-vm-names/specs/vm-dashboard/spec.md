# Spec Delta

## MODIFIED Requirements

### Requirement: VM Inventory Overview and Count
The dashboard SHALL display the current inventory of Firecracker microVMs rendering the custom name as the primary identifier and the technical `vmsanId` as a secondary detail, along with an accurate total count derived from the `/api/vms` endpoint.

#### Scenario: Displaying multiple microVMs
- **WHEN** the dashboard successfully fetches the VM list containing one or more microVMs
- **THEN** it renders each microVM as a distinct card with its custom name as the primary title and `vmsanId` as a secondary detail (e.g. `VM ID: vm-a83f19c2`)
- **AND** displays the operational status and resource configuration
- **AND** displays the total count accurately (e.g. "1 VM" or "3 VMs")

### Requirement: Create VM Action and Dialog Trigger
The dashboard SHALL provide a prominent, accessible "+ Create VM" action in the header that opens a modal configuration dialog for creating new Firecracker microVMs with configurable resources and custom names including Name, Runtime, CPU, Memory, Storage, Network Policy, and Timeout.

#### Scenario: Opening the Create VM dialog
- **WHEN** the user clicks the "+ Create VM" button in the dashboard header
- **THEN** a modal dialog opens with fields for Name, Runtime, vCPUs, Memory (MiB), Storage (GB), Network Policy, and Timeout
- **AND** the form fields are initialized with default values (`name: ""`, `runtime: "base"`, `vcpus: 1`, `memoryMiB: 128`, `diskSizeGb: 10`, `networkPolicy: "deny-all"`, `timeoutMs: 3600000`)

#### Scenario: Accessible dialog trigger presentation
- **WHEN** the dashboard renders
- **THEN** the "+ Create VM" button is clearly positioned in the dashboard header alongside the Refresh button with accessible labels

### Requirement: Create VM Form Configuration and Client-Side Validation
The Create VM dialog SHALL provide form inputs for Name, Runtime, vCPUs, Memory, and Storage with client-side validation and immediate feedback preventing invalid API requests.

#### Scenario: Validating Name input
- **WHEN** the user enters an invalid name (e.g. empty, containing spaces, illegal symbols, or starting with the reserved prefix `vm-`)
- **THEN** the dialog displays an inline validation error indicating the naming rules
- **AND** submission is prevented

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

#### Scenario: Validating Storage input
- **WHEN** the user enters a storage allocation that is not an integer between 1 and 20 GB (e.g. `0`, `-1`, `21`, or non-numeric)
- **THEN** the dialog displays an inline validation error indicating Storage must be an integer between 1 and 20 GB
- **AND** submission is prevented

#### Scenario: Valid form input state
- **WHEN** all fields have valid values (e.g. name `node-dev`, runtime `base`, vcpus `1`, memory `128`, storage `10`)
- **THEN** no validation error messages are displayed and the Create VM submit action is enabled

### Requirement: VM Creation Submission, Loading State, and Inventory Refresh
The Create VM dialog SHALL handle asynchronous submission via `POST /api/vms` including custom name, prevent concurrent submissions, handle errors (including duplicate name conflicts) without closing or exposing server internals, and synchronize the dashboard inventory upon success.

#### Scenario: Successful microVM creation workflow
- **WHEN** the user submits valid configuration with a custom name and `POST /api/vms` succeeds
- **THEN** the dialog automatically closes
- **AND** the dashboard refreshes the microVM inventory via `GET /api/vms`
- **AND** the newly created microVM appears in the dashboard inventory list showing its custom name

#### Scenario: Preventing duplicate submissions during creation
- **WHEN** VM creation is in progress
- **THEN** the Create VM submit button is disabled and displays a loading state (e.g. "Creating...")
- **AND** the Cancel button is disabled to prevent inconsistent state
- **AND** repeated clicks do not trigger duplicate network requests

#### Scenario: Handling creation errors safely
- **WHEN** `POST /api/vms` fails with an HTTP error status (such as 409 `VM_NAME_ALREADY_EXISTS` or network error)
- **THEN** the dialog remains open
- **AND** the user's entered form values are preserved
- **AND** a user-safe error message is displayed without exposing server stack traces, filesystem paths, or command internals

#### Scenario: Dialog reset on successful creation
- **WHEN** the dialog is closed after a successful VM creation and subsequently reopened
- **THEN** form inputs are reset to their default initial values (`name: ""`, `runtime: "base"`, `vcpus: 1`, `memoryMiB: 128`)
