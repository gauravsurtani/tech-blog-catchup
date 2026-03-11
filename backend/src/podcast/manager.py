"""Batch orchestration for podcast generation."""

import logging
from datetime import datetime

from sqlalchemy.orm import Session

from src.config import Config
from src.models import Post
from src.podcast.generator import generate_podcast_for_post

logger = logging.getLogger(__name__)


def generate_pending(
    session: Session,
    config: Config,
    limit: int = 10,
    since: datetime | None = None,
) -> int:
    """Find posts with audio_status='pending' and full_text available.
    Generate podcasts for up to `limit` posts.
    Updates audio_status, audio_path, audio_duration_secs.

    Args:
        session: SQLAlchemy Session.
        config: Loaded Config object.
        limit: Maximum number of posts to process.
        since: If provided, only include posts with crawled_at >= this datetime.

    Returns count of successfully generated audio files.
    """
    query = (
        session.query(Post)
        .filter(Post.audio_status == "pending")
        .filter(Post.full_text.isnot(None))
        .filter(Post.full_text != "")
        .filter(
            (Post.quality_score >= 60) | (Post.quality_score.is_(None))
        )
    )

    if since is not None:
        query = query.filter(Post.crawled_at >= since)

    posts = (
        query
        .order_by(Post.crawled_at.desc())
        .limit(limit)
        .all()
    )

    if not posts:
        logger.info("No pending posts with full_text found")
        return 0

    logger.info(f"Generating podcasts for {len(posts)} posts...")
    success_count = 0

    for post in posts:
        result = _generate_single(session, post, config)
        if result:
            success_count += 1

    return success_count


def generate_for_post(session: Session, post_id: int, config: Config) -> bool:
    """Generate podcast for a specific post by ID. Returns True on success."""
    post = session.query(Post).filter(Post.id == post_id).first()
    if not post:
        logger.error(f"Post {post_id} not found")
        return False

    return _generate_single(session, post, config)


def _generate_single(session: Session, post: Post, config: Config) -> bool:
    """Generate podcast for a single post. Returns True on success."""
    try:
        logger.info(f"Generating podcast for: [{post.source_key}] {post.title}")

        post.audio_status = "processing"
        session.commit()

        result = generate_podcast_for_post(post, config)

        if result:
            audio_path, duration = result
            post.audio_status = "ready"
            post.audio_path = audio_path
            post.audio_duration_secs = duration
            session.commit()
            logger.info(f"  -> Success: {audio_path} ({duration}s)")
            return True
        else:
            post.audio_status = "failed"
            session.commit()
            logger.warning(f"  -> Failed for post {post.id}")
            return False
    except Exception:
        logger.exception(f"Unexpected error generating podcast for post {post.id}")
        try:
            post.audio_status = "failed"
            session.commit()
        except Exception:
            logger.exception(f"Failed to mark post {post.id} as failed")
            session.rollback()
        return False


def recover_stuck_processing(session: Session, max_age_minutes: int = 30) -> int:
    """Reset posts stuck in 'processing' state for longer than max_age_minutes.
    Returns count of recovered posts."""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(minutes=max_age_minutes)
    stuck = (
        session.query(Post)
        .filter(Post.audio_status == "processing")
        .filter(Post.crawled_at < cutoff)
        .all()
    )
    count = 0
    for post in stuck:
        post.audio_status = "pending"
        count += 1
    if count:
        session.commit()
        logger.info(f"Recovered {count} posts stuck in 'processing' state")
    return count
