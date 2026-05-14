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

# CORS middleware: origins are configurable via CORS_ORIGINS env var
# When empty, no origins are allowed (most restrictive)
# When set to comma-separated list, only those origins are allowed
# Note: allow_credentials is only used when origins are explicitly set
settings = get_settings()
cors_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=len(cors_origins) > 0,
    allow_methods=["*"] if cors_origins else ["GET", "POST", "OPTIONS"],
    allow_headers=["*"] if cors_origins else ["Authorization", "Content-Type"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
