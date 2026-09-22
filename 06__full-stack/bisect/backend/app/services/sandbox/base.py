from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class CommandResult(BaseModel):
    """Structured result returned by sandbox command execution."""

    exit_code: int
    stdout: str = ""
    stderr: str = ""
    duration_seconds: float = 0.0
    timed_out: bool = False

    @property
    def success(self) -> bool:
        """True if the command completed with exit code 0 and did not time out."""
        return self.exit_code == 0 and not self.timed_out


class SandboxConfig(BaseModel):
    """Configuration options for an isolated sandbox container."""

    image: str = "python:3.12-slim"
    workspace_dir: str = "/workspace"
    memory_limit: str = "1g"
    cpu_limit: Optional[float] = None
    network_disabled: bool = True
    timeout_seconds: int = 120
    env_vars: Dict[str, str] = Field(default_factory=dict)


class Sandbox(ABC):
    """Abstract interface defining the lifecycle and execution of sandbox containers."""

    def __init__(self, config: Optional[SandboxConfig] = None) -> None:
        self.config = config or SandboxConfig()

    @property
    @abstractmethod
    def container_id(self) -> Optional[str]:
        """ID of the underlying sandbox container if created."""
        pass

    @property
    @abstractmethod
    def is_running(self) -> bool:
        """Whether the sandbox container is currently running."""
        pass

    @abstractmethod
    async def start(self) -> None:
        """Provision and start the sandbox container."""
        pass

    @abstractmethod
    async def stop(self) -> None:
        """Stop the running sandbox container."""
        pass

    @abstractmethod
    async def cleanup(self) -> None:
        """Force stop and delete the sandbox container."""
        pass

    @abstractmethod
    async def execute(
        self,
        command: Union[str, List[str]],
        timeout: Optional[int] = None,
        workdir: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> CommandResult:
        """Execute a command inside the sandbox and capture results."""
        pass

    async def __aenter__(self) -> "Sandbox":
        await self.start()
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type] = None,
        exc_val: Optional[BaseException] = None,
        exc_tb: Optional[Any] = None,
    ) -> None:
        await self.cleanup()
