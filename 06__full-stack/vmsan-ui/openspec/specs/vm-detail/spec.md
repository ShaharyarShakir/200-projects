# VM Detail Specification

## Purpose

Provides a dedicated web interface at `/vms/[id]` for inspecting Firecracker microVM configuration, runtime status, compute resources, network summary, and metadata, with integrated lifecycle controls and robust state handling.

## Requirements

### Requirement: Dedicated MicroVM Detail Page Route and Navigation
The system SHALL provide a dedicated VM management console at `/vms/[id]` featuring a persistent sidebar layout and nested section routes, defaulting to the Overview section at `/vms/[id]`, displaying the configuration and operational state for the identified microVM, providing clear navigation back to the dashboard, and supporting manual data refresh.

#### Scenario: Navigating to and viewing the VM detail page
- **WHEN** a user navigates to `/vms/:id` for an existing microVM
- **THEN** the system requests VM details from `/api/vms/:id` and renders the persistent console sidebar, console header, and Overview section displaying VM identity, resources, network summary, metadata, and lifecycle controls
- **AND** the terminal and file explorer are not embedded directly in the Overview section

#### Scenario: Navigating back to the dashboard
- **WHEN** the user clicks the `← Virtual Machines` back action or uses browser back navigation
- **THEN** the application navigates back to the root dashboard view (`/`)

#### Scenario: Refreshing VM detail data
- **WHEN** the user clicks the Refresh action on the console header
- **THEN** the system re-fetches the latest VM record from `/api/vms/:id` without navigating away and updates the displayed attributes across the active section

### Requirement: MicroVM Overview and Identifier Display
The VM detail console SHALL display a comprehensive overview header containing the microVM identifier, a copy-to-clipboard action with visual feedback, an operational status badge, runtime badge, and lifecycle controls.

#### Scenario: Displaying identifier and copying to clipboard
- **WHEN** the console renders an existing microVM
- **THEN** the full VM ID is prominently displayed alongside a copy button
- **AND** clicking the copy button copies the ID to the clipboard and provides temporary visual confirmation (e.g. "Copied!")

#### Scenario: Operational status badge rendering
- **WHEN** the microVM operational status is inspected
- **THEN** the status badge renders the current status (`running`, `stopped`, `starting`, `stopping`, `creating`, `error`, `unknown`) with distinct styling and accessible labels

### Requirement: MicroVM Resource and Allocation Inspection
The VM detail page SHALL present the microVM's allocated compute and storage resources (vCPUs, memory in MiB, disk size in GB) with null-safe formatting.

#### Scenario: Displaying compute resource allocations
- **WHEN** a microVM has defined resource values (e.g. 2 vCPUs, 512 MiB memory, 10 GB disk)
- **THEN** the resource section displays each allocation with its appropriate unit

#### Scenario: Null-safe formatting of missing resource metrics
- **WHEN** any resource attribute is null, undefined, or missing
- **THEN** the resource section renders a fallback em dash (`—`) placeholder without displaying literal "null" or "undefined"

### Requirement: MicroVM Network Summary Presentation
The VM detail page SHALL display a network summary section detailing the network policy, assigned IP address, and published ports if configured, or a clear fallback indicator if no network is provisioned.

#### Scenario: Displaying provisioned network configuration
- **WHEN** a microVM has assigned network details (e.g. policy `allow-all`, address `172.16.0.2`, ports `[8080]`)
- **THEN** the network card renders the policy name, IP address, and published port list

#### Scenario: Displaying fallback for unassigned network
- **WHEN** a microVM does not have an assigned network address or published ports
- **THEN** the network card indicates that no external network or ports are configured

### Requirement: MicroVM Metadata Presentation
The VM detail page SHALL render metadata attributes including creation timestamp, calculated age, runtime environment family, and system status flags.

#### Scenario: Displaying complete metadata
- **WHEN** a microVM metadata section renders
- **THEN** it displays the creation timestamp formatted in local date/time, human-readable age (e.g. "2 hours ago"), and runtime environment

### Requirement: Detail View Lifecycle Controls and Concurrency Guard
The VM detail page SHALL provide context-aware lifecycle actions (Start, Stop, Delete) matching the VM's operational state, isolate loading states during execution, prevent conflicting concurrent actions, and prompt for confirmation before destructive deletion.

#### Scenario: Starting a stopped microVM from detail view
- **WHEN** the user clicks Start on a stopped microVM
- **THEN** a `POST /api/vms/:id/start` request is dispatched
- **AND** the Start button indicates progress and lifecycle actions are disabled until completion
- **AND** upon success the VM status updates to Running

