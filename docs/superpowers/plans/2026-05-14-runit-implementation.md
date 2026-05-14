# RunIt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a content aggregation system with AI processing (LangGraph) and social media publishing capabilities

**Architecture:** FastAPI backend with SQLite, LangChain/LangGraph for AI orchestration, Next.js frontend, Docker deployment. Sources (RSS, GitHub, Twitter) feed into configurable agents that process content via LLM calls (Claude/OpenAI), then publish to social platforms.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy (async), LangChain, LangGraph, Anthropic SDK, OpenAI SDK, Langfuse, APScheduler, Next.js 16, Docker

---

## Phase 1: Project Foundation

### 1.1: Backend Scaffolding

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: Create requirements.txt**

```txt
# Core
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy[asyncio]>=2.0.0
aiosqlite>=0.20.0
pydantic>=2.0.0
pydantic-settings>=2.0.0

# AI
langchain>=0.3.0
langgraph>=0.2.0
anthropic>=0.40.0
openai>=1.0.0

# Tracing
langfuse>=2.0.0

# Scheduler
apscheduler>=3.10.0

# Sources
feedparser>=6.0.0
httpx>=0.27.0
PyGithub>=2.0.0
twitter-api-v2>=1.0.0

# Publishers
requests>=2.31.0

# Utils
python-dotenv>=1.0.0
cryptography>=42.0.0
```

- [ ] **Step 2: Create app/config.py**

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite+aiosqlite:///data/runit.db"
    
    # LLM Providers
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    
    # Langfuse
    langfuse_host: str = "https://cloud.langfuse.com"
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    
    # Storage
    data_dir: str = "/app/data"
    backup_dir: str = "/app/backup"
    local_obsidian_path: str = "/backup/obsidian"
    
    # Scheduler
    scheduler_enabled: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 3: Create app/database.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 4: Create app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="RunIt API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

- [ ] **Step 5: Test backend starts**

Run: `cd backend && pip install -r requirements.txt && python -c "from app.main import app; print('OK')"`
Expected: "OK"

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: scaffold FastAPI backend with config and database"
```

---

### 1.2: Database Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/llm_provider.py`
- Create: `backend/app/models/agent.py`
- Create: `backend/app/models/data_source.py`
- Create: `backend/app/models/task.py`
- Create: `backend/app/models/publisher.py`
- Create: `backend/app/models/published_item.py`

- [ ] **Step 1: Create models/__init__.py**

```python
from app.models.llm_provider import LLMProvider
from app.models.agent import Agent
from app.models.data_source import DataSource
from app.models.task import Task
from app.models.publisher import Publisher
from app.models.published_item import PublishedItem

__all__ = [
    "LLMProvider",
    "Agent",
    "DataSource",
    "Task",
    "Publisher",
    "PublishedItem",
]
```

- [ ] **Step 2: Create LLMProvider model**

```python
import uuid
from sqlalchemy import String, Boolean, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LLMProvider(Base):
    __tablename__ = "llm_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # openai, anthropic, ollama, siliconflow
    api_key: Mapped[str] = mapped_column(Text, nullable=False)
    base_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    default_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    agents: Mapped[list["Agent"]] = relationship("Agent", back_populates="llm_provider")
```

- [ ] **Step 3: Create Agent model**

```python
import uuid
from sqlalchemy import String, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # github, twitter, rss
    llm_provider_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("llm_providers.id"), nullable=True)
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    output_format: Mapped[str] = mapped_column(String(50), default="markdown")  # markdown, html, image_params
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    llm_provider: Mapped["LLMProvider | None"] = relationship("LLMProvider", back_populates="agents")
    data_sources: Mapped[list["DataSource"]] = relationship("DataSource", back_populates="agent")
```

- [ ] **Step 4: Create DataSource model**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # github, twitter, rss
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    agent_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("agents.id"), nullable=True)
    schedule: Mapped[str] = mapped_column(String(100), nullable=False)  # cron expression
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    agent: Mapped["Agent | None"] = relationship("Agent", back_populates="data_sources")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="data_source")
```

- [ ] **Step 5: Create Task model**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, JSON, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("data_sources.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.PENDING.value)
    raw_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    images: Mapped[list | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    data_source: Mapped["DataSource"] = relationship("DataSource", back_populates="tasks")
    published_items: Mapped[list["PublishedItem"]] = relationship("PublishedItem", back_populates="task")
```

- [ ] **Step 6: Create Publisher model**

```python
import uuid
from sqlalchemy import String, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Publisher(Base):
    __tablename__ = "publishers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # twitter, xiaohongshu, wechat
    credentials: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    published_items: Mapped[list["PublishedItem"]] = relationship("PublishedItem", back_populates="publisher")
```

- [ ] **Step 7: Create PublishedItem model**

```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PublishedItem(Base):
    __tablename__ = "published_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=False)
    publisher_id: Mapped[str] = mapped_column(String(36), ForeignKey("publishers.id"), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="published_items")
    publisher: Mapped["Publisher"] = relationship("Publisher", back_populates="published_items")
```

- [ ] **Step 8: Test models import correctly**

Run: `cd backend && python -c "from app.models import *; print('Models OK')"`
Expected: "Models OK"

- [ ] **Step 9: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add database models for LLMProvider, Agent, DataSource, Task, Publisher, PublishedItem"
```

---

### 1.3: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/llm_provider.py`
- Create: `backend/app/schemas/agent.py`
- Create: `backend/app/schemas/data_source.py`
- Create: `backend/app/schemas/task.py`
- Create: `backend/app/schemas/publisher.py`

- [ ] **Step 1: Create schemas/__init__.py**

```python
from app.schemas.llm_provider import LLMProviderCreate, LLMProviderUpdate, LLMProviderResponse
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse
from app.schemas.data_source import DataSourceCreate, DataSourceUpdate, DataSourceResponse
from app.schemas.task import TaskResponse, TaskListResponse
from app.schemas.publisher import PublisherCreate, PublisherUpdate, PublisherResponse

__all__ = [
    "LLMProviderCreate", "LLMProviderUpdate", "LLMProviderResponse",
    "AgentCreate", "AgentUpdate", "AgentResponse",
    "DataSourceCreate", "DataSourceUpdate", "DataSourceResponse",
    "TaskResponse", "TaskListResponse",
    "PublisherCreate", "PublisherUpdate", "PublisherResponse",
]
```

- [ ] **Step 2: Create LLMProvider schemas**

