#!/usr/bin/env python3
"""CLI entry point for Tech Blog Catchup."""

import argparse
import asyncio
import logging
import subprocess
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
    """Crawl blog feeds."""
    from src.config import get_config
    from src.database import get_session, init_db
    from src.crawler.crawl_manager import crawl_all, crawl_full, crawl_incremental
    from src.tagger.auto_tagger import ensure_tags_exist, auto_tag_post

    config = get_config()
    init_db()

    session = get_session()
    try:
        ensure_tags_exist(config.tags, session)

        if args.source:
            source = next((s for s in config.sources if s.key == args.source), None)
            if not source:
                console.print(f"[red]Source '{args.source}' not found[/red]")
                sys.exit(1)

            console.print(f"Crawling [cyan]{source.name}[/cyan] ({args.mode} mode)...")
            if args.mode == "full":
                count = crawl_full(session, source, config)
            else:
                count = crawl_incremental(session, source, config)
            console.print(f"[green]Added {count} new posts from {source.name}[/green]")
        else:
            console.print(f"Crawling all {len(config.sources)} sources ({args.mode} mode)...")
            results = crawl_all(session, config, mode=args.mode)

            table = Table(title="Crawl Results")
            table.add_column("Source", style="cyan")
            table.add_column("New Posts", justify="right", style="green")
            for source_key, count in results.items():
                source = next((s for s in config.sources if s.key == source_key), None)
                name = source.name if source else source_key
                table.add_row(name, str(count))
            table.add_row("[bold]Total[/bold]", f"[bold]{sum(results.values())}[/bold]")
            console.print(table)

        # Auto-tag new posts
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


def cmd_api(args):
    """Start FastAPI server."""
    import uvicorn
    port = args.port or 8000
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
    crawl_parser.add_argument(
        "--mode", choices=["full", "incremental"], default="incremental",
        help="Crawl mode: 'full' for sitemap archive, 'incremental' for RSS new posts (default)"
    )

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
        "api": cmd_api,
        "serve": cmd_serve,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
