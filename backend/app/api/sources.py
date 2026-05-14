import json
import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.data_source import DataSource


class DataSourceCreate(BaseModel):
    name: str
    type: str
    config: dict = Field(default_factory=dict)
    agent_id: Optional[str] = None
    schedule: str
    enabled: bool = True


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    config: Optional[dict] = None
    agent_id: Optional[str] = None
    schedule: Optional[str] = None
    enabled: Optional[bool] = None


class DataSourceResponse(BaseModel):
    id: str
    name: str
    type: str
    config: dict
    agent_id: Optional[str]
    schedule: str
    enabled: bool
    last_run_at: Optional[datetime]

    model_config = {"from_attributes": True}

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])


@router.get("", response_model=List[DataSourceResponse])
async def list_sources(db: AsyncSession = Depends(get_db)):
    """List all data sources."""
    result = await db.execute(select(DataSource))
    sources = result.scalars().all()
    return [
        DataSourceResponse(
            id=s.id,
            name=s.name,
            type=s.type,
            config=json.loads(s.config) if isinstance(s.config, str) else s.config,
            agent_id=s.agent_id,
            schedule=s.schedule,
            enabled=s.enabled,
            last_run_at=s.last_run_at,
        )
        for s in sources
    ]


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
        config=json.dumps(source_data.config),  # Convert dict to JSON string
        agent_id=source_data.agent_id,
        schedule=source_data.schedule,
        enabled=source_data.enabled,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return DataSourceResponse(
        id=source.id,
        name=source.name,
        type=source.type,
        config=source_data.config,
        agent_id=source.agent_id,
        schedule=source.schedule,
        enabled=source.enabled,
        last_run_at=source.last_run_at,
    )


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
    return DataSourceResponse(
        id=source.id,
        name=source.name,
        type=source.type,
        config=json.loads(source.config) if isinstance(source.config, str) else source.config,
        agent_id=source.agent_id,
        schedule=source.schedule,
        enabled=source.enabled,
        last_run_at=source.last_run_at,
    )


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
