from abc import ABC, abstractmethod
from dataclasses import dataclass


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
        """Fetch items from the data source."""
        pass

    @abstractmethod
    def get_type(self) -> str:
        """Return the source type identifier."""
        pass
