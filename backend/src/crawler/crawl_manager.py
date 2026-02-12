"""High-level crawl orchestration — full and incremental modes."""

import asyncio
import logging
from datetime import datetime

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
from sqlalchemy.orm import Session

from src.config import BlogSource, Config
from src.models import Post, CrawlLog
from src.crawler.sitemap_parser import parse_sitemap, parse_medium_archive
from src.crawler.feed_parser import parse_feed
from src.crawler.article_crawler import crawl_articles_batch

logger = logging.getLogger(__name__)
console = Console()


def _url_exists(session: Session, url: str) -> bool:
    """Check whether a URL is already stored in the database."""
    return session.query(Post).filter(Post.url == url).first() is not None


def _filter_new_urls(session: Session, urls: list[str]) -> list[str]:
    """Return only URLs that are not yet in the database."""
    return [u for u in urls if not _url_exists(session, u)]


def _store_post(
    session: Session,
    source: BlogSource,
    article: dict,
    feed_summary: str | None = None,
    feed_author: str | None = None,
    feed_published: datetime | None = None,
) -> Post:
    """Create and add a Post record from crawled article data.

    Feed metadata (summary, author, published_at) can be supplied to fill in
    values that the crawler might not have extracted.
    """
    text = article.get("text", "")

    # Build summary: prefer feed summary, fall back to first 500 chars of text
    summary = feed_summary
    if not summary and text:
        summary = text[:500]

    # Merge metadata: prefer crawler-extracted values, fall back to feed values
    author = article.get("author") or feed_author
    published_at = article.get("published_at") or feed_published

    post = Post(
        url=article["url"],
        source_key=source.key,
        source_name=source.name,
        title=article.get("title", article["url"]),
        summary=summary,
        full_text=text,
        author=author,
        published_at=published_at,
        crawled_at=datetime.utcnow(),
        word_count=article.get("word_count") or len(text.split()),
    )
    session.add(post)
    return post


def crawl_full(session: Session, source: BlogSource, config: Config) -> int:
    """Full archive crawl for a single source.

    1. Discover URLs from sitemap (or Medium archive for Medium-platform sources).
    2. Filter out URLs already in the database.
    3. Crawl each new URL with Crawl4AI.
    4. Store results as Post records.

    Returns the count of new posts added.
    """
    crawl_log = CrawlLog(
        source_key=source.key,
        crawl_type="full",
        started_at=datetime.utcnow(),
    )
    session.add(crawl_log)
    session.flush()

    delay = config.crawl.get("delay_between_requests", 1.5)

    # --- Discover URLs ---
    urls: list[str] = []
    if source.platform == "medium" and source.archive_url:
        console.print(f"  [dim]Fetching Medium archive: {source.archive_url}[/dim]")
        urls = parse_medium_archive(source.archive_url)
    elif source.sitemap_url:
        console.print(f"  [dim]Fetching sitemap: {source.sitemap_url}[/dim]")
        urls = parse_sitemap(source.sitemap_url, url_pattern=source.blog_url_pattern)

    # Also try the feed for additional URLs
    if source.feed_url:
        feed_entries = parse_feed(source.feed_url)
        feed_urls = {e.url for e in feed_entries}
        existing_set = set(urls)
        for fu in feed_urls:
            if fu not in existing_set:
                urls.append(fu)

    crawl_log.urls_found = len(urls)
    console.print(f"  Found [bold]{len(urls)}[/bold] total URLs")

    # --- Filter new ---
    new_urls = _filter_new_urls(session, urls)
    console.print(f"  [bold]{len(new_urls)}[/bold] are new (not in DB)")

    if not new_urls:
        crawl_log.posts_added = 0
        crawl_log.completed_at = datetime.utcnow()
        session.commit()
        return 0

    # --- Crawl ---
    articles = asyncio.run(crawl_articles_batch(new_urls, delay=delay))

    # --- Store ---
    added = 0
    for article in articles:
        try:
            _store_post(session, source, article)
            added += 1
        except Exception as exc:
            logger.error("Failed to store post %s: %s", article.get("url"), exc)
            session.rollback()
            # Re-add the crawl log after rollback
            session.add(crawl_log)

    crawl_log.posts_added = added
    crawl_log.completed_at = datetime.utcnow()
    session.commit()

    console.print(f"  Stored [green]{added}[/green] new posts")
    return added


