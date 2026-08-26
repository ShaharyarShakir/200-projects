import logging
from typing import Any

logger = logging.getLogger(__name__)


def calculate_audio_levels(
    voice_clips: list[dict[str, Any]],
    has_music: bool = True,
    has_sfx: bool = False,
) -> dict[str, Any]:
    """Calculates audio track mixing levels and ducking configuration."""
    return {
        "voice_level_db": 0.0,
        "music_level_db": -18.0 if voice_clips else -10.0,
        "sfx_level_db": -6.0,
        "voice_count": len(voice_clips),
        "total_voice_duration_ms": sum(c.get("duration_ms", 0) for c in voice_clips),
    }
