from typing import Optional

from pydantic import BaseModel, Field


class PublisherBase(BaseModel):
    """Base schema for Publisher."""
    name: str = Field(..., max_length=255)
    type: str = Field(..., max_length=50)  # twitter, xiaohongshu, wechat
    credentials: str  # JSON stored as text
    enabled: bool = True


class PublisherCreate(PublisherBase):
    """Schema for creating a Publisher."""
    pass


class PublisherUpdate(BaseModel):
    """Schema for updating a Publisher."""
    name: Optional[str] = Field(None, max_length=255)
    type: Optional[str] = Field(None, max_length=50)
    credentials: Optional[str] = None
    enabled: Optional[bool] = None


class PublisherResponse(PublisherBase):
    """Schema for Publisher response."""
    id: str

    model_config = {"from_attributes": True}
