import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    source_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("data_sources.id"),
        nullable=False,
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending"
    )  # pending, running, completed, failed
    raw_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processed_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON stored as text
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    data_source: Mapped["DataSource"] = relationship(
        "DataSource",
        back_populates="tasks"
    )
    published_items: Mapped[List["PublishedItem"]] = relationship(
        "PublishedItem",
        back_populates="task"
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, source_id={self.source_id}, status={self.status})>"
