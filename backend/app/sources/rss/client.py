import feedparser
from typing import Any

from app.sources.base import BaseSource, SourceItem


class RSSSource(BaseSource):
    """RSS/Atom feed source connector."""

    def get_type(self) -> str:
        return "rss"

    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch items from an RSS/Atom feed.

        Args:
            config: Dictionary with 'url' (required) and 'max_items' (default 20)

        Returns:
            List of SourceItem objects
        """
        url: str = config.get("url")
        max_items: int = config.get("max_items", 20)

        if not url:
            raise ValueError("RSS feed URL is required")

        feed: Any = feedparser.parse(url)

        if feed.bozo and not feed.entries:
            raise ValueError(f"Failed to parse RSS feed: {feed.bozo_exception}")

        items: list[SourceItem] = []
        for entry in feed.entries[:max_items]:
            # Generate ID from link or guid
            item_id: str = getattr(entry, "id", None) or getattr(entry, "link", "")
            if not item_id:
                # Fallback to hash of title
                item_id = str(hash(entry.get("title", "")))

            # Get content (summary or full content)
            content: str = ""
            if hasattr(entry, "summary"):
                content = entry.summary
            elif hasattr(entry, "content"):
                content = entry.content[0].value if entry.content else ""

            # Get published date
            published_at: str | None = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                import time

                published_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", entry.published_parsed)

            # Get author
            author: str | None = None
            if hasattr(entry, "author"):
                author = entry.author
            elif hasattr(entry, "author_detail") and entry.author_detail:
                author = entry.author_detail.get("name")

            # Get URL
            item_url: str | None = getattr(entry, "link", None)

            # Build metadata
            metadata: dict = {}
            if hasattr(entry, "tags"):
                metadata["tags"] = [tag.term for tag in entry.tags]
            if hasattr(entry, "updated_parsed") and entry.updated_parsed:
                import time

                metadata["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", entry.updated_parsed)

            items.append(
                SourceItem(
                    id=item_id,
                    title=entry.get("title", "Untitled"),
                    content=content,
                    url=item_url,
                    author=author,
                    published_at=published_at,
                    metadata=metadata if metadata else None,
                )
            )

        return items