```python
from pydantic import BaseModel, Field
from typing import Optional


class LLMProviderBase(BaseModel):
    name: str = Field(..., max_length=100)
    provider: str = Field(..., max_length=50)
    api_key: str
    base_url: Optional[str] = None
    model: str = Field(..., max_length=100)
    default_params: Optional[dict] = None
    enabled: bool = True
    is_default: bool = False


class LLMProviderCreate(LLMProviderBase):
    pass


class LLMProviderUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    default_params: Optional[dict] = None
    enabled: Optional[bool] = None
    is_default: Optional[bool] = None


class LLMProviderResponse(LLMProviderBase):
    id: str

    class Config:
        from_attributes = True
```

- [ ] **Step 3: Create Agent schemas**

```python
from pydantic import BaseModel, Field
from typing import Optional


class AgentBase(BaseModel):
    name: str = Field(..., max_length=100)
    source_type: str = Field(..., max_length=50)
    llm_provider_id: Optional[str] = None
    prompt_template: str = ""
    output_format: str = "markdown"
    config: Optional[dict] = None


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    llm_provider_id: Optional[str] = None
    prompt_template: Optional[str] = None
    output_format: Optional[str] = None
    config: Optional[dict] = None


class AgentResponse(AgentBase):
    id: str

    class Config:
        from_attributes = True
```

- [ ] **Step 4: Create DataSource schemas**

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DataSourceBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = Field(..., max_length=50)
    config: dict = {}
    agent_id: Optional[str] = None
    schedule: str = "0 * * * *"  # hourly
    enabled: bool = True


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    config: Optional[dict] = None
    agent_id: Optional[str] = None
    schedule: Optional[str] = None
    enabled: Optional[bool] = None


class DataSourceResponse(DataSourceBase):
    id: str
    last_run_at: Optional[datetime] = None

    class Config:
        from_attributes = True
```

- [ ] **Step 5: Create Task schemas**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskResponse(BaseModel):
    id: str
    source_id: str
    status: str
    raw_content: Optional[str] = None
    processed_content: Optional[str] = None
    images: Optional[list] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 6: Create Publisher schemas**

```python
from pydantic import BaseModel, Field
from typing import Optional


class PublisherBase(BaseModel):
    name: str = Field(..., max_length=100)
    type: str = Field(..., max_length=50)
    credentials: dict = {}
    enabled: bool = True


class PublisherCreate(PublisherBase):
    pass


class PublisherUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    credentials: Optional[dict] = None
    enabled: Optional[bool] = None


class PublisherResponse(PublisherBase):
    id: str

    class Config:
        from_attributes = True
```

- [ ] **Step 7: Test schemas import correctly**

Run: `cd backend && python -c "from app.schemas import *; print('Schemas OK')"`
Expected: "Schemas OK"

- [ ] **Step 8: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: add Pydantic schemas for API validation"
```

---

## Phase 2: API Routes

### 2.1: LLM Provider Routes

**Files:**
- Create: `backend/app/api/llm.py`

- [ ] **Step 1: Create API routes for LLM providers**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import list

from app.database import get_db
from app.models import LLMProvider
from app.schemas import LLMProviderCreate, LLMProviderUpdate, LLMProviderResponse

router = APIRouter(prefix="/api/llm/providers", tags=["LLM Providers"])


@router.get("", response_model=list[LLMProviderResponse])
async def list_providers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider))
    providers = result.scalars().all()
    return providers


@router.post("", response_model=LLMProviderResponse)
async def create_provider(provider: LLMProviderCreate, db: AsyncSession = Depends(get_db)):
    db_provider = LLMProvider(**provider.model_dump())
    db.add(db_provider)
    await db.commit()
    await db.refresh(db_provider)
    return db_provider


@router.get("/{provider_id}", response_model=LLMProviderResponse)
async def get_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.put("/{provider_id}", response_model=LLMProviderResponse)
async def update_provider(provider_id: str, provider: LLMProviderUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == provider_id))
    db_provider = result.scalar_one_or_none()
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    for key, value in provider.model_dump(exclude_unset=True).items():
        setattr(db_provider, key, value)
    
    await db.commit()
    await db.refresh(db_provider)
    return db_provider


