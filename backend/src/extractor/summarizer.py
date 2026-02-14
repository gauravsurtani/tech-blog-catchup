"""Extract a meaningful summary from markdown content."""

import re


_MIN_SUMMARY_WORDS = 15
_MAX_SUMMARY_LENGTH = 500


def extract_summary(markdown: str) -> str:
    """Extract the first meaningful paragraph as a summary.

    Skips:
    - Headings (lines starting with #)
    - Code blocks (``` fenced blocks)
    - List items
    - Very short lines (<15 words)
    - Lines that are mostly links

    Returns the first real paragraph of text, truncated to 500 chars.
    """
    if not markdown or not markdown.strip():
        return ""

    lines = markdown.split("\n")
    in_code_block = False
    paragraph_lines: list[str] = []

    for line in lines:
        stripped = line.strip()

        # Toggle code block state
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            # If we were collecting a paragraph, emit it first
            if paragraph_lines:
                break
            continue

        if in_code_block:
            continue

        # Skip headings
        if stripped.startswith("#"):
            if paragraph_lines:
                break
            continue

        # Skip list items
        if re.match(r"^[-*+]\s+|^\d+\.\s+", stripped):
            if paragraph_lines:
                break
            continue

        # Skip image-only lines
        if re.match(r"^!\[.*\]\(.*\)$", stripped):
            continue

        # Empty line = paragraph break
        if not stripped:
            if paragraph_lines:
                break
            continue

        # Skip lines that are mostly links
        link_chars = sum(len(m.group()) for m in re.finditer(r"\[([^\]]*)\]\([^)]+\)", stripped))
        if len(stripped) > 0 and link_chars / len(stripped) > 0.6:
            if paragraph_lines:
                break
            continue

        paragraph_lines.append(stripped)

    text = " ".join(paragraph_lines)

    # If the first paragraph is too short, it's probably not a real summary
    if len(text.split()) < _MIN_SUMMARY_WORDS:
        # Fall back to first 500 chars of all non-heading, non-code content
        all_text: list[str] = []
        in_code = False
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code = not in_code
                continue
            if in_code or stripped.startswith("#") or not stripped:
                continue
            # Skip image-only lines in fallback too
            if re.match(r"^!\[.*\]\(.*\)$", stripped):
                continue
            all_text.append(stripped)
        text = " ".join(all_text)

    # Truncate
    if len(text) > _MAX_SUMMARY_LENGTH:
        text = text[:_MAX_SUMMARY_LENGTH].rsplit(" ", 1)[0] + "..."

    return text
