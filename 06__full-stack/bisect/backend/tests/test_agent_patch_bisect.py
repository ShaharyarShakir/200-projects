"""Patch and bisect artifacts: the actions that produce them and the events they emit.

The bisect tests drive a sandbox that behaves like a small real repository
rather than scripting individual command strings. That matters because the
dispatcher chooses which commits to evaluate; asserting on canned command
strings would only test that the dispatcher issued the strings it was written
to issue, not that its search actually converges on the culprit.
"""

from typing import Dict, List, NamedTuple, Optional, Tuple

import pytest

from app.schemas.actions import (
    ActionErrorResult,
    ActionName,
    BisectActionResult,
    GeneratePatchAction,
    LoopConfig,
    PatchActionResult,
    RunBisectAction,
)
from app.schemas.agent import CompletionRequest, CompletionResponse, TokenUsage
from app.services.agent.base import AgentProvider
from app.services.agent.dispatcher import ActionDispatcher
from app.services.agent.loop import AgentExecutionLoop
from app.services.agent.validator import ActionValidator
from app.services.sandbox.base import CommandResult, Sandbox, SandboxConfig

RECORD_SEP = "\x1e"
FIELD_SEP = "\x1f"


class Commit(NamedTuple):
    sha: str
    short_sha: str
    author: str
    authored_at: str
    message: str


def make_commits(count: int) -> List[Commit]:
    return [
        Commit(
            sha=f"{i:040x}",
            short_sha=f"{i:07x}",
            author="Dev One",
            authored_at="2026-01-0{}T10:00:00+00:00".format((i % 9) + 1),
            message=f"Change number {i}",
        )
        for i in range(1, count + 1)
    ]


class ScriptedGitSandbox(Sandbox):
    """A sandbox standing in for a small repository with a verdict per commit.

    ``verdicts`` maps a commit sha to whether the test command passes there:
    ``True`` reads as good, ``False`` as bad. The search is free to evaluate
    commits in any order; this is what decides each verdict.
    """

    def __init__(
        self,
        commits: Optional[List[Commit]] = None,
        verdicts: Optional[Dict[str, bool]] = None,
        test_command: str = "pytest -q",
        origin_ref: str = "main",
        diff_stdout: str = "",
        diff_exit_code: int = 0,
        log_exit_code: int = 0,
        log_stderr: str = "",
    ) -> None:
        super().__init__(config=SandboxConfig(workspace_dir="/workspace"))
        self.commits = commits if commits is not None else []
        self.verdicts = verdicts or {}
        self.test_command = test_command
        self.origin_ref = origin_ref
        self.diff_stdout = diff_stdout
        self.diff_exit_code = diff_exit_code
        self.log_exit_code = log_exit_code
        self.log_stderr = log_stderr

        self.commands: List[str] = []
        self.workdirs: List[Optional[str]] = []
        self.checked_out: Optional[str] = None
        self.head_ref = origin_ref
        self.checkout_failures = 0
        self.reset_count = 0

    @property
    def container_id(self) -> Optional[str]:
        return "scripted-container"

    @property
    def is_running(self) -> bool:
        return True

    async def start(self) -> None:
        return None

    async def stop(self) -> None:
        return None

    async def cleanup(self) -> None:
        return None

    def _log_output(self) -> str:
        return "".join(
            FIELD_SEP.join([c.sha, c.short_sha, c.author, c.authored_at, c.message]) + RECORD_SEP
            for c in self.commits
        )

    async def execute(
        self,
        command,
        timeout: Optional[int] = None,
        workdir: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ) -> CommandResult:
        cmd = command if isinstance(command, str) else " ".join(command)
        self.commands.append(cmd)
        self.workdirs.append(workdir)

        if cmd.startswith("git diff"):
            return CommandResult(exit_code=self.diff_exit_code, stdout=self.diff_stdout)

        if cmd.startswith("git log"):
            return CommandResult(
                exit_code=self.log_exit_code,
                stdout=self._log_output(),
                stderr=self.log_stderr,
            )

        if "rev-parse --abbrev-ref" in cmd:
            return CommandResult(exit_code=0, stdout=f"{self.head_ref}\n")

        if "checkout --detach" in cmd:
            if self.checkout_failures > 0:
                self.checkout_failures -= 1
                return CommandResult(exit_code=1, stderr="fatal: pathspec did not match")
            self.checked_out = cmd.rsplit(" ", 1)[-1]
            return CommandResult(exit_code=0)

        # Checked before the plain checkout branch: the reset command contains
        # both, and only this one is a bisect reset.
        if "git bisect reset" in cmd:
            self.reset_count += 1
            return CommandResult(exit_code=0)

        if "checkout --force" in cmd:
            self.head_ref = cmd.rsplit(" ", 1)[-1]
            return CommandResult(exit_code=0)

        if cmd.strip() == self.test_command:
            verdict = self.verdicts.get(self.checked_out or "", True)
            if verdict:
                return CommandResult(exit_code=0, stdout="1 passed", duration_seconds=0.5)
            return CommandResult(exit_code=1, stdout="1 failed", duration_seconds=0.5)

        return CommandResult(exit_code=0, stdout="")


