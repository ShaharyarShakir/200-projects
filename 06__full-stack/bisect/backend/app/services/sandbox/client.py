import struct
from typing import Any, Dict, List, Optional, Tuple, Union
import httpx

from app.core.config import settings
from app.core.errors import (
    SandboxConnectionError,
    SandboxContainerError,
    SandboxError,
    SandboxExecutionError,
    SandboxTimeoutError,
)


def demux_docker_stream(raw_bytes: bytes) -> Tuple[str, str]:
    """Parse Docker/Podman 8-byte multiplexed header stream into (stdout, stderr)."""
    if not raw_bytes:
        return "", ""

    stdout_chunks: List[bytes] = []
    stderr_chunks: List[bytes] = []
    offset = 0
    total = len(raw_bytes)
    is_multiplexed = True

    while offset + 8 <= total:
        stream_type = raw_bytes[offset]
        # Standard multiplex stream types: 0=stdin, 1=stdout, 2=stderr
        if stream_type not in (0, 1, 2):
            is_multiplexed = False
            break

        payload_size = struct.unpack(">I", raw_bytes[offset + 4 : offset + 8])[0]
        offset += 8
        if offset + payload_size > total:
            is_multiplexed = False
            break

        payload = raw_bytes[offset : offset + payload_size]
        offset += payload_size

        if stream_type == 1:
            stdout_chunks.append(payload)
        elif stream_type == 2:
            stderr_chunks.append(payload)

    if not is_multiplexed or (not stdout_chunks and not stderr_chunks and offset < total):
        # If payload was not multiplexed or header check failed, return as stdout
        return raw_bytes.decode("utf-8", errors="replace"), ""

    stdout_str = b"".join(stdout_chunks).decode("utf-8", errors="replace")
    stderr_str = b"".join(stderr_chunks).decode("utf-8", errors="replace")
    return stdout_str, stderr_str


def parse_memory_to_bytes(mem: Union[str, int]) -> int:
    """Convert human-readable memory string (e.g. '512m', '1g') to integer bytes."""
    if isinstance(mem, int):
        return mem
    mem_str = mem.strip().lower()
    if mem_str.endswith("g") or mem_str.endswith("gb"):
        num = float(mem_str.rstrip("gb"))
        return int(num * 1024 * 1024 * 1024)
    elif mem_str.endswith("m") or mem_str.endswith("mb"):
        num = float(mem_str.rstrip("mb"))
        return int(num * 1024 * 1024)
    elif mem_str.endswith("k") or mem_str.endswith("kb"):
        num = float(mem_str.rstrip("kb"))
        return int(num * 1024)
    return int(mem_str)


