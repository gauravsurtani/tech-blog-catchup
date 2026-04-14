#!/usr/bin/env python3
"""Sync local posts with audio to a remote production server.

Usage:
    python scripts/sync_to_prod.py --prod-url https://techblog-api.up.railway.app
    python scripts/sync_to_prod.py --prod-url https://techblog-api.up.railway.app --dry-run
    python scripts/sync_to_prod.py --prod-url https://techblog-api.up.railway.app --audio-only
"""

import argparse
import json
import sys
import time
from pathlib import Path

import requests

# Add backend/ to path so we can import src.*
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import get_session
from src.models import Post


def get_posts(all_with_content: bool = False):
    """Get posts from local DB. If all_with_content, gets all posts with real content."""
    session = get_session()
    try:
        query = session.query(Post).order_by(Post.id)
        if all_with_content:
            from sqlalchemy import func
            query = query.filter(
                (Post.audio_status == "ready") |
                (Post.full_text != None)
            ).filter(func.length(Post.full_text) > 500)
        else:
            query = query.filter(Post.audio_status == "ready")
        posts = query.all()
        result = []
        for p in posts:
            result.append({
                "url": p.url,
                "source_key": p.source_key,
                "source_name": p.source_name,
                "title": p.title,
                "summary": p.summary,
                "full_text": p.full_text,
                "author": p.author,
                "published_at": p.published_at.isoformat() if p.published_at else None,
                "crawled_at": p.crawled_at.isoformat() if p.crawled_at else None,
                "audio_status": p.audio_status,
                "audio_duration_secs": p.audio_duration_secs,
                "word_count": p.word_count,
                "content_quality": p.content_quality,
                "quality_score": p.quality_score,
                "extraction_method": p.extraction_method,
                "content_hash": p.content_hash,
                "podcast_script": p.podcast_script,
                "tags": [t.name for t in p.tags],
                "audio_path": p.audio_path,
            })
        return result
    finally:
        session.close()


def resolve_audio_path(audio_path: str) -> Path | None:
    """Resolve audio path to an actual file on disk."""
    if not audio_path:
        return None
    # audio_path is like "audio/uber_1.mp3"
    backend_dir = Path(__file__).parent.parent
    full = backend_dir / audio_path
    if full.exists():
        return full
    return None


def sync_posts(prod_url: str, posts: list[dict], dry_run: bool = False) -> dict:
    """Upload post metadata to production /api/import endpoint."""
    url = f"{prod_url.rstrip('/')}/api/import"
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Syncing {len(posts)} posts to {url}")

    if dry_run:
        for p in posts:
            print(f"  Would sync: {p['source_key']} — {p['title'][:60]}")
        return {"created": 0, "updated": 0, "skipped": 0, "errors": []}

    # Send in batches of 10 to avoid huge payloads
    batch_size = 10
    totals = {"created": 0, "updated": 0, "skipped": 0, "errors": []}

    for i in range(0, len(posts), batch_size):
        batch = posts[i:i + batch_size]
        # Strip audio_path from the metadata (it's uploaded separately)
        batch_clean = [{k: v for k, v in p.items() if k != "audio_path"} for p in batch]

        resp = requests.post(url, json=batch_clean, timeout=60)
        if resp.status_code != 200:
            print(f"  ERROR batch {i//batch_size + 1}: {resp.status_code} {resp.text[:200]}")
            totals["errors"].append(f"Batch {i//batch_size + 1}: HTTP {resp.status_code}")
            continue

        result = resp.json()
        totals["created"] += result["created"]
        totals["updated"] += result["updated"]
        totals["skipped"] += result["skipped"]
        totals["errors"].extend(result.get("errors", []))
        print(f"  Batch {i//batch_size + 1}: +{result['created']} created, "
              f"{result['updated']} updated, {result['skipped']} skipped")

    return totals


def sync_audio(prod_url: str, posts: list[dict], dry_run: bool = False) -> dict:
    """Upload audio files to production /api/import/audio endpoint."""
    url = f"{prod_url.rstrip('/')}/api/import/audio"
    uploaded = 0
    skipped = 0
    errors = []

    print(f"\n{'[DRY RUN] ' if dry_run else ''}Uploading audio files...")

    for p in posts:
        audio_path = resolve_audio_path(p.get("audio_path", ""))
        if not audio_path:
            skipped += 1
            continue

        filename = audio_path.name
        size_mb = audio_path.stat().st_size / (1024 * 1024)

        if dry_run:
            print(f"  Would upload: {filename} ({size_mb:.1f} MB) for {p['title'][:50]}")
            continue

        print(f"  Uploading {filename} ({size_mb:.1f} MB)...", end=" ", flush=True)
        start = time.time()

        try:
            with open(audio_path, "rb") as f:
                resp = requests.post(
                    url,
                    data={"url": p["url"], "audio_filename": filename},
                    files={"audio_file": (filename, f, "audio/mpeg")},
                    timeout=300,  # 5 min for large files
                )
            elapsed = time.time() - start

            if resp.status_code == 200:
                uploaded += 1
                print(f"OK ({elapsed:.1f}s)")
            else:
                errors.append(f"{filename}: HTTP {resp.status_code}")
                print(f"FAILED ({resp.status_code})")
        except Exception as e:
            errors.append(f"{filename}: {str(e)}")
            print(f"ERROR: {e}")

    return {"uploaded": uploaded, "skipped": skipped, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="Sync local podcasts to production")
    parser.add_argument("--prod-url", required=True, help="Production backend URL")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be synced")
    parser.add_argument("--audio-only", action="store_true", help="Only upload audio (skip post metadata)")
    parser.add_argument("--metadata-only", action="store_true", help="Only sync metadata (skip audio)")
    parser.add_argument("--all", action="store_true", help="Sync all posts with content (not just audio-ready)")
    args = parser.parse_args()

    posts = get_posts(all_with_content=args.all)
    label = "posts with content" if args.all else "posts with audio"
    print(f"Found {len(posts)} {label} locally")

    if not posts:
        print("Nothing to sync.")
        return

    # Show summary
    from collections import Counter
    sources = Counter(p["source_key"] for p in posts)
    print("Sources:")
    for src, cnt in sources.most_common():
        print(f"  {src}: {cnt}")

    audio_posts = [p for p in posts if resolve_audio_path(p.get("audio_path", ""))]
    total_size = sum(resolve_audio_path(p["audio_path"]).stat().st_size for p in audio_posts)
    print(f"Audio files: {len(audio_posts)} ({total_size / (1024*1024):.0f} MB)")

    # Step 1: Sync post metadata
    if not args.audio_only:
        result = sync_posts(args.prod_url, posts, dry_run=args.dry_run)
        print(f"\nMetadata: {result['created']} created, {result['updated']} updated, "
              f"{result['skipped']} skipped, {len(result['errors'])} errors")

    # Step 2: Upload audio files
    if not args.metadata_only:
        result = sync_audio(args.prod_url, posts, dry_run=args.dry_run)
        print(f"\nAudio: {result['uploaded']} uploaded, {result['skipped']} skipped, "
              f"{len(result['errors'])} errors")

    if not args.dry_run:
        print(f"\nDone! Check {args.prod_url}/api/status to verify.")


if __name__ == "__main__":
    main()
