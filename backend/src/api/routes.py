"""FastAPI route definitions."""

import json
import logging
import time
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, Query, HTTPException, BackgroundTasks, Request
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

from src.database import get_session
from src.models import Post, Tag, CrawlLog, post_tags, Job
from src.api.schemas import (
    PostSummary, PostDetail, TagInfo, SourceInfo,
    StatusInfo, PaginatedPosts, CrawlRequest, GenerateRequest,
    JobInfo, CrawlStatusItem,
)
from src.api.rate_limit import limiter

router = APIRouter(prefix="/api")

_start_time = time.time()


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
        audio_path=post.audio_path,
        audio_duration_secs=post.audio_duration_secs,
        word_count=post.word_count,
    )


@router.get("/posts", response_model=PaginatedPosts)
def list_posts(
    source: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    audio_status: str | None = None,
    quality_min: int | None = None,
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
        if quality_min is not None:
            query = query.filter(Post.quality_score >= quality_min)

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


# ---------- Jobs endpoints ----------


@router.get("/jobs", response_model=list[JobInfo])
def list_jobs(
    job_type: str | None = None,
    status: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
):
    session = get_session()
    try:
        query = session.query(Job).order_by(desc(Job.created_at))
        if job_type:
            query = query.filter(Job.job_type == job_type)
        if status:
            query = query.filter(Job.status == status)
        jobs = query.limit(limit).all()
        return [JobInfo.model_validate(j) for j in jobs]
    finally:
        session.close()


@router.get("/jobs/{job_id}", response_model=JobInfo)
def get_job(job_id: int):
    session = get_session()
    try:
        job = session.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return JobInfo.model_validate(job)
    finally:
        session.close()


# ---------- Background workers ----------


def _do_crawl(job_id: int, source_key: str | None):
    """Background task: run crawl and update job status."""
    from src.crawler.crawl_manager import crawl_all, crawl_source
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        job = session.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "running"
            job.started_at = datetime.utcnow()
            session.commit()

        if source_key:
            source = next((s for s in config.sources if s.key == source_key), None)
            if not source:
                logger.error("Source '%s' not found", source_key)
                if job:
                    job.status = "failed"
                    job.error_message = f"Source '{source_key}' not found"
                    job.completed_at = datetime.utcnow()
                    session.commit()
                return
            count = crawl_source(session, source, config)
            result_data = {"source": source_key, "posts_added": count}
        else:
            results = crawl_all(session, config)
            result_data = {"results": results}

        if job:
            job.status = "completed"
            job.result = json.dumps(result_data)
            job.completed_at = datetime.utcnow()
            session.commit()
    except Exception as exc:
        logger.error("Crawl failed: %s", exc)
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.utcnow()
            session.commit()
    finally:
        session.close()


def _do_generate(job_id: int, post_id: int | None, limit_count: int):
    """Background task: run podcast generation and update job status."""
    from src.podcast.manager import generate_pending, generate_for_post
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        job = session.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = "running"
            job.started_at = datetime.utcnow()
            session.commit()

        if post_id:
            success = generate_for_post(session, post_id, config)
            result_data = {"post_id": post_id, "success": success}
            logger.info("Generate post %d: %s", post_id, "ok" if success else "failed")
        else:
            count = generate_pending(session, config, limit=limit_count)
            result_data = {"generated": count}
            logger.info("Generated %d podcasts", count)

        if job:
            job.status = "completed"
            job.result = json.dumps(result_data)
            job.completed_at = datetime.utcnow()
            session.commit()
    except Exception as exc:
        logger.error("Generate failed: %s", exc)
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.utcnow()
            session.commit()
    finally:
        session.close()


@router.post("/crawl")
@limiter.limit("5/minute")
def trigger_crawl(request: Request, req: CrawlRequest, background_tasks: BackgroundTasks):
    """Trigger a crawl. Returns immediately -- crawl runs in background."""
    from src.config import get_config

    if req.source:
        config = get_config()
        source = next((s for s in config.sources if s.key == req.source), None)
        if not source:
            raise HTTPException(status_code=404, detail=f"Source '{req.source}' not found")

    session = get_session()
    try:
        job = Job(
            job_type="crawl",
            status="queued",
            params=json.dumps({"source": req.source}),
        )
        session.add(job)
        session.commit()
        job_id = job.id
    finally:
        session.close()

    background_tasks.add_task(_do_crawl, job_id, req.source)
    return {"status": "queued", "job_id": job_id, "source": req.source}


@router.post("/generate")
@limiter.limit("5/minute")
def trigger_generate(request: Request, req: GenerateRequest, background_tasks: BackgroundTasks):
    """Trigger podcast generation. Returns immediately -- generation runs in background."""
    session = get_session()
    try:
        # Guard: if a specific post is requested, check if audio already exists
        if req.post_id:
            post = session.query(Post).filter(Post.id == req.post_id).first()
            if not post:
                raise HTTPException(status_code=404, detail=f"Post {req.post_id} not found")
            if post.audio_status == "ready":
                raise HTTPException(
                    status_code=409,
                    detail=f"Post {req.post_id} already has audio generated",
                )

        # Guard: check for duplicate queued/running generate jobs
        active_jobs = (
            session.query(Job)
            .filter(Job.job_type == "generate", Job.status.in_(["queued", "running"]))
            .all()
        )
        for existing in active_jobs:
            existing_params = json.loads(existing.params) if existing.params else {}
            existing_post_id = existing_params.get("post_id")
            if req.post_id:
                # Specific post: match if an active job targets the same post_id
                if existing_post_id == req.post_id:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Generation already in progress for post {req.post_id}",
                        headers={"X-Existing-Job-Id": str(existing.id)},
                    )
            else:
                # Batch job: match if another batch generate job is active
                if existing_post_id is None:
                    raise HTTPException(
                        status_code=409,
                        detail="A batch generation job is already queued or running",
                        headers={"X-Existing-Job-Id": str(existing.id)},
                    )

        job = Job(
            job_type="generate",
            status="queued",
            params=json.dumps({"post_id": req.post_id, "limit": req.limit}),
        )
        session.add(job)
        session.commit()
        job_id = job.id
    finally:
        session.close()

    background_tasks.add_task(_do_generate, job_id, req.post_id, req.limit)
    return {"status": "queued", "job_id": job_id, "post_id": req.post_id, "limit": req.limit}


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


