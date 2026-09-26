from app.core.errors import (
    ActionError,
    ActionParseError,
    ActionValidationError,
    AgentAuthenticationError,
    AgentConfigurationError,
    AgentProviderError,
    AgentRateLimitError,
    AgentTimeoutError,
    BisectError,
    GitHubAPIError,
    GitHubAuthError,
    GitHubNotFoundError,
    GitHubPermissionError,
    GitHubRateLimitError,
    InvalidStateTransitionError,
    LoopExecutionError,
    NotFoundError,
    OAuthError,
    SandboxConnectionError,
    SandboxContainerError,
    SandboxError,
    SandboxExecutionError,
    SandboxTimeoutError,
)


def test_base_error_status_code() -> None:
    err = BisectError()
    assert err.status_code == 500
    assert err.message == "An internal error occurred"


def test_agent_error_hierarchy() -> None:
    auth_err = AgentAuthenticationError("Invalid API key", provider="groq")
    assert isinstance(auth_err, AgentProviderError)
    assert isinstance(auth_err, BisectError)
    assert auth_err.status_code == 502
    assert auth_err.upstream_status_code == 401
    assert auth_err.provider == "groq"

    rate_err = AgentRateLimitError("Too many requests", retry_after=30, provider="groq")
    assert isinstance(rate_err, AgentProviderError)
    assert rate_err.status_code == 429
    assert rate_err.retry_after == 30

    timeout_err = AgentTimeoutError("Request timed out", provider="groq")
    assert isinstance(timeout_err, AgentProviderError)
    assert timeout_err.status_code == 504
    assert timeout_err.upstream_status_code == 408

    cfg_err = AgentConfigurationError("Missing GROQ_API_KEY", provider="groq")
    assert isinstance(cfg_err, AgentProviderError)
    assert cfg_err.status_code == 500

    generic_err = AgentProviderError("Boom", upstream_status_code=418, provider="groq")
    assert generic_err.status_code == 502
    assert generic_err.upstream_status_code == 418


def test_sandbox_error_hierarchy() -> None:
    conn_err = SandboxConnectionError("Socket not found", socket_path="/run/podman.sock")
    assert isinstance(conn_err, SandboxError)
    assert isinstance(conn_err, BisectError)
    assert conn_err.socket_path == "/run/podman.sock"
    assert conn_err.status_code == 502

    container_err = SandboxContainerError("Failed to create container", container_id="c123")
    assert isinstance(container_err, SandboxError)
    assert container_err.container_id == "c123"
    assert container_err.status_code == 500

    exec_err = SandboxExecutionError("Exec failure", container_id="c123", command=["pytest"])
    assert isinstance(exec_err, SandboxError)
    assert exec_err.command == ["pytest"]
    assert exec_err.status_code == 500

    timeout_err = SandboxTimeoutError("Command exceeded timeout", timeout_seconds=60)
    assert isinstance(timeout_err, SandboxError)
    assert timeout_err.timeout_seconds == 60
    assert timeout_err.status_code == 504


def test_github_error_hierarchy() -> None:
    auth_err = GitHubAuthError()
    assert isinstance(auth_err, GitHubAPIError)
    assert isinstance(auth_err, BisectError)
    assert auth_err.status_code == 401
    assert auth_err.upstream_status_code == 401

    rate_err = GitHubRateLimitError(retry_after=60)
    assert isinstance(rate_err, GitHubAPIError)
    assert rate_err.status_code == 429
    assert rate_err.upstream_status_code == 403
    assert rate_err.retry_after == 60

    perm_err = GitHubPermissionError()
    assert isinstance(perm_err, GitHubAPIError)
    assert perm_err.status_code == 502
    assert perm_err.upstream_status_code == 403

    not_found_err = GitHubNotFoundError()
    assert isinstance(not_found_err, GitHubAPIError)
    assert not_found_err.status_code == 404
    assert not_found_err.upstream_status_code == 404

    generic_err = GitHubAPIError("boom", upstream_status_code=500, response_body={"a": 1})
    assert generic_err.status_code == 502
    assert generic_err.upstream_status_code == 500
    assert generic_err.response_body == {"a": 1}


def test_oauth_and_action_error_hierarchy() -> None:
    oauth_err = OAuthError("bad code")
    assert isinstance(oauth_err, BisectError)
    assert oauth_err.status_code == 400

    action_err = ActionError()
    assert action_err.status_code == 400

    parse_err = ActionParseError(raw_content="not json")
    assert isinstance(parse_err, ActionError)
    assert parse_err.status_code == 400
    assert parse_err.raw_content == "not json"

    validation_err = ActionValidationError(action_name="run_command", field="command")
    assert isinstance(validation_err, ActionError)
    assert validation_err.status_code == 400
    assert validation_err.action_name == "run_command"
    assert validation_err.field == "command"


def test_state_transition_and_loop_errors() -> None:
    transition_err = InvalidStateTransitionError(current_status="created", target_status="completed")
    assert isinstance(transition_err, BisectError)
    assert transition_err.status_code == 409
    assert transition_err.current_status == "created"
    assert transition_err.target_status == "completed"

    loop_err = LoopExecutionError("iteration budget exhausted")
    assert isinstance(loop_err, BisectError)
    assert loop_err.status_code == 500


def test_not_found_error_is_404_and_carries_optional_resource_context() -> None:
    """NotFoundError serves both "absent" and "not yours" and must be 404 for both.

    A 403 would confirm the resource exists, so an unowned record has to be
    reported with this same class.
    """
    bare = NotFoundError()
    assert isinstance(bare, BisectError)
    assert bare.status_code == 404
    assert bare.message == "Resource not found"
    assert bare.resource is None
    assert bare.resource_id is None

    detailed = NotFoundError(
        "Session not found",
        resource="agent_session",
        resource_id="sess_abc123",
    )
    assert detailed.status_code == 404
    assert detailed.message == "Session not found"
    assert detailed.resource == "agent_session"
    assert detailed.resource_id == "sess_abc123"


def test_every_error_class_exposes_an_int_status_code() -> None:
    """Every class in the hierarchy resolves to an integer HTTP status."""
    classes = [
        BisectError,
        GitHubAPIError,
        GitHubAuthError,
        GitHubRateLimitError,
        GitHubPermissionError,
        GitHubNotFoundError,
        OAuthError,
        AgentProviderError,
        AgentAuthenticationError,
        AgentRateLimitError,
        AgentTimeoutError,
        AgentConfigurationError,
        ActionError,
        ActionParseError,
        ActionValidationError,
        InvalidStateTransitionError,
        LoopExecutionError,
        NotFoundError,
        SandboxError,
        SandboxConnectionError,
        SandboxContainerError,
        SandboxExecutionError,
        SandboxTimeoutError,
    ]
    for cls in classes:
        assert issubclass(cls, BisectError), cls
        assert isinstance(cls.status_code, int), cls
        assert 400 <= cls.status_code < 600, cls


def test_client_fault_errors_use_4xx_and_upstream_failures_use_5xx() -> None:
    """4xx is reserved for client-fault conditions; upstream faults are 5xx."""
    for cls in (OAuthError, ActionError, InvalidStateTransitionError):
        assert 400 <= cls.status_code < 500, cls

    # A bad provider credential is an upstream failure, not a client 401:
    # returning 401 would trigger the frontend's logout-on-401 handler.
    assert AgentAuthenticationError.status_code >= 500
    assert GitHubPermissionError.status_code >= 500
