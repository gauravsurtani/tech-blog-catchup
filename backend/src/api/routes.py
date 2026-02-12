"""FastAPI route definitions."""

import logging
from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

from src.database import get_session
from src.models import Post, Tag, CrawlLog, post_tags
from src.api.schemas import (
    PostSummary, PostDetail, TagInfo, SourceInfo,
    StatusInfo, PaginatedPosts, CrawlRequest, GenerateRequest,
)

router = APIRouter(prefix="/api")


def _post_to_summary(post: Post) -> PostSummary:
    return PostSummary(
        id=post.id,
        url=post.url,
        source_key=post.source_key,
        source_name=post.source_name,
        title=post.title,
        summary=post.summary,
        author=post.author,
        published_at=post.published_at,
        tags=[t.name for t in post.tags],
        audio_status=post.audio_status,
        audio_duration_secs=post.audio_duration_secs,
        word_count=post.word_count,
    )


@router.get("/posts", response_model=PaginatedPosts)
def list_posts(
    source: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    audio_status: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = "-published_at",
):
    session = get_session()
    try:
        query = session.query(Post).options(joinedload(Post.tags))

        if source:
            source_keys = [s.strip() for s in source.split(",")]
            if len(source_keys) == 1:
                query = query.filter(Post.source_key == source_keys[0])
            else:
                query = query.filter(Post.source_key.in_(source_keys))
        if tag:
            tag_names = [t.strip() for t in tag.split(",")]
            if len(tag_names) == 1:
                query = query.join(Post.tags).filter(Tag.name == tag_names[0])
            else:
                query = query.join(Post.tags).filter(Tag.name.in_(tag_names))
        if search:
            query = query.filter(Post.title.ilike(f"%{search}%"))
        if audio_status:
            query = query.filter(Post.audio_status == audio_status)

        total = query.count()

        # Sort
        if sort.startswith("-"):
            col = getattr(Post, sort[1:], Post.published_at)
            query = query.order_by(desc(col))
        else:
            col = getattr(Post, sort, Post.published_at)
            query = query.order_by(asc(col))

        posts = query.offset(offset).limit(limit).all()

        return PaginatedPosts(
            posts=[_post_to_summary(p) for p in posts],
            total=total,
            offset=offset,
            limit=limit,
        )
    finally:
        session.close()


@router.get("/posts/{post_id}", response_model=PostDetail)
def get_post(post_id: int):
    session = get_session()
    try:
        post = session.query(Post).options(joinedload(Post.tags)).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return PostDetail(
            id=post.id,
            url=post.url,
            source_key=post.source_key,
            source_name=post.source_name,
            title=post.title,
            summary=post.summary,
            full_text=post.full_text,
            author=post.author,
            published_at=post.published_at,
            crawled_at=post.crawled_at,
            tags=[t.name for t in post.tags],
            audio_status=post.audio_status,
            audio_path=post.audio_path,
            audio_duration_secs=post.audio_duration_secs,
            word_count=post.word_count,
        )
    finally:
        session.close()


@router.get("/tags", response_model=list[TagInfo])
def list_tags():
    session = get_session()
    try:
        results = (
            session.query(Tag.name, Tag.slug, func.count(post_tags.c.post_id).label("post_count"))
            .outerjoin(post_tags, Tag.id == post_tags.c.tag_id)
            .group_by(Tag.id)
            .order_by(desc("post_count"))
            .all()
        )
        return [TagInfo(name=r[0], slug=r[1], post_count=r[2]) for r in results]
    finally:
        session.close()


@router.get("/sources", response_model=list[SourceInfo])
def list_sources():
    session = get_session()
    try:
        results = (
            session.query(Post.source_key, Post.source_name, func.count(Post.id).label("post_count"))
            .group_by(Post.source_key, Post.source_name)
            .order_by(desc("post_count"))
            .all()
        )
        return [SourceInfo(key=r[0], name=r[1], post_count=r[2]) for r in results]
    finally:
        session.close()


@router.get("/playlist", response_model=PaginatedPosts)
def get_playlist(
    source: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    sort: str = "-published_at",
):
    """Same as list_posts but filtered to audio_status=ready only."""
    return list_posts(
        source=source,
        tag=tag,
        search=search,
        audio_status="ready",
        offset=offset,
        limit=limit,
        sort=sort,
    )


def _do_crawl(source_key: str | None, mode: str):
    """Background task: run crawl."""
    from src.crawler.crawl_manager import crawl_all, crawl_full, crawl_incremental
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        if source_key:
            source = next((s for s in config.sources if s.key == source_key), None)
            if not source:
                logger.error("Source '%s' not found", source_key)
                return
            if mode == "full":
                count = crawl_full(session, source, config)
            else:
                count = crawl_incremental(session, source, config)
            logger.info("Crawl %s (%s): %d new posts", source_key, mode, count)
        else:
            results = crawl_all(session, config, mode=mode)
            logger.info("Crawl all (%s): %s", mode, results)
    except Exception as exc:
        logger.error("Crawl failed: %s", exc)
    finally:
        session.close()


def _do_generate(post_id: int | None, limit: int):
    """Background task: run podcast generation."""
    from src.podcast.manager import generate_pending, generate_for_post
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        if post_id:
            success = generate_for_post(session, post_id, config)
            logger.info("Generate post %d: %s", post_id, "ok" if success else "failed")
        else:
            count = generate_pending(session, config, limit=limit)
            logger.info("Generated %d podcasts", count)
    except Exception as exc:
        logger.error("Generate failed: %s", exc)
    finally:
        session.close()


@router.post("/crawl")
def trigger_crawl(req: CrawlRequest, background_tasks: BackgroundTasks):
    """Trigger a crawl. Returns immediately — crawl runs in background."""
    from src.config import get_config

    if req.source:
        config = get_config()
        source = next((s for s in config.sources if s.key == req.source), None)
        if not source:
            raise HTTPException(status_code=404, detail=f"Source '{req.source}' not found")

    background_tasks.add_task(_do_crawl, req.source, req.mode)
    return {"status": "started", "source": req.source, "mode": req.mode}


@router.post("/generate")
def trigger_generate(req: GenerateRequest, background_tasks: BackgroundTasks):
    """Trigger podcast generation. Returns immediately — generation runs in background."""
    background_tasks.add_task(_do_generate, req.post_id, req.limit)
    return {"status": "started", "post_id": req.post_id, "limit": req.limit}


@router.get("/status", response_model=StatusInfo)
def get_status():
    session = get_session()
    try:
        total = session.query(func.count(Post.id)).scalar()

        sources = (
            session.query(Post.source_key, Post.source_name, func.count(Post.id))
            .group_by(Post.source_key, Post.source_name)
            .order_by(desc(func.count(Post.id)))
            .all()
        )

        audio = (
            session.query(Post.audio_status, func.count(Post.id))
            .group_by(Post.audio_status)
            .all()
        )

        tag_counts = (
            session.query(Tag.name, Tag.slug, func.count(post_tags.c.post_id))
            .outerjoin(post_tags, Tag.id == post_tags.c.tag_id)
            .group_by(Tag.id)
            .order_by(desc(func.count(post_tags.c.post_id)))
            .all()
        )

        return StatusInfo(
            total_posts=total or 0,
            posts_by_source=[SourceInfo(key=s[0], name=s[1], post_count=s[2]) for s in sources],
            audio_counts={a[0]: a[1] for a in audio},
            tag_counts=[TagInfo(name=t[0], slug=t[1], post_count=t[2]) for t in tag_counts],
        )
    finally:
        session.close()


@router.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}