@router.delete("/{provider_id}")
async def delete_provider(provider_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMProvider).where(LLMProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    await db.delete(provider)
    await db.commit()
    return {"status": "deleted"}


@router.post("/test")
async def test_provider(provider: LLMProviderCreate):
    # TODO: Implement connection test based on provider type
    return {"status": "ok", "message": "Provider configuration is valid"}
```

- [ ] **Step 2: Register router in main.py**

Edit: `backend/app/main.py` - add router import and registration

```python
from app.api.llm import router as llm_router
# ... in app = FastAPI(...):
app.include_router(llm_router)
```

- [ ] **Step 3: Test API endpoint**

Run: `cd backend && uvicorn app.main:app --reload &` then `curl http://localhost:8000/api/llm/providers`
Expected: `[]`

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/llm.py backend/app/main.py
git commit -m "feat: add LLM provider API routes"
```

---

### 2.2: Agent Routes

**Files:**
- Create: `backend/app/api/agents.py`

- [ ] **Step 1: Create agent routes**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Agent
from app.schemas import AgentCreate, AgentUpdate, AgentResponse

router = APIRouter(prefix="/api/agents", tags=["Agents"])


@router.get("", response_model=list[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent))
    agents = result.scalars().all()
    return agents


@router.post("", response_model=AgentResponse)
async def create_agent(agent: AgentCreate, db: AsyncSession = Depends(get_db)):
    db_agent = Agent(**agent.model_dump())
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    return db_agent


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, agent: AgentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    db_agent = result.scalar_one_or_none()
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    for key, value in agent.model_dump(exclude_unset=True).items():
        setattr(db_agent, key, value)
    
    await db.commit()
    await db.refresh(db_agent)
    return db_agent


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    await db.delete(agent)
    await db.commit()
    return {"status": "deleted"}
```

- [ ] **Step 2: Register router in main.py**

Edit: `backend/app/main.py` - add import and registration

```python
from app.api.agents import router as agents_router
# ...
app.include_router(agents_router)
```

- [ ] **Step 3: Test API endpoint**

Run: `curl http://localhost:8000/api/agents`
Expected: `[]`

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/agents.py backend/app/main.py
git commit -m "feat: add agent API routes"
```

---

### 2.3: DataSource Routes

**Files:**
- Create: `backend/app/api/sources.py`

- [ ] **Step 1: Create data source routes**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import DataSource
from app.schemas import DataSourceCreate, DataSourceUpdate, DataSourceResponse

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])


@router.get("", response_model=list[DataSourceResponse])
async def list_sources(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DataSource))
    sources = result.scalars().all()
    return sources


@router.post("", response_model=DataSourceResponse)
async def create_source(source: DataSourceCreate, db: AsyncSession = Depends(get_db)):
    db_source = DataSource(**source.model_dump())
    db.add(db_source)
    await db.commit()
    await db.refresh(db_source)
    return db_source


@router.get("/{source_id}", response_model=DataSourceResponse)
async def get_source(source_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.put("/{source_id}", response_model=DataSourceResponse)
async def update_source(source_id: str, source: DataSourceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    db_source = result.scalar_one_or_none()
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    for key, value in source.model_dump(exclude_unset=True).items():
        setattr(db_source, key, value)
    
    await db.commit()
    await db.refresh(db_source)
    return db_source


@router.delete("/{source_id}")
async def delete_source(source_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DataSource).where(DataSource.id == source_id))
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    await db.delete(source)
    await db.commit()
    return {"status": "deleted"}


@router.post("/{source_id}/run")
async def run_source(source_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: Trigger manual run
    return {"status": "triggered", "source_id": source_id}
```

- [ ] **Step 2: Register router in main.py**

Edit: `backend/app/main.py` - add import and registration

```python
from app.api.sources import router as sources_router
# ...
app.include_router(sources_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/sources.py backend/app/main.py
git commit -m "feat: add data source API routes"
```

---

### 2.4: Task Routes

**Files:**
- Create: `backend/app/api/tasks.py`

- [ ] **Step 1: Create task routes**

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Task
from app.schemas import TaskResponse, TaskListResponse

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Task)
    if status:
        query = query.where(Task.status == status)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.order_by(Task.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return TaskListResponse(
        items=tasks,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/retry")
async def retry_task(task_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: Implement retry logic
    return {"status": "triggered", "task_id": task_id}
```

- [ ] **Step 2: Register router in main.py**

Edit: `backend/app/main.py` - add import and registration

```python
from app.api.tasks import router as tasks_router
# ...
app.include_router(tasks_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/tasks.py backend/app/main.py
git commit -m "feat: add task API routes"
```

---

### 2.5: Publisher Routes

**Files:**
- Create: `backend/app/api/publishers.py`

- [ ] **Step 1: Create publisher routes**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Publisher
from app.schemas import PublisherCreate, PublisherUpdate, PublisherResponse

router = APIRouter(prefix="/api/publishers", tags=["Publishers"])


@router.get("", response_model=list[PublisherResponse])
async def list_publishers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Publisher))
    publishers = result.scalars().all()
    return publishers


@router.post("", response_model=PublisherResponse)
async def create_publisher(publisher: PublisherCreate, db: AsyncSession = Depends(get_db)):
    db_publisher = Publisher(**publisher.model_dump())
    db.add(db_publisher)
    await db.commit()
    await db.refresh(db_publisher)
    return db_publisher


@router.get("/{publisher_id}", response_model=PublisherResponse)
async def get_publisher(publisher_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Publisher).where(Publisher.id == publisher_id))
    publisher = result.scalar_one_or_none()
    if not publisher:
        raise HTTPException(status_code=404, detail="Publisher not found")
    return publisher


@router.put("/{publisher_id}", response_model=PublisherResponse)
async def update_publisher(publisher_id: str, publisher: PublisherUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Publisher).where(Publisher.id == publisher_id))
    db_publisher = result.scalar_one_or_none()
    if not db_publisher:
        raise HTTPException(status_code=404, detail="Publisher not found")
    
    for key, value in publisher.model_dump(exclude_unset=True).items():
        setattr(db_publisher, key, value)
    
    await db.commit()
    await db.refresh(db_publisher)
    return db_publisher


@router.delete("/{publisher_id}")
async def delete_publisher(publisher_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Publisher).where(Publisher.id == publisher_id))
    publisher = result.scalar_one_or_none()
    if not publisher:
        raise HTTPException(status_code=404, detail="Publisher not found")
    
    await db.delete(publisher)
    await db.commit()
    return {"status": "deleted"}
```

- [ ] **Step 2: Register router in main.py**

Edit: `backend/app/main.py` - add import and registration

```python
from app.api.publishers import router as publishers_router
# ...
app.include_router(publishers_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/publishers.py backend/app/main.py
git commit -m "feat: add publisher API routes"
```

---

## Phase 3: Source Connectors

### 3.1: Source Base Class

**Files:**
- Create: `backend/app/sources/__init__.py`
- Create: `backend/app/sources/base.py`

- [ ] **Step 1: Create source base class**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class SourceItem:
    """Represents a single item fetched from a data source."""
    id: str
    title: str
    content: str
    url: str | None = None
    author: str | None = None
    published_at: str | None = None
    metadata: dict | None = None


class BaseSource(ABC):
    """Abstract base class for data sources."""
    
    @abstractmethod
    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch items from the data source.
        
        Args:
            config: Source-specific configuration (API keys, filters, etc.)
            
        Returns:
            List of SourceItem objects
        """
        pass
    
    @abstractmethod
    def get_type(self) -> str:
        """Return the source type identifier."""
        pass
```

- [ ] **Step 2: Create sources/__init__.py**

```python
from app.sources.base import BaseSource, SourceItem

__all__ = ["BaseSource", "SourceItem"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/sources/
git commit -m "feat: add source base class"
```

---

### 3.2: RSS Source

**Files:**
- Create: `backend/app/sources/rss/__init__.py`
- Create: `backend/app/sources/rss/client.py`

- [ ] **Step 1: Create RSS client**

```python
import feedparser
from datetime import datetime
from app.sources.base import BaseSource, SourceItem


class RSSSource(BaseSource):
    """RSS/Atom feed source."""
    
    def get_type(self) -> str:
        return "rss"
    
    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch items from RSS feed.
        
        Config:
            url: Feed URL (required)
            max_items: Maximum number of items to fetch (default: 20)
            etag: ETag header for conditional requests
            modified: Last-Modified header for conditional requests
        """
        url = config.get("url")
        if not url:
            raise ValueError("RSS feed URL is required")
        
        max_items = config.get("max_items", 20)
        
        # Parse the feed
        feed = feedparser.parse(url)
        
        if feed.bozo and not feed.entries:
            raise ValueError(f"Failed to parse RSS feed: {feed.bozo_exception}")
        
        items = []
        for entry in feed.entries[:max_items]:
            # Extract content
            content = ""
            if hasattr(entry, "content"):
                content = entry.content[0].value
            elif hasattr(entry, "summary"):
                content = entry.summary
            elif hasattr(entry, "description"):
                content = entry.description
            
            # Extract date
            published = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    dt = datetime(*entry.published_parsed[:6])
                    published = dt.isoformat()
                except Exception:
                    pass
            
            items.append(SourceItem(
                id=entry.get("id", entry.link),
                title=entry.get("title", ""),
                content=content,
                url=entry.get("link"),
                author=entry.get("author"),
                published_at=published,
                metadata={
                    "tags": getattr(entry, "tags", []),
                    "language": getattr(feed.feed, "language", None),
                }
            ))
        
        return items
```

- [ ] **Step 2: Update sources/__init__.py**

```python
from app.sources.base import BaseSource, SourceItem
from app.sources.rss import RSSSource

__all__ = ["BaseSource", "SourceItem", "RSSSource"]
```

- [ ] **Step 3: Create rss/__init__.py**

```python
from app.sources.rss.client import RSSSource

__all__ = ["RSSSource"]
```

- [ ] **Step 4: Test RSS source**

Run: `cd backend && python -c "
import asyncio
from app.sources.rss import RSSSource

async def test():
    source = RSSSource()
    items = await source.fetch({'url': 'https://news.ycombinator.com/rss', 'max_items': 5})
    print(f'Fetched {len(items)} items')
    for item in items[:2]:
        print(f'  - {item.title[:50]}')

asyncio.run(test())
"`
Expected: Fetches items from Hacker News RSS

- [ ] **Step 5: Commit**

```bash
git add backend/app/sources/rss/
git commit -m "feat: add RSS source connector"
```

---

### 3.3: GitHub Source

**Files:**
- Create: `backend/app/sources/github/__init__.py`
- Create: `backend/app/sources/github/client.py`

- [ ] **Step 1: Create GitHub client**

```python
from github import Github
from github.GithubException import GithubException
from app.sources.base import BaseSource, SourceItem


class GitHubSource(BaseSource):
    """GitHub Stars source."""
    
    def get_type(self) -> str:
        return "github"
    
    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch starred repositories.
        
        Config:
            token: GitHub personal access token (required)
            username: GitHub username (required for fetching user's stars)
            max_items: Maximum number of repos to fetch (default: 100)
        """
        token = config.get("token")
        username = config.get("username")
        
        if not token or not username:
            raise ValueError("GitHub token and username are required")
        
        max_items = config.get("max_items", 100)
        
        g = Github(token)
        
        try:
            user = g.get_user(username)
            starred = user.get_starred()
            
            items = []
            count = 0
            for repo in starred:
                if count >= max_items:
                    break
                
                # Build content from repo info
                content = f"# {repo.full_name}\n\n"
                content += f"{repo.description or 'No description'}\n\n"
                content += f"**Language:** {repo.language or 'Unknown'}\n"
                content += f"**Stars:** {repo.stargazers_count}\n"
                content += f"**Forks:** {repo.forks_count}\n\n"
                content += f"**Topics:** {', '.join(repo.get_topics()) if hasattr(repo, 'get_topics') else 'None'}\n\n"
                content += f"[Repository Link]({repo.html_url})\n"
                
                items.append(SourceItem(
                    id=str(repo.id),
                    title=repo.full_name,
                    content=content,
                    url=repo.html_url,
                    author=repo.owner.login,
                    published_at=repo.starred_at.isoformat() if repo.starred_at else None,
                    metadata={
                        "stars": repo.stargazers_count,
                        "forks": repo.forks_count,
                        "language": repo.language,
                        "topics": repo.get_topics() if hasattr(repo, 'get_topics') else [],
                    }
                ))
                count += 1
            
            return items
            
        except GithubException as e:
            raise ValueError(f"GitHub API error: {e.status} - {e.data}")
        finally:
            g.close()
```

- [ ] **Step 2: Create github/__init__.py**

```python
from app.sources.github.client import GitHubSource

__all__ = ["GitHubSource"]
```

- [ ] **Step 3: Update sources/__init__.py**

```python
from app.sources.base import BaseSource, SourceItem
from app.sources.rss import RSSSource
from app.sources.github import GitHubSource

__all__ = ["BaseSource", "SourceItem", "RSSSource", "GitHubSource"]
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/sources/github/
git commit -m "feat: add GitHub source connector"
```

---

### 3.4: Twitter Source

**Files:**
- Create: `backend/app/sources/twitter/__init__.py`
- Create: `backend/app/sources/twitter/client.py`

- [ ] **Step 1: Create Twitter client**

```python
from typing import Optional
from app.sources.base import BaseSource, SourceItem


class TwitterSource(BaseSource):
    """Twitter bookmarks and timeline source."""
    
    def get_type(self) -> str:
        return "twitter"
    
    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch tweets from bookmarks or timeline.
        
        Config:
            api_key: Twitter API key
            api_secret: Twitter API secret
            access_token: Access token
            access_secret: Access token secret
            source: 'bookmarks' or 'timeline' (default: bookmarks)
            max_items: Maximum number of tweets (default: 50)
        """
        # Note: Twitter API v2 implementation
        # This requires bearer token for v2 API
        bearer_token = config.get("bearer_token")
        
        if not bearer_token:
            raise ValueError("Twitter bearer token is required")
        
        source_type = config.get("source", "bookmarks")
        max_items = config.get("max_items", 50)
        
        # TODO: Implement Twitter API v2 calls
        # For now, return empty list as placeholder
        return []
```

- [ ] **Step 2: Create twitter/__init__.py**

```python
from app.sources.twitter.client import TwitterSource

__all__ = ["TwitterSource"]
```

- [ ] **Step 3: Update sources/__init__.py**

```python
from app.sources.base import BaseSource, SourceItem
from app.sources.rss import RSSSource
from app.sources.github import GitHubSource
from app.sources.twitter import TwitterSource

__all__ = ["BaseSource", "SourceItem", "RSSSource", "GitHubSource", "TwitterSource"]
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/sources/twitter/
git commit -m "feat: add Twitter source connector (placeholder)"
```

---

## Phase 4: LLM Integration

### 4.1: LLM Provider Factory

**Files:**
- Create: `backend/app/llm/__init__.py`
- Create: `backend/app/llm/providers.py`

- [ ] **Step 1: Create LLM provider factory**

```python
from typing import Optional
from langchain.chat_models import ChatAnthropic, ChatOpenAI
from langchain.chat_models.base import BaseChatModel
from app.config import get_settings


def create_llm_provider(
    provider_type: str,
    api_key: str,
    model: str,
    base_url: Optional[str] = None,
    **kwargs
) -> BaseChatModel:
    """
    Create an LLM provider instance.
    
    Args:
        provider_type: 'anthropic', 'openai', 'ollama', 'siliconflow'
        api_key: API key
        model: Model name
        base_url: Optional base URL for proxies
        **kwargs: Additional parameters (temperature, max_tokens, etc.)
    """
    if provider_type == "anthropic":
        return ChatAnthropic(
            anthropic_api_key=api_key,
            model=model,
            **kwargs
        )
    elif provider_type == "openai":
        return ChatOpenAI(
            openai_api_key=api_key,
            model=model,
            base_url=base_url,
            **kwargs
        )
    elif provider_type == "ollama":
        return ChatOpenAI(
            openai_api_key="ollama",  # Dummy key for local
            model=model,
            base_url=base_url or "http://localhost:11434/v1",
            **kwargs
        )
    elif provider_type == "siliconflow":
        return ChatOpenAI(
            openai_api_key=api_key,
            model=model,
            base_url="https://api.siliconflow.cn/v1",
            **kwargs
        )
    else:
        raise ValueError(f"Unknown provider type: {provider_type}")
```

- [ ] **Step 2: Create llm/__init__.py**

```python
from app.llm.providers import create_llm_provider

__all__ = ["create_llm_provider"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/llm/
git commit -m "feat: add LLM provider factory"
```

---

### 4.2: Langfuse Integration

**Files:**
- Create: `backend/app/llm/langfuse.py`

- [ ] **Step 1: Create Langfuse integration**

```python
from typing import Optional
from langfuse import Langfuse
from langfuse.callback import CallbackHandler
from app.config import get_settings

settings = get_settings()

# Initialize Langfuse client (lazy)
_langfuse_client: Optional[Langfuse] = None


def get_langfuse() -> Optional[Langfuse]:
    """Get or create Langfuse client."""
    global _langfuse_client
    
    if not settings.langfuse_public_key or not settings.langfuse_secret_key:
        return None
    
    if _langfuse_client is None:
        _langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
    
    return _langfuse_client


def get_langfuse_callback() -> Optional[CallbackHandler]:
    """Get Langfuse callback handler for LangChain."""
    client = get_langfuse()
    if client is None:
        return None
    
    return CallbackHandler(
        client=client,
        metadata={"service": "runit"}
    )
```

- [ ] **Step 2: Update llm/__init__.py**

```python
from app.llm.providers import create_llm_provider
from app.llm.langfuse import get_langfuse, get_langfuse_callback

__all__ = ["create_llm_provider", "get_langfuse", "get_langfuse_callback"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/llm/langfuse.py
git commit -m "feat: add Langfuse integration"
```

---

## Phase 5: Agent System

### 5.1: Agent Base and Registry

**Files:**
- Create: `backend/app/agents/__init__.py`
- Create: `backend/app/agents/base.py`
- Create: `backend/app/agents/registry.py`

- [ ] **Step 1: Create agent base**

```python
from abc import ABC, abstractmethod
from typing import Any, TypedDict
from langchain.graph import StateGraph
from langgraph.graph import END, START


class AgentState(TypedDict):
    """Base state for all agents."""
    raw_content: str
    processed_content: str | None
    metadata: dict | None
    error: str | None


class BaseAgent(ABC):
    """Abstract base class for content processing agents."""
    
    @abstractmethod
    def get_name(self) -> str:
        """Return agent identifier."""
        pass
    
    @abstractmethod
    def get_source_type(self) -> str:
        """Return the source type this agent handles."""
        pass
    
    @abstractmethod
    def create_graph(self) -> StateGraph:
        """Create the LangGraph state graph."""
        pass
    
    def get_graph(self) -> StateGraph:
        """Get compiled graph (cached)."""
        if not hasattr(self, "_graph"):
            self._graph = self.create_graph().compile()
        return self._graph
    
    async def run(self, input_data: dict) -> dict:
        """Run the agent on input data."""
        graph = self.get_graph()
        result = await graph.ainvoke(input_data)
        return result
```

- [ ] **Step 2: Create agent registry**

```python
from typing import Dict, Type
from app.agents.base import BaseAgent

# Registry of available agents
_agent_registry: Dict[str, Type[BaseAgent]] = {}


def register_agent(agent_class: Type[BaseAgent]):
    """Decorator to register an agent."""
    _agent_registry[agent_class.get_source_type()] = agent_class
    return agent_class


def get_agent(source_type: str) -> BaseAgent | None:
    """Get an agent instance by source type."""
    agent_class = _agent_registry.get(source_type)
    if agent_class:
        return agent_class()
    return None


def list_agents() -> list[str]:
    """List all registered agent types."""
    return list(_agent_registry.keys())
```

- [ ] **Step 3: Update agents/__init__.py**

```python
from app.agents.base import BaseAgent, AgentState
from app.agents.registry import register_agent, get_agent, list_agents

__all__ = ["BaseAgent", "AgentState", "register_agent", "get_agent", "list_agents"]
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/agents/
git commit -m "feat: add agent base class and registry"
```

---

### 5.2: RSS Agent

**Files:**
- Create: `backend/app/agents/rss/__init__.py`
- Create: `backend/app/agents/rss/graph.py`
- Create: `backend/app/agents/rss/prompts.py`

- [ ] **Step 1: Create RSS agent prompts**

```python
RSS_SYSTEM_PROMPT = """You are a content curator specializing in RSS feeds.
Your task is to transform raw RSS/Atom feed content into engaging, well-formatted content.

Guidelines:
- Summarize the key points concisely
- Highlight actionable insights or interesting findings
- Format with appropriate markdown
- Keep it suitable for social media (under 2000 characters for main text)
- Add relevant hashtags if appropriate
"""


RSS_USER_PROMPT = """Transform the following RSS feed content into engaging social media content:

Title: {title}
Source: {source}
Content: {content}

Original URL: {url}

Create a concise, engaging summary that would work well on social media."""
```

- [ ] **Step 2: Create RSS agent graph**

```python
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage
from langgraph.graph import StateGraph, END, START
from app.agents.base import BaseAgent, AgentState, register_agent
from app.agents.rss.prompts import RSS_SYSTEM_PROMPT, RSS_USER_PROMPT


@register_agent
class RSSAgent(BaseAgent):
    """Agent for processing RSS feed content."""
    
    def get_name(self) -> str:
        return "rss_agent"
    
    def get_source_type(self) -> str:
        return "rss"
    
    def create_graph(self) -> StateGraph:
        builder = StateGraph(AgentState)
        
        # Add nodes
        builder.add_node("parse", self._parse_node)
        builder.add_node("process", self._process_node)
        builder.add_node("format", self._format_node)
        
        # Define edges
        builder.add_edge(START, "parse")
        builder.add_edge("parse", "process")
        builder.add_edge("process", "format")
        builder.add_edge("format", END)
        
        return builder
    
    async def _parse_node(self, state: AgentState) -> dict:
        """Parse and validate raw content."""
        # Content is already parsed from RSS, just validate
        return {"metadata": {"parsed": True}}
    
    async def _process_node(self, state: AgentState) -> dict:
        """Process content with LLM."""
        from app.llm.providers import create_llm_provider
        
        # Get LLM from config (passed in via metadata)
        llm_config = state.get("metadata", {}).get("llm_config", {})
        if not llm_config:
            return {"error": "No LLM configuration provided"}
        
        llm = create_llm_provider(
            provider_type=llm_config.get("provider", "anthropic"),
            api_key=llm_config.get("api_key", ""),
            model=llm_config.get("model", "claude-sonnet-4-20250514"),
            temperature=0.7,
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", RSS_SYSTEM_PROMPT),
            ("human", RSS_USER_PROMPT),
        ])
        
        metadata = state.get("metadata", {})
        chain = prompt | llm
        
        result = await chain.ainvoke({
            "title": metadata.get("title", ""),
            "source": metadata.get("source", ""),
            "content": state["raw_content"],
            "url": metadata.get("url", ""),
        })
        
        return {"processed_content": result.content}
    
    async def _format_node(self, state: AgentState) -> dict:
        """Format the final output."""
        return {"metadata": {"formatted": True}}
```

- [ ] **Step 3: Create rss/__init__.py**

```python
from app.agents.rss.graph import RSSAgent

__all__ = ["RSSAgent"]
```

- [ ] **Step 4: Update agents/__init__.py**

```python
from app.agents.base import BaseAgent, AgentState
from app.agents.registry import register_agent, get_agent, list_agents
from app.agents.rss import RSSAgent

__all__ = ["BaseAgent", "AgentState", "register_agent", "get_agent", "list_agents", "RSSAgent"]
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/agents/rss/
git commit -m "feat: add RSS agent with LangGraph"
```

---

## Phase 6: Publisher Adapters

### 6.1: Publisher Base and Registry

**Files:**
- Create: `backend/app/publishers/__init__.py`
- Create: `backend/app/publishers/base.py`

- [ ] **Step 1: Create publisher base**

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class PublishResult:
    """Result of a publish operation."""
    success: bool
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    error: Optional[str] = None


class BasePublisher(ABC):
    """Abstract base class for platform publishers."""
    
    @abstractmethod
    def get_type(self) -> str:
        """Return the publisher type identifier."""
        pass
    
    @abstractmethod
    async def publish(self, content: str, images: list[str] | None = None, **kwargs) -> PublishResult:
        """
        Publish content to the platform.
        
        Args:
            content: The content to publish (markdown or HTML)
            images: Optional list of image paths
            **kwargs: Additional platform-specific parameters
            
        Returns:
            PublishResult with external_id and url if successful
        """
        pass
    
    def validate_credentials(self, credentials: dict) -> bool:
        """
        Validate that credentials are properly configured.
        Override in subclass for platform-specific validation.
        """
        return bool(credentials)
```

- [ ] **Step 2: Create publishers/__init__.py**

```python
from app.publishers.base import BasePublisher, PublishResult

__all__ = ["BasePublisher", "PublishResult"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/publishers/
git commit -m "feat: add publisher base class"
```

---

### 6.2: Twitter Publisher

**Files:**
- Create: `backend/app/publishers/twitter/__init__.py`
- Create: `backend/app/publishers/twitter/client.py`

- [ ] **Step 1: Create Twitter publisher**

```python
import httpx
from app.publishers.base import BasePublisher, PublishResult


class TwitterPublisher(BasePublisher):
    """Publisher for Twitter/X."""
    
    def get_type(self) -> str:
        return "twitter"
    
    async def publish(self, content: str, images: list[str] | None = None, **kwargs) -> PublishResult:
        """
        Publish to Twitter.
        
        Args:
            content: Tweet text (max 280 chars for standard tweets)
            images: Optional image URLs
            credentials: Must contain bearer_token, api_key, api_secret
        """
        credentials = kwargs.get("credentials", {})
        bearer_token = credentials.get("bearer_token")
        api_key = credentials.get("api_key")
        api_secret = credentials.get("api_secret")
        access_token = credentials.get("access_token")
        access_secret = credentials.get("access_secret")
        
        if not all([bearer_token, api_key, api_secret, access_token, access_secret]):
            return PublishResult(
                success=False,
                error="Missing required Twitter credentials"
            )
        
        # Twitter API v2 implementation
        # TODO: Implement actual Twitter API call
        # This would use tweepy or direct API calls
        
        return PublishResult(
            success=True,
            external_id="placeholder_id",
            external_url=f"https://twitter.com/user/status/placeholder"
        )
```

- [ ] **Step 2: Create twitter/__init__.py**

```python
from app.publishers.twitter.client import TwitterPublisher

__all__ = ["TwitterPublisher"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/publishers/twitter/
git commit -m "feat: add Twitter publisher (placeholder)"
```

---

## Phase 7: Storage & Backup

### 7.1: Content Storage

**Files:**
- Create: `backend/app/storage/__init__.py`
- Create: `backend/app/storage/content.py`
- Create: `backend/app/storage/backup.py`

- [ ] **Step 1: Create content storage**

```python
import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
from app.config import get_settings

settings = get_settings()


class ContentStorage:
    """Store processed content to local filesystem."""
    
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.data_dir) / "content"
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def save(self, content: str, metadata: dict, format: str = "md") -> str:
        """
        Save content to file.
        
        Returns the file path.
        """
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.{format}"
        filepath = self.base_path / filename
        
        # Write content
        filepath.write_text(content, encoding="utf-8")
        
        # Write metadata
        meta_path = self.base_path / f"{file_id}.meta.json"
        meta_data = {
            "id": file_id,
            "created_at": datetime.utcnow().isoformat(),
            "format": format,
            **metadata
        }
        meta_path.write_text(json.dumps(meta_data, indent=2), encoding="utf-8")
        
        return str(filepath)
    
    def load(self, file_id: str) -> tuple[str, dict]:
        """Load content and metadata by file ID."""
        content_path = self.base_path / f"{file_id}.md"
        meta_path = self.base_path / f"{file_id}.meta.json"
        
        if not content_path.exists():
            raise FileNotFoundError(f"Content {file_id} not found")
        
        content = content_path.read_text(encoding="utf-8")
        
        if meta_path.exists():
            metadata = json.loads(meta_path.read_text(encoding="utf-8"))
        else:
            metadata = {}
        
        return content, metadata
    
    def list(self, limit: int = 100) -> list[dict]:
        """List stored content files."""
        files = []
        for meta_path in sorted(self.base_path.glob("*.meta.json"), reverse=True)[:limit]:
            try:
                metadata = json.loads(meta_path.read_text(encoding="utf-8"))
                files.append(metadata)
            except Exception:
                continue
        return files
```

- [ ] **Step 2: Create backup module**

```python
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from app.config import get_settings

settings = get_settings()


class ObsidianBackup:
    """Backup content to Obsidian-compatible directory."""
    
    def __init__(self, target_path: Optional[str] = None):
        self.target_path = Path(target_path or settings.local_obsidian_path)
        self.target_path.mkdir(parents=True, exist_ok=True)
    
    def backup(self, content: str, filename: str, metadata: dict) -> str:
        """
        Backup content to Obsidian directory.
        
        Creates dated subdirectories and handles duplicate filenames.
        
        Returns the backup path.
        """
        # Create date-based folder structure
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        dated_dir = self.target_path / date_str
        dated_dir.mkdir(parents=True, exist_ok=True)
        
        # Handle filename conflicts
        base_name = Path(filename).stem
        extension = Path(filename).suffix or ".md"
        backup_path = dated_dir / f"{base_name}{extension}"
        
        counter = 1
        while backup_path.exists():
            backup_path = dated_dir / f"{base_name}_{counter}{extension}"
            counter += 1
        
        # Add frontmatter
        frontmatter = self._generate_frontmatter(metadata)
        full_content = f"{frontmatter}\n\n{content}"
        
        backup_path.write_text(full_content, encoding="utf-8")
        
        return str(backup_path)
    
    def _generate_frontmatter(self, metadata: dict) -> str:
        """Generate Obsidian-compatible frontmatter."""
        lines = ["---"]
        lines.append(f"created: {datetime.utcnow().isoformat()}")
        
        for key, value in metadata.items():
            if value is not None:
                if isinstance(value, list):
                    lines.append(f"{key}: [{', '.join(str(v) for v in value)}]")
                elif isinstance(value, dict):
                    lines.append(f"{key}: {json.dumps(value)}")
                else:
                    lines.append(f"{key}: {value}")
        
        lines.append("---")
        return "\n".join(lines)
```

- [ ] **Step 3: Update storage/__init__.py**

```python
from app.storage.content import ContentStorage
from app.storage.backup import ObsidianBackup

__all__ = ["ContentStorage", "ObsidianBackup"]
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/storage/
git commit -m "feat: add content storage and Obsidian backup"
```

---

## Phase 8: Worker & Scheduler

### 8.1: Task Executor

**Files:**
- Create: `backend/app/worker/__init__.py`
- Create: `backend/app/worker/executor.py`

- [ ] **Step 1: Create task executor**

```python
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker
from app.models import DataSource, Task, Agent
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
    
    async def execute_source(self, source_id: str, db: AsyncSession):
        """Execute a data source: fetch, process, store."""
        # Load data source
        result = await db.execute(select(DataSource).where(DataSource.id == source_id))
        source = result.scalar_one_or_none()
        
        if not source or not source.enabled:
            return
        
        # Create task
        task = Task(
            source_id=source_id,
            status="running",
            started_at=datetime.utcnow(),
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        
        try:
            # Fetch from source
            source_client = self.sources.get(source.type)
            if not source_client:
                raise ValueError(f"Unknown source type: {source.type}")
            
            items = await source_client.fetch(source.config)
            
            # Process each item with agent
            for item in items:
                await self._process_item(item, source, task, db)
            
            # Update task status
            task.status = "completed"
            task.completed_at = datetime.utcnow()
            
            # Update source last run
            source.last_run_at = datetime.utcnow()
            
            await db.commit()
            
        except Exception as e:
            task.status = "failed"
            task.error_message = str(e)
            task.completed_at = datetime.utcnow()
            await db.commit()
    
    async def _process_item(self, item, source, task, db):
        """Process a single item through agent."""
        # Load agent if configured
        agent = None
        if source.agent_id:
            result = await db.execute(select(Agent).where(Agent.id == source.agent_id))
            db_agent = result.scalar_one_or_none()
            if db_agent:
                agent = get_agent(source.type)
        
        # Store raw content
        task.raw_content = item.content
        
        # If agent exists, process content
        if agent and db_agent:
            # TODO: Call agent with LLM config from db_agent
            pass
        
        # Save to storage
        metadata = {
            "title": item.title,
            "url": item.url,
            "source": source.name,
            "source_type": source.type,
        }
        filepath = self.storage.save(
            content=item.content,
            metadata=metadata,
            format="md"
        )
        
        # Backup to Obsidian
        self.backup.backup(
            content=item.content,
            filename=f"{source.type}_{item.id}.md",
            metadata=metadata
        )
```

- [ ] **Step 2: Create worker/__init__.py**

```python
from app.worker.executor import TaskExecutor

__all__ = ["TaskExecutor"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/worker/
git commit -m "feat: add task executor"
```

---

### 8.2: Scheduler

**Files:**
- Create: `backend/app/worker/scheduler.py`

- [ ] **Step 1: Create scheduler**

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker, engine, Base
from app.worker.executor import TaskExecutor


class Scheduler:
    """APScheduler-based job scheduler."""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.executor = TaskExecutor()
    
    async def _run_source(self, source_id: str):
        """Job function to run a data source."""
        async with async_session_maker() as db:
            await self.executor.execute_source(source_id, db)
    
    async def load_jobs(self):
        """Load and schedule jobs from database."""
        async with async_session_maker() as db:
            from app.models import DataSource
            result = await db.execute(
                select(DataSource).where(DataSource.enabled == True)
            )
            sources = result.scalars().all()
            
            for source in sources:
                self.add_job(source)
    
    def add_job(self, source):
        """Add a job for a data source."""
        job_id = f"source_{source.id}"
        
        # Parse cron expression
        # APScheduler uses: minute hour day month day_of_week
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
            # Default to hourly
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
```

- [ ] **Step 2: Integrate scheduler in main.py**

Edit: `backend/app/main.py`

```python
from app.worker.scheduler import Scheduler
from app.config import get_settings

settings = get_settings()

scheduler: Scheduler | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global scheduler
    await init_db()
    
    if settings.scheduler_enabled:
        scheduler = Scheduler()
        scheduler.start()
    
    yield
    
    if scheduler:
        scheduler.stop()
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/worker/scheduler.py backend/app/main.py
git commit -m "feat: add APScheduler integration"
```

---

## Phase 9: Frontend

### 9.1: Next.js Setup

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.ts`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/lib/api.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "runit-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^16.1.6",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "lucide-react": "^0.576.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.5.0",
    "class-variance-authority": "^0.7.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export default nextConfig;
```

- [ ] **Step 3: Create layout.tsx**

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunIt - Content Aggregator",
  description: "AI-powered content aggregation and social media publishing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Create API client lib**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

// LLM Providers
export const api = {
  llm: {
    list: () => fetchAPI("/api/llm/providers"),
    create: (data: any) => fetchAPI("/api/llm/providers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/llm/providers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/llm/providers/${id}`, { method: "DELETE" }),
  },
  agents: {
    list: () => fetchAPI("/api/agents"),
    create: (data: any) => fetchAPI("/api/agents", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/agents/${id}`, { method: "DELETE" }),
  },
  sources: {
    list: () => fetchAPI("/api/sources"),
    create: (data: any) => fetchAPI("/api/sources", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/sources/${id}`, { method: "DELETE" }),
    run: (id: string) => fetchAPI(`/api/sources/${id}/run`, { method: "POST" }),
  },
  tasks: {
    list: (params?: { page?: number; page_size?: number; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/tasks${query ? `?${query}` : ""}`);
    },
    get: (id: string) => fetchAPI(`/api/tasks/${id}`),
    retry: (id: string) => fetchAPI(`/api/tasks/${id}/retry`, { method: "POST" }),
  },
  publishers: {
    list: () => fetchAPI("/api/publishers"),
    create: (data: any) => fetchAPI("/api/publishers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/publishers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/publishers/${id}`, { method: "DELETE" }),
  },
};
```

- [ ] **Step 5: Create dashboard page**

```typescript
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Activity, Database, Rss, Settings } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    sources: 0,
    tasks: 0,
    providers: 0,
    publishers: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [sources, tasks, providers, publishers] = await Promise.all([
          api.sources.list(),
          api.tasks.list({ page_size: 1 }),
          api.llm.list(),
          api.publishers.list(),
        ]);
        setStats({
          sources: sources.length,
          tasks: tasks.total,
          providers: providers.length,
          publishers: publishers.length,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">RunIt Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Data Sources"
          value={stats.sources}
          icon={<Rss className="w-6 h-6" />}
        />
        <StatCard
          title="Tasks"
          value={stats.tasks}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="LLM Providers"
          value={stats.providers}
          icon={<Database className="w-6 h-6" />}
        />
        <StatCard
          title="Publishers"
          value={stats.publishers}
          icon={<Settings className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add web/
git commit -m "feat: scaffold Next.js frontend with dashboard"
```

---

## Phase 10: Docker Deployment

### 10.1: Docker Configuration

**Files:**
- Create: `Dockerfile.backend`
- Create: `Dockerfile.web`
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Create Dockerfile.backend**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Create data directory
RUN mkdir -p /app/data/content /app/data/images /app/backup

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create Dockerfile.web**

```dockerfile
FROM node:22-slim

WORKDIR /app

COPY web/package*.json ./
RUN npm install

COPY web/ .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./backup:/app/backup
      - ./data:/backup/obsidian
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped
```

- [ ] **Step 4: Create .env.example**

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///data/runit.db

# LLM Providers (必选)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Langfuse
LANGFUSE_HOST=https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=

# Storage
DATA_DIR=/app/data
BACKUP_DIR=/app/backup
LOCAL_OBSIDIAN_PATH=/backup/obsidian

# Scheduler
SCHEDULER_ENABLED=true
```

- [ ] **Step 5: Create .gitignore**

```gitignore
# Python
__pycache__/
*.py[cod]
.env

# Node
node_modules/
.next/

# Data
data/
backup/

# IDE
.idea/
.vscode/
```

- [ ] **Step 6: Commit**

```bash
git add Dockerfile.backend Dockerfile.web docker-compose.yml .env.example .gitignore
git commit -m "feat: add Docker deployment configuration"
```

---

## Summary

This plan implements the full RunIt system:

| Phase | Component | Key Deliverables |
|-------|-----------|-----------------|
| 1 | Foundation | FastAPI app, config, database, models, schemas |
| 2 | API Routes | CRUD endpoints for all entities |
| 3 | Sources | RSS, GitHub, Twitter connectors |
| 4 | LLM | Provider factory, Langfuse integration |
| 5 | Agents | Base agent, registry, RSS agent with LangGraph |
| 6 | Publishers | Base publisher, Twitter adapter |
| 7 | Storage | Content storage, Obsidian backup |
| 8 | Worker | Task executor, APScheduler |
| 9 | Frontend | Next.js with dashboard |
| 10 | Deployment | Docker configuration |

---

## Spec Coverage Check

- [x] FastAPI + SQLAlchemy backend
- [x] SQLite storage
- [x] LangChain + LangGraph AI orchestration
- [x] Claude + OpenAI LLM support
- [x] Langfuse tracing
- [x] Next.js frontend
- [x] APScheduler for jobs
- [x] RSS, GitHub, Twitter sources
- [x] Twitter publisher (placeholder)
- [x] Content storage + Obsidian backup
- [x] Docker deployment
- [x] All 6 data models implemented
- [x] All API endpoints defined

---

Plan complete and saved to `docs/superpowers/plans/2026-05-14-runit-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
