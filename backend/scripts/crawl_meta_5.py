"""Quick test: crawl 5 Meta posts and store them."""

import asyncio
from datetime import datetime

from src.crawler.feed_parser import parse_feed
from src.extractor.pipeline import extract_article
from src.database import get_session, init_db
from src.models import Post
from src.tagger.auto_tagger import auto_tag_post
from src.config import get_config


def to_naive(dt):
    """Strip timezone info for SQLite compatibility."""
    if dt and hasattr(dt, "tzinfo") and dt.tzinfo:
        return dt.replace(tzinfo=None)
    return dt


async def main():
    init_db()
    config = get_config()
    session = get_session()

    entries = parse_feed("https://engineering.fb.com/feed/")
    existing = set(
        r[0] for r in session.query(Post.url).filter(Post.source_key == "meta").all()
    )
    new_entries = [e for e in entries if e.url not in existing]
    print(f"{len(new_entries)} new Meta posts, taking first 5\n")
    batch = new_entries[:5]

    added = 0
    for i, entry in enumerate(batch, 1):
        print(f"[{i}/5] {entry.title[:65]}")
        result = await extract_article(entry.url, source_key="meta")
        if result:
            post = Post(
                url=result.url,
                source_key="meta",
                source_name="Meta Engineering",
                title=result.title,
                summary=result.summary or entry.summary or "",
                full_text=result.markdown,
                author=result.author or entry.author,
                published_at=to_naive(result.published_at or entry.published_at),
                crawled_at=datetime.utcnow(),
                word_count=result.word_count,
                content_quality=result.quality.quality_label,
                quality_score=result.quality.score,
                extraction_method=result.extraction_method,
                podcast_script=getattr(result, "podcast_script", None),
            )
            session.add(post)
            session.commit()
            auto_tag_post(post, config.tags, session)
            session.commit()
            added += 1
            print(f"  OK: {result.quality.score}/100 | {result.word_count}w | {result.extraction_method}")
            if getattr(result, "podcast_script", None):
                print(f"  Podcast script: {len(result.podcast_script)} chars")
            else:
                print(f"  Podcast script: None")
        else:
            print(f"  SKIP (extraction failed)")

    session.close()
    print(f"\nDone! Added {added} Meta posts to DB.")


if __name__ == "__main__":
    asyncio.run(main())
