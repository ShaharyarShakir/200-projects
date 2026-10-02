# Spec Delta

## MODIFIED Requirements

### Requirement: MicroVM Resource Details and Null-Safe Formatting
The dashboard SHALL display the resource parameters (vCPUs, memory in MiB, allocated storage in GB, runtime name, age) for each microVM and safely format missing, null, or undefined values without displaying literal "null", "undefined", or "NaN".

#### Scenario: Displaying complete VM resource attributes
- **WHEN** a microVM has defined values for `vcpus`, `memoryMiB`, `diskSizeGb`, `runtime`, and `age`
- **THEN** the card renders the vCPU count, memory value with "MiB" suffix, storage allocation with "GB" suffix (e.g. "10 GB"), runtime name, and age string

#### Scenario: Handling null or missing resource fields
- **WHEN** any resource attribute (`vcpus`, `memoryMiB`, `diskSizeGb`, `runtime`, `age`) is `null`, `undefined`, or missing
- **THEN** the dashboard renders an em dash (`—`) placeholder in place of that value

### Requirement: Create VM Action and Dialog Trigger
The dashboard SHALL provide a prominent, accessible "+ Create VM" action in the header that opens a modal configuration dialog for creating new Firecracker microVMs with configurable resources including Runtime, CPU, Memory, Storage, Network Policy, and Timeout.

#### Scenario: Opening the Create VM dialog
- **WHEN** the user clicks the "+ Create VM" button in the dashboard header
- **THEN** a modal dialog opens with fields for Runtime, vCPUs, Memory (MiB), Storage (GB), Network Policy, and Timeout
- **AND** the form fields are initialized with default values (`runtime: "base"`, `vcpus: 1`, `memoryMiB: 128`, `diskSizeGb: 10`, `networkPolicy: "deny-all"`, `timeoutMs: 3600000`)

#### Scenario: Accessible dialog trigger presentation
- **WHEN** the dashboard renders
- **THEN** the "+ Create VM" button is clearly positioned in the dashboard header alongside the Refresh button with accessible labels

### Requirement: Create VM Form Configuration and Client-Side Validation
The Create VM dialog SHALL provide form inputs for Runtime, vCPUs, Memory, and Storage with client-side validation preventing invalid API requests.

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
- **WHEN** all fields have valid values (e.g. runtime `base`, vcpus `1`, memory `128`, storage `10`)
- **THEN** no validation error messages are displayed and the Create VM submit action is enabled

### Requirement: MicroVM Card Detail Navigation Action
The dashboard microVM cards SHALL provide direct navigation to the VM Management Console at `/vms/[id]` via clickable VM identifiers and a prominent "Open Console" action, without interfering with lifecycle action buttons.

#### Scenario: Navigating to VM detail via card identifier
- **WHEN** the user clicks on the VM identifier or "Open Console" button on a microVM card
- **THEN** the browser navigates to `/vms/:id` for that microVM

#### Scenario: Lifecycle actions do not trigger detail navigation
- **WHEN** the user clicks a lifecycle action button (Start, Stop, Delete) on a microVM card
- **THEN** the lifecycle action is executed without triggering navigation to the console or detail page
