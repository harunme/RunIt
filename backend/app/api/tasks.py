from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task import Task, TaskLog
from app.schemas.task import TaskListResponse, TaskResponse, TaskLogResponse, TaskLogListResponse, TaskContentItem, TaskContentListResponse
from app.models.content import Content

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    source_id: Optional[str] = Query(None, description="Filter by source ID"),
    db: AsyncSession = Depends(get_db)
):
    """List tasks with pagination and optional status/source filter."""
    # Build base query with eager loading of data_source
    base_query = select(Task).options(selectinload(Task.data_source))
    count_query = select(func.count()).select_from(Task)

    if status:
        base_query = base_query.where(Task.status == status)
        count_query = count_query.where(Task.status == status)

    if source_id:
        base_query = base_query.where(Task.source_id == source_id)
        count_query = count_query.where(Task.source_id == source_id)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    base_query = base_query.order_by(Task.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(base_query)
    tasks = result.scalars().all()

    # Transform tasks to include source_name
    task_responses = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "source_id": task.source_id,
            "source_name": task.data_source.name if task.data_source else None,
            "status": task.status,
            "raw_content": task.raw_content,
            "processed_content": task.processed_content,
            "images": task.images,
            "error_message": task.error_message,
            "created_at": task.created_at,
            "started_at": task.started_at,
            "completed_at": task.completed_at,
        }
        task_responses.append(TaskResponse(**task_dict))

    return TaskListResponse(
        items=task_responses,
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


@router.get("/{task_id}/logs", response_model=TaskLogListResponse)
async def get_task_logs(
    task_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    level: Optional[str] = Query(None, description="Filter by level (INFO, WARNING, ERROR)"),
    db: AsyncSession = Depends(get_db)
):
    """Get logs for a specific task."""
    # Verify task exists
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    if not task_result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")

    # Build query
    base_query = select(TaskLog).where(TaskLog.task_id == task_id)
    count_query = select(func.count()).select_from(TaskLog).where(TaskLog.task_id == task_id)

    if level:
        base_query = base_query.where(TaskLog.level == level)
        count_query = count_query.where(TaskLog.level == level)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    base_query = base_query.order_by(TaskLog.created_at.asc()).offset(offset).limit(page_size)

    result = await db.execute(base_query)
    logs = result.scalars().all()

    return TaskLogListResponse(
        items=logs,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}/contents", response_model=TaskContentListResponse)
async def get_task_contents(
    task_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """Get contents associated with a specific task."""
    # Verify task exists
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    if not task_result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")

    # Count total
    count_query = select(func.count()).select_from(Content).where(Content.task_id == task_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get paginated contents
    offset = (page - 1) * page_size
    query = (
        select(Content)
        .where(Content.task_id == task_id)
        .order_by(Content.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    contents = result.scalars().all()

    return TaskContentListResponse(
        items=contents,
        total=total,
        page=page,
        page_size=page_size,
    )


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
