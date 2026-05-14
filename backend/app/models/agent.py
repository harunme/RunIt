import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # github, twitter, rss
    llm_provider_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        nullable=True,
        index=True
    )
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    output_format: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="markdown"
    )  # markdown, html, image_params
    config: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON stored as text

    # Relationships
    llm_provider: Mapped[Optional["LLMProvider"]] = relationship(
        "LLMProvider",
        back_populates="agents"
    )
    data_sources: Mapped[List["DataSource"]] = relationship(
        "DataSource",
        back_populates="agent"
    )

    def __repr__(self) -> str:
        return f"<Agent(id={self.id}, name={self.name}, source_type={self.source_type})>"
