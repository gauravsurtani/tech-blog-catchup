#!/usr/bin/env python3
"""CLI entry point for Tech Blog Catchup."""

import argparse
import asyncio
import logging
import os

import sys
from datetime import datetime

from rich.console import Console
from rich.table import Table
from rich.logging import RichHandler

console = Console()


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[RichHandler(console=console, show_time=False)],
    )


def cmd_init(args):
    """Initialize database and create directories."""
    from src.database import init_db
    from src.config import get_config
    from src.tagger.auto_tagger import ensure_tags_exist
    from src.database import get_session

    config = get_config()
    init_db()
    console.print("[green]Database initialized[/green]")

    session = get_session()
    try:
        ensure_tags_exist(config.tags, session)
        console.print(f"[green]Created {len(config.tags)} tag categories[/green]")
    finally:
        session.close()

    console.print("[green]Ready! Run 'python run.py crawl' to start scraping.[/green]")


def cmd_crawl(args):
    """Crawl blog feeds (unified smart crawl)."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.crawler.crawl_manager import crawl_all, crawl_source
    from src.tagger.auto_tagger import ensure_tags_exist, auto_tag_post

    config = get_config()
    init_db()

    session = get_session()
    try:
        ensure_tags_exist(config.tags, session)
        dry_run = getattr(args, "dry_run", False)

        if args.source:
            source = next((s for s in config.sources if s.key == args.source), None)
            if not source:
                console.print(f"[red]Source '{args.source}' not found[/red]")
                sys.exit(1)

            label = " (dry run)" if dry_run else ""
            console.print(f"Crawling [cyan]{source.name}[/cyan]{label}...")
            max_posts = getattr(args, "max_posts", None)
            count = crawl_source(session, source, config, dry_run=dry_run, max_posts=max_posts)
            console.print(f"[green]Added {count} new posts from {source.name}[/green]")
        else:
            label = " (dry run)" if dry_run else ""
            console.print(f"Crawling all {len(config.sources)} sources{label}...")
            results = crawl_all(session, config, dry_run=dry_run)

            table = Table(title="Crawl Results")
            table.add_column("Source", style="cyan")
            table.add_column("New Posts", justify="right", style="green")
            for source_key, count in results.items():
                source = next((s for s in config.sources if s.key == source_key), None)
                name = source.name if source else source_key
                table.add_row(name, str(count))
            table.add_row("[bold]Total[/bold]", f"[bold]{sum(results.values())}[/bold]")
            console.print(table)

        # Auto-tag new posts (skip on dry run)
        if not dry_run:
            from src.models import Post
            untagged = session.query(Post).filter(~Post.tags.any()).all()
            if untagged:
                console.print(f"Auto-tagging {len(untagged)} posts...")
                for post in untagged:
                    auto_tag_post(post, config.tags, session)
                console.print("[green]Tagging complete[/green]")

    finally:
        session.close()


def cmd_generate(args):
    """Generate podcast audio for pending posts."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.podcast.manager import generate_pending, generate_for_post

    config = get_config()
    init_db()
    session = get_session()

    try:
        if args.post_id:
            console.print(f"Generating podcast for post {args.post_id}...")
            success = generate_for_post(session, args.post_id, config)
            if success:
                console.print("[green]Podcast generated successfully![/green]")
            else:
                console.print("[red]Failed to generate podcast[/red]")
                sys.exit(1)
        else:
            console.print(f"Generating podcasts for up to {args.limit} pending posts...")
            count = generate_pending(session, config, limit=args.limit)
            console.print(f"[green]Generated {count} podcasts[/green]")
    finally:
        session.close()


