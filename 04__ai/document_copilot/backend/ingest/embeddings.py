"""Google GenAI embedding generation for document chunks."""

from __future__ import annotations

import google.generativeai as genai

from app.config import settings

EMBED_BATCH_SIZE = 100


def _configure_client() -> None:
    genai.configure(api_key=settings.google_api_key)


def embed_texts(texts: list[str], *, batch_size: int = EMBED_BATCH_SIZE) -> list[list[float]]:
    if not texts:
        return []

    _configure_client()

    expected_dims = settings.google_embedding_dimensions
    vectors: list[list[float]] = []

    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        response = genai.embed_content(
            model=settings.google_embedding_model,
            content=batch,
            output_dimensionality=expected_dims,
        )
        for embedding in response["embedding"]:
            if len(embedding) != expected_dims:
                raise ValueError(
                    f"Expected embedding dimension {expected_dims}, got {len(embedding)}"
                )
            vectors.append(embedding)

    return vectors