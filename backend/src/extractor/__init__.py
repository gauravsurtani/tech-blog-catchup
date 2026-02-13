"""Content extraction engine — clean, structured article extraction with quality scoring."""

from src.extractor.types import ExtractionResult, QualityResult
from src.extractor.pipeline import extract_article, extract_articles_batch
from src.extractor.quality_scorer import score_content
from src.extractor.html_to_markdown import html_to_markdown
from src.extractor.content_cleaner import clean_html, clean_markdown, strip_html_tags
from src.extractor.content_generator import generate_content
from src.extractor.content_scanner import is_useful_content

__all__ = [
    "ExtractionResult",
    "QualityResult",
    "extract_article",
    "extract_articles_batch",
    "score_content",
    "html_to_markdown",
    "clean_html",
    "clean_markdown",
    "strip_html_tags",
    "generate_content",
    "is_useful_content",
]
