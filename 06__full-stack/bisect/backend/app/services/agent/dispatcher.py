import posixpath
import shlex

from app.core.errors import (
    SandboxError,
    SandboxExecutionError,
    SandboxTimeoutError,
)
from app.schemas.actions import (
    ActionErrorResult,
    ActionResult,
    AgentAction,
    CommandActionResult,
    FinishAction,
    FinishActionResult,
    InspectFileAction,
    InspectFileActionResult,
    RunCommandAction,
)
from app.services.sandbox.base import Sandbox


class ActionDispatcher:
    """Dispatches validated agent actions strictly to the isolated sandbox."""

    def __init__(self, sandbox: Sandbox) -> None:
        self._sandbox = sandbox

    async def dispatch(self, action: AgentAction) -> ActionResult:
        """Execute a validated AgentAction inside the sandbox and return a structured ActionResult."""
        if isinstance(action, RunCommandAction):
            return await self._dispatch_run_command(action)
        elif isinstance(action, InspectFileAction):
            return await self._dispatch_inspect_file(action)
        elif isinstance(action, FinishAction):
            return FinishActionResult(
                message=action.message,
                success=action.success,
            )
        else:
            return ActionErrorResult(
                error=f"Unsupported action type for dispatch: {type(action).__name__}",
                details={"action": str(action)},
            )

    async def _dispatch_run_command(self, action: RunCommandAction) -> ActionResult:
        """Execute a shell command in the sandbox."""
        workdir = None
        if action.workdir:
            workdir = posixpath.join(self._sandbox.config.workspace_dir, action.workdir)

        try:
            cmd_result = await self._sandbox.execute(
                command=action.command,
                timeout=action.timeout_seconds,
                workdir=workdir,
            )
            return CommandActionResult(
                command=action.command,
                exit_code=cmd_result.exit_code,
                stdout=cmd_result.stdout,
                stderr=cmd_result.stderr,
                duration_seconds=cmd_result.duration_seconds,
                timed_out=cmd_result.timed_out,
            )
        except SandboxTimeoutError as e:
            return CommandActionResult(
                command=action.command,
                exit_code=124,
                stdout="",
                stderr=f"Command timed out: {e.message}",
                duration_seconds=float(action.timeout_seconds or self._sandbox.config.timeout_seconds),
                timed_out=True,
            )
        except SandboxExecutionError as e:
            return ActionErrorResult(
                error=f"Sandbox execution error: {e.message}",
                details={"command": action.command, "container_id": e.container_id},
            )
        except SandboxError as e:
            return ActionErrorResult(
                error=f"Sandbox failure: {e.message}",
                details={"command": action.command},
            )
        except Exception as e:
            return ActionErrorResult(
                error=f"Unexpected error executing command in sandbox: {str(e)}",
                details={"command": action.command},
            )

    async def _dispatch_inspect_file(self, action: InspectFileAction) -> ActionResult:
        """Inspect/read file content inside the sandbox container."""
        target_path = posixpath.join(self._sandbox.config.workspace_dir, action.path)
        quoted_path = shlex.quote(target_path)

        if action.max_bytes:
            cmd = f'if [ -f {quoted_path} ]; then head -c {action.max_bytes} {quoted_path}; elif [ -d {quoted_path} ]; then exit 43; else exit 44; fi'
        else:
            cmd = f'if [ -f {quoted_path} ]; then cat {quoted_path}; elif [ -d {quoted_path} ]; then exit 43; else exit 44; fi'

        try:
            result = await self._sandbox.execute(command=cmd)

            if result.exit_code == 0:
                raw_bytes = result.stdout.encode("utf-8")
                return InspectFileActionResult(
                    path=action.path,
                    exists=True,
                    content=result.stdout,
                    size_bytes=len(raw_bytes),
                    error=None,
                )
            elif result.exit_code == 43:
                return InspectFileActionResult(
                    path=action.path,
                    exists=True,
                    content=None,
                    error=f"Path '{action.path}' is a directory, not a regular file.",
                )
            elif result.exit_code == 44:
                return InspectFileActionResult(
                    path=action.path,
                    exists=False,
                    content=None,
                    error=f"File not found: '{action.path}'",
                )
            else:
                return InspectFileActionResult(
                    path=action.path,
                    exists=False,
                    content=None,
                    error=result.stderr or f"Failed to inspect file (exit code {result.exit_code})",
                )

        except SandboxTimeoutError as e:
            return ActionErrorResult(
                error=f"File inspection timed out: {e.message}",
                details={"path": action.path},
            )
        except SandboxError as e:
            return ActionErrorResult(
                error=f"Sandbox error inspecting file: {e.message}",
                details={"path": action.path},
            )
        except Exception as e:
            return ActionErrorResult(
                error=f"Unexpected error inspecting file in sandbox: {str(e)}",
                details={"path": action.path},
            )
