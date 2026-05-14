import json
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models import DataSource, Task
from app.sources import RSSSource, GitHubSource, TwitterSource
from app.agents import get_agent
from app.storage import ContentStorage, ObsidianBackup


class TaskExecutor:
    """Executes tasks for data sources."""

    def __init__(self):
        self.sources = {
            "rss": RSSSource(),
            "github": GitHubSource(),
            "twitter": TwitterSource(),
        }
        self.storage = ContentStorage()
        self.backup = ObsidianBackup()

    async def execute_source(self, source_id: str):
        """Execute a data source: fetch, process, store."""
        async with async_session_maker() as db:
            session: AsyncSession = db

            result = await session.execute(select(DataSource).where(DataSource.id == source_id))
            source = result.scalar_one_or_none()

            if not source or not source.enabled:
                return

            task = Task(
                source_id=source_id,
                status="running",
                started_at=datetime.utcnow(),
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)

            try:
                source_client = self.sources.get(source.type)
                if not source_client:
                    raise ValueError(f"Unknown source type: {source.type}")

                config = json.loads(source.config) if isinstance(source.config, str) else source.config
                items = await source_client.fetch(config)

                for item in items:
                    await self._process_item(item, source, task, session)

                task.status = "completed"
                task.completed_at = datetime.utcnow()
                source.last_run_at = datetime.utcnow()

                await session.commit()

            except Exception as e:
                task.status = "failed"
                task.error_message = str(e)
                task.completed_at = datetime.utcnow()
                await session.commit()

    async def _process_item(self, item, source, task, db):
        """Process a single item through agent."""
        session: AsyncSession = db

        task.raw_content = item.content

        metadata = {
            "title": item.title,
            "url": item.url,
            "source": source.name,
            "source_type": source.type,
        }

        self.storage.save(
            content=item.content,
            metadata=metadata,
            format="md"
        )

        self.backup.backup(
            content=item.content,
            filename=f"{source.type}_{item.id}.md",
            metadata=metadata
        )
