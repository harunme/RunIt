import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PublishedItem(Base):
    __tablename__ = "published_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    task_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tasks.id"),
        nullable=False,
        index=True
    )
    publisher_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("publishers.id"),
        nullable=False,
        index=True
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    external_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    published_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="published_items"
    )
    publisher: Mapped["Publisher"] = relationship(
        "Publisher",
        back_populates="published_items"
    )

    def __repr__(self) -> str:
        return f"<PublishedItem(id={self.id}, task_id={self.task_id}, publisher_id={self.publisher_id})>"
