from langchain_ollama import ChatOllama

from app.ai.config import ai_settings


def get_chat_model() -> ChatOllama:
    return ChatOllama(
        model=ai_settings.ollama_model,
        base_url=ai_settings.ollama_base_url,
        temperature=0.8,
    )
