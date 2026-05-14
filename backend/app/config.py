from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = ""  # Comma-separated list of allowed origins, empty for restrictive mode

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

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse cors_origins string into a list of origins."""
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
