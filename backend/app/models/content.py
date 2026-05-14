import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Content(Base):
    __tablename__ = "contents"
    __table_args__ = (
        UniqueConstraint("source_id", "url", name="uq_source_url"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    task_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("tasks.id"),
        nullable=True,
        index=True
    )
    source_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("data_sources.id"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    author: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    published_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationships
    task: Mapped[Optional["Task"]] = relationship("Task", back_populates="contents")
    source: Mapped["DataSource"] = relationship("DataSource", back_populates="contents")

    def __repr__(self) -> str:
        return f"<Content(id={self.id}, title={self.title[:30]}...)>"
