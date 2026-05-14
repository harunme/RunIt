from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.config import get_settings
from app.api.llm import router as llm_router
from app.api.agents import router as agents_router
from app.api.sources import router as sources_router
from app.api.tasks import router as tasks_router
from app.api.publishers import router as publishers_router
from app.api.auth import router as auth_router
from app.api.content import router as content_router
from app.worker.scheduler import Scheduler

# Load settings at module level for use throughout the app
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


app = FastAPI(
    title="RunIt API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=len(settings.cors_origins_list) > 0,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(llm_router)
app.include_router(agents_router)
app.include_router(sources_router)
app.include_router(tasks_router)
app.include_router(publishers_router)
app.include_router(auth_router)
app.include_router(content_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