def cmd_status(args):
    """Show system status."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.models import Post, Tag, post_tags
    from sqlalchemy import func

    config = get_config()
    init_db()
    session = get_session()

    try:
        total = session.query(func.count(Post.id)).scalar() or 0

        # Posts by source
        table = Table(title=f"Posts by Source (Total: {total})")
        table.add_column("Source", style="cyan")
        table.add_column("Posts", justify="right", style="green")
        table.add_column("With Audio", justify="right", style="yellow")

        sources = (
            session.query(Post.source_key, Post.source_name, func.count(Post.id))
            .group_by(Post.source_key, Post.source_name)
            .order_by(func.count(Post.id).desc())
            .all()
        )
        for key, name, count in sources:
            audio_count = (
                session.query(func.count(Post.id))
                .filter(Post.source_key == key, Post.audio_status == "ready")
                .scalar()
            )
            table.add_row(name, str(count), str(audio_count or 0))
        console.print(table)

        # Audio status
        audio_table = Table(title="Audio Status")
        audio_table.add_column("Status", style="cyan")
        audio_table.add_column("Count", justify="right", style="green")

        audio_stats = (
            session.query(Post.audio_status, func.count(Post.id))
            .group_by(Post.audio_status)
            .all()
        )
        for status, count in audio_stats:
            audio_table.add_row(status, str(count))
        console.print(audio_table)

        # Tag distribution
        tag_table = Table(title="Tag Distribution")
        tag_table.add_column("Tag", style="cyan")
        tag_table.add_column("Posts", justify="right", style="green")

        tag_stats = (
            session.query(Tag.name, func.count(post_tags.c.post_id))
            .outerjoin(post_tags, Tag.id == post_tags.c.tag_id)
            .group_by(Tag.id)
            .order_by(func.count(post_tags.c.post_id).desc())
            .all()
        )
        for name, count in tag_stats:
            tag_table.add_row(name, str(count))
        console.print(tag_table)

    finally:
        session.close()


def cmd_discover(args):
    """Discover URLs for sources without extracting (dry-run discovery)."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.crawler.crawl_manager import discover_urls, filter_new_urls

    config = get_config()
    init_db()
    session = get_session()

    try:
        sources = [s for s in config.sources if s.enabled]
        if args.source:
            source = next((s for s in config.sources if s.key == args.source), None)
            if not source:
                console.print(f"[red]Source '{args.source}' not found[/red]")
                sys.exit(1)
            sources = [source]

        table = Table(title="URL Discovery Report")
        table.add_column("Source", style="cyan")
        table.add_column("Discoverable", justify="right", style="bold")
        table.add_column("In DB", justify="right", style="green")
        table.add_column("New", justify="right", style="yellow")
        table.add_column("Methods", style="dim")

        total_disc = 0
        total_db = 0
        total_new = 0

        for source in sources:
            console.print(f"\n[bold cyan]{source.name}[/bold cyan] ({source.key})")
            try:
                all_urls, methods = discover_urls(source)
            except Exception as exc:
                console.print(f"  [red]Discovery failed: {exc}[/red]")
                continue

            new_urls = filter_new_urls(session, all_urls)
            in_db_count = len(all_urls) - len(new_urls)
            new_count = len(new_urls)

            method_parts = []
            for method_name, method_urls in methods.items():
                method_parts.append(f"{method_name}({len(method_urls)})")
            methods_str = ", ".join(method_parts)

            table.add_row(
                source.name,
                str(len(all_urls)),
                str(in_db_count),
                str(new_count),
                methods_str,
            )

            total_disc += len(all_urls)
            total_db += in_db_count
            total_new += new_count

        table.add_row(
            "[bold]Total[/bold]",
            f"[bold]{total_disc}[/bold]",
            f"[bold]{total_db}[/bold]",
            f"[bold]{total_new}[/bold]",
            "",
        )
        console.print()
        console.print(table)

    finally:
        session.close()


