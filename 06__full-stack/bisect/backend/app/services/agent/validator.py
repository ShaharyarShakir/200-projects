import posixpath
from typing import Any, Dict

from pydantic import ValidationError

from app.core.errors import ActionValidationError
from app.schemas.actions import (
    ActionName,
    AgentAction,
    FinishAction,
    GeneratePatchAction,
    InspectFileAction,
    RunBisectAction,
    RunCommandAction,
)


class ActionValidator:
    """Validates parsed action dictionaries against strict schemas and safety constraints."""

    SUPPORTED_ACTIONS = {action.value for action in ActionName}

    @classmethod
    def sanitize_workspace_path(
        cls,
        path_str: str,
        action_name: str = ActionName.INSPECT_FILE.value,
        field: str = "path",
    ) -> str:
        """
        Normalize and validate a file path relative to /workspace.
        Prevents directory traversal escaping the workspace root.

        ``action_name`` and ``field`` are reported on failure so a rejected
        value is attributed to the action and input that actually carried it.
        """
        cleaned = path_str.strip()
        if not cleaned:
            raise ActionValidationError(
                "File path cannot be empty or whitespace.",
                action_name=action_name,
                field=field,
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
                action_name=action_name,
                field=field,
            )

        return norm

    @classmethod
    def _sanitize_optional_workdir(cls, data: Dict[str, Any], action_name: str) -> Dict[str, Any]:
        """Return a copy of ``data`` with any ``workdir`` normalised inside /workspace.

        A workdir is joined onto the sandbox workspace root at dispatch time, so
        an unsanitised ``..`` in one would let an action address paths outside
        the sandbox workspace.
        """
        raw_workdir = data.get("workdir")
        if raw_workdir is None:
            return data
        if not isinstance(raw_workdir, str) or not raw_workdir.strip():
            raise ActionValidationError(
                "workdir must be a non-empty string when provided.",
                action_name=action_name,
                field="workdir",
            )
        data_copy = dict(data)
        data_copy["workdir"] = cls.sanitize_workspace_path(
            raw_workdir, action_name=action_name, field="workdir"
        )
        return data_copy

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

            elif action_name == ActionName.GENERATE_PATCH.value:
                return GeneratePatchAction(**cls._sanitize_optional_workdir(data, action_name))

            elif action_name == ActionName.RUN_BISECT.value:
                for required_field in ("good", "bad", "command"):
                    value = data.get(required_field)
                    if not isinstance(value, str) or not value.strip():
                        hint = ""
                        if required_field in ("good", "bad"):
                            hint = (
                                " A bisect cannot start without both a"
                                " known-good and a known-bad revision."
                            )
                        raise ActionValidationError(
                            f"'{required_field}' is required and must be a non-empty string.{hint}",
                            action_name=action_name,
                            field=required_field,
                        )
                return RunBisectAction(**cls._sanitize_optional_workdir(data, action_name))

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
