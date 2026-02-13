"""Unified smart-crawl orchestration.

Every source goes through the same pipeline:
  discover_urls → filter_new → extract → store

No more ``--mode`` flag — the system tries every available discovery method
(sitemap, Medium archive, blog page scrape, RSS) per source, merges and
deduplicates, then only extracts URLs that are not yet in the database.
"""

import asyncio
import logging
import re
from datetime import datetime

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, MofNCompleteColumn
from rich.table import Table
from sqlalchemy.orm import Session

from src.config import BlogSource, Config
from src.models import Post, CrawlLog
from src.crawler.sitemap_parser import parse_sitemap, scrape_medium_archive_urls
from src.crawler.feed_parser import parse_feed, FeedEntry
from src.extractor import extract_articles_batch
from src.extractor.types import ExtractionResult

logger = logging.getLogger(__name__)
console = Console()


# ---------------------------------------------------------------------------
# URL discovery helpers
# ---------------------------------------------------------------------------


def _scrape_blog_page_urls(
    blog_page_url: str,
    blog_url_pattern: str | None = None,
    max_scrolls: int = 10,
) -> list[str]:
    """Scrape a blog listing page for article URLs using Crawl4AI with scroll.

    Injects a scroll-to-bottom script to trigger lazy-loaded content, then
    extracts matching article URLs from the fully-rendered page.

    Args:
        blog_page_url: The blog listing page URL.
        blog_url_pattern: Substring that article URLs must contain (e.g. ``/blog/``).
        max_scrolls: Maximum number of scroll iterations before stopping.

    Returns:
        Deduplicated list of article URLs found on the page.
    """
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

    scroll_js = """
    (async () => {
        let prev = 0;
        for (let i = 0; i < %d; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 2000));
            if (document.body.scrollHeight === prev) break;
            prev = document.body.scrollHeight;
        }
    })();
    """ % max_scrolls

    async def _scrape():
        try:
            async with AsyncWebCrawler(config=BrowserConfig(headless=True)) as crawler:
                result = await crawler.arun(
                    url=blog_page_url,
                    config=CrawlerRunConfig(js_code=scroll_js, wait_until="networkidle"),
                )
                if not result or not result.success or not result.markdown:
                    return []

                from urllib.parse import urlparse
                parsed = urlparse(blog_page_url)
                base_domain = f"{parsed.scheme}://{parsed.netloc}"
                pattern = blog_url_pattern or "/blog/"

                # Find all URLs matching the blog pattern
                raw_links = re.findall(
                    rf'{re.escape(base_domain)}(?:/[a-z]{{2}}-[A-Z]{{2}})?{re.escape(pattern)}[a-z0-9][a-z0-9\-]+/?',
                    result.markdown,
                )

                # Deduplicate preserving order
                seen: set[str] = set()
                urls: list[str] = []
                for url in raw_links:
                    url = url.rstrip("/")
                    if url not in seen:
                        seen.add(url)
                        urls.append(url)
                return urls
        except Exception as exc:
            logger.warning("Blog page scrape failed for %s: %s", blog_page_url, exc)
            return []

    return asyncio.run(_scrape())


def _filter_new_urls(session: Session, urls: list[str]) -> list[str]:
    """Return only URLs not yet in the database (batch query, chunked)."""
    if not urls:
        return []

    existing: set[str] = set()
    chunk_size = 500
    for i in range(0, len(urls), chunk_size):
        chunk = urls[i : i + chunk_size]
        rows = session.query(Post.url).filter(Post.url.in_(chunk)).all()
        existing.update(row[0] for row in rows)

    return [u for u in urls if u not in existing]


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------


