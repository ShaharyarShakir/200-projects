import math
import os
import struct
import wave
from app.audio.providers.base import VoiceProvider


class LocalVoiceProvider:
    """Generates synthetic local WAV audio for dialogue lines for fast testing without external TTS quota."""

    async def synthesize(
        self,
        text: str,
        voice_id: str = "default_voice",
        output_path: str = "temp_voice.wav",
    ) -> dict:
        # Calculate realistic speech duration: ~15 chars per second
        words = text.split()
        duration_sec = max(1.5, min(12.0, len(text) / 14.0))
        duration_ms = int(duration_sec * 1000)

        # Generate audio parameters
        sample_rate = 22050
        num_samples = int(sample_rate * duration_sec)

        # Map voice_id to base frequency
        pitch_map = {"student": 220.0, "roommate": 165.0, "narrator": 130.0}
        freq = pitch_map.get(voice_id.lower(), 200.0)
        dirname = os.path.dirname(output_path)
        if dirname:
            os.makedirs(dirname, exist_ok=True)



        with wave.open(output_path, "w") as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)

            raw_frames = bytearray()
            for i in range(num_samples):
                t = i / sample_rate
                # Envelope: fade in and fade out
                envelope = min(1.0, t * 5) * min(1.0, (duration_sec - t) * 5)
                sample_val = int(32767 * 0.3 * envelope * math.sin(2 * math.pi * freq * t))
                raw_frames.extend(struct.pack("<h", sample_val))

            wav_file.writeframes(raw_frames)

        return {
            "output_path": output_path,
            "duration_ms": duration_ms,
            "sample_rate": sample_rate,
            "voice_id": voice_id,
            "text": text,
        }
