# Spec Delta

## Purpose

Defines standard interfaces and implementations for invoking LLM inference providers, normalizing request and response payloads, configuring credentials, and unifying provider error handling across the application.

## ADDED Requirements

### Requirement: Normalized Agent Provider Interface and Contracts
The system SHALL provide an abstract `AgentProvider` interface that accepts standardized message sequences (system, user, assistant) and generation parameters (model, temperature, max_tokens) and returns a normalized completion response containing the generated text, model identifier, and token usage metadata (prompt_tokens, completion_tokens, total_tokens).

#### Scenario: Successful message completion
- **WHEN** a completion request with system and user messages is submitted to the agent provider
- **THEN** the system returns a normalized completion response containing the generated text content and token usage statistics

#### Scenario: Custom generation parameters
- **WHEN** a completion request specifies temperature and max_tokens parameters
- **THEN** the agent provider applies those parameters to the inference generation request

### Requirement: Groq Provider Implementation and Configuration
The system SHALL provide a concrete `GroqProvider` that interfaces with the Groq API using configured application settings (`GROQ_API_KEY`, `GROQ_MODEL`). If `GROQ_API_KEY` is not provided or empty, the system SHALL reject initialization or execution with a configuration error.

#### Scenario: Valid Groq provider execution
- **WHEN** a completion request is sent to the Groq provider with a valid API key and model configured
- **THEN** the provider sends the request to the Groq API and returns a normalized completion response

#### Scenario: Missing Groq API key
- **WHEN** the Groq provider is initialized or invoked without `GROQ_API_KEY` configured in the environment
- **THEN** the system raises a configuration error indicating the missing API key

### Requirement: Normalized Agent Provider Error Handling
The system SHALL catch provider-specific exceptions and map them to domain-specific error types (`AgentAuthenticationError`, `AgentRateLimitError`, `AgentProviderError`, `AgentTimeoutError`). The system SHALL NEVER include secret API keys in exception messages or logs.

#### Scenario: Authentication error normalization
- **WHEN** the Groq API returns an HTTP 401 Unauthorized response due to invalid credentials
- **THEN** the system raises an `AgentAuthenticationError` without exposing the secret API key

#### Scenario: Rate limit error normalization
- **WHEN** the Groq API returns an HTTP 429 Too Many Requests response
- **THEN** the system raises an `AgentRateLimitError`

#### Scenario: Network or upstream service outage
- **WHEN** the Groq API is unreachable, encounters a network timeout, or returns a 5xx server error
- **THEN** the system raises an `AgentProviderError` detailing the upstream failure
