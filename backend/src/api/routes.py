"""FastAPI route definitions."""

import hashlib
import json
import logging
import os
import time
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import urlparse
from xml.etree.ElementTree import Element, SubElement, tostring

from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks, Request, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

from src.database import get_session
from src.models import Post, Tag, CrawlLog, post_tags, Job, User, UserPreferences, UserFavorite
from src.api.schemas import (
    PostSummary, PostDetail, TagInfo, SourceInfo,
    StatusInfo, PaginatedPosts, CrawlRequest, GenerateRequest,
    JobInfo, CrawlStatusItem,
    UserMeResponse, UserInfo, UserPreferencesInfo, UpdatePreferencesRequest,
    SubmitRequest, ImportPostRequest, ImportResponse,
)
from src.api.rate_limit import limiter
from src.api.auth_middleware import get_current_user, get_optional_user

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
@limiter.limit("60/minute")
def list_posts(
    request: Request,
    source: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    audio_status: str | None = None,
    ids: str | None = None,
    quality_min: int | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = "-published_at",
):
    session = get_session()
    try:
        query = session.query(Post).options(joinedload(Post.tags))

        if ids:
            id_list = [int(x.strip()) for x in ids.split(",") if x.strip().isdigit()]
            if id_list:
                query = query.filter(Post.id.in_(id_list))

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

        # Sort — map friendly aliases then whitelist columns
        SORT_ALIASES = {
            "newest": "-published_at",
            "oldest": "published_at",
            "shortest": "audio_duration_secs",
            "longest": "-audio_duration_secs",
        }
        sort = SORT_ALIASES.get(sort, sort)
        ALLOWED_SORT = {"published_at", "created_at", "title", "word_count", "audio_status", "audio_duration_secs"}
        sort_col = sort.lstrip("-")
        if sort_col not in ALLOWED_SORT:
            raise HTTPException(status_code=400, detail=f"Invalid sort column: {sort_col}")
        col = getattr(Post, sort_col)
        if sort.startswith("-"):
            query = query.order_by(desc(col))
        else:
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
@limiter.limit("60/minute")
def get_post(request: Request, post_id: int):
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
@limiter.limit("30/minute")
def list_tags(request: Request):
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
@limiter.limit("30/minute")
def list_sources(request: Request):
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
@limiter.limit("60/minute")
def get_playlist(
    request: Request,
    source: str | None = None,
    tag: str | None = None,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    sort: str = "-published_at",
):
    """Same as list_posts but filtered to audio_status=ready only."""
    return list_posts(
        request=request,
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
@limiter.limit("30/minute")
def list_jobs(
    request: Request,
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
@limiter.limit("30/minute")
def get_job(request: Request, job_id: int):
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
        logger.exception("Crawl job %d failed", job_id)
        if job:
            job.status = "failed"
            job.error_message = "Crawl failed — check server logs for details"
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
        logger.exception("Generate job %d failed", job_id)
        if job:
            job.status = "failed"
            job.error_message = "Generation failed — check server logs for details"
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


@router.post("/posts/submit")
@limiter.limit("3/hour")
def submit_post(request: Request, req: SubmitRequest, background_tasks: BackgroundTasks):
    """Submit text content for podcast generation.

    Accepts title + text, creates a Post, and queues generation.
    Returns the new post_id and a background job_id for tracking.
    """
    content_hash = hashlib.md5(req.text.encode()).hexdigest()
    synthetic_url = f"user://submission/{content_hash}"

    session = get_session()
    try:
        # Check for duplicate content
        existing = session.query(Post).filter(Post.content_hash == content_hash).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"This content has already been submitted (post_id={existing.id})",
            )

        word_count = len(req.text.split())
        post = Post(
            url=synthetic_url,
            source_key="user",
            source_name="User Submission",
            title=req.title,
            full_text=req.text,
            crawled_at=datetime.utcnow(),
            audio_status="pending",
            word_count=word_count,
            content_hash=content_hash,
            extraction_method="user_text",
            is_user_submitted=True,
            submission_type="text",
        )

        session.add(post)
        session.commit()
        post_id = post.id

        # Queue podcast generation as a background job
        job = Job(
            job_type="generate",
            status="queued",
            params=json.dumps({"post_id": post_id, "source": "user_submit"}),
        )
        session.add(job)
        session.commit()
        job_id = job.id
    finally:
        session.close()

    background_tasks.add_task(_do_generate, job_id, post_id, 1)
    return {"post_id": post_id, "job_id": job_id, "status": "queued"}


@router.get("/status", response_model=StatusInfo)
@limiter.limit("20/minute")
def get_status(request: Request):
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
@limiter.limit("20/minute")
def crawl_status(request: Request):
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
                error_message="Crawl encountered an error" if (log and log.error_message) else None,
            ))

        return result
    finally:
        session.close()


