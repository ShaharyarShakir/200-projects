import asyncio
import logging
from typing import Type, TypeVar
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from app.ai.providers.base import LLMProvider

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class OllamaProvider:
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "qwen2.5:0.5b"):
        self.base_url = base_url
        self.model_name = model
        self.model = ChatOllama(
            model=model,
            base_url=base_url,
            temperature=0.8,
            client_kwargs={"timeout": 5.0},
        )

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: str | None = None,
    ) -> T:
        structured_model = self.model.with_structured_output(schema)
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))

        try:
            res = await asyncio.wait_for(structured_model.ainvoke(messages), timeout=5.0)
        except Exception as exc:
            logger.warning(f"Ollama structured invocation failed or timed out: {exc}")
            raise exc

        if isinstance(res, schema):
            return res
        elif isinstance(res, dict):
            return schema(**res)
        raise ValueError(f"Failed to parse structured output from Ollama: {res}")

