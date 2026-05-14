from typing import Optional

from pydantic import BaseModel, Field


class AgentBase(BaseModel):
    """Base schema for Agent."""
    name: str = Field(..., max_length=255)
    source_type: str = Field(..., max_length=50)  # github, twitter, rss
    llm_provider_id: Optional[str] = None
    prompt_template: str
    output_format: str = Field(default="markdown", max_length=50)  # markdown, html, image_params
    config: Optional[str] = None  # JSON stored as text


class AgentCreate(AgentBase):
    """Schema for creating an Agent."""
    pass


class AgentUpdate(BaseModel):
    """Schema for updating an Agent."""
    name: Optional[str] = Field(None, max_length=255)
    source_type: Optional[str] = Field(None, max_length=50)
    llm_provider_id: Optional[str] = None
    prompt_template: Optional[str] = None
    output_format: Optional[str] = Field(None, max_length=50)
    config: Optional[str] = None


class AgentResponse(AgentBase):
    """Schema for Agent response."""
    id: str

    model_config = {"from_attributes": True}
