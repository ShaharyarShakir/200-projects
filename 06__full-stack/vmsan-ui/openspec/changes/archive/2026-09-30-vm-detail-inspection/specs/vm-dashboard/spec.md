# Spec Delta

## ADDED Requirements

### Requirement: MicroVM Card Detail Navigation Action
The dashboard microVM cards SHALL provide direct navigation links to the VM detail inspection page at `/vms/[id]` via clickable VM identifiers and dedicated detail navigation actions, without interfering with lifecycle action buttons.

#### Scenario: Navigating to VM detail via card identifier
- **WHEN** the user clicks on the VM identifier or "View Details" link on a microVM card
- **THEN** the browser navigates to `/vms/:id` for that microVM

#### Scenario: Lifecycle actions do not trigger detail navigation
- **WHEN** the user clicks a lifecycle action button (Start, Stop, Delete) on a microVM card
- **THEN** the lifecycle action is executed without triggering navigation to the detail page
