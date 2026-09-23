import json
import re
from typing import Any, Dict

from app.core.errors import ActionParseError


class ActionParser:
    """Parser that extracts and deserializes JSON action payloads from LLM responses."""

    @staticmethod
    def extract_json_string(text: str) -> str:
        """Extract a JSON substring from raw model output, handling markdown blocks."""
        if not text or not text.strip():
            raise ActionParseError("Empty response received from LLM", raw_content=text)

        stripped = text.strip()

        # 1. Match fenced code blocks ```json ... ``` or ``` ... ```
        fenced_pattern = r"```(?:json)?\s*\n?([\s\S]*?)\n?```"
        fenced_matches = re.findall(fenced_pattern, stripped, re.IGNORECASE)
        for match in fenced_matches:
            match_stripped = match.strip()
            if (match_stripped.startswith("{") and match_stripped.endswith("}")) or (
                match_stripped.startswith("[") and match_stripped.endswith("]")
            ):
                return match_stripped

        # 2. If entire string is a JSON object or array
        if (stripped.startswith("{") and stripped.endswith("}")) or (
            stripped.startswith("[") and stripped.endswith("]")
        ):
            return stripped

        # 3. Find outer-most { ... } substring
        start_idx = stripped.find("{")
        end_idx = stripped.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            return stripped[start_idx : end_idx + 1]

        # 4. Find outer-most [ ... ] substring
        start_arr = stripped.find("[")
        end_arr = stripped.rfind("]")
        if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
            return stripped[start_arr : end_arr + 1]

        raise ActionParseError(
            "No JSON object structure found in response. Expected format: {'action': 'run_command' | 'inspect_file' | 'finish', ...}",
            raw_content=text,
        )

    @classmethod
    def parse_action(cls, text: str) -> Dict[str, Any]:
        """Extract and parse JSON object from LLM response into a dictionary."""
        json_str = cls.extract_json_string(text)
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ActionParseError(
                f"Invalid JSON syntax: {e.msg} at line {e.lineno} column {e.colno}",
                raw_content=text,
            ) from e

        if not isinstance(data, dict):
            raise ActionParseError(
                f"Action payload must be a JSON dictionary object, got {type(data).__name__}",
                raw_content=text,
            )

        return data