def discover_urls(source: BlogSource) -> tuple[list[str], dict[str, list[str]]]:
    """Try every available discovery method for *source* and merge results.

    Methods tried (in order):
      1. Sitemap (if ``source.sitemap_url``)
      2. Medium archive year-by-year (if ``source.platform == "medium"``)
      3. Blog page scrape with scroll (if ``source.blog_page_url``)
      4. RSS/Atom feed (if ``source.feed_url``)

    Returns:
        ``(combined_deduped_urls, {method_name: urls_from_that_method})``
    """
    methods: dict[str, list[str]] = {}
    seen: set[str] = set()
    combined: list[str] = []

    def _merge(name: str, urls: list[str]):
        methods[name] = urls
        for u in urls:
            u = u.rstrip("/")
            if u not in seen:
                seen.add(u)
                combined.append(u)

    # 1. Sitemap
    if source.sitemap_url:
        try:
            console.print(f"  [dim]Sitemap: {source.sitemap_url}[/dim]")
            sitemap_urls = parse_sitemap(source.sitemap_url, url_pattern=source.blog_url_pattern)
            _merge("sitemap", sitemap_urls)
            console.print(f"    sitemap → {len(sitemap_urls)} URLs")
        except Exception as exc:
            logger.warning("Sitemap failed for %s: %s", source.key, exc)

    # 2. Medium archive (year-by-year browser scrape)
    if source.platform == "medium":
        archive_base = source.archive_url or source.feed_url
        if archive_base:
            # Derive base URL: strip /feed or /archive suffix
            base = archive_base.replace("/feed", "").rstrip("/")
            if base.endswith("/archive"):
                base = base[: -len("/archive")]
            try:
                console.print(f"  [dim]Medium archive: {base}[/dim]")
                medium_urls = scrape_medium_archive_urls(base)
                _merge("medium_archive", medium_urls)
                console.print(f"    medium_archive → {len(medium_urls)} URLs")
            except Exception as exc:
                logger.warning("Medium archive failed for %s: %s", source.key, exc)

    # 3. Blog page scrape with scroll
    if source.blog_page_url:
        try:
            console.print(f"  [dim]Blog page: {source.blog_page_url}[/dim]")
            blog_urls = _scrape_blog_page_urls(source.blog_page_url, source.blog_url_pattern)
            _merge("blog_page", blog_urls)
            console.print(f"    blog_page → {len(blog_urls)} URLs")
        except Exception as exc:
            logger.warning("Blog page scrape failed for %s: %s", source.key, exc)

    # 4. RSS / Atom feed
    if source.feed_url:
        try:
            console.print(f"  [dim]Feed: {source.feed_url}[/dim]")
            entries = parse_feed(source.feed_url)
            feed_urls = [e.url for e in entries]
            _merge("feed", feed_urls)
            console.print(f"    feed → {len(feed_urls)} URLs")
        except Exception as exc:
            logger.warning("Feed parse failed for %s: %s", source.key, exc)

    return combined, methods


# ---------------------------------------------------------------------------
# Storage helpers (unchanged from before)
# ---------------------------------------------------------------------------


def _store_extraction_result(
    session: Session,
    source: BlogSource,
    result: ExtractionResult,
    feed_summary: str | None = None,
    feed_author: str | None = None,
    feed_published: datetime | None = None,
) -> Post:
    """Create and add a Post record from an ExtractionResult."""
    summary = result.summary or feed_summary or ""
    author = result.author or feed_author
    published_at = result.published_at or feed_published

    post = Post(
        url=result.url,
        source_key=source.key,
        source_name=source.name,
        title=result.title,
        summary=summary,
        full_text=result.markdown,
        author=author,
        published_at=published_at,
        crawled_at=datetime.utcnow(),
        word_count=result.word_count,
        content_quality=result.quality.quality_label,
        quality_score=result.quality.score,
        extraction_method=result.extraction_method,
        podcast_script=getattr(result, 'podcast_script', None),
    )
    session.add(post)
    return post


def _store_feed_only_post(
    session: Session,
    source: BlogSource,
    url: str,
    title: str,
    summary: str,
    author: str | None = None,
    published_at: datetime | None = None,
) -> Post:
    """Store a post using only feed metadata when extraction fails entirely."""
    post = Post(
        url=url,
        source_key=source.key,
        source_name=source.name,
        title=title,
        summary=summary,
        full_text=summary,
        author=author,
        published_at=published_at,
        crawled_at=datetime.utcnow(),
        word_count=len(summary.split()) if summary else 0,
        content_quality="low",
        quality_score=0,
        extraction_method="feed_only",
    )
    session.add(post)
    return post


# ---------------------------------------------------------------------------
# Unified crawl
# ---------------------------------------------------------------------------


