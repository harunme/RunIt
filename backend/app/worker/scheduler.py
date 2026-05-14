from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from app.database import async_session_maker
from app.models import DataSource
from app.worker.executor import TaskExecutor


class Scheduler:
    """APScheduler-based job scheduler."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.executor = TaskExecutor()

    async def _run_source(self, source_id: str):
        """Job function to run a data source."""
        await self.executor.execute_source(source_id)

    async def load_jobs(self):
        """Load and schedule jobs from database."""
        async with async_session_maker() as db:
            result = await db.execute(
                select(DataSource).where(DataSource.enabled == True)
            )
            sources = result.scalars().all()

            for source in sources:
                self.add_job(source)

    def add_job(self, source):
        """Add a job for a data source."""
        job_id = f"source_{source.id}"

        parts = source.schedule.split()
        if len(parts) >= 5:
            trigger = CronTrigger(
                minute=parts[0],
                hour=parts[1],
                day=parts[2],
                month=parts[3],
                day_of_week=parts[4],
            )
        else:
            trigger = CronTrigger(minute=0)

        self.scheduler.add_job(
            self._run_source,
            trigger=trigger,
            args=[source.id],
            id=job_id,
            replace_existing=True,
        )

    def start(self):
        """Start the scheduler."""
        import asyncio
        asyncio.create_task(self.load_jobs())
        self.scheduler.start()

    def stop(self):
        """Stop the scheduler."""
        self.scheduler.shutdown()
