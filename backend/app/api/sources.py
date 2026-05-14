import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.data_source import DataSource
from app.schemas.data_source import (
    DataSourceCreate,
    DataSourceUpdate,
    DataSourceResponse,
)

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])


@router.get("", response_model=List[DataSourceResponse])
async def list_sources(db: AsyncSession = Depends(get_db)):
    """List all data sources."""
    result = await db.execute(select(DataSource))
    sources = result.scalars().all()
    return sources


@router.post("", response_model=DataSourceResponse, status_code=201)
async def create_source(
    source_data: DataSourceCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new data source."""
    source = DataSource(
        id=str(uuid.uuid4()),
        name=source_data.name,
        type=source_data.type,
        config=source_data.config,
        agent_id=source_data.agent_id,
        schedule=source_data.schedule,
        enabled=source_data.enabled,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.get("/{source_id}", response_model=DataSourceResponse)
async def get_source(
    source_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific data source by ID."""
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.put("/{source_id}", response_model=DataSourceResponse)
async def update_source(
    source_id: str,
    source_data: DataSourceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing data source."""
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    update_data = source_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(source, key, value)

    await db.commit()
    await db.refresh(source)
    return source


@router.delete("/{source_id}", status_code=204)
async def delete_source(
    source_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a data source."""
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    await db.delete(source)
    await db.commit()
    return None


@router.post("/{source_id}/run")
async def run_source(
    source_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger a data source (placeholder)."""
    result = await db.execute(
        select(DataSource).where(DataSource.id == source_id)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    # TODO: Implement actual source triggering
    return {"status": "pending", "message": "Source run not implemented"}
