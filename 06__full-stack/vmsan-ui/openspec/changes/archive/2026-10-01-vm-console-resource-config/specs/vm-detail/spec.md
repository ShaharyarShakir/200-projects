# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
