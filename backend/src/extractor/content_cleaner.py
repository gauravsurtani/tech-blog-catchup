"""Clean HTML and markdown content by removing boilerplate, nav, ads."""

import re

from bs4 import BeautifulSoup


# Tags to remove entirely from HTML before conversion
_REMOVE_TAGS = [
    "nav", "header", "footer", "aside", "script", "style", "noscript",
    "iframe", "form", "button",
]

# CSS selectors for common boilerplate elements
_REMOVE_SELECTORS = [
    ".sidebar", ".nav", ".navigation", ".menu", ".footer",
    ".header", ".breadcrumb", ".pagination", ".share-buttons",
    ".social-share", ".related-posts", ".comments", ".comment-section",
    ".advertisement", ".ad", ".ads", ".cookie-banner", ".cookie-consent",
    ".newsletter", ".subscribe", ".signup", ".popup", ".modal",
    "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    "[role='complementary']",
]


def clean_html(html: str, article_selector: str | None = None, strip_selectors: list[str] | None = None) -> str:
    """Clean HTML by removing boilerplate elements.

    Args:
        html: Raw HTML string.
        article_selector: CSS selector to extract article content (e.g. "article", ".post-content").
        strip_selectors: Additional CSS selectors to remove.

    Returns:
        Cleaned HTML string containing only article content.
    """
    if not html or not html.strip():
        return ""

    soup = BeautifulSoup(html, "lxml")

    # If an article selector is provided, extract just that element
    if article_selector:
        article = soup.select_one(article_selector)
        if article:
            soup = BeautifulSoup(str(article), "lxml")

    # Remove known boilerplate tags
    for tag_name in _REMOVE_TAGS:
        for el in soup.find_all(tag_name):
            el.decompose()

    # Remove boilerplate by CSS selectors
    all_selectors = _REMOVE_SELECTORS + (strip_selectors or [])
    for selector in all_selectors:
        try:
            for el in soup.select(selector):
                el.decompose()
        except Exception:
            continue

    return str(soup)


def clean_markdown(markdown: str) -> str:
    """Clean markdown content by removing navigation artifacts and normalizing.

    Removes:
    - Lines that look like navigation (e.g. "Skip to content", "Home > Blog > ...")
    - Excessive link clusters (3+ consecutive markdown links)
    - Trailing boilerplate patterns (share buttons, related posts, etc.)
    """
    if not markdown or not markdown.strip():
        return ""

    lines = markdown.split("\n")
    cleaned: list[str] = []

    # Patterns to skip
    nav_patterns = re.compile(
        r"^(skip to|jump to|go to|back to|return to|home\s*[>/]|"
        r"menu|navigation|breadcrumb|table of contents|"
        r"share this|tweet this|share on|follow us|subscribe|"
        r"related posts|you might also|recommended|read more|"
        r"previous article|next article|newer post|older post)",
        re.IGNORECASE,
    )

    # Detect consecutive link-only lines (nav menus)
    consecutive_links = 0

    for line in lines:
        stripped = line.strip()

        # Skip empty navigation-like lines
        if nav_patterns.match(stripped):
            continue

        # Count consecutive link-only lines
        if re.match(r"^\[.*\]\(.*\)$", stripped):
            consecutive_links += 1
            if consecutive_links >= 3:
                continue
        else:
            consecutive_links = 0

        cleaned.append(line)

    result = "\n".join(cleaned)

    # Normalize excessive blank lines
    result = re.sub(r"\n{4,}", "\n\n\n", result)

    return result.strip()


def strip_html_tags(text: str) -> str:
    """Remove all HTML tags from text, returning plain text.

    Useful for cleaning RSS feed summaries that contain inline HTML.
    """
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text(separator=" ", strip=True)
