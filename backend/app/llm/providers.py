from typing import Optional
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel


def create_llm_provider(
    provider_type: str,
    api_key: str,
    model: str,
    base_url: Optional[str] = None,
    **kwargs
) -> BaseChatModel:
    """Create an LLM provider instance."""
    if provider_type == "anthropic":
        return ChatAnthropic(
            anthropic_api_key=api_key,
            model=model,
            **kwargs
        )
    elif provider_type == "openai":
        return ChatOpenAI(
            openai_api_key=api_key,
            model=model,
            base_url=base_url,
            **kwargs
        )
    elif provider_type == "ollama":
        return ChatOpenAI(
            openai_api_key="ollama",
            model=model,
            base_url=base_url or "http://localhost:11434/v1",
            **kwargs
        )
    elif provider_type == "siliconflow":
        return ChatOpenAI(
            openai_api_key=api_key,
            model=model,
            base_url="https://api.siliconflow.cn/v1",
            **kwargs
        )
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")
