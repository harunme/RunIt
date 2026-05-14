import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional
from app.config import get_settings

settings = get_settings()


class ContentStorage:
    """Store processed content to local filesystem."""

    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.data_dir) / "content"
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, content: str, metadata: dict, format: str = "md") -> str:
        """Save content to file."""
        file_id = str(uuid.uuid4())
        filename = f"{file_id}.{format}"
        filepath = self.base_path / filename

        filepath.write_text(content, encoding="utf-8")

        meta_path = self.base_path / f"{file_id}.meta.json"
        meta_data = {
            "id": file_id,
            "created_at": datetime.utcnow().isoformat(),
            "format": format,
            **metadata
        }
        meta_path.write_text(json.dumps(meta_data, indent=2), encoding="utf-8")

        return str(filepath)

    def load(self, file_id: str) -> tuple[str, dict]:
        """Load content and metadata by file ID."""
        content_path = self.base_path / f"{file_id}.md"
        meta_path = self.base_path / f"{file_id}.meta.json"

        if not content_path.exists():
            raise FileNotFoundError(f"Content {file_id} not found")

        content = content_path.read_text(encoding="utf-8")

        if meta_path.exists():
            metadata = json.loads(meta_path.read_text(encoding="utf-8"))
        else:
            metadata = {}

        return content, metadata

    def list(self, limit: int = 100) -> list[dict]:
        """List stored content files."""
        files = []
        for meta_path in sorted(self.base_path.glob("*.meta.json"), reverse=True)[:limit]:
            try:
                metadata = json.loads(meta_path.read_text(encoding="utf-8"))
                files.append(metadata)
            except Exception:
                continue
        return files