#### Scenario: Stopping a running microVM from detail view
- **WHEN** the user clicks Stop on a running microVM
- **THEN** a `POST /api/vms/:id/stop` request is dispatched
- **AND** the Stop button indicates progress and lifecycle actions are disabled until completion
- **AND** upon success the VM status updates to Stopped

#### Scenario: Confirming destructive deletion from detail view
- **WHEN** the user clicks Delete on the detail page
- **THEN** an accessible confirmation dialog opens prompting for confirmation
- **AND** confirming the deletion dispatches `DELETE /api/vms/:id`
- **AND** upon successful deletion the user is redirected back to the dashboard (`/`)

#### Scenario: Retaining detail view and showing safe error on lifecycle failure
- **WHEN** a lifecycle action fails on the detail page
- **THEN** the error message is displayed safely without exposing host paths or internal details
- **AND** the current VM detail view remains visible and actionable

### Requirement: Detail Page Loading, Not-Found, and Error States
The VM detail view SHALL render accessible loading skeletons during data retrieval, an informative 404 Not Found recovery view when the VM does not exist, and a safe error recovery state with a Retry action for network or server errors.

#### Scenario: Initial page load skeleton
- **WHEN** the detail page is loading initial VM data from `/api/vms/:id`
- **THEN** skeleton placeholder cards are rendered representing the overview, resources, network, and metadata sections

#### Scenario: Virtual machine not found (404)
- **WHEN** `/api/vms/:id` returns a 404 status code indicating the VM does not exist
- **THEN** the page displays a dedicated "Virtual machine not found" message with an explanation and a "Back to Virtual Machines" navigation button

#### Scenario: Server or network error recovery
- **WHEN** `/api/vms/:id` fails with a 5xx error or network connection error
- **THEN** the page renders a user-safe error alert with a Retry action allowing the user to attempt fetching again without a full page reload

### Requirement: Persistent VM Console Sidebar Navigation
The VM console SHALL provide a persistent navigation sidebar across all sub-views under `/vms/[id]` with links and icons for `Overview` (LayoutDashboard), `Terminal` (Terminal), `Storage` (HardDrive), `Networking` (Network), `Files` (Folder), `Snapshots` (Camera / History), and `Settings` (Settings).

#### Scenario: Persistent sidebar rendering across routes
- **WHEN** an operator navigates between `/vms/[id]`, `/vms/[id]/terminal`, `/vms/[id]/storage`, `/vms/[id]/networking`, `/vms/[id]/files`, `/vms/[id]/snapshots`, and `/vms/[id]/settings`
- **THEN** the sidebar remains mounted and visible without layout shifting
- **AND** the active section link is visually highlighted

#### Scenario: Responsive navigation on smaller viewports
- **WHEN** the VM console is viewed on smaller screens
- **THEN** the sidebar collapses into a responsive navigation menu while keeping all section routes accessible

### Requirement: Dedicated VM Console Sub-Route Section Views
The VM console SHALL provide dedicated route pages for `Storage` (`/vms/[id]/storage`), `Networking` (`/vms/[id]/networking`), `Files` (`/vms/[id]/files`), `Snapshots` (`/vms/[id]/snapshots`), and `Settings` (`/vms/[id]/settings`).

#### Scenario: Viewing the dedicated storage section
- **WHEN** the operator navigates to `/vms/[id]/storage`
- **THEN** the console renders the storage view showing allocated disk size (e.g. 10 GB) and indicates that granular disk usage information is unavailable from the current manager API

#### Scenario: Viewing the dedicated files section
- **WHEN** the operator navigates to `/vms/[id]/files`
- **THEN** the console renders the full-featured filesystem explorer component for the running microVM

#### Scenario: Viewing the dedicated networking section
- **WHEN** the operator navigates to `/vms/[id]/networking`
- **THEN** the console renders the network policy and assigned IP address information

#### Scenario: Viewing the dedicated settings section
- **WHEN** the operator navigates to `/vms/[id]/settings`
- **THEN** the console renders VM configuration metadata without exposing internal or unmanaged daemon flags

### Requirement: Honest Placeholders for Unimplemented Console Sections
The VM console SHALL render clear, honest placeholder indicators for sections whose underlying management capabilities are reserved for future phases.

#### Scenario: Viewing the snapshots placeholder
- **WHEN** the operator navigates to `/vms/[id]/snapshots`
- **THEN** the view displays an informational message stating that snapshot management will be available in a future phase
- **AND** no fake snapshot actions or mocked controls are rendered
