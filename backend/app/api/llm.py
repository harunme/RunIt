import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.llm_provider import LLMProvider
from app.schemas.llm_provider import (
    LLMProviderCreate,
    LLMProviderUpdate,
    LLMProviderResponse,
)

router = APIRouter(prefix="/api/llm/providers", tags=["LLM Providers"])


@router.get("", response_model=List[LLMProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    """List all LLM providers."""
    result = await db.execute(select(LLMProvider))
    providers = result.scalars().all()
    return providers


@router.post("", response_model=LLMProviderResponse, status_code=201)
async def create_provider(
    provider_data: LLMProviderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new LLM provider."""
    provider = LLMProvider(
        id=str(uuid.uuid4()),
        name=provider_data.name,
        provider=provider_data.provider,
        api_key=provider_data.api_key,
        base_url=provider_data.base_url,
        model=provider_data.model,
        default_params=provider_data.default_params,
        enabled=provider_data.enabled,
        is_default=provider_data.is_default,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider


@router.get("/{provider_id}", response_model=LLMProviderResponse)
async def get_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific LLM provider by ID."""
    result = await db.execute(
        select(LLMProvider).where(LLMProvider.id == provider_id)
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.put("/{provider_id}", response_model=LLMProviderResponse)
async def update_provider(
    provider_id: str,
    provider_data: LLMProviderUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing LLM provider."""
    result = await db.execute(
        select(LLMProvider).where(LLMProvider.id == provider_id)
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_data = provider_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(provider, key, value)

    await db.commit()
    await db.refresh(provider)
    return provider


@router.delete("/{provider_id}", status_code=204)
async def delete_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an LLM provider."""
    result = await db.execute(
        select(LLMProvider).where(LLMProvider.id == provider_id)
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    await db.delete(provider)
    await db.commit()
    return None


@router.post("/test")
async def test_provider(
    provider_data: LLMProviderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Test LLM provider connection (placeholder)."""
    # TODO: Implement actual connection testing
    return {"status": "pending", "message": "Connection test not implemented"}
