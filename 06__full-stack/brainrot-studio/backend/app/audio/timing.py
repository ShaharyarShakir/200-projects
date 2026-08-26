import os
import subprocess
import wave
import logging

logger = logging.getLogger(__name__)


def get_audio_duration_ms(file_path: str) -> int:
    """Measures physical audio file duration in milliseconds."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    # Try standard library WAV reader first
    try:
        with wave.open(file_path, "r") as wav_file:
            frames = wav_file.getnframes()
            rate = wav_file.getframerate()
            duration_sec = frames / float(rate)
            return int(duration_sec * 1000)
    except Exception:
        pass

    # Fallback to ffprobe for non-WAV media formats
    try:
        cmd = [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            file_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        dur_sec = float(result.stdout.strip())
        return int(dur_sec * 1000)
    except Exception as exc:
        logger.warning(f"Could not determine audio duration for {file_path} via ffprobe: {exc}")
        # Default fallback estimate if ffprobe is unavailable
        file_size = os.path.getsize(file_path)
        return max(1000, int((file_size / 32000) * 1000))