class ScriptedProvider(AgentProvider):
    """Provider replaying a fixed list of raw responses."""

    def __init__(self, responses: List[str]) -> None:
        self.responses = list(responses)
        self.calls = 0

    @property
    def name(self) -> str:
        return "scripted_provider"

    async def complete(self, request: CompletionRequest) -> CompletionResponse:
        raw = self.responses[min(self.calls, len(self.responses) - 1)]
        self.calls += 1
        return CompletionResponse(
            content=raw,
            model="scripted",
            usage=TokenUsage(prompt_tokens=1, completion_tokens=1, total_tokens=2),
        )


# ==============================================================================
# Vocabulary and validation
# ==============================================================================


def test_new_actions_are_in_the_vocabulary():
    assert ActionName.GENERATE_PATCH == "generate_patch"
    assert ActionName.RUN_BISECT == "run_bisect"
    assert ActionValidator.SUPPORTED_ACTIONS >= {"generate_patch", "run_bisect"}


def test_generate_patch_accepts_the_bare_envelope():
    action = ActionValidator.validate_action({"action": "generate_patch"})
    assert isinstance(action, GeneratePatchAction)
    assert action.workdir is None


def test_generate_patch_sanitizes_workdir():
    action = ActionValidator.validate_action(
        {"action": "generate_patch", "workdir": "src/../lib"}
    )
    assert action.workdir == "lib"


def test_generate_patch_rejects_workdir_escaping_the_workspace():
    with pytest.raises(Exception) as excinfo:
        ActionValidator.validate_action({"action": "generate_patch", "workdir": "../../etc"})
    assert excinfo.value.action_name == "generate_patch"
    assert excinfo.value.field == "workdir"


@pytest.mark.parametrize("missing", ["good", "bad", "command"])
def test_run_bisect_requires_a_boundary_on_both_ends(missing):
    payload = {"action": "run_bisect", "good": "v1.0", "bad": "HEAD", "command": "pytest"}
    payload.pop(missing)
    with pytest.raises(Exception) as excinfo:
        ActionValidator.validate_action(payload)
    assert excinfo.value.action_name == "run_bisect"
    assert excinfo.value.field == missing


def test_run_bisect_error_explains_the_boundary_requirement():
    with pytest.raises(Exception) as excinfo:
        ActionValidator.validate_action({"action": "run_bisect", "bad": "HEAD", "command": "x"})
    assert "known-good" in excinfo.value.message


def test_run_bisect_rejects_blank_revisions():
    with pytest.raises(Exception):
        ActionValidator.validate_action(
            {"action": "run_bisect", "good": "   ", "bad": "HEAD", "command": "pytest"}
        )


# ==============================================================================
# Patch collection
# ==============================================================================


@pytest.mark.asyncio
async def test_generate_patch_collects_a_diff():
    sandbox = ScriptedGitSandbox(diff_stdout="diff --git a/a.py b/a.py\n+print(1)\n")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(GeneratePatchAction())

    assert isinstance(result, PatchActionResult)
    assert "print(1)" in result.diff
    assert result.is_empty is False


@pytest.mark.asyncio
async def test_generate_patch_on_an_unmodified_tree_is_an_empty_success():
    """A clean tree answers the agent's question; it is not a failure."""
    sandbox = ScriptedGitSandbox(diff_stdout="", diff_exit_code=0)
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(GeneratePatchAction())

    assert isinstance(result, PatchActionResult)
    assert result.diff == ""
    assert result.is_empty is True


@pytest.mark.asyncio
async def test_generate_patch_ignores_whitespace_only_output():
    sandbox = ScriptedGitSandbox(diff_stdout="\n \n")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(GeneratePatchAction())

    assert isinstance(result, PatchActionResult)
    assert result.is_empty is True


@pytest.mark.asyncio
async def test_generate_patch_fails_structurally_without_a_repository():
    sandbox = ScriptedGitSandbox(diff_exit_code=128, diff_stdout="")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(GeneratePatchAction())

    assert isinstance(result, ActionErrorResult)
    assert "Failed to collect patch" in result.error
    assert result.details["exit_code"] == 128


