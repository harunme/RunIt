import json
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
        """Backup content to Obsidian directory."""
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        dated_dir = self.target_path / date_str
        dated_dir.mkdir(parents=True, exist_ok=True)

        base_name = Path(filename).stem
        extension = Path(filename).suffix or ".md"
        backup_path = dated_dir / f"{base_name}{extension}"

        counter = 1
        while backup_path.exists():
            backup_path = dated_dir / f"{base_name}_{counter}{extension}"
            counter += 1

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