@router.get("/health")
@limiter.limit("30/minute")
def health(request: Request):
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
        "audio_base_url": os.getenv("AUDIO_BASE_URL", "/audio"),
        "auth_configured": bool(os.getenv("NEXTAUTH_SECRET")),
        "generation_configured": bool(os.getenv("OPENAI_API_KEY")),
    }


@router.get("/config")
@limiter.limit("30/minute")
def get_config_endpoint(request: Request):
    """Public configuration for clients (audio URL, version)."""
    return {
        "audio_base_url": os.getenv("AUDIO_BASE_URL", "/audio"),
        "version": "0.1.0",
    }


@router.get("/audio-inventory")
@limiter.limit("10/minute")
def audio_inventory(request: Request):
    """Compare posts with audio_status=ready against actual files on disk."""
    audio_dir_env = os.getenv("AUDIO_DIR")
    audio_dir = Path(audio_dir_env) if audio_dir_env else Path(__file__).parent.parent.parent / "audio"

    session = get_session()
    try:
        ready_posts = (
            session.query(Post)
            .filter(Post.audio_status == "ready")
            .all()
        )

        expected_files: dict[str, Post] = {}
        missing = []
        for post in ready_posts:
            if not post.audio_path:
                missing.append({
                    "post_id": post.id,
                    "title": post.title,
                    "expected_path": None,
                })
                continue
            filename = Path(post.audio_path).name
            expected_files[filename] = post
            full_path = audio_dir / filename
            if not full_path.exists():
                missing.append({
                    "post_id": post.id,
                    "title": post.title,
                    "expected_path": str(full_path),
                })

        orphaned = []
        if audio_dir.is_dir():
            for entry in audio_dir.iterdir():
                if entry.is_file() and entry.name not in expected_files:
                    orphaned.append(entry.name)

        files_on_disk = sum(
            1 for post in ready_posts
            if post.audio_path and (audio_dir / Path(post.audio_path).name).exists()
        )

        return {
            "total_ready": len(ready_posts),
            "files_on_disk": files_on_disk,
            "missing": missing,
            "orphaned": sorted(orphaned),
            "audio_dir": str(audio_dir.resolve()),
        }
    finally:
        session.close()


# ---------- RSS Podcast Feed ----------


