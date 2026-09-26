import time
import uuid
from typing import Any, Awaitable, Callable, Dict, List, Optional

from app.core.config import settings
from app.core.errors import ActionParseError, ActionValidationError
from app.core.logging import log_agent_event, logger
from app.schemas.actions import (
    ActionErrorResult,
    ActionResult,
    AgentAction,
    BisectActionResult,
    CommandActionResult,
    FinishAction,
    FinishActionResult,
    GeneratePatchAction,
    InspectFileActionResult,
    LoopConfig,
    LoopResult,
    LoopStatus,
    LoopStep,
    PatchActionResult,
    RunBisectAction,
    RunCommandAction,
)
from app.schemas.agent import ChatMessage, CompletionRequest
from app.schemas.session import AgentSession, SessionStatus
from app.services.agent.base import AgentProvider
from app.services.agent.dispatcher import ActionDispatcher
from app.services.agent.parser import ActionParser
from app.services.agent.validator import ActionValidator
from app.services.sandbox.base import Sandbox

# Called with the live session after every recorded step and after the session
# reaches a terminal status, so a caller can persist progress as it happens
# rather than only at the end.
SessionSink = Callable[[AgentSession], Awaitable[None]]

# Called with every event the loop reports, alongside the log write.
EventSink = Callable[[str, Dict[str, Any], str], Awaitable[None]]

# Called with each artifact-producing result, so the patch and bisect timeline
# a run creates are stored against the session that produced them.
ArtifactSink = Callable[[str, ActionResult], Awaitable[None]]

DEFAULT_SYSTEM_PROMPT = """You are Bisect Agent, an autonomous coding agent operating inside an isolated development sandbox.
Your goal is to inspect code, run tests, diagnose failures, and apply fixes.

You interact with the sandbox strictly by outputting a single JSON action in each response.
Every response MUST contain exactly one valid JSON action object in the following format:

1. Run a shell command in the sandbox:
```json
{
  "action": "run_command",
  "command": "pytest -v",
  "timeout_seconds": 30
}
```

2. Inspect / read a file in the workspace:
```json
{
  "action": "inspect_file",
  "path": "app/main.py",
  "max_bytes": 4096
}
```

3. Generate a unified diff of the changes made so far:
```json
{
  "action": "generate_patch"
}
```

4. Bisect history to find the first commit that broke something:
```json
{
  "action": "run_bisect",
  "good": "v1.2.0",
  "bad": "HEAD",
  "command": "pytest -x -q",
  "max_commits": 8
}
```

5. Complete the task:
```json
{
  "action": "finish",
  "message": "All failing tests have been resolved and verified.",
  "success": true
}
```

RULES:
- Always output a valid JSON object matching one of the five actions above.
- Do not attempt actions outside the supported set.
- All file paths are relative to /workspace.
- 'run_bisect' requires both a known-good and a known-bad revision; never guess them.
- 'generate_patch' on an unmodified tree succeeds and returns an empty diff.
- Use 'finish' once the task is completed or cannot proceed.
"""


