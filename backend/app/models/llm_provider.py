import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LLMProvider(Base):
    __tablename__ = "llm_providers"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # openai, anthropic, ollama, siliconflow
    api_key: Mapped[str] = mapped_column(Text, nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    default_params: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON stored as text
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    agents: Mapped[List["Agent"]] = relationship("Agent", back_populates="llm_provider")

    def __repr__(self) -> str:
        return f"<LLMProvider(id={self.id}, name={self.name}, provider={self.provider})>"
