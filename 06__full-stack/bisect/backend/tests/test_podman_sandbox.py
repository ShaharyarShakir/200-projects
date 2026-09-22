import struct
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest

from app.core.errors import (
    SandboxConnectionError,
    SandboxContainerError,
    SandboxExecutionError,
    SandboxTimeoutError,
)
from app.services.sandbox import (
    CommandResult,
    PodmanClient,
    PodmanSandbox,
    SandboxConfig,
    demux_docker_stream,
)
from app.services.sandbox.client import parse_memory_to_bytes


def make_docker_stream(stdout_str: str = "", stderr_str: str = "") -> bytes:
    """Helper to build Docker 8-byte multiplexed binary stream."""
    stream = b""
    if stdout_str:
        payload = stdout_str.encode("utf-8")
        header = struct.pack(">BxxxI", 1, len(payload))
        stream += header + payload
    if stderr_str:
        payload = stderr_str.encode("utf-8")
        header = struct.pack(">BxxxI", 2, len(payload))
        stream += header + payload
    return stream


def test_demux_docker_stream() -> None:
    # Empty
    assert demux_docker_stream(b"") == ("", "")

    # Standard stdout and stderr
    raw = make_docker_stream(stdout_str="Hello World\n", stderr_str="Warning: check logs\n")
    out, err = demux_docker_stream(raw)
    assert out == "Hello World\n"
    assert err == "Warning: check logs\n"

    # Non-multiplexed raw fallback
    raw_plain = b"Plain text output without header"
    out_plain, err_plain = demux_docker_stream(raw_plain)
    assert out_plain == "Plain text output without header"
    assert err_plain == ""


def test_parse_memory_to_bytes() -> None:
    assert parse_memory_to_bytes(1024) == 1024
    assert parse_memory_to_bytes("512m") == 512 * 1024 * 1024
    assert parse_memory_to_bytes("1g") == 1024 * 1024 * 1024
    assert parse_memory_to_bytes("64k") == 64 * 1024


def test_command_result_success_property() -> None:
    res_ok = CommandResult(exit_code=0, stdout="done", duration_seconds=1.0, timed_out=False)
    assert res_ok.success is True

    res_fail = CommandResult(exit_code=1, stderr="error", duration_seconds=1.0, timed_out=False)
    assert res_fail.success is False

    res_timeout = CommandResult(exit_code=124, stderr="timeout", duration_seconds=5.0, timed_out=True)
    assert res_timeout.success is False


@pytest.mark.asyncio
async def test_podman_client_ping_success() -> None:
    mock_http = MagicMock()
    mock_http.get = AsyncMock(return_value=httpx.Response(200, text="OK"))

    client = PodmanClient(socket_path="/mock/socket.sock", client=mock_http)
    assert await client.ping() is True


@pytest.mark.asyncio
async def test_podman_client_ping_failure() -> None:
    mock_http = MagicMock()
    mock_http.get = AsyncMock(side_effect=httpx.ConnectError("Socket not found"))

    client = PodmanClient(socket_path="/mock/socket.sock", client=mock_http)
    with pytest.raises(SandboxConnectionError) as exc_info:
        await client.ping()
    assert "/mock/socket.sock" in exc_info.value.socket_path


@pytest.mark.asyncio
async def test_podman_client_create_start_stop_remove() -> None:
    mock_http = MagicMock()
    mock_http.post = AsyncMock()
    mock_http.delete = AsyncMock()
    mock_http.get = AsyncMock()

    # Create response
    mock_http.post.side_effect = [
        httpx.Response(201, json={"Id": "container_12345"}),  # /containers/create
        httpx.Response(204),                                   # /containers/{id}/start
        httpx.Response(204),                                   # /containers/{id}/stop
    ]
    mock_http.delete.return_value = httpx.Response(204)       # /containers/{id}
    mock_http.get.return_value = httpx.Response(200, json={"State": {"Running": True}})

    client = PodmanClient(socket_path="/mock/socket.sock", client=mock_http)

    cid = await client.create_container(image="python:3.12-slim", memory="512m")
    assert cid == "container_12345"

    await client.start_container(cid)
    info = await client.inspect_container(cid)
    assert info["State"]["Running"] is True

    await client.stop_container(cid)
    await client.remove_container(cid)


