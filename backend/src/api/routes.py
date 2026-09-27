"""FastAPI route definitions."""

import hashlib
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks, Request, UploadFile, File, Form
from sqlalchemy import func, desc, asc, or_
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

from src.database import get_session
from src.models import Post, Tag, CrawlLog, post_tags, Job, User, UserPreferences
from src.api.schemas import (
    PostSummary, PostDetail, TagInfo, SourceInfo,
    StatusInfo, PaginatedPosts, CrawlRequest, GenerateRequest,
    JobInfo, CrawlStatusItem,
    UserMeResponse, UserInfo, UserPreferencesInfo, UpdatePreferencesRequest,
    SubmitRequest, ImportPostRequest, ImportResponse,
)
from src.api.rate_limit import limiter
from src.api.auth_middleware import get_current_user, get_optional_user, require_member, require_admin, require_generation_enabled

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
        query = session.query(Post).options(joinedload(Post.tags)).filter(Post.visibility == "public")

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
                query = query.join(Post.tags).filter(or_(Tag.name == tag_names[0], Tag.slug == tag_names[0]))
            else:
                query = query.join(Post.tags).filter(or_(Tag.name.in_(tag_names), Tag.slug.in_(tag_names)))
        if search:
            query = query.filter(Post.title.ilike(f"%{search}%"))
        if audio_status:
            query = query.filter(Post.audio_status == audio_status)
        if quality_min is not None:
            query = query.filter(Post.quality_score >= quality_min)

        query = query.distinct()
        total = query.count()

        # Sort — map friendly aliases then whitelist columns
        SORT_ALIASES = {
            "newest": "-published_at",
            "oldest": "published_at",
            "shortest": "audio_duration_secs",
            "longest": "-audio_duration_secs",
        }
        sort = SORT_ALIASES.get(sort, sort)
        ALLOWED_SORT = {"published_at", "crawled_at", "quality_score", "title", "word_count", "audio_status", "audio_duration_secs"}
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
    user = get_optional_user(request)
    session = get_session()
    try:
        post = session.query(Post).options(joinedload(Post.tags)).filter(Post.id == post_id).first()
        if not post or (post.visibility != "public" and (not user or (user.role != "admin" and post.submitted_by_user_id != user.id))):
            raise HTTPException(status_code=404, detail="Post not found")
        published_job=session.get(Job,post.published_job_id) if post.published_job_id else None
        artifact=json.loads(published_job.artifact) if published_job and published_job.artifact else {}
        return PostDetail(
            transcript=artifact.get("turns",[]),
            transcript_sample_rate=artifact.get("sample_rate",24000),
            podcast_script=post.podcast_script,
            id=post.id,
            url=post.url,
            source_key=post.source_key,
            source_name=post.source_name,
            title=post.title,
            summary=post.summary,
            full_text=None,
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
            session.query(Tag.name, Tag.slug, func.count(Post.id).label("post_count"))
            .join(post_tags, Tag.id == post_tags.c.tag_id).join(Post, Post.id == post_tags.c.post_id).filter(Post.visibility == "public")
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
            .filter(Post.visibility == "public").group_by(Post.source_key, Post.source_name)
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
    user = get_current_user(request)
    session = get_session()
    try:
        query = session.query(Job).order_by(desc(Job.created_at))
        if user.role != "admin":
            query = query.filter(Job.owner_id == user.id)
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
    user = get_current_user(request)
    session = get_session()
    try:
        job = session.query(Job).filter(Job.id == job_id).first()
        if not job or (user.role != "admin" and job.owner_id != user.id):
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


@router.post("/crawl")
@limiter.limit("5/minute")
def trigger_crawl(request: Request, req: CrawlRequest, background_tasks: BackgroundTasks, user: User = Depends(require_admin)):
    require_generation_enabled()
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
def trigger_generate(request: Request, req: GenerateRequest, background_tasks: BackgroundTasks, user: User = Depends(require_member)):
    require_generation_enabled()
    from src.jobs import admit_generation
    if req.post_id is None:
        require_admin(request)
        raise HTTPException(400, "Select an individual source during the private beta")
    with get_session() as session:
        post=session.get(Post,req.post_id)
        if not post or (post.visibility != "public" and user.role != "admin" and post.submitted_by_user_id != user.id):
            raise HTTPException(404,"Post not found")
        job=admit_generation(session,f"user:{user.id}",post.id,request.headers.get("Idempotency-Key"),
            {"model":os.getenv("OLLAMA_MODEL","gemma4:31b"),"speech":"kokoro-v1-int8","prompt":"v1"},user.id)
        return {"status":job.status,"job_id":job.id,"post_id":post.id}


@router.post("/posts/submit")
@limiter.limit("3/hour")
def submit_post(request: Request, req: SubmitRequest, background_tasks: BackgroundTasks, user: User = Depends(require_member)):
    require_generation_enabled()
    from src.jobs import admit_generation
    key=request.headers.get("Idempotency-Key")
    if not key or not 8 <= len(key) <= 128:
        raise HTTPException(400,"An 8–128 character Idempotency-Key is required")
    with get_session() as session:
        job=admit_generation(session,f"user:{user.id}",None,key,
            {"model":os.getenv("OLLAMA_MODEL","gemma4:31b"),"speech":"kokoro-v1-int8","prompt":"v1"},user.id,
            source={"title":req.title,"text":req.text})
        return {"post_id":job.post_id,"job_id":job.id,"status":job.status}


@router.get("/status", response_model=StatusInfo)
@limiter.limit("20/minute")
def get_status(request: Request):
    session = get_session()
    try:
        total = session.query(func.count(Post.id)).filter(Post.visibility == "public").scalar()

        sources = (
            session.query(Post.source_key, Post.source_name, func.count(Post.id))
            .filter(Post.visibility == "public").group_by(Post.source_key, Post.source_name)
            .order_by(desc(func.count(Post.id)))
            .all()
        )

        audio = (
            session.query(Post.audio_status, func.count(Post.id))
            .filter(Post.visibility == "public").group_by(Post.audio_status)
            .all()
        )

        tag_counts = (
            session.query(Tag.name, Tag.slug, func.count(Post.id))
            .join(post_tags, Tag.id == post_tags.c.tag_id).join(Post, Post.id == post_tags.c.post_id).filter(Post.visibility == "public")
            .group_by(Tag.id)
            .order_by(desc(func.count(Post.id)))
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
def crawl_status(request: Request, user: User = Depends(require_admin)):
    """Return scrape status for every configured source (green/red/grey)."""
    from src.config import get_config

    config = get_config()
    session = get_session()
    try:
        # Get post counts per source
        post_counts = dict(
            session.query(Post.source_key, func.count(Post.id))
            .filter(Post.visibility == "public").group_by(Post.source_key)
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
        total_posts = session.query(func.count(Post.id)).filter(Post.visibility == "public").scalar() or 0
        audio_ready = session.query(func.count(Post.id)).filter(Post.audio_status == "ready", Post.visibility == "public").scalar() or 0
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
def audio_inventory(request: Request, user: User = Depends(require_admin)):
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
            filename = post.audio_path.removeprefix("audio/")
            expected_files[filename] = post
            full_path = audio_dir / filename
            if not full_path.exists():
                missing.append({
                    "post_id": post.id,
                    "title": post.title,
                    "expected_path": filename,
                })

        orphaned = []
        if audio_dir.is_dir():
            for entry in audio_dir.rglob("*.mp3"):
                if entry.is_file() and entry.relative_to(audio_dir).as_posix() not in expected_files:
                    orphaned.append(entry.relative_to(audio_dir).as_posix())

        files_on_disk = sum(
            1 for post in ready_posts
            if post.audio_path and (audio_dir / post.audio_path.removeprefix("audio/")).is_file()
        )

        return {
            "total_ready": len(ready_posts),
            "files_on_disk": files_on_disk,
            "missing": missing,
            "orphaned": sorted(orphaned),
        }
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


# --- Import endpoint for syncing local data to production ---

@router.post("/import", response_model=ImportResponse)
async def import_posts(posts: list[ImportPostRequest], user: User = Depends(require_admin)):
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
                if existing and existing.visibility == "public":
                    skipped += 1
                    continue
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
    user: User = Depends(require_admin),
):
    # Legacy arbitrary-file import cannot establish provenance or publication state.
    raise HTTPException(409, "Audio import is disabled. Use a reviewed generation job.")


@router.post("/jobs/{job_id}/publish")
def publish(job_id: int, user: User = Depends(require_admin)):
    from src.jobs import publish_job
    with get_session() as session:
        return publish_job(session,job_id)


@router.post("/posts/{post_id}/withdraw")
def withdraw(post_id: int, user: User = Depends(require_admin)):
    from src.models import AudioArtifact
    with get_session() as session:
        post=session.get(Post,post_id)
        if not post: raise HTTPException(404,"Post not found")
        post.visibility="private"
        session.query(AudioArtifact).filter_by(post_id=post_id).update({"public":False})
        session.commit()
        return {"status":"withdrawn"}


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int, user: User = Depends(require_member)):
    with get_session() as session:
        job=session.get(Job,job_id)
        if not job or (user.role!="admin" and job.owner_id!=user.id): raise HTTPException(404,"Job not found")
        if job.status not in ("queued","running","retrying"): raise HTTPException(409,"Job is no longer active")
        job.status="cancelled"; job.completed_at=datetime.utcnow(); session.commit()
        return {"status":"cancelled"}