def crawl_source(
    session: Session,
    source: BlogSource,
    config: Config,
    dry_run: bool = False,
    max_posts: int | None = None,
) -> int:
    """Smart-crawl a single source: discover → filter → extract → store.

    1. Runs ``discover_urls()`` to find all article URLs via every available
       method (sitemap, Medium archive, blog page, RSS).
    2. Filters out URLs already in the database.
    3. If ``dry_run`` is True, prints the URLs and returns 0.
    4. Extracts content for new URLs using the extraction pipeline.
    5. Enriches with feed metadata where available.
    6. Stores Post records and updates the CrawlLog.

    Returns:
        Number of new posts added.
    """
    crawl_log = CrawlLog(
        source_key=source.key,
        crawl_type="smart",
        started_at=datetime.utcnow(),
    )
    session.add(crawl_log)
    session.commit()  # Release write lock immediately so API stays responsive

    delay = config.crawl.get("delay_between_requests", 1.5)
    timeout = config.crawl.get("request_timeout", 30)

    # --- Discover ---
    all_urls, methods = discover_urls(source)
    crawl_log.urls_found = len(all_urls)
    console.print(f"  Found [bold]{len(all_urls)}[/bold] total URLs (deduplicated)")

    # --- Filter new ---
    new_urls = _filter_new_urls(session, all_urls)
    console.print(f"  [bold]{len(new_urls)}[/bold] are new (not in DB)")
    if max_posts:
        console.print(f"  Will store up to [bold]{max_posts}[/bold] posts (--max-posts)")

    if not new_urls:
        crawl_log.posts_added = 0
        crawl_log.status = "success"
        crawl_log.completed_at = datetime.utcnow()
        session.commit()
        return 0

    # --- Dry run ---
    if dry_run:
        table = Table(title=f"New URLs for {source.name} (dry run)")
        table.add_column("#", justify="right", style="dim")
        table.add_column("URL")
        for i, url in enumerate(new_urls, 1):
            table.add_row(str(i), url)
        console.print(table)
        crawl_log.posts_added = 0
        crawl_log.status = "success"
        crawl_log.completed_at = datetime.utcnow()
        session.commit()
        return 0

    # --- Extract ---
    extraction_results = asyncio.run(extract_articles_batch(
        new_urls,
        source_key=source.key,
        needs_browser=source.needs_browser,
        article_selector=source.article_selector,
        strip_selectors=source.strip_selectors,
        delay=delay,
        timeout=timeout,
    ))

    # Build maps for merging
    result_map = {r.url: r for r in extraction_results}

    # Feed metadata map (if feed was used)
    entry_map: dict[str, FeedEntry] = {}
    if source.feed_url:
        try:
            entries = parse_feed(source.feed_url)
            entry_map = {e.url: e for e in entries}
        except Exception:
            pass  # already logged during discover

    # --- Store (commit per post to avoid holding write locks) ---
    added = 0
    for url in new_urls:
        if max_posts and added >= max_posts:
            console.print(f"  Reached --max-posts limit ({max_posts}), stopping")
            break

        feed_entry = entry_map.get(url)
        result = result_map.get(url)

        if result is not None:
            try:
                _store_extraction_result(
                    session,
                    source,
                    result,
                    feed_summary=feed_entry.summary if feed_entry else None,
                    feed_author=feed_entry.author if feed_entry else None,
                    feed_published=feed_entry.published_at if feed_entry else None,
                )
                session.commit()
                added += 1
            except Exception as exc:
                logger.error("Failed to store post %s: %s", url, exc)
                session.rollback()
        elif feed_entry is not None:
            try:
                _store_feed_only_post(
                    session,
                    source,
                    url=url,
                    title=feed_entry.title,
                    summary=feed_entry.summary or "",
                    author=feed_entry.author,
                    published_at=feed_entry.published_at,
                )
                session.commit()
                added += 1
            except Exception as exc:
                logger.error("Failed to store feed-only post %s: %s", url, exc)
                session.rollback()

    crawl_log.posts_added = added
    crawl_log.status = "success" if added > 0 else "error"
    crawl_log.completed_at = datetime.utcnow()
    session.commit()

    console.print(f"  Stored [green]{added}[/green] new posts")
    return added


def crawl_all(
    session: Session,
    config: Config,
    dry_run: bool = False,
) -> dict[str, int]:
    """Crawl all enabled sources and return per-source new-post counts.

    Args:
        session: SQLAlchemy Session.
        config: Loaded Config object.
        dry_run: If True, only discover and list URLs without extracting.

    Returns:
        Dict mapping source_key to the number of new posts added.
    """
    enabled_sources = [s for s in config.sources if s.enabled]
    results: dict[str, int] = {}

    console.print()
    label = "DRY RUN" if dry_run else "Smart Crawl"
    console.rule(f"[bold blue]{label} — All Sources[/bold blue]")
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
                count = crawl_source(session, source, config, dry_run=dry_run)
                results[source.key] = count
            except Exception as exc:
                logger.error("Error crawling %s: %s", source.key, exc)
                console.print(f"  [red]ERROR: {exc}[/red]")
                results[source.key] = 0
                error_log = CrawlLog(
                    source_key=source.key,
                    crawl_type="smart",
                    status="error",
                    error_message=str(exc)[:500],
                    started_at=datetime.utcnow(),
                    completed_at=datetime.utcnow(),
                    urls_found=0,
                    posts_added=0,
                )
                session.add(error_log)
                session.commit()

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