def cmd_reextract(args):
    """Re-extract content for existing posts using the new extraction pipeline."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.models import Post
    from src.extractor import extract_article
    from src.tagger.auto_tagger import auto_tag_post

    config = get_config()
    init_db()
    session = get_session()

    try:
        query = session.query(Post)

        if args.source:
            source = next((s for s in config.sources if s.key == args.source), None)
            if not source:
                console.print(f"[red]Source '{args.source}' not found[/red]")
                sys.exit(1)
            query = query.filter(Post.source_key == args.source)
            console.print(f"Filtering to source: [cyan]{source.name}[/cyan]")

        if args.quality_below:
            query = query.filter(
                (Post.quality_score < args.quality_below) | (Post.quality_score.is_(None))
            )
            console.print(f"Filtering to quality_score < {args.quality_below}")

        if args.limit:
            query = query.limit(args.limit)

        posts = query.all()
        console.print(f"Found [bold]{len(posts)}[/bold] posts to re-extract")

        if args.dry_run:
            table = Table(title="Posts to Re-extract (Dry Run)")
            table.add_column("ID", justify="right")
            table.add_column("Source", style="cyan")
            table.add_column("Title")
            table.add_column("Quality", justify="right")
            table.add_column("Method")
            for post in posts:
                table.add_row(
                    str(post.id),
                    post.source_key,
                    (post.title[:50] + "...") if len(post.title) > 50 else post.title,
                    str(post.quality_score or "N/A"),
                    post.extraction_method or "legacy",
                )
            console.print(table)
            return

        improved = 0
        failed = 0
        for i, post in enumerate(posts):
            console.print(f"[{i+1}/{len(posts)}] Re-extracting: {post.title[:60]}...")

            source_cfg = next((s for s in config.sources if s.key == post.source_key), None)
            needs_browser = source_cfg.needs_browser if source_cfg else False
            article_selector = source_cfg.article_selector if source_cfg else None
            strip_selectors = source_cfg.strip_selectors if source_cfg else None

            try:
                result = asyncio.run(extract_article(
                    url=post.url,
                    source_key=post.source_key,
                    needs_browser=needs_browser,
                    article_selector=article_selector,
                    strip_selectors=strip_selectors,
                ))
            except Exception as exc:
                console.print(f"  [red]ERROR: {exc}[/red]")
                failed += 1
                continue

            if result is None:
                console.print(f"  [yellow]SKIP: extraction returned nothing[/yellow]")
                failed += 1
                continue

            old_score = post.quality_score or 0
            new_score = result.quality.score

            if new_score > old_score:
                post.full_text = result.markdown
                post.summary = result.summary
                post.word_count = result.word_count
                post.content_quality = result.quality.quality_label
                post.quality_score = result.quality.score
                post.extraction_method = result.extraction_method
                if result.author and not post.author:
                    post.author = result.author

                # Re-run auto-tagger
                auto_tag_post(post, config.tags, session)

                improved += 1
                console.print(
                    f"  [green]IMPROVED: {old_score} -> {new_score} "
                    f"({result.quality.grade}, {result.extraction_method})[/green]"
                )
            else:
                console.print(
                    f"  [dim]NO CHANGE: {old_score} -> {new_score}[/dim]"
                )

        session.commit()
        console.print(f"\n[bold]Re-extraction complete: {improved} improved, {failed} failed[/bold]")

    finally:
        session.close()


def cmd_regenerate(args):
    """Regenerate summaries and podcast scripts for posts with bad/missing content."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.models import Post
    from sqlalchemy import or_

    config = get_config()
    init_db()
    session = get_session()

    try:
        query = session.query(Post)

        if args.source:
            source = next((s for s in config.sources if s.key == args.source), None)
            if not source:
                console.print(f"[red]Source '{args.source}' not found[/red]")
                sys.exit(1)
            query = query.filter(Post.source_key == args.source)
            console.print(f"Filtering to source: [cyan]{source.name}[/cyan]")

        summary_only = getattr(args, "summary_only", False)

        # Find posts with bad summaries or missing podcast_script
        conditions = [
            Post.summary.contains("[Skip to"),
            Post.summary.is_(None),
            Post.summary == "",
        ]
        if not summary_only:
            conditions.append(Post.podcast_script.is_(None))

        query = query.filter(or_(*conditions))

        # Merge both queries via union of IDs
        bad_ids = {p.id for p in query.all()}
        # For short summaries, just do a Python filter since SQLite lacks LEN on text easily
        all_posts_for_len_check = session.query(Post)
        if args.source:
            all_posts_for_len_check = all_posts_for_len_check.filter(Post.source_key == args.source)
        for p in all_posts_for_len_check.all():
            if p.summary and len(p.summary) < 50 and "[Skip to" not in p.summary:
                bad_ids.add(p.id)
            if not summary_only and p.podcast_script is None:
                bad_ids.add(p.id)

        if not bad_ids:
            console.print("[green]No posts need regeneration[/green]")
            return

        posts = session.query(Post).filter(Post.id.in_(bad_ids))
        if args.limit:
            posts = posts.limit(args.limit)
        posts = posts.all()

        console.print(f"Found [bold]{len(posts)}[/bold] posts to regenerate")

        if args.dry_run:
            table = Table(title="Posts to Regenerate (Dry Run)")
            table.add_column("ID", justify="right")
            table.add_column("Source", style="cyan")
            table.add_column("Title")
            table.add_column("Summary", style="dim")
            table.add_column("Has Script", justify="center")
            for post in posts:
                summary_preview = (post.summary[:40] + "...") if post.summary and len(post.summary) > 40 else (post.summary or "N/A")
                has_script = "Yes" if post.podcast_script else "No"
                table.add_row(
                    str(post.id),
                    post.source_key,
                    (post.title[:50] + "...") if len(post.title) > 50 else post.title,
                    summary_preview,
                    has_script,
                )
            console.print(table)
            return

        updated = 0
        failed = 0
        for i, post in enumerate(posts):
            console.print(f"[{i+1}/{len(posts)}] Regenerating: {post.title[:60]}...")

            if not post.full_text:
                console.print(f"  [yellow]SKIP: no full_text[/yellow]")
                failed += 1
                continue

            try:
                if summary_only:
                    from src.extractor.content_generator import generate_summary_only
                    new_summary = asyncio.run(generate_summary_only(post.title, post.full_text))
                    post.summary = new_summary
                    console.print(f"  [green]Summary updated[/green]")
                else:
                    from src.extractor.content_generator import generate_content
                    content = asyncio.run(generate_content(post.title, post.full_text))
                    post.summary = content.get("summary", post.summary)
                    post.podcast_script = content.get("podcast_script", post.podcast_script)
                    has_script = "yes" if post.podcast_script else "no"
                    console.print(f"  [green]Updated (script={has_script})[/green]")
                updated += 1
            except Exception as exc:
                console.print(f"  [red]ERROR: {exc}[/red]")
                failed += 1

        session.commit()
        console.print(f"\n[bold]Regeneration complete: {updated} updated, {failed} failed[/bold]")

    finally:
        session.close()


