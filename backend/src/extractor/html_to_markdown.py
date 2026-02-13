"""Convert HTML to clean markdown, preserving code blocks and structure."""

import re

from bs4 import BeautifulSoup
from markdownify import MarkdownConverter


class _TechBlogConverter(MarkdownConverter):
    """Custom converter that preserves code blocks and tech content."""

    def convert_pre(self, el, text, **kwargs):
        """Preserve <pre> blocks as fenced code blocks."""
        code_el = el.find("code")
        if code_el:
            lang = ""
            classes = code_el.get("class", [])
            if isinstance(classes, list):
                for cls in classes:
                    if cls.startswith(("language-", "lang-", "highlight-")):
                        lang = cls.split("-", 1)[1]
                        break
            code_text = code_el.get_text()
            return f"\n\n```{lang}\n{code_text}\n```\n\n"
        return f"\n\n```\n{text}\n```\n\n"

    def convert_code(self, el, text, **kwargs):
        """Preserve inline <code> elements."""
        if el.parent and el.parent.name == "pre":
            return text
        return f"`{text}`"


def html_to_markdown(html: str) -> str:
    """Convert HTML string to clean markdown.

    Preserves:
    - Code blocks (fenced with language hints)
    - Headings (h1-h6)
    - Lists (ordered and unordered)
    - Bold, italic, links
    - Tables

    Strips:
    - Script/style tags
    - Inline styles
    - Class attributes (except language hints on code)
    """
    if not html or not html.strip():
        return ""

    # Pre-process: remove script, style, noscript, iframe tags with BS4
    soup = BeautifulSoup(html, "html.parser")
    for tag_name in ("script", "style", "noscript", "iframe"):
        for tag in soup.find_all(tag_name):
            tag.decompose()
    cleaned_html = str(soup)

    md = _TechBlogConverter(
        heading_style="atx",
        bullets="-",
        strong_em_symbol="*",
    ).convert(cleaned_html)

    # Strip trailing whitespace on each line FIRST (important: removes <br> trailing spaces)
    md = "\n".join(line.rstrip() for line in md.split("\n"))

    # Then normalize excessive blank lines (3+ newlines → 2 newlines)
    md = re.sub(r"\n{3,}", "\n\n", md)

    return md.strip()
