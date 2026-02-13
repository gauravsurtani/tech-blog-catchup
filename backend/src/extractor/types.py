"""Data types for the content extraction pipeline."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class QualityResult:
    """Quality assessment of extracted content."""

    score: int  # 0-100
    grade: str  # A, B, C, D, F
    word_count: int
    heading_count: int
    code_block_count: int
    list_count: int
    link_density: float
    has_raw_html: bool
    flags: list[str] = field(default_factory=list)

    @property
    def is_acceptable(self) -> bool:
        return self.score >= 20

    @property
    def quality_label(self) -> str:
        if self.score >= 60:
            return "good"
        if self.score >= 40:
            return "low"
        return "rejected"


@dataclass(frozen=True)
class ExtractionResult:
    """Result of extracting and processing an article."""

    url: str
    title: str
    markdown: str
    summary: str
    word_count: int
    quality: QualityResult
    extraction_method: str  # "trafilatura", "crawl4ai", "bs4"
    author: str | None = None
    published_at: object | None = None  # datetime, kept generic for serialization
    podcast_script: str | None = None

    @property
    def is_acceptable(self) -> bool:
        return self.quality.is_acceptable
