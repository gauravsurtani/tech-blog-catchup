"""Score extracted content quality on a 0-100 scale."""

import re

from src.extractor.types import QualityResult


_HEADING_RE = re.compile(r"^#{1,6}\s+\S", re.MULTILINE)
_CODE_BLOCK_RE = re.compile(r"^```", re.MULTILINE)
_LIST_ITEM_RE = re.compile(r"^[\s]*[-*+]\s+\S|^[\s]*\d+\.\s+\S", re.MULTILINE)
_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]+\)")
_RAW_HTML_RE = re.compile(r"<(?:div|span|p|a|img|table|tr|td|th|ul|ol|li|br|hr)\b[^>]*>", re.IGNORECASE)


def _grade_from_score(score: int) -> str:
    if score >= 80:
        return "A"
    if score >= 60:
        return "B"
    if score >= 40:
        return "C"
    if score >= 20:
        return "D"
    return "F"


def score_content(markdown: str) -> QualityResult:
    """Score markdown content quality and return a QualityResult.

    Scoring algorithm:
    - Base: 50 points
    - Word count: <100 -> -30, 100-499 -> 0, 500-2000 -> +15, 2000-5000 -> +20, >5000 -> +10
    - Has headings: +10
    - Has code blocks: +10
    - Has lists: +5
    - Link density > 0.3: -15
    - Contains raw HTML tags: -20
    """
    words = markdown.split()
    word_count = len(words)

    heading_count = len(_HEADING_RE.findall(markdown))
    code_block_pairs = len(_CODE_BLOCK_RE.findall(markdown)) // 2
    list_count = len(_LIST_ITEM_RE.findall(markdown))

    # Link density: ratio of link text characters to total characters
    total_chars = len(markdown) or 1
    link_chars = sum(len(m) for m in _LINK_RE.findall(markdown))
    link_density = link_chars / total_chars

    has_raw_html = bool(_RAW_HTML_RE.search(markdown))

    # --- Scoring ---
    score = 50
    flags: list[str] = []

    # Word count scoring
    if word_count < 100:
        score -= 30
        flags.append("very_short")
    elif 500 <= word_count <= 2000:
        score += 15
    elif 2000 < word_count <= 5000:
        score += 20
    elif word_count > 5000:
        score += 10

    # Structure bonuses
    if heading_count > 0:
        score += 10
    if code_block_pairs > 0:
        score += 10
    if list_count > 0:
        score += 5

    # Penalties
    if link_density > 0.3:
        score -= 15
        flags.append("high_link_density")
    if has_raw_html:
        score -= 20
        flags.append("contains_raw_html")

    # Clamp to 0-100
    score = max(0, min(100, score))

    return QualityResult(
        score=score,
        grade=_grade_from_score(score),
        word_count=word_count,
        heading_count=heading_count,
        code_block_count=code_block_pairs,
        list_count=list_count,
        link_density=round(link_density, 3),
        has_raw_html=has_raw_html,
        flags=flags,
    )
