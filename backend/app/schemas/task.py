from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class TaskResponse(BaseModel):
    """Schema for Task response."""
    id: str
    source_id: str
    status: str = Field(default="pending")  # pending, running, completed, failed
    raw_content: Optional[str] = None
    processed_content: Optional[str] = None
    images: Optional[str] = None  # JSON stored as text
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Schema for paginated Task list response."""
    items: List[TaskResponse]
    total: int
    page: int
    page_size: int


class TaskLogResponse(BaseModel):
    """Schema for TaskLog response."""
    id: str
    task_id: str
    level: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskLogListResponse(BaseModel):
    """Schema for paginated TaskLog list response."""
    items: List[TaskLogResponse]
    total: int
    page: int
    page_size: int
