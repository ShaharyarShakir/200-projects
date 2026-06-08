from google import genai
from app.config import settings


def _client():
    return genai.Client(api_key=settings.google_api_key)


def embed_query(text: str) -> list[float]:
    response = _client().embeddings.create(
        model="text-embedding-004",
        contents=text,
    )

    embedding = response.embeddings[0].values

    expected_dims = settings.google_embedding_dimensions  # rename this later
    if len(embedding) != expected_dims:
        raise ValueError(
            f"Expected embedding dimension {expected_dims}, got {len(embedding)}"
        )

    return embedding