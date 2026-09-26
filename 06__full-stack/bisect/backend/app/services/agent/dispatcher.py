import logging
import posixpath
import shlex
from dataclasses import dataclass
from typing import List, Optional

from app.core.errors import (
    SandboxError,
    SandboxExecutionError,
    SandboxTimeoutError,
)
from app.schemas.actions import (
    ActionErrorResult,
    ActionResult,
    AgentAction,
    BisectActionResult,
    BisectCommit,
    CommandActionResult,
    FinishAction,
    FinishActionResult,
    GeneratePatchAction,
    InspectFileAction,
    InspectFileActionResult,
    PatchActionResult,
    RunBisectAction,
    RunCommandAction,
)
from app.services.sandbox.base import Sandbox

logger = logging.getLogger(__name__)

# Record separators used to frame ``git log`` output. Subjects and author names
# are single-line, so a control-character frame parses unambiguously where a
# newline-delimited format would not.
_FIELD_SEP = "\x1f"
_RECORD_SEP = "\x1e"

# A test command can emit a full suite's worth of output. The timeline only
# needs enough to explain a verdict, and the tail carries the failure itself.
MAX_TEST_OUTPUT_CHARS = 2000


@dataclass
class _BisectCandidate:
    """One commit in the search range, with the metadata the timeline renders."""

    sha: str
    short_sha: str = ""
    author: str = ""
    authored_at: str = ""
    message: str = ""


