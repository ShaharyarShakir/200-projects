def build_story_prompt(
    user_prompt: str,
    target_duration_ms: int = 30000,
    tone: str = "chaotic",
    language: str = "en",
    validation_errors: list[str] | None = None,
) -> str:
    prompt = f"""Create a short-form video story based on this prompt:
"{user_prompt}"

Configuration:
- Target total duration: {target_duration_ms // 1000} seconds ({target_duration_ms} ms)
- Tone: {tone}
- Language: {language}

Requirements:
- Output 4 to 8 scenes.
- Total sum of scene duration_ms MUST be close to {target_duration_ms} ms (within 20%).
- Each scene must have a clear visual_description, purpose, short dialogue lines, and a short punchy caption.
- Include a strong opening hook in the story metadata.
- End with a strong punchline or plot twist.
"""
    if validation_errors:
        errors_str = "\n".join(f"- {e}" for e in validation_errors)
        prompt += f"\nCRITICAL FIXES REQUIRED FROM PREVIOUS ATTEMPT:\n{errors_str}\nAdjust your output to resolve all validation errors."

    return prompt