def cmd_cleanup(args):
    """Remove posts without podcast audio from the database."""
    from src.database import get_session, init_db
    from src.models import Post, post_tags
    from sqlalchemy import func

    init_db()
    session = get_session()

    try:
        total = session.query(func.count(Post.id)).scalar() or 0
        ready_count = (
            session.query(func.count(Post.id))
            .filter(Post.audio_status == "ready")
            .scalar() or 0
        )

        # Build filter for posts to remove
        remove_filter = Post.audio_status != "ready"
        if args.keep_failed:
            remove_filter = Post.audio_status.notin_(["ready", "failed"])

        to_remove = session.query(Post).filter(remove_filter).all()
        remove_count = len(to_remove)

        if remove_count == 0:
            console.print("[green]No posts to remove — all posts have audio.[/green]")
            return

        # Show breakdown by status
        status_table = Table(title="Cleanup Preview")
        status_table.add_column("Audio Status", style="cyan")
        status_table.add_column("Count", justify="right", style="green")
        status_table.add_column("Action", style="yellow")

        status_counts = (
            session.query(Post.audio_status, func.count(Post.id))
            .group_by(Post.audio_status)
            .all()
        )
        for status, count in status_counts:
            if status == "ready":
                action = "KEEP"
            elif status == "failed" and args.keep_failed:
                action = "KEEP (--keep-failed)"
            else:
                action = "REMOVE"
            status_table.add_row(status, str(count), action)
        console.print(status_table)

        if args.dry_run:
            console.print(
                f"\n[yellow][DRY RUN][/yellow] Would remove [bold]{remove_count}[/bold] posts, "
                f"keep [bold]{total - remove_count}[/bold]"
            )
            return

        if not args.yes:
            confirm = input(f"\nRemove {remove_count} posts? [y/N] ").strip().lower()
            if confirm not in ("y", "yes"):
                console.print("[yellow]Aborted.[/yellow]")
                return

        # Delete post_tags associations for posts being removed
        remove_ids = [p.id for p in to_remove]
        orphaned_tags = (
            session.query(func.count())
            .select_from(post_tags)
            .filter(post_tags.c.post_id.in_(remove_ids))
            .scalar() or 0
        )
        session.execute(
            post_tags.delete().where(post_tags.c.post_id.in_(remove_ids))
        )

        # Delete the posts
        session.query(Post).filter(Post.id.in_(remove_ids)).delete(
            synchronize_session="fetch"
        )
        session.commit()

        console.print(
            f"\n[green]Removed {remove_count} posts and {orphaned_tags} tag associations, "
            f"kept {total - remove_count} with audio[/green]"
        )

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def cmd_api(args):
    """Start FastAPI server."""
    import uvicorn
    port = args.port or int(os.environ.get("PORT", 8000))
    console.print(f"Starting FastAPI server on port {port}...")
    uvicorn.run("src.api.app:app", host="0.0.0.0", port=port, reload=args.reload)


