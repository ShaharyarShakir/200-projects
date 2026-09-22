import time
from typing import Any, Dict, List, Optional, Union

from app.core.errors import SandboxContainerError, SandboxExecutionError, SandboxTimeoutError
from app.services.sandbox.base import CommandResult, Sandbox, SandboxConfig
from app.services.sandbox.client import PodmanClient, demux_docker_stream


class PodmanSandbox(Sandbox):
    """Isolated execution sandbox backed by host Podman containers."""

    def __init__(
        self,
        config: Optional[SandboxConfig] = None,
        client: Optional[PodmanClient] = None,
    ) -> None:
        super().__init__(config=config)
        self._client = client or PodmanClient()
        self._container_id: Optional[str] = None
        self._is_running: bool = False

    @property
    def container_id(self) -> Optional[str]:
        return self._container_id

    @property
    def is_running(self) -> bool:
        return self._is_running

    async def start(self) -> None:
        """Provision and start the sandbox container."""
        if self._is_running and self._container_id:
            return

        network_mode = "none" if self.config.network_disabled else "bridge"
        self._container_id = await self._client.create_container(
            image=self.config.image,
            cmd=["tail", "-f", "/dev/null"],
            working_dir=self.config.workspace_dir,
            memory=self.config.memory_limit,
            network_mode=network_mode,
            env=self.config.env_vars,
        )

        await self._client.start_container(self._container_id)
        self._is_running = True

        # Ensure /workspace directory exists
        try:
            exec_id = await self._client.create_exec(
                container_id=self._container_id,
                cmd=["mkdir", "-p", self.config.workspace_dir],
            )
            await self._client.start_exec(exec_id, timeout=10.0)
        except Exception:
            # If creating directory fails, continue as it might already exist from image
            pass

    async def stop(self) -> None:
        """Stop the running sandbox container."""
        if self._container_id and self._is_running:
            await self._client.stop_container(self._container_id)
            self._is_running = False

    async def cleanup(self) -> None:
        """Forcefully remove the sandbox container."""
        if self._container_id:
            try:
                await self._client.remove_container(self._container_id, force=True)
            finally:
                self._container_id = None
                self._is_running = False

    async def execute(
        self,
        command: Union[str, List[str]],
        timeout: Optional[int] = None,
        workdir: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> CommandResult:
        """Execute a command inside the sandbox and return structured results."""
        if not self._is_running or not self._container_id:
            await self.start()

        if not self._container_id:
            raise SandboxContainerError(message="Cannot execute command without an active container.")

        if isinstance(command, str):
            cmd_list = ["sh", "-c", command]
        else:
            cmd_list = list(command)

        target_workdir = workdir or self.config.workspace_dir
        merged_env = {**self.config.env_vars, **(env or {})}
        cmd_timeout = timeout if timeout is not None else self.config.timeout_seconds

        start_time = time.monotonic()
        try:
            exec_id = await self._client.create_exec(
                container_id=self._container_id,
                cmd=cmd_list,
                working_dir=target_workdir,
                env=merged_env,
            )

            raw_output = await self._client.start_exec(exec_id, timeout=float(cmd_timeout))
            duration = max(0.0, time.monotonic() - start_time)

            inspect_data = await self._client.inspect_exec(exec_id)
            exit_code = inspect_data.get("ExitCode", 0)
            if exit_code is None:
                exit_code = 0

            stdout, stderr = demux_docker_stream(raw_output)
            return CommandResult(
                exit_code=exit_code,
                stdout=stdout,
                stderr=stderr,
                duration_seconds=duration,
                timed_out=False,
            )

        except SandboxTimeoutError:
            duration = max(0.0, time.monotonic() - start_time)
            return CommandResult(
                exit_code=124,
                stdout="",
                stderr=f"Command timed out after {cmd_timeout} seconds",
                duration_seconds=duration,
                timed_out=True,
            )
        except SandboxExecutionError:
            raise
        except Exception as e:
            duration = max(0.0, time.monotonic() - start_time)
            raise SandboxExecutionError(
                message=f"Command execution failed: {str(e)}",
                container_id=self._container_id,
                command=cmd_list,
            ) from e