@pytest.mark.asyncio
async def test_podman_client_exec_flow() -> None:
    mock_http = MagicMock()
    mock_http.post = AsyncMock()
    mock_http.get = AsyncMock()

    raw_stream = make_docker_stream(stdout_str="pytest output: 1 passed\n")

    mock_http.post.side_effect = [
        httpx.Response(201, json={"Id": "exec_abc123"}),      # /containers/{id}/exec
        httpx.Response(200, content=raw_stream),               # /exec/{id}/start
    ]
    mock_http.get.return_value = httpx.Response(200, json={"ExitCode": 0, "Running": False})

    client = PodmanClient(socket_path="/mock/socket.sock", client=mock_http)
    exec_id = await client.create_exec("container_123", cmd=["pytest"])
    assert exec_id == "exec_abc123"

    output_bytes = await client.start_exec(exec_id, timeout=10.0)
    assert output_bytes == raw_stream

    exec_info = await client.inspect_exec(exec_id)
    assert exec_info["ExitCode"] == 0


@pytest.mark.asyncio
async def test_podman_sandbox_lifecycle_and_execution() -> None:
    mock_client = MagicMock()
    mock_client.create_container = AsyncMock(return_value="container_test_99")
    mock_client.start_container = AsyncMock()
    mock_client.stop_container = AsyncMock()
    mock_client.remove_container = AsyncMock()
    mock_client.create_exec = AsyncMock(side_effect=["exec_mkdir", "exec_cmd_1"])
    mock_client.start_exec = AsyncMock(
        side_effect=[
            b"",                                                            # mkdir
            make_docker_stream(stdout_str="pytest passed\n", stderr_str=""), # test command
        ]
    )
    mock_client.inspect_exec = AsyncMock(return_value={"ExitCode": 0, "Running": False})

    config = SandboxConfig(
        image="python:3.12-slim",
        workspace_dir="/workspace",
        memory_limit="1g",
        network_disabled=True,
    )
    sandbox = PodmanSandbox(config=config, client=mock_client)

    async with sandbox:
        assert sandbox.is_running is True
        assert sandbox.container_id == "container_test_99"

        result = await sandbox.execute("pytest")
        assert result.exit_code == 0
        assert result.stdout == "pytest passed\n"
        assert result.stderr == ""
        assert result.timed_out is False
        assert result.success is True

    # After exiting context manager, container should be cleaned up
    assert sandbox.is_running is False
    assert sandbox.container_id is None
    mock_client.remove_container.assert_awaited_once_with("container_test_99", force=True)


@pytest.mark.asyncio
async def test_podman_sandbox_command_failure_exit_code() -> None:
    mock_client = MagicMock()
    mock_client.create_container = AsyncMock(return_value="container_test_failed")
    mock_client.start_container = AsyncMock()
    mock_client.remove_container = AsyncMock()
    mock_client.create_exec = AsyncMock(side_effect=["exec_mkdir", "exec_cmd_fail"])
    mock_client.start_exec = AsyncMock(
        side_effect=[
            b"",
            make_docker_stream(stdout_str="FAILED tests/test_foo.py\n", stderr_str="AssertionError\n"),
        ]
    )
    mock_client.inspect_exec = AsyncMock(return_value={"ExitCode": 1, "Running": False})

    sandbox = PodmanSandbox(client=mock_client)
    await sandbox.start()

    result = await sandbox.execute(["pytest", "tests/"])
    assert result.exit_code == 1
    assert "FAILED" in result.stdout
    assert "AssertionError" in result.stderr
    assert result.timed_out is False
    assert result.success is False

    await sandbox.cleanup()
    mock_client.remove_container.assert_awaited_once_with("container_test_failed", force=True)


@pytest.mark.asyncio
async def test_podman_sandbox_timeout_handling() -> None:
    mock_client = MagicMock()
    mock_client.create_container = AsyncMock(return_value="container_timeout")
    mock_client.start_container = AsyncMock()
    mock_client.remove_container = AsyncMock()
    mock_client.create_exec = AsyncMock(side_effect=["exec_mkdir", "exec_hang"])
    mock_client.start_exec = AsyncMock(
        side_effect=[
            b"",
            SandboxTimeoutError(message="Exec timed out", timeout_seconds=5),
        ]
    )

    sandbox = PodmanSandbox(client=mock_client)
    await sandbox.start()

    result = await sandbox.execute("sleep 100", timeout=5)
    assert result.timed_out is True
    assert result.exit_code == 124
    assert "Command timed out after 5 seconds" in result.stderr
    assert result.success is False

    await sandbox.cleanup()