@router.get("/crawl-status", response_model=list[CrawlStatusItem])
def crawl_status():
    """Return scrape status for every configured source (green/red/grey)."""
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        # Get post counts per source
        post_counts = dict(
            session.query(Post.source_key, func.count(Post.id))
            .group_by(Post.source_key)
            .all()
        )

        # Get max URLs discovered per source (best discovery run)
        max_discovered = dict(
            session.query(CrawlLog.source_key, func.max(CrawlLog.urls_found))
            .filter(CrawlLog.urls_found.isnot(None))
            .group_by(CrawlLog.source_key)
            .all()
        )

        # Get latest CrawlLog per source
        latest_logs: dict[str, CrawlLog] = {}
        for log in (
            session.query(CrawlLog)
            .order_by(desc(CrawlLog.started_at))
            .all()
        ):
            if log.source_key not in latest_logs:
                latest_logs[log.source_key] = log

        result = []
        for source in config.sources:
            log = latest_logs.get(source.key)
            if log:
                status = log.status if log.status else ("success" if log.completed_at else "running")
            else:
                status = "never"

            # Derive blog homepage from blog_page_url or feed URL
            url_for_blog = source.blog_page_url or source.feed_url or ""
            if url_for_blog:
                parsed = urlparse(url_for_blog)
                blog_url = f"{parsed.scheme}://{parsed.netloc}"
            else:
                blog_url = None

            result.append(CrawlStatusItem(
                source_key=source.key,
                source_name=source.name,
                enabled=source.enabled,
                feed_url=source.feed_url,
                blog_url=blog_url,
                status=status,
                post_count=post_counts.get(source.key, 0),
                total_discoverable=max_discovered.get(source.key),
                last_crawl_at=log.completed_at or log.started_at if log else None,
                last_crawl_type=log.crawl_type if log else None,
                posts_added_last=log.posts_added if log else None,
                urls_found_last=log.urls_found if log else None,
                error_message=log.error_message if log else None,
            ))

        return result
    finally:
        session.close()


@router.get("/health")
def health():
    """Health check endpoint with system details."""
    session = get_session()
    try:
        total_posts = session.query(func.count(Post.id)).scalar() or 0
        audio_ready = session.query(func.count(Post.id)).filter(Post.audio_status == "ready").scalar() or 0
        db_ok = True
    except Exception:
        total_posts = 0
        audio_ready = 0
        db_ok = False
    finally:
        session.close()

    return {
        "status": "ok" if db_ok else "degraded",
        "uptime_seconds": int(time.time() - _start_time),
        "db_connected": db_ok,
        "total_posts": total_posts,
        "audio_ready_count": audio_ready,
        "version": "0.1.0",
    }
