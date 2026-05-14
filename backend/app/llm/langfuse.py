from typing import Optional
from langfuse import Langfuse
from langfuse.langchain import CallbackHandler
from app.config import get_settings

settings = get_settings()

_langfuse_client: Optional[Langfuse] = None


def get_langfuse() -> Optional[Langfuse]:
    """Get or create Langfuse client."""
    global _langfuse_client

    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        return None

    if _langfuse_client is None:
        _langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )

    return _langfuse_client


def get_langfuse_callback() -> Optional[CallbackHandler]:
    """Get Langfuse callback handler for LangChain."""
    client = get_langfuse()
    if client is None:
        return None

    return CallbackHandler(
        client=client,
        metadata={"service": "runit"}
    )