class ActionDispatcher:
    """Dispatches validated agent actions strictly to the isolated sandbox."""

    def __init__(self, sandbox: Sandbox) -> None:
        self._sandbox = sandbox
        # Tracked so teardown only undoes a bisect that actually ran, and so a
        # reset never lazily starts a container purely to run `git bisect reset`.
        self._bisect_active = False
        self._bisect_origin_ref: Optional[str] = None

    @property
    def bisect_active(self) -> bool:
        """True while the workspace is parked at a bisect midpoint."""
        return self._bisect_active

    def _resolve_workdir(self, workdir: Optional[str]) -> str:
        """Resolve an action-relative workdir against the sandbox workspace root.

        The validator has already rejected any workdir that escapes the
        workspace, so joining here cannot walk out of the sandbox.
        """
        if not workdir:
            return self._sandbox.config.workspace_dir
        return posixpath.join(self._sandbox.config.workspace_dir, workdir)

    async def dispatch(self, action: AgentAction) -> ActionResult:
        """Execute a validated AgentAction inside the sandbox and return a structured ActionResult."""
        if isinstance(action, RunCommandAction):
            return await self._dispatch_run_command(action)
        elif isinstance(action, InspectFileAction):
            return await self._dispatch_inspect_file(action)
        elif isinstance(action, GeneratePatchAction):
            return await self._dispatch_generate_patch(action)
        elif isinstance(action, RunBisectAction):
            return await self._dispatch_run_bisect(action)
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

    async def _dispatch_generate_patch(self, action: GeneratePatchAction) -> ActionResult:
        """Collect a unified diff of the sandboxed working tree.

        An unmodified tree is a success carrying an empty diff: the agent asked
        what changed, and "nothing" is the answer. A diff that cannot be
        collected at all -- no git binary, no repository, a broken worktree --
        is a structured failure, so the loop can record it and hand the agent
        feedback instead of aborting the run.
        """
        workdir = self._resolve_workdir(action.workdir)
        # --no-ext-diff keeps an external diff driver in the repo config from
        # hijacking the output; --no-pager keeps a configured pager from
        # swallowing it.
        cmd = "git diff --no-color --no-ext-diff --no-pager"

        try:
            result = await self._sandbox.execute(
                command=cmd,
                timeout=action.timeout_seconds,
                workdir=workdir,
            )
        except SandboxTimeoutError as e:
            return ActionErrorResult(
                error=f"Patch collection timed out: {e.message}",
                details={"workdir": action.workdir},
            )
        except SandboxExecutionError as e:
            return ActionErrorResult(
                error=f"Sandbox execution error collecting patch: {e.message}",
                details={"workdir": action.workdir, "container_id": e.container_id},
            )
        except SandboxError as e:
            return ActionErrorResult(
                error=f"Sandbox failure collecting patch: {e.message}",
                details={"workdir": action.workdir},
            )
        except Exception as e:
            return ActionErrorResult(
                error=f"Unexpected error collecting patch in sandbox: {str(e)}",
                details={"workdir": action.workdir},
            )

        if not result.success:
            return ActionErrorResult(
                error=(
                    f"Failed to collect patch: "
                    f"{result.stderr.strip() or f'git diff exited with code {result.exit_code}'}"
                ),
                details={"exit_code": result.exit_code, "workdir": action.workdir},
            )

        return PatchActionResult(
            diff=result.stdout,
            is_empty=not result.stdout.strip(),
        )

    def _parse_bisect_candidates(self, stdout: str) -> List[_BisectCandidate]:
        """Parse framed ``git log`` output into ordered candidate records."""
        candidates: List[_BisectCandidate] = []
        for record in stdout.split(_RECORD_SEP):
            if not record.strip():
                continue
            parts = record.strip("\n").split(_FIELD_SEP)
            if len(parts) < 5:
                continue
            candidates.append(
                _BisectCandidate(
                    sha=parts[0],
                    short_sha=parts[1],
                    author=parts[2],
                    authored_at=parts[3],
                    # A subject may itself contain a field separator in
                    # pathological history, so rejoin the tail rather than
                    # silently truncating the message.
                    message=_FIELD_SEP.join(parts[4:]),
                )
            )
        return candidates

    @staticmethod
    def _bound_test_output(text: str) -> str:
        """Trim a test command's output to the tail that explains its verdict."""
        cleaned = text.strip()
        if len(cleaned) <= MAX_TEST_OUTPUT_CHARS:
            return cleaned
        return f"... (truncated)\n{cleaned[-MAX_TEST_OUTPUT_CHARS:]}"

    async def _dispatch_run_bisect(self, action: RunBisectAction) -> ActionResult:
        """Search the sandboxed history for the first commit that breaks the test.

        The search is a binary search over ``git log bad ^good`` rather than a
        shell ``git bisect run``: the timeline has to record each commit in the
        order it was actually evaluated, and a commit budget has to stop that
        order partway. Driving git's own bisect would mean parsing its
        human-readable output for both.

        A commit whose test command times out is recorded as bad, matching git
        bisect's own treatment of a non-zero exit, and carries ``timed_out`` so
        the timeline can show that the verdict was not a clean signal.
        """
        workdir = self._resolve_workdir(action.workdir)
        log_format = f"%H{_FIELD_SEP}%h{_FIELD_SEP}%an{_FIELD_SEP}%aI{_FIELD_SEP}%s{_RECORD_SEP}"
        log_cmd = (
            "git log --reverse --no-color "
            f"--format={shlex.quote(log_format)} "
            f"{shlex.quote(action.bad)} ^{shlex.quote(action.good)}"
        )

        try:
            log_result = await self._sandbox.execute(
                command=log_cmd,
                timeout=action.timeout_seconds,
                workdir=workdir,
            )
        except SandboxTimeoutError as e:
            return ActionErrorResult(
                error=f"Cannot enumerate bisect range: {e.message}",
                details={"good": action.good, "bad": action.bad},
            )
        except SandboxError as e:
            return ActionErrorResult(
                error=f"Sandbox failure enumerating bisect range: {e.message}",
                details={"good": action.good, "bad": action.bad},
            )
        except Exception as e:
            return ActionErrorResult(
                error=f"Unexpected error enumerating bisect range: {str(e)}",
                details={"good": action.good, "bad": action.bad},
            )

        if not log_result.success:
            return ActionErrorResult(
                error=(
                    f"Failed to enumerate bisect range "
                    f"{action.good}..{action.bad}: "
                    f"{log_result.stderr.strip() or f'git log exited with code {log_result.exit_code}'}"
                ),
                details={
                    "good": action.good,
                    "bad": action.bad,
                    "exit_code": log_result.exit_code,
                },
            )

        candidates = self._parse_bisect_candidates(log_result.stdout)
        if not candidates:
            # An empty range is not an error: the boundary commits may be equal,
            # or `bad` may already be an ancestor of `good`. The timeline is
            # still returned, with no culprit.
            return BisectActionResult(
                commits=[],
                culprit=None,
                good=action.good,
                bad=action.bad,
            )

        origin_ref = await self._read_current_ref(workdir)
        self._bisect_active = True
        self._bisect_origin_ref = origin_ref

        commits: List[BisectCommit] = []
        culprit_sha: Optional[str] = None
        truncated = False
        low, high = 0, len(candidates) - 1
        reset_completed = False

        try:
            while low <= high:
                if len(commits) >= action.max_commits:
                    truncated = True
                    break

                mid = (low + high) // 2
                candidate = candidates[mid]

                checkout = await self._sandbox.execute(
                    command=f"git checkout --detach --force {shlex.quote(candidate.sha)}",
                    timeout=action.timeout_seconds,
                    workdir=workdir,
                )
                if not checkout.success:
                    return ActionErrorResult(
                        error=(
                            f"Failed to check out candidate {candidate.short_sha or candidate.sha}: "
                            f"{checkout.stderr.strip() or f'git checkout exited with code {checkout.exit_code}'}"
                        ),
                        details={"sha": candidate.sha, "exit_code": checkout.exit_code},
                    )

                test = await self._sandbox.execute(
                    command=action.command,
                    timeout=action.timeout_seconds,
                    workdir=workdir,
                )
                verdict = "good" if test.success else "bad"
                commits.append(
                    BisectCommit(
                        sha=candidate.sha,
                        short_sha=candidate.short_sha,
                        author=candidate.author,
                        authored_at=candidate.authored_at,
                        message=candidate.message,
                        verdict=verdict,
                        exit_code=test.exit_code,
                        test_output=self._bound_test_output(test.stdout or test.stderr),
                        duration_seconds=test.duration_seconds,
                        timed_out=test.timed_out,
                    )
                )

                if verdict == "bad":
                    culprit_sha = candidate.sha
                    high = mid - 1
                else:
                    low = mid + 1
        except SandboxError as e:
            return ActionErrorResult(
                error=f"Sandbox failure during bisect: {e.message}",
                details={"good": action.good, "bad": action.bad, "commits_evaluated": len(commits)},
            )
        except Exception as e:
            return ActionErrorResult(
                error=f"Unexpected error during bisect: {str(e)}",
                details={"good": action.good, "bad": action.bad, "commits_evaluated": len(commits)},
            )
        finally:
            # Unconditional: whether the search finished, ran out of budget, or
            # failed, the workspace must not stay parked at a midpoint.
            reset_completed = await self.reset_bisect_state()
        # A culprit is only proven once the search converges. Stopping at the
        # commit budget leaves the last bad commit probed as a candidate, not a
        # verdict, so reporting it would put a specific commit on screen as the
        # isolated regression when the run never established one.
        if truncated:
            culprit_sha = None

        if culprit_sha is not None:
            for commit in commits:
                if commit.sha == culprit_sha:
                    commit.is_culprit = True

        return BisectActionResult(
            commits=commits,
            culprit=culprit_sha,
            truncated=truncated,
            good=action.good,
            bad=action.bad,
            reset_completed=reset_completed,
        )

    async def _read_current_ref(self, workdir: str) -> Optional[str]:
        """Read the checked-out ref so a bisect can hand the workspace back to it."""
        try:
            result = await self._sandbox.execute(
                command="git rev-parse --abbrev-ref HEAD",
                workdir=workdir,
            )
        except SandboxError:
            return None
        if not result.success:
            return None
        ref = result.stdout.strip()
        return ref or None

    async def reset_bisect_state(self) -> bool:
        """Return the workspace to the ref it held before a bisect started.

        A bisect leaves HEAD detached at whichever midpoint it reached, so
        without this a later action would silently run against that commit
        instead of the branch it asked for. This runs both ``git bisect reset``
        and a checkout of the pre-bisect ref, so it also clears state left by
        anything that drove git's own bisect.

        It never raises and never touches the sandbox unless a bisect actually
        ran: teardown must not fail because there was nothing to undo, and must
        not start a container purely to ask git to decline.
        """
        if not self._bisect_active:
            return False

        ref = self._bisect_origin_ref
        if ref and ref != "HEAD":
            restore = f"git checkout --force {shlex.quote(ref)}"
        else:
            restore = "git checkout --force -"

        self._bisect_active = False
        self._bisect_origin_ref = None

        try:
            result = await self._sandbox.execute(
                # `git bisect reset` is best effort: the search above used
                # checkout directly, so it usually has nothing to reset and
                # exits non-zero. The checkout is last so its status is the one
                # reported back.
                command=f"git bisect reset >/dev/null 2>&1; {restore}",
                workdir=self._sandbox.config.workspace_dir,
            )
            return result.success
        except SandboxError as e:
            logger.warning(f"Failed to reset bisect state in sandbox: {e.message}")
            return False
        except Exception as e:
            logger.warning(f"Unexpected error resetting bisect state: {e}")
            return False

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
