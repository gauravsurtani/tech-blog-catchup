"""Durable, bounded generation. Published posts are never used as draft storage."""

import asyncio
import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy import text
from src.models import Job, Post, AudioArtifact
from src.api.auth_middleware import require_generation_enabled


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def _lock(session):
    # SQLite serializes admission and claims across API processes and scheduler.
    session.rollback()
    session.execute(text("BEGIN IMMEDIATE"))


def admit_generation(
    session, actor_key, post_id, idempotency_key, run_spec, owner_id=None, source=None
):
    require_generation_enabled()
    if not idempotency_key or not 8 <= len(idempotency_key) <= 128:
        raise HTTPException(400, "An 8–128 character Idempotency-Key is required")
    request_digest = digest(
        {"post_id": post_id, "run_spec": run_spec, "source": source}
    )
    _lock(session)
    existing = (
        session.query(Job)
        .filter_by(actor_key=actor_key, idempotency_key=idempotency_key)
        .first()
    )
    if existing:
        session.commit()
        if existing.request_digest != request_digest:
            raise HTTPException(409, "Idempotency key was used for another request")
        return existing
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    daily = session.query(Job).filter(
        Job.job_type == "generate", Job.created_at >= today
    )
    if daily.count() >= int(os.getenv("GENERATION_DAILY_LIMIT", "10")) or daily.filter(
        Job.actor_key == actor_key
    ).count() >= int(os.getenv("MEMBER_DAILY_LIMIT", "3")):
        session.rollback()
        raise HTTPException(429, "Daily generation limit reached")
    if source is not None:
        if owner_id is None:
            session.rollback()
            raise HTTPException(403, "Owner required")
        source_hash = hashlib.sha256(source["text"].encode()).hexdigest()
        url = f"user://{owner_id}/{source_hash}"
        post = session.query(Post).filter_by(url=url).first()
        if post is None:
            post = Post(
                url=url,
                title=source["title"],
                full_text=source["text"],
                source_key="user",
                source_name="Member submission",
                submitted_by_user_id=owner_id,
                is_user_submitted=True,
                submission_type="text",
                visibility="private",
                content_hash=source_hash,
                word_count=len(source["text"].split()),
            )
            session.add(post)
            session.flush()
        post_id = post.id
    else:
        post = session.get(Post, post_id)
    if not post or not post.full_text:
        session.rollback()
        raise HTTPException(404, "Source unavailable")
    if len(post.full_text) > 50000:
        session.rollback()
        raise HTTPException(422, "Source exceeds 50,000 characters")
    if (
        session.query(Job)
        .filter(
            Job.job_type == "generate",
            Job.post_id == post_id,
            Job.status.in_(["queued", "running", "retrying"]),
        )
        .first()
    ):
        session.rollback()
        raise HTTPException(409, "This source has a generation in progress")
    job = Job(
        job_type="generate",
        actor_key=actor_key,
        owner_id=owner_id,
        post_id=post_id,
        idempotency_key=idempotency_key,
        request_digest=request_digest,
        source_snapshot=json.dumps(
            {"title": post.title, "text": post.full_text, "url": post.url}
        ),
        run_spec=json.dumps(run_spec, sort_keys=True),
        params=json.dumps({"post_id": post_id}),
        stage="queued",
    )
    session.add(job)
    session.commit()
    return job


def claim_job(session, job_id, worker_id, now_utc):
    _lock(session)
    # A global one-job ceiling includes API, CLI and scheduled work.
    active = (
        session.query(Job)
        .filter(
            Job.job_type == "generate",
            Job.status.in_(["running", "cancelled"]),
            Job.lease_until > now_utc,
        )
        .first()
    )
    job = session.get(Job, job_id)
    if (
        active
        or not job
        or job.status not in ("queued", "retrying", "running")
        or job.attempt >= 2
    ):
        session.rollback()
        return None
    if job.status == "running" and (
        job.lease_until is None or job.lease_until > now_utc
    ):
        session.rollback()
        return None
    job.status = "running"
    job.stage = "script"
    job.worker_id = worker_id
    job.attempt += 1
    job.started_at = now_utc
    job.lease_until = now_utc + timedelta(seconds=90)
    session.commit()
    return job.attempt


def finalize_job(session, job_id, worker_id, attempt, artifact=None, error=None):
    query = session.query(Job).filter(
        Job.id == job_id,
        Job.worker_id == worker_id,
        Job.attempt == attempt,
        Job.status == "running",
        Job.lease_until > datetime.utcnow(),
    )
    values = {
        "status": "failed" if error else "completed",
        "stage": "failed" if error else "preview",
        "error_message": error,
        "completed_at": datetime.utcnow(),
        "lease_until": None,
    }
    if artifact is not None:
        values["artifact"] = json.dumps(artifact)
    accepted = query.update(values) == 1
    session.commit()
    return accepted