class AgentExecutionLoop:
    """Orchestrates the iterative prompt -> LLM -> validation -> sandbox execution feedback loop."""

    def __init__(
        self,
        provider: AgentProvider,
        sandbox: Sandbox,
        dispatcher: Optional[ActionDispatcher] = None,
        config: Optional[LoopConfig] = None,
        auto_cleanup: bool = True,
        session_sink: Optional[SessionSink] = None,
        event_sink: Optional[EventSink] = None,
        artifact_sink: Optional[ArtifactSink] = None,
    ) -> None:
        self._provider = provider
        self._sandbox = sandbox
        self._dispatcher = dispatcher or ActionDispatcher(sandbox=sandbox)
        self._config = config or LoopConfig(
            max_iterations=settings.AGENT_MAX_ITERATIONS,
            max_commands=settings.AGENT_MAX_COMMANDS,
            step_timeout_seconds=settings.AGENT_COMMAND_TIMEOUT_SECONDS,
            max_duration_seconds=settings.AGENT_MAX_DURATION_SECONDS,
            max_consecutive_errors=settings.AGENT_MAX_CONSECUTIVE_ERRORS,
        )
        self._auto_cleanup = auto_cleanup
        # Both sinks default to doing nothing, so a loop run without persistence
        # behaves exactly as it did before they existed.
        self._session_sink = session_sink
        self._event_sink = event_sink
        self._artifact_sink = artifact_sink

    @property
    def provider(self) -> AgentProvider:
        return self._provider

    @property
    def sandbox(self) -> Sandbox:
        return self._sandbox

    @property
    def dispatcher(self) -> ActionDispatcher:
        return self._dispatcher

    @property
    def config(self) -> LoopConfig:
        return self._config

    @property
    def auto_cleanup(self) -> bool:
        return self._auto_cleanup

    @classmethod
    def format_action_result_feedback(cls, result: ActionResult) -> str:
        """Format an ActionResult into conversational feedback for the agent."""
        if isinstance(result, CommandActionResult):
            status_desc = "SUCCESS" if result.is_success else "FAILED"
            feedback = [
                f"[Command Result: {status_desc}]",
                f"Command: {result.command}",
                f"Exit Code: {result.exit_code}",
                f"Duration: {result.duration_seconds:.2f}s",
            ]
            if result.timed_out:
                feedback.append("Status: TIMED OUT")
            if result.stdout:
                feedback.append(f"STDOUT:\n{result.stdout.strip()}")
            if result.stderr:
                feedback.append(f"STDERR:\n{result.stderr.strip()}")
            return "\n".join(feedback)

        elif isinstance(result, InspectFileActionResult):
            if result.exists and result.content is not None:
                return f"[File Content: {result.path}]\n{result.content}"
            else:
                return f"[File Inspection Failed: {result.path}]\nError: {result.error or 'Unable to inspect file'}"

        elif isinstance(result, PatchActionResult):
            if result.is_empty:
                return "[Patch: EMPTY]\nThe working tree has no modifications, so there is nothing to review."
            return f"[Patch: {len(result.diff)} bytes]\n{result.diff}"

        elif isinstance(result, BisectActionResult):
            lines = [f"[Bisect Result: {result.good}..{result.bad}]"]
            if result.commits:
                for commit in result.commits:
                    marker = "CULPRIT" if commit.is_culprit else commit.verdict.upper()
                    lines.append(f"{marker} {commit.short_sha or commit.sha}: {commit.message}")
            else:
                lines.append("No commits were evaluated; the range held nothing to test.")
            if result.culprit:
                lines.append(f"First bad commit: {result.culprit}")
            elif result.truncated:
                lines.append("Stopped at the commit budget before isolating a culprit.")
            else:
                lines.append("No first bad commit was isolated.")
            return "\n".join(lines)

        elif isinstance(result, FinishActionResult):
            return f"[Task Finished]\nMessage: {result.message}\nSuccess: {result.success}"

        elif isinstance(result, ActionErrorResult):
            return f"[Action Execution Error]\nError: {result.error}"

        return f"[Action Result]\n{str(result)}"

    @classmethod
    def format_error_feedback(cls, error_msg: str) -> str:
        """Format parse/validation errors to guide the agent toward self-correction."""
        return (
            f"[Action Error]\n{error_msg}\n\n"
            "Please respond with a valid JSON action matching one of the supported schemas:\n"
            "- run_command: {\"action\": \"run_command\", \"command\": \"...\"}\n"
            "- inspect_file: {\"action\": \"inspect_file\", \"path\": \"...\"}\n"
            "- generate_patch: {\"action\": \"generate_patch\"}\n"
            "- run_bisect: {\"action\": \"run_bisect\", \"good\": \"...\", \"bad\": \"...\","
            " \"command\": \"...\", \"max_commits\": 8}\n"
            "- finish: {\"action\": \"finish\", \"message\": \"...\", \"success\": true}"
        )

    @staticmethod
    def _action_result_payload(result: ActionResult) -> Dict[str, Any]:
        """Summarise a result for the generic ``action_executed`` event.

        A patch is the one result that can be arbitrarily large. The diff is
        stored against the session and kept in the recorded step, so copying it
        into an event row would duplicate an unbounded blob that every poll of
        the feed then reads back. The event reports its size instead.
        """
        if isinstance(result, PatchActionResult):
            return {
                "action_type": result.action_type,
                "is_empty": result.is_empty,
                "diff_bytes": len(result.diff),
            }
        return result.model_dump()

    async def _emit_artifact_events(
        self,
        execution_id: str,
        iteration: int,
        action: AgentAction,
        result: ActionResult,
    ) -> None:
        """Surface patch and bisect outcomes in the durable feed.

        The generic ``action_executed`` event already carries the whole result,
        so these events exist to make the two reviewable artifacts legible in
        the activity timeline: one entry per bisect verdict, and a distinct
        error entry when an artifact could not be produced. A failed artifact
        records the problem and lets the run continue, exactly as every other
        recoverable action failure in this loop does.

        The diff itself is deliberately not echoed here. It is stored against
        the session, and duplicating an unbounded blob into the event feed on
        every read would be the wrong place to spend response size.
        """
        if isinstance(result, PatchActionResult):
            await self._emit(
                execution_id=execution_id,
                event_type="patch_generated",
                details={
                    "iteration": iteration,
                    "is_empty": result.is_empty,
                    "diff_bytes": len(result.diff),
                },
            )

        elif isinstance(result, BisectActionResult):
            for evaluation_index, commit in enumerate(result.commits):
                await self._emit(
                    execution_id=execution_id,
                    event_type="bisect_verdict",
                    details={
                        "iteration": iteration,
                        "evaluation_index": evaluation_index,
                        "sha": commit.sha,
                        "short_sha": commit.short_sha,
                        "message": commit.message,
                        "verdict": commit.verdict,
                        "is_culprit": commit.is_culprit,
                        "exit_code": commit.exit_code,
                        "timed_out": commit.timed_out,
                        "duration_seconds": commit.duration_seconds,
                    },
                )
            await self._emit(
                execution_id=execution_id,
                event_type="bisect_completed",
                details={
                    "iteration": iteration,
                    "commits_evaluated": len(result.commits),
                    "culprit": result.culprit,
                    "truncated": result.truncated,
                    "reset_completed": result.reset_completed,
                },
            )

        elif isinstance(result, ActionErrorResult):
            if isinstance(action, GeneratePatchAction):
                event_type = "patch_generation_failed"
            elif isinstance(action, RunBisectAction):
                event_type = "bisect_failed"
            else:
                return
            await self._emit(
                execution_id=execution_id,
                event_type=event_type,
                details={"iteration": iteration, "error": result.error},
                level="error",
            )

    async def _emit(
        self,
        execution_id: str,
        event_type: str,
        details: Optional[Dict[str, Any]] = None,
        level: str = "info",
    ) -> None:
        """Report one event to the log and, when wired, to the durable feed.

        Every event the loop produces goes through here, so the persisted feed
        and the log can never disagree about what happened. A failing sink is
        logged and swallowed: losing the ability to record progress must not
        abort an agent run that is otherwise succeeding.
        """
        payload = details or {}
        log_agent_event(
            execution_id=execution_id,
            event_type=event_type,
            details=payload,
            level=level,
        )
        if self._event_sink is None:
            return
        try:
            await self._event_sink(event_type, payload, level)
        except Exception as sink_err:
            logger.warning(
                f"Event sink failed for {event_type} on {execution_id}: {sink_err}"
            )

    async def _notify_session(self, session_obj: Optional[AgentSession]) -> None:
        """Hand the live session to the persistence sink, if one is wired.

        A failing sink is logged and swallowed for the same reason as in
        ``_emit``: the sink observes the loop, it does not drive it.
        """
        if self._session_sink is None or session_obj is None:
            return
        try:
            await self._session_sink(session_obj)
        except Exception as sink_err:
            logger.warning(
                f"Session sink failed for {session_obj.id}: {sink_err}"
            )

    async def _notify_artifact(self, session_id: str, result: ActionResult) -> None:
        """Hand a produced artifact to the persistence sink, if one is wired.

        Filtered to the two artifact results so an unrelated result cannot be
        persisted by a future caller, and swallowed on failure for the same
        reason as ``_emit``: failing to store a reviewable artifact must not
        abort a run that is otherwise succeeding.
        """
        if self._artifact_sink is None:
            return
        if not isinstance(result, (PatchActionResult, BisectActionResult)):
            return
        try:
            await self._artifact_sink(session_id, result)
        except Exception as sink_err:
            logger.warning(f"Artifact sink failed for {session_id}: {sink_err}")

    async def _record_step(
        self,
        session_obj: AgentSession,
        step: LoopStep,
        steps: List[LoopStep],
    ) -> None:
        """Append a step to both the local list and the session, then notify.

        Notifying here rather than only at the end is what lets a reader watch a
        session accumulate steps while it is still running.
        """
        steps.append(step)
        session_obj.record_step(step)
        await self._notify_session(session_obj)

    async def run(
        self,
        task_prompt: str,
        system_prompt: Optional[str] = None,
        execution_id: Optional[str] = None,
        session: Optional[AgentSession] = None,
    ) -> LoopResult:
        """Execute the bounded iterative agent loop until finish, limits reached, or failure.

        The loop body lives in ``_run_loop`` so that the final session state is
        persisted in one place. Every exit from the body leaves the session in a
        terminal status, so a single notification after it covers all of them
        without touching any of the body's return paths.
        """
        result = await self._run_loop(
            task_prompt,
            system_prompt=system_prompt,
            execution_id=execution_id,
            session=session,
        )
        await self._notify_session(getattr(result, "session", None))
        return result

    async def _run_loop(
        self,
        task_prompt: str,
        system_prompt: Optional[str] = None,
        execution_id: Optional[str] = None,
        session: Optional[AgentSession] = None,
    ) -> LoopResult:
        """The loop body. See ``run``, which owns the terminal-state notification."""
        session_obj = session or AgentSession(
            id=execution_id or f"sess_{uuid.uuid4().hex[:12]}",
            task_prompt=task_prompt,
        )
        if session_obj.status == SessionStatus.CREATED:
            session_obj.start()

        exec_id = session_obj.id
        start_time = time.monotonic()
        sys_prompt = system_prompt or self._config.system_prompt or DEFAULT_SYSTEM_PROMPT

        await self._emit(
            execution_id=exec_id,
            event_type="loop_started",
            details={
                "task_prompt": task_prompt,
                "max_iterations": self._config.max_iterations,
                "max_commands": self._config.max_commands,
                "max_duration_seconds": self._config.max_duration_seconds,
            },
        )

        messages: List[ChatMessage] = [
            ChatMessage(role="system", content=sys_prompt),
            ChatMessage(role="user", content=task_prompt),
        ]

        steps: List[LoopStep] = []
        consecutive_errors = 0
        commands_executed = 0
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
        iteration = 0

        try:
            while iteration < self._config.max_iterations:
                # Check overall duration timeout before starting next iteration
                elapsed_seconds = time.monotonic() - start_time
                if elapsed_seconds >= self._config.max_duration_seconds:
                    await self._emit(
                        execution_id=exec_id,
                        event_type="loop_timeout",
                        details={"elapsed_seconds": elapsed_seconds, "max_duration_seconds": self._config.max_duration_seconds},
                        level="warning",
                    )
                    timeout_msg = f"Agent loop exceeded maximum overall duration of {self._config.max_duration_seconds}s."
                    session_obj.time_out(reason=timeout_msg)
                    return LoopResult(
                        status=LoopStatus.TIMEOUT,
                        total_iterations=iteration,
                        execution_id=exec_id,
                        steps=steps,
                        final_message=timeout_msg,
                        total_duration_seconds=max(0.0, elapsed_seconds),
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                        session=session_obj,
                    )

                iteration += 1
                step_start = time.monotonic()

                await self._emit(
                    execution_id=exec_id,
                    event_type="iteration_started",
                    details={"iteration": iteration, "commands_executed": commands_executed},
                )

                try:
                    # 1. Request completion from LLM provider
                    completion_req = CompletionRequest(messages=messages)
                    completion_resp = await self._provider.complete(completion_req)

                    prompt_tokens += completion_resp.usage.prompt_tokens
                    completion_tokens += completion_resp.usage.completion_tokens
                    total_tokens += completion_resp.usage.total_tokens
                    session_obj.add_tokens(
                        prompt=completion_resp.usage.prompt_tokens,
                        completion=completion_resp.usage.completion_tokens,
                        total=completion_resp.usage.total_tokens,
                    )

                    raw_content = completion_resp.content
                    messages.append(ChatMessage(role="assistant", content=raw_content))

                    await self._emit(
                        execution_id=exec_id,
                        event_type="llm_completion_received",
                        details={
                            "iteration": iteration,
                            "prompt_tokens": completion_resp.usage.prompt_tokens,
                            "completion_tokens": completion_resp.usage.completion_tokens,
                        },
                    )

                except Exception as e:
                    # Provider-level failure (e.g. rate limit, timeout, auth error)
                    total_duration = max(0.0, time.monotonic() - start_time)
                    step_duration = max(0.0, time.monotonic() - step_start)
                    error_msg = f"Provider completion failed: {str(e)}"
                    step = LoopStep(
                        iteration=iteration,
                        execution_id=exec_id,
                        raw_response="",
                        error=error_msg,
                        duration_seconds=step_duration,
                    )
                    await self._record_step(session_obj, step, steps)

                    await self._emit(
                        execution_id=exec_id,
                        event_type="provider_failure",
                        details={"iteration": iteration, "error": str(e)},
                        level="error",
                    )

                    fail_reason = f"Agent provider failure: {str(e)}"
                    session_obj.fail(reason=fail_reason)
                    return LoopResult(
                        status=LoopStatus.FAILED,
                        total_iterations=iteration,
                        execution_id=exec_id,
                        steps=steps,
                        final_message=fail_reason,
                        total_duration_seconds=total_duration,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                        session=session_obj,
                    )

                # 2. Extract and parse action JSON
                try:
                    raw_dict = ActionParser.parse_action(raw_content)
                except ActionParseError as e:
                    consecutive_errors += 1
                    step_duration = max(0.0, time.monotonic() - step_start)
                    step = LoopStep(
                        iteration=iteration,
                        execution_id=exec_id,
                        raw_response=raw_content,
                        error=str(e.message),
                        duration_seconds=step_duration,
                    )
                    await self._record_step(session_obj, step, steps)

                    await self._emit(
                        execution_id=exec_id,
                        event_type="action_parse_error",
                        details={"iteration": iteration, "error": e.message, "consecutive_errors": consecutive_errors},
                        level="warning",
                    )

                    if consecutive_errors >= self._config.max_consecutive_errors:
                        total_duration = max(0.0, time.monotonic() - start_time)
                        term_msg = f"Consecutive action errors limit ({self._config.max_consecutive_errors}) exceeded. Last error: {e.message}"
                        session_obj.terminate(reason=term_msg)
                        return LoopResult(
                            status=LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED,
                            total_iterations=iteration,
                            execution_id=exec_id,
                            steps=steps,
                            final_message=term_msg,
                            total_duration_seconds=total_duration,
                            prompt_tokens=prompt_tokens,
                            completion_tokens=completion_tokens,
                            total_tokens=total_tokens,
                            session=session_obj,
                        )

                    feedback = self.format_error_feedback(e.message)
                    messages.append(ChatMessage(role="user", content=feedback))
                    continue

                # 3. Validate action against schema and safety guardrails
                try:
                    action: AgentAction = ActionValidator.validate_action(raw_dict)
                except ActionValidationError as e:
                    consecutive_errors += 1
                    step_duration = max(0.0, time.monotonic() - step_start)
                    step = LoopStep(
                        iteration=iteration,
                        execution_id=exec_id,
                        raw_response=raw_content,
                        action=raw_dict,
                        error=str(e.message),
                        duration_seconds=step_duration,
                    )
                    await self._record_step(session_obj, step, steps)

                    await self._emit(
                        execution_id=exec_id,
                        event_type="action_validation_error",
                        details={"iteration": iteration, "error": e.message, "consecutive_errors": consecutive_errors},
                        level="warning",
                    )

                    if consecutive_errors >= self._config.max_consecutive_errors:
                        total_duration = max(0.0, time.monotonic() - start_time)
                        term_msg = f"Consecutive action errors limit ({self._config.max_consecutive_errors}) exceeded. Last error: {e.message}"
                        session_obj.terminate(reason=term_msg)
                        return LoopResult(
                            status=LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED,
                            total_iterations=iteration,
                            execution_id=exec_id,
                            steps=steps,
                            final_message=term_msg,
                            total_duration_seconds=total_duration,
                            prompt_tokens=prompt_tokens,
                            completion_tokens=completion_tokens,
                            total_tokens=total_tokens,
                            session=session_obj,
                        )

                    feedback = self.format_error_feedback(e.message)
                    messages.append(ChatMessage(role="user", content=feedback))
                    continue

                # Valid action received -> reset consecutive error count
                consecutive_errors = 0

                # Check max commands limit before executing run_command
                if isinstance(action, RunCommandAction):
                    if commands_executed >= self._config.max_commands:
                        total_duration = max(0.0, time.monotonic() - start_time)
                        await self._emit(
                            execution_id=exec_id,
                            event_type="max_commands_exceeded",
                            details={"commands_executed": commands_executed, "max_commands": self._config.max_commands},
                            level="warning",
                        )
                        term_msg = f"Agent loop reached maximum command execution limit of {self._config.max_commands}."
                        session_obj.terminate(reason=term_msg)
                        return LoopResult(
                            status=LoopStatus.MAX_COMMANDS_EXCEEDED,
                            total_iterations=iteration,
                            execution_id=exec_id,
                            steps=steps,
                            final_message=term_msg,
                            total_duration_seconds=total_duration,
                            prompt_tokens=prompt_tokens,
                            completion_tokens=completion_tokens,
                            total_tokens=total_tokens,
                            session=session_obj,
                        )
                    commands_executed += 1

                # 4. Handle finish action
                if isinstance(action, FinishAction):
                    action_result = await self._dispatcher.dispatch(action)
                    step_duration = max(0.0, time.monotonic() - step_start)
                    total_duration = max(0.0, time.monotonic() - start_time)

                    step = LoopStep(
                        iteration=iteration,
                        execution_id=exec_id,
                        raw_response=raw_content,
                        action=action.model_dump(),
                        result=action_result.model_dump(),
                        duration_seconds=step_duration,
                    )
                    await self._record_step(session_obj, step, steps)

                    status = LoopStatus.COMPLETED if action.success else LoopStatus.FAILED
                    await self._emit(
                        execution_id=exec_id,
                        event_type="loop_completed",
                        details={"status": status.value, "success": action.success, "message": action.message},
                    )

                    finish_msg = action.message or ("Task completed by agent." if action.success else "Task reported failed by agent.")
                    if action.success:
                        session_obj.complete(reason=finish_msg)
                    else:
                        session_obj.fail(reason=finish_msg)

                    return LoopResult(
                        status=status,
                        total_iterations=iteration,
                        execution_id=exec_id,
                        steps=steps,
                        final_message=finish_msg,
                        total_duration_seconds=total_duration,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                        session=session_obj,
                    )

                # 5. Dispatch command or inspect_file to sandbox
                await self._emit(
                    execution_id=exec_id,
                    event_type="action_dispatched",
                    details={"iteration": iteration, "action": action.model_dump()},
                )

                action_result = await self._dispatcher.dispatch(action)
                step_duration = max(0.0, time.monotonic() - step_start)

                step = LoopStep(
                    iteration=iteration,
                    execution_id=exec_id,
                    raw_response=raw_content,
                    action=action.model_dump(),
                    result=action_result.model_dump(),
                    duration_seconds=step_duration,
                )
                await self._record_step(session_obj, step, steps)

                await self._emit(
                    execution_id=exec_id,
                    event_type="action_executed",
                    details={
                        "iteration": iteration,
                        "result": self._action_result_payload(action_result),
                        "duration_seconds": step_duration,
                    },
                )

                await self._emit_artifact_events(exec_id, iteration, action, action_result)

                await self._notify_artifact(exec_id, action_result)

                # Format result feedback and append to conversation
                feedback = self.format_action_result_feedback(action_result)
                messages.append(ChatMessage(role="user", content=feedback))

            # Reached max iterations limit
            total_duration = max(0.0, time.monotonic() - start_time)
            await self._emit(
                execution_id=exec_id,
                event_type="max_iterations_reached",
                details={"max_iterations": self._config.max_iterations, "total_iterations": iteration},
                level="warning",
            )
            term_msg = f"Agent loop reached maximum iteration limit of {self._config.max_iterations}."
            session_obj.terminate(reason=term_msg)
            return LoopResult(
                status=LoopStatus.MAX_ITERATIONS_REACHED,
                total_iterations=iteration,
                execution_id=exec_id,
                steps=steps,
                final_message=term_msg,
                total_duration_seconds=total_duration,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                session=session_obj,
            )

        except Exception as e:
            total_duration = max(0.0, time.monotonic() - start_time)
            await self._emit(
                execution_id=exec_id,
                event_type="unhandled_loop_exception",
                details={"error": str(e), "total_duration_seconds": total_duration},
                level="error",
            )
            err_msg = f"Agent loop failed with unhandled exception: {str(e)}"
            if not session_obj.is_terminal:
                session_obj.fail(reason=err_msg)
            return LoopResult(
                status=LoopStatus.FAILED,
                total_iterations=iteration,
                execution_id=exec_id,
                steps=steps,
                final_message=err_msg,
                total_duration_seconds=total_duration,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                session=session_obj,
            )

        finally:
            # Undo any bisect before the sandbox is torn down. A run that stopped
            # on a limit or an exception can leave the workspace detached at a
            # midpoint, and teardown is the one path guaranteed to run.
            try:
                await self._dispatcher.reset_bisect_state()
            except Exception as bisect_err:
                logger.warning(
                    f"Error resetting bisect state for execution {exec_id}: {bisect_err}"
                )

            if self._auto_cleanup:
                try:
                    await self._sandbox.cleanup()
                    await self._emit(
                        execution_id=exec_id,
                        event_type="sandbox_cleanup_success",
                    )
                except Exception as cleanup_err:
                    logger.warning(f"Error during sandbox cleanup for execution {exec_id}: {cleanup_err}")
                    await self._emit(
                        execution_id=exec_id,
                        event_type="sandbox_cleanup_error",
                        details={"error": str(cleanup_err)},
                        level="warning",
                    )

