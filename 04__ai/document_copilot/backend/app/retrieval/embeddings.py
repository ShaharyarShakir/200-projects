from google import genai
from app.config import settings


client = genai.Client(api_key=settings.google_api_key)

def _client():
    return client
def embed_query(text: str) -> list[float]:
    response = _client().models.embed_content(
        model=settings.google_embedding_model,
        contents=text,
    )
    embedding = response.embeddings[0].values
    expected_dims = settings.google_embedding_dimensions
    if len(embedding) != expected_dims:
        raise ValueError(
            f"Expected embedding dimension {expected_dims}, got {len(embedding)}"
        )
    return embedding