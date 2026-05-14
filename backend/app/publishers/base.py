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
        """Publish content to the platform."""
        pass

    def validate_credentials(self, credentials: dict) -> bool:
        """Validate credentials."""
        return bool(credentials)
