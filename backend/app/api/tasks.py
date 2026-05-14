from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskListResponse, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: AsyncSession = Depends(get_db)
):
    """List tasks with pagination and optional status filter."""
    # Build base query
    base_query = select(Task)
    count_query = select(func.count()).select_from(Task)

    if status:
        base_query = base_query.where(Task.status == status)
        count_query = count_query.where(Task.status == status)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    base_query = base_query.order_by(Task.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(base_query)
    tasks = result.scalars().all()

    return TaskListResponse(
        items=tasks,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific task by ID."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/retry")
async def retry_task(
    task_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retry a failed task (placeholder)."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")

    # TODO: Implement actual task retry logic
    return {"status": "pending", "message": "Task retry not implemented"}