@pytest.mark.asyncio
async def test_generate_patch_reports_a_missing_git_binary():
    """The default sandbox image ships no git, which must read as a clean failure."""
    sandbox = ScriptedGitSandbox(diff_exit_code=127, diff_stdout="")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(GeneratePatchAction())

    assert isinstance(result, ActionErrorResult)
    assert result.details["exit_code"] == 127


@pytest.mark.asyncio
async def test_generate_patch_targets_the_requested_workdir():
    sandbox = ScriptedGitSandbox(diff_stdout="diff")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    await dispatcher.dispatch(GeneratePatchAction(workdir="svc/api"))

    assert sandbox.commands[0].startswith("git diff")
    assert sandbox.workdirs[0] == "/workspace/svc/api"


@pytest.mark.asyncio
async def test_generate_patch_defaults_to_the_workspace_root():
    sandbox = ScriptedGitSandbox(diff_stdout="diff")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    await dispatcher.dispatch(GeneratePatchAction())

    assert sandbox.workdirs[0] == "/workspace"


# ==============================================================================
# Bisect
# ==============================================================================


def _culprit_case() -> Tuple[ScriptedGitSandbox, RunBisectAction]:
    """Five commits where the third is the first bad one."""
    commits = make_commits(5)
    # Good, good, BAD, bad, bad: commit 3 introduced the regression.
    verdicts = {commits[0].sha: True, commits[1].sha: True, commits[2].sha: False,
                commits[3].sha: False, commits[4].sha: False}
    sandbox = ScriptedGitSandbox(commits=commits, verdicts=verdicts)
    return sandbox, RunBisectAction(good=commits[0].sha, bad=commits[-1].sha, command="pytest -q")


@pytest.mark.asyncio
async def test_run_bisect_isolates_the_culprit():
    sandbox, action = _culprit_case()
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(action)

    assert isinstance(result, BisectActionResult)
    assert result.culprit == make_commits(5)[2].sha
    culprits = [c for c in result.commits if c.is_culprit]
    assert len(culprits) == 1
    assert culprits[0].verdict == "bad"


@pytest.mark.asyncio
async def test_run_bisect_records_metadata_for_the_timeline():
    sandbox, action = _culprit_case()
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(action)

    assert result.commits
    for commit in result.commits:
        assert commit.sha and commit.short_sha
        assert commit.author == "Dev One"
        assert commit.message
        assert commit.verdict in ("good", "bad")


@pytest.mark.asyncio
async def test_run_bisect_records_evaluation_order():
    sandbox, action = _culprit_case()
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(action)

    # The order commits were checked out must match the order recorded.
    checkouts = [c.rsplit(" ", 1)[-1] for c in sandbox.commands if "checkout --detach" in c]
    assert [c.sha for c in result.commits] == checkouts


@pytest.mark.asyncio
async def test_run_bisect_with_no_bad_commit_returns_a_timeline_with_no_culprit():
    """Nothing to find is a normal outcome, not an error."""
    commits = make_commits(4)
    sandbox = ScriptedGitSandbox(commits=commits, verdicts={c.sha: True for c in commits})
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(good=commits[0].sha, bad=commits[-1].sha, command="pytest -q")
    )

    assert isinstance(result, BisectActionResult)
    assert result.culprit is None
    assert result.commits
    assert all(c.is_culprit is False for c in result.commits)


@pytest.mark.asyncio
async def test_run_bisect_stops_at_its_commit_budget():
    commits = make_commits(9)
    # Monotonic history: the last two commits are bad, so a converging search
    # would need more than two evaluations to prove which one broke it.
    sandbox = ScriptedGitSandbox(
        commits=commits, verdicts={c.sha: i >= 7 for i, c in enumerate(commits)}
    )
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(
            good=commits[0].sha, bad=commits[-1].sha, command="pytest -q", max_commits=2
        )
    )

    assert result.truncated is True
    assert len(result.commits) == 2
    # Truncation means nothing was proven, so no commit is put forward as the
    # culprit even though the search probed bad commits.
    assert result.culprit is None
    assert all(c.is_culprit is False for c in result.commits)


@pytest.mark.asyncio
async def test_run_bisect_stays_within_its_budget():
    commits = make_commits(20)
    sandbox = ScriptedGitSandbox(
        commits=commits, verdicts={c.sha: i >= 19 for i, c in enumerate(commits)}
    )
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(
            good=commits[0].sha, bad=commits[-1].sha, command="pytest -q", max_commits=3
        )
    )

    assert len(result.commits) <= 3
    assert result.truncated is True
    assert result.culprit is None


