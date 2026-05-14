from app.sources.base import BaseSource, SourceItem


class TwitterSource(BaseSource):
    """Twitter source connector (placeholder implementation)."""

    def get_type(self) -> str:
        return "twitter"

    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch items from Twitter (placeholder).

        This is a placeholder implementation that returns an empty list.
        Full Twitter API integration will be implemented when needed.

        Args:
            config: Dictionary with 'bearer_token' (required),
                   'source' (bookmarks/timeline), and 'max_items' (default 50)

        Returns:
            Empty list (placeholder)
        """
        bearer_token: str | None = config.get("bearer_token")

        if not bearer_token:
            raise ValueError("Twitter bearer_token is required")

        # Placeholder: Return empty list until Twitter API v2 integration is implemented
        # When implementing, use tweepy to:
        # - For bookmarks: GET /2/users/:id/bookmarks
        # - For timeline: GET /2/users/:id/tweets

        return []
