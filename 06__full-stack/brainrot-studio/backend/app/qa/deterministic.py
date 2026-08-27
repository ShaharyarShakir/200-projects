import json
import logging
import os
import subprocess
from pathlib import Path

from app.models.qa import QACategory, QASeverity
from app.qa.models import QAIssue
from app.qa.rules import (
    DEV_ALLOWED_HEIGHT,
    DEV_ALLOWED_WIDTH,
    EXPECTED_AUDIO_CODEC,
    EXPECTED_VIDEO_CODEC,
    MAX_SHORT_DURATION_SEC,
    TARGET_HEIGHT,
    TARGET_WIDTH,
)

logger = logging.getLogger(__name__)


def check_media_format(video_path: str | Path) -> list[QAIssue]:
    """Inspects rendered MP4 video file using ffprobe to check format, streams, codecs, and resolution."""
    issues: list[QAIssue] = []

    if not os.path.exists(video_path):
        issues.append(
            QAIssue(
                category=QACategory.MEDIA,
                severity=QASeverity.CRITICAL,
                code="FILE_NOT_FOUND",
                message=f"Rendered video file not found at path: {video_path}",
                repairable=True,
            )
        )
        return issues

    cmd = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        str(video_path),
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
    except Exception as exc:
        logger.error(f"ffprobe failed for {video_path}: {exc}")
        issues.append(
            QAIssue(
                category=QACategory.MEDIA,
                severity=QASeverity.CRITICAL,
                code="FILE_CORRUPTED",
                message=f"Media file is corrupted or unreadable: {exc}",
                repairable=True,
            )
        )
        return issues

    streams = data.get("streams", [])
    format_info = data.get("format", {})

    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    if not video_stream:
        issues.append(
            QAIssue(
                category=QACategory.MEDIA,
                severity=QASeverity.CRITICAL,
                code="MISSING_VIDEO_STREAM",
                message="Final render contains no video stream.",
                repairable=True,
            )
        )
    else:
        v_codec = video_stream.get("codec_name", "").lower()
        if EXPECTED_VIDEO_CODEC not in v_codec and v_codec != EXPECTED_VIDEO_CODEC:
            issues.append(
                QAIssue(
                    category=QACategory.MEDIA,
                    severity=QASeverity.WARNING,
                    code="INVALID_VIDEO_CODEC",
                    message=f"Video stream codec '{v_codec}' does not match expected '{EXPECTED_VIDEO_CODEC}'.",
                    repairable=True,
                )
            )

    if not audio_stream:
        issues.append(
            QAIssue(
                category=QACategory.AUDIO,
                severity=QASeverity.ERROR,
                code="MISSING_AUDIO_STREAM",
                message="Final render contains no audio stream.",
                repairable=True,
            )
        )
    else:
        a_codec = audio_stream.get("codec_name", "").lower()
        if EXPECTED_AUDIO_CODEC not in a_codec and a_codec != EXPECTED_AUDIO_CODEC:
            issues.append(
                QAIssue(
                    category=QACategory.AUDIO,
                    severity=QASeverity.WARNING,
                    code="INVALID_AUDIO_CODEC",
                    message=f"Audio stream codec '{a_codec}' does not match expected '{EXPECTED_AUDIO_CODEC}'.",
                    repairable=True,
                )
            )

    if video_stream:
        width = int(video_stream.get("width", 0))
        height = int(video_stream.get("height", 0))

        if (width, height) not in [(TARGET_WIDTH, TARGET_HEIGHT), (DEV_ALLOWED_WIDTH, DEV_ALLOWED_HEIGHT)]:
            issues.append(
                QAIssue(
                    category=QACategory.MEDIA,
                    severity=QASeverity.ERROR,
                    code="INVALID_RESOLUTION",
                    message=f"Video resolution {width}x{height} does not match expected {TARGET_WIDTH}x{TARGET_HEIGHT}.",
                    repairable=True,
                )
            )

    try:
        duration_sec = float(format_info.get("duration", 0.0))
        if duration_sec <= 0:
            issues.append(
                QAIssue(
                    category=QACategory.MEDIA,
                    severity=QASeverity.ERROR,
                    code="ZERO_DURATION",
                    message="Video duration is zero or invalid.",
                    repairable=True,
                )
            )
        elif duration_sec > MAX_SHORT_DURATION_SEC:
            issues.append(
                QAIssue(
                    category=QACategory.MEDIA,
                    severity=QASeverity.WARNING,
                    code="VIDEO_TOO_LONG",
                    message=f"Video duration ({duration_sec:.1f}s) exceeds maximum short limit ({MAX_SHORT_DURATION_SEC}s).",
                    repairable=True,
                )
            )
    except (ValueError, TypeError):
        pass

    return issues