def cmd_serve(args):
    """Start both FastAPI and Next.js frontend."""
    console.print("[yellow]Starting FastAPI backend...[/yellow]")
    cmd_api(args)


def main():
    parser = argparse.ArgumentParser(
        description="Tech Blog Catchup - Scrape tech blogs, generate podcasts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # init
    subparsers.add_parser("init", help="Initialize database and create directories")

    # crawl
    crawl_parser = subparsers.add_parser("crawl", help="Crawl blog feeds")
    crawl_parser.add_argument("--source", help="Crawl specific source only (e.g., 'cloudflare')")
    crawl_parser.add_argument("--max-posts", type=int, help="Limit number of new posts to extract")
    crawl_parser.add_argument("--dry-run", action="store_true", help="Discover URLs without extracting or storing")

    # generate
    gen_parser = subparsers.add_parser("generate", help="Generate podcast audio")
    gen_parser.add_argument("--post-id", type=int, help="Generate for specific post ID")
    gen_parser.add_argument("--limit", type=int, default=10, help="Max posts to process (default: 10)")

    # status
    subparsers.add_parser("status", help="Show system status")

    # api
    api_parser = subparsers.add_parser("api", help="Start FastAPI server")
    api_parser.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    api_parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    # discover
    discover_parser = subparsers.add_parser("discover", help="Discover URLs without extracting")
    discover_parser.add_argument("--source", help="Discover for specific source only")

    # reextract
    reextract_parser = subparsers.add_parser("reextract", help="Re-extract content for existing posts")
    reextract_parser.add_argument("--source", help="Re-extract specific source only (e.g., 'github')")
    reextract_parser.add_argument("--quality-below", type=int, help="Only re-extract posts with quality_score below this")
    reextract_parser.add_argument("--dry-run", action="store_true", help="Show what would be re-extracted without doing it")
    reextract_parser.add_argument("--limit", type=int, help="Max posts to re-extract")

    # regenerate
    regen_parser = subparsers.add_parser("regenerate", help="Regenerate summaries and podcast scripts")
    regen_parser.add_argument("--source", help="Regenerate specific source only (e.g., 'github')")
    regen_parser.add_argument("--limit", type=int, help="Max posts to regenerate")
    regen_parser.add_argument("--dry-run", action="store_true", help="Show what would be regenerated without doing it")
    regen_parser.add_argument("--summary-only", action="store_true", help="Only regenerate summaries, skip podcast scripts")

    # cleanup
    cleanup_parser = subparsers.add_parser("cleanup", help="Remove posts without podcast audio")
    cleanup_parser.add_argument("--dry-run", action="store_true", help="Preview what would be removed without deleting")
    cleanup_parser.add_argument("--keep-failed", action="store_true", help="Retain failed posts for retry")
    cleanup_parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt")

    # serve
    serve_parser = subparsers.add_parser("serve", help="Start backend server")
    serve_parser.add_argument("--port", type=int, default=8000, help="API port (default: 8000)")
    serve_parser.add_argument("--reload", action="store_true", help="Enable auto-reload")

    args = parser.parse_args()
    setup_logging(args.verbose)

    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "init": cmd_init,
        "crawl": cmd_crawl,
        "generate": cmd_generate,
        "status": cmd_status,
        "discover": cmd_discover,
        "reextract": cmd_reextract,
        "regenerate": cmd_regenerate,
        "cleanup": cmd_cleanup,
        "api": cmd_api,
        "serve": cmd_serve,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
