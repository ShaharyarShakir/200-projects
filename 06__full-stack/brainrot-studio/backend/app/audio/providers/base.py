from typing import Protocol


class VoiceProvider(Protocol):
    async def synthesize(
        self,
        text: str,
        voice_id: str,
        output_path: str,
    ) -> dict:
        """Synthesizes text into an audio file and returns metadata (duration_ms, path, sample_rate)."""
        ...
