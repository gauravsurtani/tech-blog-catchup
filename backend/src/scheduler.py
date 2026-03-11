"""APScheduler integration for daily automated crawl + generate.

Enable by setting ENABLE_SCHEDULER=true as an environment variable.
Schedule and limits are configured in config.yaml under the ``scheduler`` key.
"""

import logging
import os
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from src.config import Config
from src.crawler.crawl_manager import crawl_all
from src.database import get_session, init_db
from src.models import Post
from src.podcast.manager import generate_pending
from src.tagger.auto_tagger import auto_tag_post, ensure_tags_exist

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Defaults — used when config.yaml values are missing
# ---------------------------------------------------------------------------
_DEFAULTS = {
    "crawl_cron": "0 2 * * *",
    "generate_cron": "0 4 * * *",
    "crawl_max_posts": 5,
    "generate_batch_size": 50,
    "generate_since_days": 2,
}


def should_enable_scheduler() -> bool:
    """Return True when the ENABLE_SCHEDULER env var is set to 'true'."""
    return os.getenv("ENABLE_SCHEDULER", "").lower() == "true"


def create_scheduler(config: Config) -> AsyncIOScheduler:
    """Build an AsyncIOScheduler with crawl and generate jobs.

    The scheduler is returned in a *stopped* state — the caller must
    call ``scheduler.start()`` to begin execution.
    """
    sched_cfg = config.scheduler or {}
    crawl_cron = sched_cfg.get("crawl_cron", _DEFAULTS["crawl_cron"])
    generate_cron = sched_cfg.get("generate_cron", _DEFAULTS["generate_cron"])

    scheduler = AsyncIOScheduler()

    scheduler.add_job(
        scheduled_crawl,
        trigger=CronTrigger.from_crontab(crawl_cron),
        id="scheduled_crawl",
        name="Daily blog crawl",
        args=[config],
        replace_existing=True,
    )

    scheduler.add_job(
        scheduled_generate,
        trigger=CronTrigger.from_crontab(generate_cron),
        id="scheduled_generate",
        name="Daily podcast generation",
        args=[config],
        replace_existing=True,
    )

    return scheduler


# ---------------------------------------------------------------------------
# Job functions
# ---------------------------------------------------------------------------

def scheduled_crawl(config: Config) -> None:
    """Crawl all enabled sources and auto-tag new posts.

    Called by the scheduler at the configured cron interval.
    Exceptions are caught so the scheduler keeps running.
    """
    logger.info("Scheduled crawl starting")
    init_db()
    session = get_session()
    try:
        results = crawl_all(session, config, dry_run=False)
        total = sum(results.values())
        logger.info("Scheduled crawl finished — %d new posts", total)

        # Auto-tag untagged posts
        ensure_tags_exist(config.tags, session)
        untagged = session.query(Post).filter(~Post.tags.any()).all()
        for post in untagged:
            auto_tag_post(post, config.tags, session)
        if untagged:
            logger.info("Auto-tagged %d posts", len(untagged))
    except Exception:
        logger.exception("Scheduled crawl failed")
    finally:
        session.close()


def scheduled_generate(config: Config) -> None:
    """Generate podcasts for recent pending posts.

    Called by the scheduler at the configured cron interval.
    Uses ``generate_since_days`` and ``generate_batch_size`` from config.
    Exceptions are caught so the scheduler keeps running.
    """
    sched_cfg = config.scheduler or {}
    batch_size = sched_cfg.get("generate_batch_size", _DEFAULTS["generate_batch_size"])
    since_days = sched_cfg.get("generate_since_days", _DEFAULTS["generate_since_days"])
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=since_days)

    logger.info("Scheduled generate starting (batch_size=%d, since=%s)", batch_size, since)
    init_db()
    session = get_session()
    try:
        count = generate_pending(session, config, limit=batch_size, since=since)
        logger.info("Scheduled generate finished — %d podcasts created", count)
    except Exception:
        logger.exception("Scheduled generate failed")
    finally:
        session.close()
