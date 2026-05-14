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
    contents: Mapped[list["Content"]] = relationship(
        "Content",
        back_populates="task"
    )
    published_items: Mapped[List["PublishedItem"]] = relationship(
        "PublishedItem",
        back_populates="task"
    )
    logs: Mapped[List["TaskLog"]] = relationship(
        "TaskLog",
        back_populates="task",
        order_by="TaskLog.created_at"
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, source_id={self.source_id}, status={self.status})>"


class TaskLog(Base):
    __tablename__ = "task_logs"

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
    level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="INFO"
    )  # INFO, WARNING, ERROR
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationship
    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="logs"
    )

    def __repr__(self) -> str:
        return f"<TaskLog(id={self.id}, task_id={self.task_id}, level={self.level})>"
