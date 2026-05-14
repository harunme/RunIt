from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class LLMProviderBase(BaseModel):
    """Base schema for LLM Provider."""
    name: str = Field(..., max_length=255)
    provider: str = Field(..., max_length=50)
    api_key: str = Field(..., max_length=1000)
    base_url: Optional[str] = Field(None, max_length=500)
    model: str = Field(..., max_length=100)
    default_params: Optional[str] = None  # JSON stored as text
    enabled: bool = True
    is_default: bool = False


class LLMProviderCreate(LLMProviderBase):
    """Schema for creating an LLM Provider."""
    pass


class LLMProviderUpdate(BaseModel):
    """Schema for updating an LLM Provider."""
    name: Optional[str] = Field(None, max_length=255)
    provider: Optional[str] = Field(None, max_length=50)
    api_key: Optional[str] = Field(None, max_length=1000)
    base_url: Optional[str] = Field(None, max_length=500)
    model: Optional[str] = Field(None, max_length=100)
    default_params: Optional[str] = None
    enabled: Optional[bool] = None
    is_default: Optional[bool] = None


class LLMProviderResponse(LLMProviderBase):
    """Schema for LLM Provider response."""
    id: str

    model_config = {"from_attributes": True}
