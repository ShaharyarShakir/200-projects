# Spec Delta

## MODIFIED Requirements

### Requirement: Uniform Error Response and Status Code Mapping
The system SHALL return all API error responses in a uniform JSON schema `{ "error": { "code": string, "message": string } }` mapped to appropriate HTTP status codes without exposing internal system details, raw sudo output, or sensitive host environments.

#### Scenario: Validation error mapping
- **WHEN** a request fails route parameter or request body validation
- **THEN** the endpoint returns HTTP 400 with `{ "error": { "code": "INVALID_REQUEST", "message": "<descriptive message>" } }`

#### Scenario: Not found error mapping
- **WHEN** an operation targets a microVM that does not exist
- **THEN** the endpoint returns HTTP 404 with `{ "error": { "code": "VM_NOT_FOUND", "message": "<descriptive message>" } }`

#### Scenario: Conflict error mapping
- **WHEN** an operation fails due to invalid VM lifecycle state or conflict
- **THEN** the endpoint returns HTTP 409 with `{ "error": { "code": "INVALID_VM_STATE", "message": "<descriptive message>" } }`

#### Scenario: Service unavailable error mapping
- **WHEN** the `vmsan` executable is missing or inaccessible on the host
- **THEN** the endpoint returns HTTP 503 with `{ "error": { "code": "VMSAN_UNAVAILABLE", "message": "<descriptive message>" } }`

#### Scenario: Privilege escalation error mapping
- **WHEN** a privileged command fails because passwordless sudo is not configured or sudo requires a password in non-interactive mode
- **THEN** the endpoint returns HTTP 503 or HTTP 500 with `{ "error": { "code": "VMSAN_UNAVAILABLE", "message": "vmsan requires configured privilege escalation (passwordless sudo)" } }` without exposing raw sudo stderr or terminal prompt text

#### Scenario: Command execution failure error mapping
- **WHEN** a `vmsan` execution fails with an unexpected exit code or generic failure
- **THEN** the endpoint returns HTTP 500 with `{ "error": { "code": "VMSAN_COMMAND_FAILED", "message": "<sanitized error message>" } }`
