import posixpath
from typing import Any, Dict

from pydantic import ValidationError

from app.core.errors import ActionValidationError
from app.schemas.actions import (
    ActionName,
    AgentAction,
    FinishAction,
    InspectFileAction,
    RunCommandAction,
)


class ActionValidator:
    """Validates parsed action dictionaries against strict schemas and safety constraints."""

    SUPPORTED_ACTIONS = {action.value for action in ActionName}

    @classmethod
    def sanitize_workspace_path(cls, path_str: str) -> str:
        """
        Normalize and validate a file path relative to /workspace.
        Prevents directory traversal escaping the workspace root.
        """
        cleaned = path_str.strip()
        if not cleaned:
            raise ActionValidationError(
                "File path cannot be empty or whitespace.",
                action_name=ActionName.INSPECT_FILE.value,
                field="path",
            )

        # Normalize path separators
        norm = posixpath.normpath(cleaned)

        # If absolute path starts with /workspace, strip the prefix
        if norm.startswith("/workspace"):
            norm = norm[len("/workspace") :].lstrip("/")
            norm = posixpath.normpath(norm) if norm else "."

        # Check for traversal outside workspace
        if norm.startswith("../") or norm == ".." or norm.startswith("/"):
            raise ActionValidationError(
                f"Invalid file path '{path_str}'. Path must remain within /workspace and cannot use directory traversal escaping workspace.",
                action_name=ActionName.INSPECT_FILE.value,
                field="path",
            )

        return norm

    @classmethod
    def validate_action(cls, data: Dict[str, Any]) -> AgentAction:
        """Validate raw dictionary data into a typed AgentAction model."""
        if not isinstance(data, dict):
            raise ActionValidationError("Action payload must be a dictionary.")

        action_name = data.get("action")
        if not action_name:
            raise ActionValidationError(
                f"Missing required 'action' field. Allowed actions: {', '.join(sorted(cls.SUPPORTED_ACTIONS))}"
            )

        if not isinstance(action_name, str) or action_name not in cls.SUPPORTED_ACTIONS:
            raise ActionValidationError(
                f"Unsupported action '{action_name}'. Supported actions: {', '.join(sorted(cls.SUPPORTED_ACTIONS))}",
                action_name=str(action_name),
            )

        try:
            if action_name == ActionName.RUN_COMMAND.value:
                command = data.get("command")
                if not isinstance(command, str) or not command.strip():
                    raise ActionValidationError(
                        "Command must be a non-empty string.",
                        action_name=action_name,
                        field="command",
                    )
                return RunCommandAction(**data)

            elif action_name == ActionName.INSPECT_FILE.value:
                raw_path = data.get("path")
                if not isinstance(raw_path, str) or not raw_path.strip():
                    raise ActionValidationError(
                        "Path must be a non-empty string.",
                        action_name=action_name,
                        field="path",
                    )
                sanitized_path = cls.sanitize_workspace_path(raw_path)
                data_copy = dict(data)
                data_copy["path"] = sanitized_path
                return InspectFileAction(**data_copy)

            elif action_name == ActionName.FINISH.value:
                return FinishAction(**data)

            else:
                raise ActionValidationError(
                    f"Unhandled action type: {action_name}",
                    action_name=action_name,
                )

        except ValidationError as e:
            err_msg = "; ".join([f"{err['loc']}: {err['msg']}" for err in e.errors()])
            raise ActionValidationError(
                f"Action validation failed for '{action_name}': {err_msg}",
                action_name=action_name,
            ) from e
