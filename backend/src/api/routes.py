"""FastAPI route definitions."""

from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import joinedload

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
            query = query.filter(Post.source_key == source)
        if tag:
            query = query.join(Post.tags).filter(Tag.name == tag)
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


@router.post("/crawl")
def trigger_crawl(req: CrawlRequest):
    """Trigger a crawl. Returns immediately with status."""
    # Import here to avoid circular imports
    from src.crawler.crawl_manager import crawl_all, crawl_full, crawl_incremental
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        if req.source:
            source = next((s for s in config.sources if s.key == req.source), None)
            if not source:
                raise HTTPException(status_code=404, detail=f"Source '{req.source}' not found")
            if req.mode == "full":
                count = crawl_full(session, source, config)
            else:
                count = crawl_incremental(session, source, config)
            return {"source": req.source, "mode": req.mode, "new_posts": count}
        else:
            results = crawl_all(session, config, mode=req.mode)
            return {"mode": req.mode, "results": results}
    finally:
        session.close()


@router.post("/generate")
def trigger_generate(req: GenerateRequest):
    """Trigger podcast generation."""
    from src.podcast.manager import generate_pending, generate_for_post
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        if req.post_id:
            success = generate_for_post(session, req.post_id, config)
            return {"post_id": req.post_id, "success": success}
        else:
            count = generate_pending(session, config, limit=req.limit)
            return {"generated": count}
    finally:
        session.close()


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
