import json
import logging
import re
import sys
import time
from typing import Any, Dict, List, Optional, Union
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings

# Sensitive key names in dictionaries to redact
SENSITIVE_KEY_NAMES = {
    "api_key",
    "apikey",
    "secret",
    "secret_key",
    "token",
    "access_token",
    "refresh_token",
    "password",
    "authorization",
    "groq_api_key",
    "github_token",
    "encryption_secret_key",
    "jwt_secret_key",
    "github_client_secret",
}

# Regex patterns matching token/key formats in strings
SECRET_PATTERNS = [
    re.compile(r"Bearer\s+([A-Za-z0-9\-._~+/]+=*)", re.IGNORECASE),
    re.compile(r"(ghp_[A-Za-z0-9_]{20,})"),
    re.compile(r"(github_pat_[A-Za-z0-9_]{20,})"),
    re.compile(r"(gsk_[A-Za-z0-9_]{20,})"),
    re.compile(r"(sk-ant-[A-Za-z0-9_\-]{20,})"),
    re.compile(r"(sk-[A-Za-z0-9_\-]{20,})"),
]


def sanitize_log_data(
    data: Any,
    custom_secrets: Optional[List[str]] = None,
) -> Any:
    """Sanitize and redact sensitive credentials and secrets from data structures or strings."""
    # Collect known secrets from settings
    known_secrets = set(custom_secrets or [])
    for secret_attr in (
        settings.GROQ_API_KEY,
        settings.ENCRYPTION_SECRET_KEY,
        settings.JWT_SECRET_KEY,
        settings.GITHUB_CLIENT_SECRET,
    ):
        if secret_attr and len(secret_attr) >= 6:
            known_secrets.add(secret_attr)

    def _sanitize_str(text: str) -> str:
        res = text
        # Redact exact secret values
        for s in known_secrets:
            if s in res:
                res = res.replace(s, "[REDACTED]")

        # Redact pattern matches
        for pattern in SECRET_PATTERNS:
            res = pattern.sub("[REDACTED]", res)

        return res

    if isinstance(data, str):
        return _sanitize_str(data)

    elif isinstance(data, dict):
        sanitized_dict = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEY_NAMES:
                sanitized_dict[k] = "[REDACTED]"
            else:
                sanitized_dict[k] = sanitize_log_data(v, custom_secrets=custom_secrets)
        return sanitized_dict

    elif isinstance(data, (list, tuple, set)):
        sanitized_list = [sanitize_log_data(item, custom_secrets=custom_secrets) for item in data]
        if isinstance(data, tuple):
            return tuple(sanitized_list)
        elif isinstance(data, set):
            return set(sanitized_list)
        return sanitized_list

    return data


def setup_logging() -> logging.Logger:
    """Configure structured logging for the application."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    logger = logging.getLogger("bisect")
    logger.setLevel(log_level)
    return logger


logger = setup_logging()


def log_agent_event(
    execution_id: str,
    event_type: str,
    details: Optional[Dict[str, Any]] = None,
    level: str = "info",
) -> None:
    """Log structured, sanitized agent execution event."""
    sanitized_details = sanitize_log_data(details or {})
    log_payload = {
        "execution_id": execution_id,
        "event": event_type,
        "details": sanitized_details,
    }
    msg = f"[AGENT-EXEC:{execution_id}] event={event_type} data={json.dumps(sanitized_details, default=str)}"
    log_fn = getattr(logger, level.lower(), logger.info)
    log_fn(msg)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all incoming HTTP requests and their processing durations."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.perf_counter()
        method = request.method
        path = request.url.path

        logger.info(f"--> {method} {path}")

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.info(
                f"<-- {method} {path} status={response.status_code} duration={duration_ms:.2f}ms"
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"<-- {method} {path} error={exc.__class__.__name__} duration={duration_ms:.2f}ms: {exc}"
            )
            raise