@router.get("/feed.xml")
@limiter.limit("120/minute")
def podcast_feed(
    request: Request,
    source: str | None = None,
    tag: str | None = None,
):
    """RSS 2.0 podcast feed with iTunes extensions."""
    site_url = os.getenv("SITE_URL", "http://localhost:3000")
    audio_base = os.getenv("AUDIO_BASE_URL", str(request.base_url).rstrip("/") + "/audio")

    ITUNES_NS = "http://www.itunes.com/dtds/podcast-1.0.dtd"
    ATOM_NS = "http://www.w3.org/2005/Atom"

    rss = Element("rss", version="2.0")
    rss.set("xmlns:itunes", ITUNES_NS)
    rss.set("xmlns:atom", ATOM_NS)

    channel = SubElement(rss, "channel")
    SubElement(channel, "title").text = "Catchup — Tech Blog Podcasts"
    SubElement(channel, "link").text = site_url
    SubElement(channel, "description").text = (
        "Listen to top tech engineering blogs as AI-generated conversational podcasts."
    )
    SubElement(channel, "language").text = "en-us"
    SubElement(channel, "generator").text = "Tech Blog Catchup"

    atom_link = SubElement(channel, "{%s}link" % ATOM_NS)
    atom_link.set("href", f"{str(request.base_url).rstrip('/')}/api/feed.xml")
    atom_link.set("rel", "self")
    atom_link.set("type", "application/rss+xml")

    itunes_author = SubElement(channel, "{%s}author" % ITUNES_NS)
    itunes_author.text = "Catchup"
    itunes_cat = SubElement(channel, "{%s}category" % ITUNES_NS)
    itunes_cat.set("text", "Technology")
    itunes_explicit = SubElement(channel, "{%s}explicit" % ITUNES_NS)
    itunes_explicit.text = "false"

    session = get_session()
    try:
        query = (
            session.query(Post)
            .filter(Post.audio_status == "ready", Post.audio_path.isnot(None))
            .order_by(desc(Post.published_at))
        )
        if source:
            query = query.filter(Post.source_key == source)
        if tag:
            query = query.join(Post.tags).filter(Tag.name == tag)

        posts = query.limit(100).all()

        for post in posts:
            item = SubElement(channel, "item")
            SubElement(item, "title").text = post.title
            SubElement(item, "description").text = post.summary or ""
            SubElement(item, "link").text = post.url

            guid = SubElement(item, "guid")
            guid.set("isPermaLink", "false")
            guid.text = f"techblog-catchup-{post.id}"

            if post.published_at:
                pub_dt = post.published_at.replace(tzinfo=timezone.utc) if post.published_at.tzinfo is None else post.published_at
                SubElement(item, "pubDate").text = format_datetime(pub_dt, usegmt=True)

            audio_filename = Path(post.audio_path).name
            enclosure = SubElement(item, "enclosure")
            enclosure.set("url", f"{audio_base}/{audio_filename}")
            enclosure.set("type", "audio/mpeg")
            enclosure.set("length", "0")

            SubElement(item, "{%s}author" % ITUNES_NS).text = post.source_name
            if post.audio_duration_secs:
                mins, secs = divmod(post.audio_duration_secs, 60)
                hours, mins = divmod(mins, 60)
                duration_str = f"{hours:02d}:{mins:02d}:{secs:02d}" if hours else f"{mins:02d}:{secs:02d}"
                SubElement(item, "{%s}duration" % ITUNES_NS).text = duration_str
            if post.summary:
                SubElement(item, "{%s}summary" % ITUNES_NS).text = post.summary
    finally:
        session.close()

    xml_bytes = tostring(rss, encoding="unicode", xml_declaration=False)
    xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_bytes
    return Response(content=xml_str, media_type="application/rss+xml")


# ---------- Favorites endpoints ----------


@router.get("/favorites")
@limiter.limit("60/minute")
def list_favorites(request: Request, current_user: User = Depends(get_current_user)):
    """Return the authenticated user's favorite post IDs."""
    session = get_session()
    try:
        favs = (
            session.query(UserFavorite.post_id)
            .filter(UserFavorite.user_id == current_user.id)
            .order_by(desc(UserFavorite.created_at))
            .all()
        )
        return {"post_ids": [f[0] for f in favs]}
    finally:
        session.close()


@router.post("/favorites/{post_id}", status_code=201)
@limiter.limit("30/minute")
def add_favorite(request: Request, post_id: int, current_user: User = Depends(get_current_user)):
    """Add a post to the user's favorites. Idempotent."""
    session = get_session()
    try:
        post = session.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        existing = (
            session.query(UserFavorite)
            .filter(UserFavorite.user_id == current_user.id, UserFavorite.post_id == post_id)
            .first()
        )
        if existing:
            return {"status": "already_favorited", "post_id": post_id}

        fav = UserFavorite(user_id=current_user.id, post_id=post_id, created_at=datetime.utcnow())
        session.add(fav)
        session.commit()
        return {"status": "favorited", "post_id": post_id}
    finally:
        session.close()


