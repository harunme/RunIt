from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


# Default paths relative to the project root
_default_data_dir = str(Path(__file__).parent.parent.parent / "data")
_default_backup_dir = str(Path(__file__).parent.parent.parent / "backup")


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = ""  # Comma-separated list of allowed origins, empty for restrictive mode

    # Database
    database_url: str = f"sqlite+aiosqlite:///data/runit.db"

    # LLM Providers
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # Langfuse
    langfuse_host: str = "https://cloud.langfuse.com"
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    # Storage
    data_dir: str = ""  # Will use default if empty
    backup_dir: str = ""  # Will use default if empty
    local_obsidian_path: str = ""  # Will use default if empty

    # Scheduler
    scheduler_enabled: bool = True

    # JWT Auth
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    @property
    def resolved_data_dir(self) -> str:
        return self.data_dir or _default_data_dir

    @property
    def resolved_backup_dir(self) -> str:
        return self.backup_dir or _default_backup_dir

    @property
    def resolved_obsidian_path(self) -> str:
        return self.local_obsidian_path or str(Path(_default_backup_dir) / "obsidian")

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
