import time
import uuid
from typing import List, Optional

from app.core.config import settings
from app.core.errors import ActionParseError, ActionValidationError
from app.core.logging import log_agent_event, logger
from app.schemas.actions import (
    ActionErrorResult,
    ActionResult,
    AgentAction,
    CommandActionResult,
    FinishAction,
    FinishActionResult,
    InspectFileActionResult,
    LoopConfig,
    LoopResult,
    LoopStatus,
    LoopStep,
    RunCommandAction,
)
from app.schemas.agent import ChatMessage, CompletionRequest
from app.schemas.session import AgentSession, SessionStatus
from app.services.agent.base import AgentProvider
from app.services.agent.dispatcher import ActionDispatcher
from app.services.agent.parser import ActionParser
from app.services.agent.validator import ActionValidator
from app.services.sandbox.base import Sandbox

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

3. Complete the task:
```json
{
  "action": "finish",
  "message": "All failing tests have been resolved and verified.",
  "success": true
}
```

RULES:
- Always output a valid JSON object matching one of the three actions above.
- Do not attempt actions outside the supported set.
- All file paths are relative to /workspace.
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
            "- finish: {\"action\": \"finish\", \"message\": \"...\", \"success\": true}"
        )

    async def run(
        self,
        task_prompt: str,
        system_prompt: Optional[str] = None,
        execution_id: Optional[str] = None,
        session: Optional[AgentSession] = None,
    ) -> LoopResult:
        """Execute the bounded iterative agent loop until finish, limits reached, or failure."""
        session_obj = session or AgentSession(
            id=execution_id or f"sess_{uuid.uuid4().hex[:12]}",
            task_prompt=task_prompt,
        )
        if session_obj.status == SessionStatus.CREATED:
            session_obj.start()

        exec_id = session_obj.id
        start_time = time.monotonic()
        sys_prompt = system_prompt or self._config.system_prompt or DEFAULT_SYSTEM_PROMPT

        log_agent_event(
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
                    log_agent_event(
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

                log_agent_event(
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

                    log_agent_event(
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
                    steps.append(step)
                    session_obj.record_step(step)

                    log_agent_event(
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
                    steps.append(step)
                    session_obj.record_step(step)

                    log_agent_event(
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
                    steps.append(step)
                    session_obj.record_step(step)

                    log_agent_event(
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
                        log_agent_event(
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
                    steps.append(step)
                    session_obj.record_step(step)

                    status = LoopStatus.COMPLETED if action.success else LoopStatus.FAILED
                    log_agent_event(
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
                log_agent_event(
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
                steps.append(step)
                session_obj.record_step(step)

                log_agent_event(
                    execution_id=exec_id,
                    event_type="action_executed",
                    details={"iteration": iteration, "result": action_result.model_dump(), "duration_seconds": step_duration},
                )

                # Format result feedback and append to conversation
                feedback = self.format_action_result_feedback(action_result)
                messages.append(ChatMessage(role="user", content=feedback))

            # Reached max iterations limit
            total_duration = max(0.0, time.monotonic() - start_time)
            log_agent_event(
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
            log_agent_event(
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
            if self._auto_cleanup:
                try:
                    await self._sandbox.cleanup()
                    log_agent_event(
                        execution_id=exec_id,
                        event_type="sandbox_cleanup_success",
                    )
                except Exception as cleanup_err:
                    logger.warning(f"Error during sandbox cleanup for execution {exec_id}: {cleanup_err}")
                    log_agent_event(
                        execution_id=exec_id,
                        event_type="sandbox_cleanup_error",
                        details={"error": str(cleanup_err)},
                        level="warning",
                    )

