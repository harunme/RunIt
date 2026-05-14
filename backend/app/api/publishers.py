import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.publisher import Publisher
from app.schemas.publisher import PublisherCreate, PublisherUpdate, PublisherResponse

router = APIRouter(prefix="/api/publishers", tags=["Publishers"])


@router.get("", response_model=List[PublisherResponse])
async def list_publishers(db: AsyncSession = Depends(get_db)):
    """List all publishers."""
    result = await db.execute(select(Publisher))
    publishers = result.scalars().all()
    return publishers


@router.post("", response_model=PublisherResponse, status_code=201)
async def create_publisher(
    publisher_data: PublisherCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new publisher."""
    publisher = Publisher(
        id=str(uuid.uuid4()),
        name=publisher_data.name,
        type=publisher_data.type,
        credentials=publisher_data.credentials,
        enabled=publisher_data.enabled,
    )
    db.add(publisher)
    await db.commit()
    await db.refresh(publisher)
    return publisher


@router.get("/{publisher_id}", response_model=PublisherResponse)
async def get_publisher(
    publisher_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific publisher by ID."""
    result = await db.execute(
        select(Publisher).where(Publisher.id == publisher_id)
    )
    publisher = result.scalar_one_or_none()
    if not publisher:
        raise HTTPException(status_code=404, detail="Publisher not found")
    return publisher


@router.put("/{publisher_id}", response_model=PublisherResponse)
async def update_publisher(
    publisher_id: str,
    publisher_data: PublisherUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing publisher."""
    result = await db.execute(
        select(Publisher).where(Publisher.id == publisher_id)
    )
    publisher = result.scalar_one_or_none()
    if not publisher:
        raise HTTPException(status_code=404, detail="Publisher not found")

    update_data = publisher_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(publisher, key, value)

    await db.commit()
    await db.refresh(publisher)
    return publisher


@router.delete("/{publisher_id}", status_code=204)
async def delete_publisher(
    publisher_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a publisher."""
    result = await db.execute(
        select(Publisher).where(Publisher.id == publisher_id)
    )
    publisher = result.scalar_one_or_none()
    if not publisher:
        raise HTTPException(status_code=404, detail="Publisher not found")

    await db.delete(publisher)
    await db.commit()
    return None