def crawl_incremental(session: Session, source: BlogSource, config: Config) -> int:
    """Incremental (RSS-only) crawl for a single source.

    1. Parse the RSS/Atom feed to get recent entries.
    2. Filter entries whose URL is not already in the database.
    3. Crawl the full text for each new entry.
    4. Store results as Post records.

    Returns the count of new posts added.
    """
    crawl_log = CrawlLog(
        source_key=source.key,
        crawl_type="incremental",
        started_at=datetime.utcnow(),
    )
    session.add(crawl_log)
    session.flush()

    delay = config.crawl.get("delay_between_requests", 1.5)

    # --- Parse feed ---
    if not source.feed_url:
        console.print(f"  [yellow]No feed_url configured — skipping[/yellow]")
        crawl_log.urls_found = 0
        crawl_log.posts_added = 0
        crawl_log.completed_at = datetime.utcnow()
        session.commit()
        return 0

    console.print(f"  [dim]Parsing feed: {source.feed_url}[/dim]")
    entries = parse_feed(source.feed_url)
    crawl_log.urls_found = len(entries)
    console.print(f"  Found [bold]{len(entries)}[/bold] feed entries")

    # --- Filter new ---
    # Build a lookup from URL to feed entry for metadata merging
    entry_map = {e.url: e for e in entries}
    all_urls = [e.url for e in entries]
    new_urls = _filter_new_urls(session, all_urls)
    console.print(f"  [bold]{len(new_urls)}[/bold] are new (not in DB)")

    if not new_urls:
        crawl_log.posts_added = 0
        crawl_log.completed_at = datetime.utcnow()
        session.commit()
        return 0

    # --- Crawl full text ---
    articles = asyncio.run(crawl_articles_batch(new_urls, delay=delay))

    # Build a URL->article mapping for merging
    article_map = {a["url"]: a for a in articles}

    # --- Store ---
    added = 0
    for url in new_urls:
        feed_entry = entry_map.get(url)
        article = article_map.get(url)

        if article is None:
            # Crawl4AI failed — store with just feed metadata
            if feed_entry is None:
                continue
            article = {
                "url": url,
                "title": feed_entry.title,
                "text": feed_entry.summary or "",
                "author": feed_entry.author,
                "published_at": feed_entry.published_at,
                "word_count": len((feed_entry.summary or "").split()),
            }

        try:
            _store_post(
                session,
                source,
                article,
                feed_summary=feed_entry.summary if feed_entry else None,
                feed_author=feed_entry.author if feed_entry else None,
                feed_published=feed_entry.published_at if feed_entry else None,
            )
            added += 1
        except Exception as exc:
            logger.error("Failed to store post %s: %s", url, exc)
            session.rollback()
            session.add(crawl_log)

    crawl_log.posts_added = added
    crawl_log.completed_at = datetime.utcnow()
    session.commit()

    console.print(f"  Stored [green]{added}[/green] new posts")
    return added


def crawl_all(
    session: Session,
    config: Config,
    mode: str = "full",
) -> dict[str, int]:
    """Crawl all enabled sources and return per-source new-post counts.

    Args:
        session: SQLAlchemy Session.
        config: Loaded Config object.
        mode: "full" for sitemap-based archive crawl, "incremental" for RSS-only.

    Returns:
        Dict mapping source_key to the number of new posts added.
    """
    enabled_sources = [s for s in config.sources if s.enabled]
    results: dict[str, int] = {}

    console.print()
    console.rule(f"[bold blue]Crawl All — {mode.upper()} mode[/bold blue]")
    console.print(f"Sources: {len(enabled_sources)} enabled\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        console=console,
    ) as progress:
        task_id = progress.add_task("Crawling sources", total=len(enabled_sources))

        for source in enabled_sources:
            progress.update(task_id, description=f"[bold]{source.name}[/bold]")
            console.print(f"\n[bold cyan]{source.name}[/bold cyan] ({source.key})")

            try:
                if mode == "full":
                    count = crawl_full(session, source, config)
                else:
                    count = crawl_incremental(session, source, config)
                results[source.key] = count
            except Exception as exc:
                logger.error("Error crawling %s: %s", source.key, exc)
                console.print(f"  [red]ERROR: {exc}[/red]")
                results[source.key] = 0

            progress.advance(task_id)

    # Summary
    console.print()
    console.rule("[bold blue]Crawl Summary[/bold blue]")
    total = sum(results.values())
    for key, count in results.items():
        if count > 0:
            console.print(f"  [green]{key}: {count} new posts[/green]")
        else:
            console.print(f"  [dim]{key}: {count} new posts[/dim]")
    console.print(f"\n  [bold]Total: {total} new posts[/bold]\n")

    return results
