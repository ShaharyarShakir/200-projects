import pytest

from app.core.errors import ActionParseError, ActionValidationError
from app.schemas.actions import FinishAction, InspectFileAction, RunCommandAction
from app.services.agent.parser import ActionParser
from app.services.agent.validator import ActionValidator


class TestActionParser:
    def test_parse_plain_json(self):
        raw = '{"action": "run_command", "command": "pytest"}'
        parsed = ActionParser.parse_action(raw)
        assert parsed == {"action": "run_command", "command": "pytest"}

    def test_parse_markdown_fenced_json(self):
        raw = """
        I will run the tests now:
        ```json
        {
          "action": "run_command",
          "command": "pytest -v"
        }
        ```
        Let's see what happens.
        """
        parsed = ActionParser.parse_action(raw)
        assert parsed == {"action": "run_command", "command": "pytest -v"}

    def test_parse_generic_fenced_block(self):
        raw = """
        ```
        {
          "action": "inspect_file",
          "path": "app/main.py"
        }
        ```
        """
        parsed = ActionParser.parse_action(raw)
        assert parsed == {"action": "inspect_file", "path": "app/main.py"}

    def test_parse_embedded_json_without_fences(self):
        raw = 'Sure, here is the command: {"action": "finish", "message": "All done"} That was easy.'
        parsed = ActionParser.parse_action(raw)
        assert parsed == {"action": "finish", "message": "All done"}

    def test_parse_empty_string_raises_error(self):
        with pytest.raises(ActionParseError):
            ActionParser.parse_action("   ")

    def test_parse_no_json_raises_error(self):
        with pytest.raises(ActionParseError):
            ActionParser.parse_action("I am not sure what to do next.")

    def test_parse_invalid_json_syntax_raises_error(self):
        with pytest.raises(ActionParseError) as exc_info:
            ActionParser.parse_action('{"action": "run_command", "command": }')
        assert "Invalid JSON syntax" in str(exc_info.value)

    def test_parse_non_dict_json_raises_error(self):
        with pytest.raises(ActionParseError) as exc_info:
            ActionParser.parse_action('["action", "run_command"]')
        assert "must be a JSON dictionary" in str(exc_info.value)


class TestActionValidator:
    def test_validate_run_command_valid(self):
        data = {"action": "run_command", "command": "uv run pytest", "timeout_seconds": 30}
        action = ActionValidator.validate_action(data)
        assert isinstance(action, RunCommandAction)
        assert action.command == "uv run pytest"
        assert action.timeout_seconds == 30

    def test_validate_inspect_file_valid(self):
        data = {"action": "inspect_file", "path": "app/services/agent.py"}
        action = ActionValidator.validate_action(data)
        assert isinstance(action, InspectFileAction)
        assert action.path == "app/services/agent.py"

    def test_validate_inspect_file_workspace_prefix_stripped(self):
        data = {"action": "inspect_file", "path": "/workspace/app/core/config.py"}
        action = ActionValidator.validate_action(data)
        assert isinstance(action, InspectFileAction)
        assert action.path == "app/core/config.py"

    def test_validate_finish_valid(self):
        data = {"action": "finish", "message": "Tests fixed successfully", "success": True}
        action = ActionValidator.validate_action(data)
        assert isinstance(action, FinishAction)
        assert action.message == "Tests fixed successfully"
        assert action.success is True

    def test_missing_action_field_raises_error(self):
        with pytest.raises(ActionValidationError) as exc_info:
            ActionValidator.validate_action({"command": "ls"})
        assert "Missing required 'action' field" in str(exc_info.value)

    def test_unsupported_action_raises_error(self):
        with pytest.raises(ActionValidationError) as exc_info:
            ActionValidator.validate_action({"action": "delete_database", "target": "all"})
        assert "Unsupported action 'delete_database'" in str(exc_info.value)

    def test_empty_command_raises_error(self):
        with pytest.raises(ActionValidationError) as exc_info:
            ActionValidator.validate_action({"action": "run_command", "command": "   "})
        assert "Command must be a non-empty string" in str(exc_info.value)

    def test_empty_path_raises_error(self):
        with pytest.raises(ActionValidationError) as exc_info:
            ActionValidator.validate_action({"action": "inspect_file", "path": ""})
        assert "Path must be a non-empty string" in str(exc_info.value)

    def test_path_traversal_escaping_workspace_raises_error(self):
        with pytest.raises(ActionValidationError) as exc_info:
            ActionValidator.validate_action({"action": "inspect_file", "path": "../../etc/passwd"})
        assert "must remain within /workspace" in str(exc_info.value)

    def test_root_path_not_in_workspace_raises_error(self):
        with pytest.raises(ActionValidationError) as exc_info:
            ActionValidator.validate_action({"action": "inspect_file", "path": "/etc/shadow"})
        assert "must remain within /workspace" in str(exc_info.value)