@router.delete("/favorites/{post_id}", status_code=200)
@limiter.limit("30/minute")
def remove_favorite(request: Request, post_id: int, current_user: User = Depends(get_current_user)):
    """Remove a post from the user's favorites."""
    session = get_session()
    try:
        fav = (
            session.query(UserFavorite)
            .filter(UserFavorite.user_id == current_user.id, UserFavorite.post_id == post_id)
            .first()
        )
        if fav:
            session.delete(fav)
            session.commit()
        return {"status": "removed", "post_id": post_id}
    finally:
        session.close()


# ---------- User endpoints ----------


@router.get("/users/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user and their preferences."""
    session = get_session()
    try:
        prefs = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()

        prefs_info = UserPreferencesInfo(
            theme=prefs.theme if prefs else "dark",
            playback_speed=prefs.playback_speed if prefs else 1.0,
            notifications=prefs.notifications if prefs else True,
        )

        return UserMeResponse(
            user=UserInfo.model_validate(current_user),
            preferences=prefs_info,
        )
    finally:
        session.close()


@router.patch("/users/me", response_model=UserMeResponse)
def update_me(
    req: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
):
    """Update the authenticated user's preferences."""
    session = get_session()
    try:
        prefs = session.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id
        ).first()

        if not prefs:
            prefs = UserPreferences(user_id=current_user.id)
            session.add(prefs)
            session.flush()

        if req.theme is not None:
            prefs.theme = req.theme
        if req.playback_speed is not None:
            prefs.playback_speed = req.playback_speed
        if req.notifications is not None:
            prefs.notifications = req.notifications

        session.commit()

        prefs_info = UserPreferencesInfo(
            theme=prefs.theme,
            playback_speed=prefs.playback_speed,
            notifications=prefs.notifications,
        )

        return UserMeResponse(
            user=UserInfo.model_validate(current_user),
            preferences=prefs_info,
        )
    finally:
        session.close()


# ---------- Admin monitoring endpoints ----------


@router.get("/admin/stats")
@limiter.limit("20/minute")
def admin_stats(request: Request, current_user: User = Depends(get_current_user)):
    """Aggregated monitoring stats for authenticated admins."""
    session = get_session()
    try:
        total_users = session.query(func.count(User.id)).scalar() or 0
        total_posts = session.query(func.count(Post.id)).scalar() or 0
        total_favorites = session.query(func.count(UserFavorite.id)).scalar() or 0

        audio_rows = (
            session.query(Post.audio_status, func.count(Post.id))
            .group_by(Post.audio_status)
            .all()
        )
        audio_counts = {row[0]: row[1] for row in audio_rows}

        recent_users = (
            session.query(User)
            .order_by(desc(User.created_at))
            .limit(20)
            .all()
        )

        popular_posts_q = (
            session.query(
                UserFavorite.post_id,
                Post.title,
                func.count(UserFavorite.id).label("fav_count"),
            )
            .join(Post, Post.id == UserFavorite.post_id)
            .group_by(UserFavorite.post_id, Post.title)
            .order_by(desc("fav_count"))
            .limit(20)
            .all()
        )

        job_stats_q = (
            session.query(Job.status, func.count(Job.id))
            .filter(Job.job_type == "generate")
            .group_by(Job.status)
            .all()
        )
        job_dict = {row[0]: row[1] for row in job_stats_q}

        # Listening activity: posts played (based on audio_status=ready count per source)
        source_audio = (
            session.query(Post.source_name, func.count(Post.id))
            .filter(Post.audio_status == "ready")
            .group_by(Post.source_name)
            .order_by(desc(func.count(Post.id)))
            .limit(15)
            .all()
        )

        # Posts per day (last 30 days)
        from sqlalchemy import cast, Date
        daily_posts = (
            session.query(
                cast(Post.crawled_at, Date).label("day"),
                func.count(Post.id),
            )
            .group_by("day")
            .order_by(desc("day"))
            .limit(30)
            .all()
        )

        return {
            "total_users": total_users,
            "total_posts": total_posts,
            "total_favorites": total_favorites,
            "audio_counts": audio_counts,
            "recent_users": [
                {
                    "email": u.email,
                    "name": u.name,
                    "provider": u.provider,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                }
                for u in recent_users
            ],
            "popular_posts": [
                {"post_id": r[0], "title": r[1], "favorite_count": r[2]}
                for r in popular_posts_q
            ],
            "generation_jobs": {
                "total": sum(job_dict.values()),
                "completed": job_dict.get("completed", 0),
                "failed": job_dict.get("failed", 0),
                "running": job_dict.get("running", 0),
                "queued": job_dict.get("queued", 0),
            },
            "source_audio": [
                {"source": r[0], "ready_count": r[1]}
                for r in source_audio
            ],
            "daily_posts": [
                {"date": str(r[0]), "count": r[1]}
                for r in daily_posts
            ],
        }
    finally:
        session.close()