class PodmanClient:
    """Asynchronous client for interacting with the host Podman REST API over Unix domain socket."""

    def __init__(
        self,
        socket_path: Optional[str] = None,
        base_url: str = "http://d/v1.41",
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self.socket_path = socket_path or settings.PODMAN_SOCKET
        self.base_url = base_url.rstrip("/")
        self._owned_client = client is None

        if client is not None:
            self._client = client
        else:
            transport = httpx.AsyncHTTPTransport(uds=self.socket_path)
            self._client = httpx.AsyncClient(
                transport=transport,
                base_url=self.base_url,
                timeout=httpx.Timeout(30.0, connect=10.0),
            )

    async def ping(self) -> bool:
        """Check if the Podman daemon is reachable and healthy."""
        try:
            response = await self._client.get("/_ping")
            return response.status_code == 200
        except Exception as e:
            raise SandboxConnectionError(
                message=f"Cannot reach host Podman socket at '{self.socket_path}': {str(e)}",
                socket_path=self.socket_path,
            ) from e

    async def get_version(self) -> Dict[str, Any]:
        """Retrieve Podman / Docker API version info."""
        try:
            response = await self._client.get("/version")
            if response.status_code != 200:
                raise SandboxConnectionError(
                    message=f"Failed to get Podman version: status {response.status_code}",
                    socket_path=self.socket_path,
                )
            return response.json()
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxConnectionError(
                message=f"Error connecting to host Podman socket at '{self.socket_path}': {str(e)}",
                socket_path=self.socket_path,
            ) from e

    async def create_container(
        self,
        image: str,
        cmd: Optional[List[str]] = None,
        working_dir: str = "/workspace",
        memory: Optional[Union[str, int]] = None,
        network_mode: str = "none",
        env: Optional[Dict[str, str]] = None,
        name: Optional[str] = None,
    ) -> str:
        """Create a new container and return its container ID."""
        cmd = cmd or ["tail", "-f", "/dev/null"]
        host_config: Dict[str, Any] = {
            "NetworkMode": network_mode,
            "AutoRemove": False,
        }
        if memory is not None:
            host_config["Memory"] = parse_memory_to_bytes(memory)

        env_list = [f"{k}={v}" for k, v in (env or {}).items()]

        payload: Dict[str, Any] = {
            "Image": image,
            "Cmd": cmd,
            "WorkingDir": working_dir,
            "HostConfig": host_config,
            "Env": env_list,
        }

        params = {}
        if name:
            params["name"] = name

        try:
            response = await self._client.post("/containers/create", json=payload, params=params)
            if response.status_code not in (200, 201):
                raise SandboxContainerError(
                    message=f"Failed to create container (status {response.status_code}): {response.text}"
                )
            data = response.json()
            container_id = data.get("Id")
            if not container_id:
                raise SandboxContainerError(message="Container creation succeeded but no Id returned.")
            return container_id
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxContainerError(
                message=f"Error creating sandbox container: {str(e)}"
            ) from e

    async def start_container(self, container_id: str) -> None:
        """Start a created container."""
        try:
            response = await self._client.post(f"/containers/{container_id}/start")
            if response.status_code not in (200, 204, 304):
                raise SandboxContainerError(
                    message=f"Failed to start container {container_id} (status {response.status_code}): {response.text}",
                    container_id=container_id,
                )
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxContainerError(
                message=f"Error starting sandbox container {container_id}: {str(e)}",
                container_id=container_id,
            ) from e

    async def inspect_container(self, container_id: str) -> Dict[str, Any]:
        """Inspect container state and attributes."""
        try:
            response = await self._client.get(f"/containers/{container_id}/json")
            if response.status_code != 200:
                raise SandboxContainerError(
                    message=f"Failed to inspect container {container_id}: status {response.status_code}",
                    container_id=container_id,
                )
            return response.json()
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxContainerError(
                message=f"Error inspecting container {container_id}: {str(e)}",
                container_id=container_id,
            ) from e

    async def stop_container(self, container_id: str, timeout: int = 5) -> None:
        """Stop a running container."""
        try:
            response = await self._client.post(f"/containers/{container_id}/stop", params={"t": timeout})
            if response.status_code not in (200, 204, 304, 404):
                raise SandboxContainerError(
                    message=f"Failed to stop container {container_id} (status {response.status_code}): {response.text}",
                    container_id=container_id,
                )
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxContainerError(
                message=f"Error stopping container {container_id}: {str(e)}",
                container_id=container_id,
            ) from e

    async def remove_container(self, container_id: str, force: bool = True) -> None:
        """Remove a container from the host daemon."""
        try:
            response = await self._client.delete(
                f"/containers/{container_id}",
                params={"force": str(force).lower(), "v": "true"},
            )
            if response.status_code not in (200, 204, 404):
                raise SandboxContainerError(
                    message=f"Failed to remove container {container_id} (status {response.status_code}): {response.text}",
                    container_id=container_id,
                )
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxContainerError(
                message=f"Error removing container {container_id}: {str(e)}",
                container_id=container_id,
            ) from e

    async def create_exec(
        self,
        container_id: str,
        cmd: List[str],
        working_dir: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> str:
        """Create an exec instance for running a command in a container."""
        env_list = [f"{k}={v}" for k, v in (env or {}).items()]
        payload: Dict[str, Any] = {
            "AttachStdout": True,
            "AttachStderr": True,
            "Tty": False,
            "Cmd": cmd,
            "WorkingDir": working_dir,
            "Env": env_list,
        }

        try:
            response = await self._client.post(f"/containers/{container_id}/exec", json=payload)
            if response.status_code not in (200, 201):
                raise SandboxExecutionError(
                    message=f"Failed to create exec instance in container {container_id}: {response.text}",
                    container_id=container_id,
                    command=cmd,
                )
            exec_id = response.json().get("Id")
            if not exec_id:
                raise SandboxExecutionError(
                    message="Exec instance created but no Id returned",
                    container_id=container_id,
                    command=cmd,
                )
            return exec_id
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxExecutionError(
                message=f"Error creating exec in container {container_id}: {str(e)}",
                container_id=container_id,
                command=cmd,
            ) from e

    async def start_exec(self, exec_id: str, timeout: Optional[float] = None) -> bytes:
        """Start the exec instance, wait for stream output, and return raw bytes."""
        payload = {"Detach": False, "Tty": False}
        req_timeout = httpx.Timeout(timeout) if timeout else None

        try:
            response = await self._client.post(
                f"/exec/{exec_id}/start",
                json=payload,
                timeout=req_timeout,
            )
            if response.status_code not in (200, 204):
                raise SandboxExecutionError(
                    message=f"Failed to start exec instance {exec_id} (status {response.status_code}): {response.text}"
                )
            return response.content
        except httpx.TimeoutException as e:
            raise SandboxTimeoutError(
                message=f"Exec instance {exec_id} timed out after {timeout} seconds",
                timeout_seconds=int(timeout) if timeout else None,
            ) from e
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxExecutionError(
                message=f"Error starting exec instance {exec_id}: {str(e)}"
            ) from e

    async def inspect_exec(self, exec_id: str) -> Dict[str, Any]:
        """Inspect the status and exit code of an exec instance."""
        try:
            response = await self._client.get(f"/exec/{exec_id}/json")
            if response.status_code != 200:
                raise SandboxExecutionError(
                    message=f"Failed to inspect exec {exec_id}: status {response.status_code}"
                )
            return response.json()
        except SandboxError:
            raise
        except Exception as e:
            raise SandboxExecutionError(
                message=f"Error inspecting exec {exec_id}: {str(e)}"
            ) from e

    async def close(self) -> None:
        """Close the underlying HTTP client session."""
        if self._owned_client:
            await self._client.aclose()

    async def __aenter__(self) -> "PodmanClient":
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        await self.close()
