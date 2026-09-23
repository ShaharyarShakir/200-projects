import time
from typing import List, Optional

from app.core.errors import ActionParseError, ActionValidationError
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
)
from app.schemas.agent import ChatMessage, CompletionRequest
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
    ) -> None:
        self._provider = provider
        self._sandbox = sandbox
        self._dispatcher = dispatcher or ActionDispatcher(sandbox=sandbox)
        self._config = config or LoopConfig()

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
    ) -> LoopResult:
        """Execute the bounded iterative agent loop until finish, limits reached, or failure."""
        start_time = time.monotonic()
        sys_prompt = system_prompt or self._config.system_prompt or DEFAULT_SYSTEM_PROMPT

        messages: List[ChatMessage] = [
            ChatMessage(role="system", content=sys_prompt),
            ChatMessage(role="user", content=task_prompt),
        ]

        steps: List[LoopStep] = []
        consecutive_errors = 0
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
        iteration = 0

        while iteration < self._config.max_iterations:
            iteration += 1
            step_start = time.monotonic()

            try:
                # 1. Request completion from LLM provider
                completion_req = CompletionRequest(messages=messages)
                completion_resp = await self._provider.complete(completion_req)

                prompt_tokens += completion_resp.usage.prompt_tokens
                completion_tokens += completion_resp.usage.completion_tokens
                total_tokens += completion_resp.usage.total_tokens

                raw_content = completion_resp.content
                messages.append(ChatMessage(role="assistant", content=raw_content))

            except Exception as e:
                # Provider-level failure (e.g. rate limit, timeout, auth error)
                total_duration = max(0.0, time.monotonic() - start_time)
                step_duration = max(0.0, time.monotonic() - step_start)
                step = LoopStep(
                    iteration=iteration,
                    raw_response="",
                    error=f"Provider completion failed: {str(e)}",
                    duration_seconds=step_duration,
                )
                steps.append(step)
                return LoopResult(
                    status=LoopStatus.FAILED,
                    total_iterations=iteration,
                    steps=steps,
                    final_message=f"Agent provider failure: {str(e)}",
                    total_duration_seconds=total_duration,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                )

            # 2. Extract and parse action JSON
            try:
                raw_dict = ActionParser.parse_action(raw_content)
            except ActionParseError as e:
                consecutive_errors += 1
                step_duration = max(0.0, time.monotonic() - step_start)
                step = LoopStep(
                    iteration=iteration,
                    raw_response=raw_content,
                    error=str(e.message),
                    duration_seconds=step_duration,
                )
                steps.append(step)

                if consecutive_errors >= self._config.max_consecutive_errors:
                    total_duration = max(0.0, time.monotonic() - start_time)
                    return LoopResult(
                        status=LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED,
                        total_iterations=iteration,
                        steps=steps,
                        final_message=f"Consecutive action errors limit ({self._config.max_consecutive_errors}) exceeded. Last error: {e.message}",
                        total_duration_seconds=total_duration,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
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
                    raw_response=raw_content,
                    action=raw_dict,
                    error=str(e.message),
                    duration_seconds=step_duration,
                )
                steps.append(step)

                if consecutive_errors >= self._config.max_consecutive_errors:
                    total_duration = max(0.0, time.monotonic() - start_time)
                    return LoopResult(
                        status=LoopStatus.CONSECUTIVE_ERRORS_EXCEEDED,
                        total_iterations=iteration,
                        steps=steps,
                        final_message=f"Consecutive action errors limit ({self._config.max_consecutive_errors}) exceeded. Last error: {e.message}",
                        total_duration_seconds=total_duration,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        total_tokens=total_tokens,
                    )

                feedback = self.format_error_feedback(e.message)
                messages.append(ChatMessage(role="user", content=feedback))
                continue

            # Valid action received -> reset consecutive error count
            consecutive_errors = 0

            # 4. Handle finish action
            if isinstance(action, FinishAction):
                action_result = await self._dispatcher.dispatch(action)
                step_duration = max(0.0, time.monotonic() - step_start)
                total_duration = max(0.0, time.monotonic() - start_time)

                step = LoopStep(
                    iteration=iteration,
                    raw_response=raw_content,
                    action=action.model_dump(),
                    result=action_result.model_dump(),
                    duration_seconds=step_duration,
                )
                steps.append(step)

                status = LoopStatus.COMPLETED if action.success else LoopStatus.FAILED
                return LoopResult(
                    status=status,
                    total_iterations=iteration,
                    steps=steps,
                    final_message=action.message or "Task completed by agent.",
                    total_duration_seconds=total_duration,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                )

            # 5. Dispatch command or inspect_file to sandbox
            action_result = await self._dispatcher.dispatch(action)
            step_duration = max(0.0, time.monotonic() - step_start)

            step = LoopStep(
                iteration=iteration,
                raw_response=raw_content,
                action=action.model_dump(),
                result=action_result.model_dump(),
                duration_seconds=step_duration,
            )
            steps.append(step)

            # Format result feedback and append to conversation
            feedback = self.format_action_result_feedback(action_result)
            messages.append(ChatMessage(role="user", content=feedback))

        # Reached max iterations limit
        total_duration = max(0.0, time.monotonic() - start_time)
        return LoopResult(
            status=LoopStatus.MAX_ITERATIONS_REACHED,
            total_iterations=iteration,
            steps=steps,
            final_message=f"Agent loop reached maximum iteration limit of {self._config.max_iterations}.",
            total_duration_seconds=total_duration,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )
