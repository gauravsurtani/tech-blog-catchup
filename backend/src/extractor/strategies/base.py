from abc import ABC, abstractmethod


class ExtractionStrategy(ABC):
    """Base class for content extraction strategies."""

    name: str = "base"

    @property
    def available(self) -> bool:
        """Check if this strategy is available (has required dependencies/keys)."""
        return True

    @abstractmethod
    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Extract content from a URL.

        Returns a dict with keys: html, text, title, author, published_at
        or None if extraction fails.
        """
        ...