def publish_job(session, job_id):
    job = session.get(Job, job_id)
    if not job or job.status != "completed" or not job.artifact:
        raise HTTPException(409, "A complete reviewed episode is required")
    artifact = json.loads(job.artifact)
    from src.podcast.generator import audio_directory

    path = audio_directory() / artifact["audio_path"].removeprefix("audio/")
    if (
        not path.is_file()
        or hashlib.sha256(path.read_bytes()).hexdigest() != artifact["audio_sha256"]
    ):
        raise HTTPException(409, "Audio integrity check failed")
    post = session.get(Post, job.post_id)
    post.summary = artifact["summary"]
    post.podcast_script = artifact["podcast_script"]
    post.audio_path = artifact["audio_path"]
    post.audio_status = "ready"
    post.audio_duration_secs = round(
        artifact["duration_samples"] / artifact["sample_rate"]
    )
    post.visibility = "public"
    post.published_job_id = job.id
    session.merge(
        AudioArtifact(path=post.audio_path, post_id=post.id, job_id=job.id, public=True)
    )
    session.commit()
    return {"post_id": post.id, "status": "published"}


def run_job(job_id, worker_id, attempt):
    from src.database import get_session
    from src.extractor.content_generator import generate_content
    from src.podcast.generator import render_episode

    def still_owned():
        with get_session() as check:
            return (
                check.query(Job.id)
                .filter(
                    Job.id == job_id,
                    Job.worker_id == worker_id,
                    Job.attempt == attempt,
                    Job.status == "running",
                    Job.lease_until > datetime.utcnow(),
                )
                .first()
                is not None
            )

    try:
        if not still_owned():
            return
        with get_session() as s:
            job = s.get(Job, job_id)
            source = json.loads(job.source_snapshot)
            spec = json.loads(job.run_spec)
        content = asyncio.run(
            asyncio.wait_for(
                generate_content(
                    source["title"], source["text"], model=spec.get("model")
                ),
                timeout=100,
            )
        )
        if not still_owned():
            return
        with get_session() as s:
            updated = (
                s.query(Job)
                .filter(
                    Job.id == job_id,
                    Job.worker_id == worker_id,
                    Job.attempt == attempt,
                    Job.status == "running",
                    Job.lease_until > datetime.utcnow(),
                )
                .update({"stage": "speech"})
            )
            s.commit()
            if not updated:
                return
        manifest = render_episode(
            content["podcast_script"],
            f"{job_id}-{attempt}",
            digest(source),
            digest(spec),
            cancelled=lambda: not still_owned(),
        )
        manifest.update(content)
        with get_session() as s:
            finalize_job(s, job_id, worker_id, attempt, manifest)
    except Exception:
        with get_session() as s:
            finalize_job(
                s,
                job_id,
                worker_id,
                attempt,
                error="Generation failed. No public episode was changed.",
            )
    finally:
        # Cancellation stops admission immediately but keeps the resource lease until
        # the provider request/child has really exited. Never release a newer attempt.
        with get_session() as s:
            s.query(Job).filter_by(
                id=job_id, worker_id=worker_id, attempt=attempt, status="cancelled"
            ).update({"lease_until": None})
            s.commit()


async def worker_loop():
    from src.database import get_session

    worker_id = uuid.uuid4().hex
    while True:
        if os.getenv("ENABLE_GENERATION", "").lower() == "true":
            with get_session() as s:
                now = datetime.utcnow()
                # Exhausted leases are explicit failures; legacy jobs without leases are not reclaimed.
                s.query(Job).filter(
                    Job.status == "running", Job.lease_until < now, Job.attempt >= 2
                ).update(
                    {
                        "status": "failed",
                        "error_message": "Worker lease expired",
                        "completed_at": now,
                    }
                )
                s.commit()
                ids = [
                    r.id
                    for r in s.query(Job)
                    .filter(
                        Job.job_type == "generate",
                        Job.source_snapshot.isnot(None),
                        Job.status.in_(["queued", "retrying", "running"]),
                    )
                    .order_by(Job.id)
                    .all()
                ]
                for job_id in ids:
                    attempt = claim_job(s, job_id, worker_id, now)
                    if attempt:
                        task = asyncio.create_task(
                            asyncio.to_thread(run_job, job_id, worker_id, attempt)
                        )
                        while not task.done():
                            await asyncio.wait([task], timeout=20)
                            if task.done():
                                break
                            with get_session() as heartbeat:
                                heartbeat.query(Job).filter_by(
                                    id=job_id,
                                    worker_id=worker_id,
                                    attempt=attempt,
                                ).filter(
                                    Job.status.in_(["running", "cancelled"])
                                ).update(
                                    {
                                        "lease_until": datetime.utcnow()
                                        + timedelta(seconds=90)
                                    }
                                )
                                heartbeat.commit()
                        await task
                        break
        await asyncio.sleep(2)
