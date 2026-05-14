from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DataSourceBase(BaseModel):
    """Base schema for DataSource."""
    name: str = Field(..., max_length=255)
    type: str = Field(..., max_length=50)  # github, twitter, rss
    config: str  # JSON stored as text
    agent_id: Optional[str] = None
    schedule: str = Field(..., max_length=100)  # cron expression
    enabled: bool = True


class DataSourceCreate(DataSourceBase):
    """Schema for creating a DataSource."""
    pass


class DataSourceUpdate(BaseModel):
    """Schema for updating a DataSource."""
    name: Optional[str] = Field(None, max_length=255)
    type: Optional[str] = Field(None, max_length=50)
    config: Optional[str] = None
    agent_id: Optional[str] = None
    schedule: Optional[str] = Field(None, max_length=100)
    enabled: Optional[bool] = None


class DataSourceResponse(DataSourceBase):
    """Schema for DataSource response."""
    id: str
    last_run_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
