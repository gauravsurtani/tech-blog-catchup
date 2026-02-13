"""RSS and Atom feed parsing using the atoma library."""

import logging
from dataclasses import dataclass
from datetime import datetime

import atoma
import requests

from src.extractor.content_cleaner import strip_html_tags

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
}
_TIMEOUT = 30


@dataclass
class FeedEntry:
    """A single entry extracted from an RSS or Atom feed."""

    url: str
    title: str
    summary: str | None
    author: str | None
    published_at: datetime | None


def _parse_rss(content: bytes) -> list[FeedEntry]:
    """Parse RSS feed bytes and return FeedEntry list."""
    feed = atoma.parse_rss_bytes(content)
    entries: list[FeedEntry] = []

    for item in feed.items:
        url = item.link
        if not url:
            # Some feeds put the URL in guid
            url = item.guid
        if not url:
            continue

        title = item.title or ""
        summary = item.description
        if summary:
            summary = strip_html_tags(summary)
        author = item.author

        published_at = item.pub_date  # This is already a datetime or None

        entries.append(FeedEntry(
            url=url.strip(),
            title=title.strip(),
            summary=summary.strip() if summary else None,
            author=author.strip() if author else None,
            published_at=published_at,
        ))

    return entries


def _parse_atom(content: bytes) -> list[FeedEntry]:
    """Parse Atom feed bytes and return FeedEntry list."""
    feed = atoma.parse_atom_bytes(content)
    entries: list[FeedEntry] = []

    for entry in feed.entries:
        # Get URL from links — prefer "alternate" type, fall back to first link
        url = None
        if entry.links:
            for link in entry.links:
                if link.rel == "alternate" or link.rel is None:
                    url = link.href
                    break
            if not url:
                url = entry.links[0].href
        if not url:
            # Try entry id as URL
            if entry.id_ and entry.id_.startswith("http"):
                url = entry.id_
        if not url:
            continue

        # Title
        title = ""
        if entry.title:
            title = entry.title.value if hasattr(entry.title, "value") else str(entry.title)

        # Summary
        summary = None
        if entry.summary:
            summary = entry.summary.value if hasattr(entry.summary, "value") else str(entry.summary)

        if summary:
            summary = strip_html_tags(summary)

        # Author
        author = None
        if entry.authors:
            author = entry.authors[0].name

        # Published date — prefer published, fall back to updated
        published_at = entry.published or entry.updated

        entries.append(FeedEntry(
            url=url.strip(),
            title=title.strip(),
            summary=summary.strip() if summary else None,
            author=author.strip() if author else None,
            published_at=published_at,
        ))

    return entries


def parse_feed(feed_url: str) -> list[FeedEntry]:
    """Fetch and parse an RSS or Atom feed.

    Tries RSS parsing first; if that fails, tries Atom. Returns an empty list
    on any network or parse error.

    Args:
        feed_url: Full URL to the RSS/Atom feed.

    Returns:
        List of FeedEntry instances extracted from the feed.
    """
    try:
        resp = requests.get(feed_url, headers=_HEADERS, timeout=_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Failed to fetch feed %s: %s", feed_url, exc)
        return []

    content = resp.content

    # Try RSS first
    try:
        entries = _parse_rss(content)
        logger.info("Parsed RSS feed %s — %d entries", feed_url, len(entries))
        return entries
    except Exception as rss_exc:
        logger.debug("RSS parse failed for %s (%s), trying Atom", feed_url, rss_exc)

    # Try Atom
    try:
        entries = _parse_atom(content)
        logger.info("Parsed Atom feed %s — %d entries", feed_url, len(entries))
        return entries
    except Exception as atom_exc:
        logger.warning(
            "Both RSS and Atom parsing failed for %s. RSS error: %s / Atom error: %s",
            feed_url,
            rss_exc,
            atom_exc,
        )
        return []