@pytest.mark.asyncio
async def test_run_bisect_resets_the_workspace_afterwards():
    sandbox, action = _culprit_case()
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(action)

    assert sandbox.reset_count == 1
    assert result.reset_completed is True
    assert sandbox.head_ref == "main"
    assert dispatcher.bisect_active is False


@pytest.mark.asyncio
async def test_run_bisect_resets_even_when_a_checkout_fails():
    commits = make_commits(3)
    sandbox = ScriptedGitSandbox(commits=commits, verdicts={c.sha: True for c in commits})
    sandbox.checkout_failures = 99
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(good=commits[0].sha, bad=commits[-1].sha, command="pytest -q")
    )

    assert isinstance(result, ActionErrorResult)
    assert sandbox.reset_count == 1


@pytest.mark.asyncio
async def test_run_bisect_with_an_empty_range_is_not_a_failure():
    sandbox = ScriptedGitSandbox(commits=[], verdicts={})
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(good="v1.0", bad="v1.0", command="pytest -q")
    )

    assert isinstance(result, BisectActionResult)
    assert result.commits == []
    assert result.culprit is None


@pytest.mark.asyncio
async def test_run_bisect_fails_structurally_on_an_unknown_revision():
    sandbox = ScriptedGitSandbox(
        commits=make_commits(2), log_exit_code=128, log_stderr="fatal: bad revision 'nope'"
    )
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(good="v1.0", bad="nope", command="pytest -q")
    )

    assert isinstance(result, ActionErrorResult)
    assert "Failed to enumerate bisect range" in result.error


@pytest.mark.asyncio
async def test_run_bisect_reports_a_missing_git_binary():
    sandbox = ScriptedGitSandbox(commits=[], log_exit_code=127, log_stderr="git: not found")
    dispatcher = ActionDispatcher(sandbox=sandbox)

    result = await dispatcher.dispatch(
        RunBisectAction(good="v1.0", bad="HEAD", command="pytest -q")
    )

    assert isinstance(result, ActionErrorResult)
    assert result.details["exit_code"] == 127


@pytest.mark.asyncio
async def test_run_bisect_bounds_a_noisy_test_command():
    """A full suite's worth of output must not be stored per commit."""

    class NoisySandbox(ScriptedGitSandbox):
        async def execute(self, command, timeout=None, workdir=None, env=None):
            result = await super().execute(command, timeout, workdir, env)
            if isinstance(command, str) and command.strip() == self.test_command:
                return CommandResult(exit_code=1, stdout="x" * 50_000)
            return result

    commits = make_commits(3)
    noisy = NoisySandbox(commits=commits, verdicts={c.sha: True for c in commits})
    result = await ActionDispatcher(sandbox=noisy).dispatch(
        RunBisectAction(good=commits[0].sha, bad=commits[-1].sha, command="pytest -q")
    )

    assert result.commits
    for commit in result.commits:
        assert len(commit.test_output) < 50_000
        assert "truncated" in commit.test_output


# ==============================================================================
# Teardown
# ==============================================================================


@pytest.mark.asyncio
async def test_reset_is_a_no_op_when_no_bisect_ran():
    """Teardown must not start a container just to ask git to decline."""
    sandbox = ScriptedGitSandbox()
    dispatcher = ActionDispatcher(sandbox=sandbox)

    assert await dispatcher.reset_bisect_state() is False
    assert sandbox.commands == []


@pytest.mark.asyncio
async def test_reset_undoes_an_interrupted_bisect():
    sandbox = ScriptedGitSandbox()
    dispatcher = ActionDispatcher(sandbox=sandbox)
    # Stand in for a run that ended while the workspace was at a midpoint.
    dispatcher._bisect_active = True
    dispatcher._bisect_origin_ref = "main"

    assert await dispatcher.reset_bisect_state() is True
    assert sandbox.reset_count == 1
    assert sandbox.head_ref == "main"
    assert dispatcher.bisect_active is False


# ==============================================================================
# Events
# ==============================================================================