# --- Import endpoint for syncing local data to production ---

@router.post("/import", response_model=ImportResponse)
async def import_posts(posts: list[ImportPostRequest]):
    """Bulk import posts (upsert by URL). Audio files uploaded separately via /import/audio."""
    session = get_session()
    created = 0
    updated = 0
    skipped = 0
    errors = []
    try:
        for post_data in posts:
            try:
                existing = session.query(Post).filter(Post.url == post_data.url).first()
                if existing:
                    if post_data.audio_status == "ready" and existing.audio_status != "ready":
                        for field in [
                            "title", "summary", "full_text", "author", "published_at",
                            "audio_status", "audio_duration_secs", "word_count",
                            "content_quality", "quality_score", "extraction_method",
                            "content_hash", "podcast_script",
                        ]:
                            val = getattr(post_data, field)
                            if val is not None:
                                setattr(existing, field, val)
                        updated += 1
                    else:
                        skipped += 1
                else:
                    new_post = Post(
                        url=post_data.url,
                        source_key=post_data.source_key,
                        source_name=post_data.source_name,
                        title=post_data.title,
                        summary=post_data.summary,
                        full_text=post_data.full_text,
                        author=post_data.author,
                        published_at=post_data.published_at,
                        crawled_at=post_data.crawled_at or datetime.utcnow(),
                        audio_status=post_data.audio_status,
                        audio_duration_secs=post_data.audio_duration_secs,
                        word_count=post_data.word_count,
                        content_quality=post_data.content_quality,
                        quality_score=post_data.quality_score,
                        extraction_method=post_data.extraction_method,
                        content_hash=post_data.content_hash,
                        podcast_script=post_data.podcast_script,
                    )
                    session.add(new_post)
                    session.flush()

                    for tag_name in post_data.tags:
                        tag = session.query(Tag).filter(Tag.name == tag_name).first()
                        if tag:
                            new_post.tags.append(tag)

                    created += 1
            except Exception as e:
                errors.append(f"{post_data.url}: {str(e)}")

        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

    return ImportResponse(created=created, updated=updated, skipped=skipped, errors=errors)


@router.post("/import/audio")
async def import_audio(
    url: str = Form(...),
    audio_filename: str = Form(...),
    audio_file: UploadFile = File(...),
):
    """Upload an audio file and link it to a post by URL."""
    session = get_session()
    try:
        post = session.query(Post).filter(Post.url == url).first()
        if not post:
            raise HTTPException(status_code=404, detail=f"Post not found: {url}")

        env_audio_dir = os.getenv("AUDIO_DIR")
        if env_audio_dir:
            audio_dir = Path(env_audio_dir)
        else:
            audio_dir = Path(__file__).parent.parent.parent / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)

        dest = audio_dir / audio_filename
        content = await audio_file.read()
        dest.write_bytes(content)

        post.audio_path = f"audio/{audio_filename}"
        post.audio_status = "ready"
        session.commit()

        return {"status": "ok", "post_id": post.id, "audio_path": post.audio_path}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()
