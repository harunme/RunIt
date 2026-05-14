import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Publisher(Base):
    __tablename__ = "publishers"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # twitter, xiaohongshu, wechat
    credentials: Mapped[str] = mapped_column(Text, nullable=False)  # JSON stored as text
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    published_items: Mapped[List["PublishedItem"]] = relationship(
        "PublishedItem",
        back_populates="publisher"
    )

    def __repr__(self) -> str:
        return f"<Publisher(id={self.id}, name={self.name}, type={self.type})>"