@pytest.mark.asyncio
async def test_patch_generation_emits_one_informational_event():
    events: List[Tuple[str, dict, str]] = []
    sandbox = ScriptedGitSandbox(diff_stdout="diff --git a/a b/a\n+x\n")
    loop = AgentExecutionLoop(
        provider=ScriptedProvider(['{"action": "generate_patch"}', '{"action": "finish"}']),
        sandbox=sandbox,
        config=LoopConfig(max_iterations=3),
        event_sink=lambda t, d, l: _record(events, t, d, l),
    )

    await loop.run("do the thing")

    types = [t for t, _, _ in events]
    assert "patch_generated" in types
    patch_events = [d for t, d, _ in events if t == "patch_generated"]
    assert patch_events[0]["diff_bytes"] > 0
    assert patch_events[0]["is_empty"] is False
    # The diff itself stays out of the feed.
    assert not any("diff --git" in str(d) for _, d, _ in events)


@pytest.mark.asyncio
async def test_empty_patch_is_reported_as_empty_rather_than_failed():
    events: List[Tuple[str, dict, str]] = []
    sandbox = ScriptedGitSandbox(diff_stdout="", diff_exit_code=0)
    loop = AgentExecutionLoop(
        provider=ScriptedProvider(['{"action": "generate_patch"}', '{"action": "finish"}']),
        sandbox=sandbox,
        config=LoopConfig(max_iterations=3),
        event_sink=lambda t, d, l: _record(events, t, d, l),
    )

    await loop.run("do the thing")

    assert "patch_generation_failed" not in [t for t, _, _ in events]
    assert [d for t, d, _ in events if t == "patch_generated"][0]["is_empty"] is True


@pytest.mark.asyncio
async def test_failed_patch_records_an_error_event_without_aborting_the_run():
    events: List[Tuple[str, dict, str]] = []
    sandbox = ScriptedGitSandbox(diff_exit_code=127)
    loop = AgentExecutionLoop(
        provider=ScriptedProvider(['{"action": "generate_patch"}', '{"action": "finish"}']),
        sandbox=sandbox,
        config=LoopConfig(max_iterations=3),
        event_sink=lambda t, d, l: _record(events, t, d, l),
    )

    result = await loop.run("do the thing")

    failure = [(t, d, l) for t, d, l in events if t == "patch_generation_failed"]
    assert len(failure) == 1
    assert failure[0][2] == "error"
    # The run continued and finished normally.
    assert result.status.value == "completed"
    assert "loop_completed" in [t for t, _, _ in events]


@pytest.mark.asyncio
async def test_bisect_emits_one_event_per_verdict_plus_a_completion():
    events: List[Tuple[str, dict, str]] = []
    commits = make_commits(5)
    sandbox = ScriptedGitSandbox(
        commits=commits,
        verdicts={commits[0].sha: True, commits[1].sha: True, commits[2].sha: False,
                  commits[3].sha: False, commits[4].sha: False},
    )
    provider = ScriptedProvider(
        [
            '{"action": "run_bisect", "good": "%s", "bad": "%s", "command": "pytest -q"}'
            % (commits[0].sha, commits[-1].sha),
            '{"action": "finish"}',
        ]
    )
    loop = AgentExecutionLoop(
        provider=provider,
        sandbox=sandbox,
        config=LoopConfig(max_iterations=3),
        event_sink=lambda t, d, l: _record(events, t, d, l),
    )

    await loop.run("find the regression")

    verdicts = [d for t, d, _ in events if t == "bisect_verdict"]
    completed = [d for t, d, _ in events if t == "bisect_completed"]
    assert len(completed) == 1
    # One event per evaluation, not per candidate: a binary search tests a
    # subset of the range, and only the tested ones carry a verdict.
    assert len(verdicts) == completed[0]["commits_evaluated"] == 3
    assert [v["evaluation_index"] for v in verdicts] == list(range(len(verdicts)))
    assert any(v["is_culprit"] for v in verdicts)
    assert completed[0]["culprit"] == commits[2].sha


@pytest.mark.asyncio
async def test_failed_bisect_records_an_error_event():
    events: List[Tuple[str, dict, str]] = []
    sandbox = ScriptedGitSandbox(commits=[], log_exit_code=128, log_stderr="fatal: not a git repository")
    provider = ScriptedProvider(
        ['{"action": "run_bisect", "good": "v1", "bad": "v2", "command": "pytest"}',
         '{"action": "finish"}']
    )
    loop = AgentExecutionLoop(
        provider=provider,
        sandbox=sandbox,
        config=LoopConfig(max_iterations=3),
        event_sink=lambda t, d, l: _record(events, t, d, l),
    )

    result = await loop.run("find the regression")

    failure = [(t, d, l) for t, d, l in events if t == "bisect_failed"]
    assert len(failure) == 1
    assert failure[0][2] == "error"
    assert result.status.value == "completed"


async def _record(store: List[Tuple[str, dict, str]], event_type: str, details: dict, level: str):
    store.append((event_type, details, level))
