from github import Github
from github.GitRelease import GitRelease

from app.sources.base import BaseSource, SourceItem


class GitHubSource(BaseSource):
    """GitHub source connector for fetching starred repositories."""

    def get_type(self) -> str:
        return "github"

    async def fetch(self, config: dict) -> list[SourceItem]:
        """
        Fetch starred repositories from GitHub.

        Args:
            config: Dictionary with 'token' (required), 'username' (required),
                   and 'max_items' (default 100)

        Returns:
            List of SourceItem objects
        """
        token: str = config.get("token")
        username: str = config.get("username")
        max_items: int = config.get("max_items", 100)

        if not token:
            raise ValueError("GitHub token is required")
        if not username:
            raise ValueError("GitHub username is required")

        g: Github = Github(token)
        user = g.get_user(username)
        starred = user.get_starred()

        items: list[SourceItem] = []
        count = 0

        for repo in starred:
            if count >= max_items:
                break

            # Build content from description and metadata
            content_parts: list[str] = []
            if repo.description:
                content_parts.append(repo.description)

            language = repo.language
            if language:
                content_parts.append(f"Language: {language}")

            topics = repo.get_topics()
            if topics:
                content_parts.append(f"Topics: {', '.join(topics)}")

            stars = repo.stargazers_count
            if stars is not None:
                content_parts.append(f"Stars: {stars}")

            forks = repo.forks_count
            if forks is not None:
                content_parts.append(f"Forks: {forks}")

            content = "\n".join(content_parts)

            # Get published_at (created_at for the repo)
            published_at: str | None = None
            if repo.created_at:
                published_at = repo.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Build metadata
            metadata: dict = {
                "full_name": repo.full_name,
                "language": language,
                "stars": stars,
                "forks": forks,
                "topics": topics,
                "open_issues": repo.open_issues_count,
                "watchers": repo.watchers_count,
                "homepage": repo.homepage,
            }

            items.append(
                SourceItem(
                    id=str(repo.id),
                    title=repo.name,
                    content=content,
                    url=repo.html_url,
                    author=repo.owner.login,
                    published_at=published_at,
                    metadata=metadata,
                )
            )

            count += 1

        return items
