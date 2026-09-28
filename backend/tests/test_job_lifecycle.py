import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.database import Base
from src.models import Post, Job


def test_admission_idempotency_and_fencing(monkeypatch):
    from src.jobs import admit_generation, claim_job, finalize_job

    monkeypatch.setenv("ENABLE_GENERATION", "true")
    e = create_engine("sqlite://")
    Base.metadata.create_all(e)
    with Session(e, expire_on_commit=False) as s:
        p = Post(
            url="test://one",
            title="One",
            source_key="test",
            source_name="Test",
            full_text="source " * 100,
            visibility="public",
        )
        s.add(p)
        s.commit()
        j = admit_generation(s, "system:test", p.id, "first-key", {"model": "test"})
        assert (
            admit_generation(s, "system:test", p.id, "first-key", {"model": "test"}).id
            == j.id
        )
        with pytest.raises(HTTPException) as err:
            admit_generation(
                s, "system:test", p.id, "first-key", {"model": "different"}
            )
        assert err.value.status_code == 409
        now = datetime.utcnow()
        attempt = claim_job(s, j.id, "a", now)
        assert attempt == 1
        assert claim_job(s, j.id, "b", now) is None
        assert not finalize_job(s, j.id, "b", attempt, {"audio_path": "bad"})
        assert finalize_job(s, j.id, "a", attempt, {"audio_path": "draft"})
        s.refresh(p)
        assert p.audio_path is None and p.visibility == "public"


def test_cancelled_job_never_starts_provider(tmp_path, monkeypatch):
    from src.jobs import run_job
    from sqlalchemy.orm import sessionmaker

    e = create_engine(f"sqlite:///{tmp_path}/jobs.db")
    Base.metadata.create_all(e)
    factory = sessionmaker(e)
    with factory() as s:
        j = Job(
            job_type="generate",
            status="cancelled",
            worker_id="worker",
            attempt=1,
            source_snapshot='{"title":"Test","text":"Source text"}',
            run_spec="{}",
        )
        s.add(j)
        s.commit()
        job_id = j.id
    monkeypatch.setattr("src.database.get_session", factory)
    calls = []

    async def provider(*args):
        calls.append("model")
        raise AssertionError("must not run")

    monkeypatch.setattr("src.extractor.content_generator.generate_content", provider)
    run_job(job_id, "worker", 1)
    assert calls == []


def test_budget_applies_before_new_admission(monkeypatch):
    from src.jobs import admit_generation

    monkeypatch.setenv("ENABLE_GENERATION", "true")
    monkeypatch.setenv("GENERATION_DAILY_LIMIT", "1")
    e = create_engine("sqlite://")
    Base.metadata.create_all(e)
    with Session(e, expire_on_commit=False) as s:
        s.add_all(
            [
                Post(
                    url=f"test://{n}",
                    title="Title",
                    source_key="demo",
                    source_name="Demo",
                    full_text="source " * 100,
                )
                for n in range(2)
            ]
        )
        s.commit()
        one = admit_generation(s, "system:a", 1, "first-request", {})
        assert admit_generation(s, "system:a", 1, "first-request", {}).id == one.id
        with pytest.raises(HTTPException) as error:
            admit_generation(s, "system:b", 2, "second-request", {})
        assert error.value.status_code == 429
        assert s.query(Job).count() == 1


def test_cancelled_inflight_job_keeps_global_slot(monkeypatch):
    from src.jobs import admit_generation, claim_job

    monkeypatch.setenv("ENABLE_GENERATION", "true")
    e = create_engine("sqlite://")
    Base.metadata.create_all(e)
    with Session(e, expire_on_commit=False) as s:
        s.add_all(
            [
                Post(
                    url=f"test://cancel{n}",
                    title="Title",
                    source_key="demo",
                    source_name="Demo",
                    full_text="source " * 100,
                )
                for n in range(2)
            ]
        )
        s.commit()
        one = admit_generation(s, "system:a", 1, "first-request", {})
        two = admit_generation(s, "system:b", 2, "second-request", {})
        now = datetime.utcnow()
        assert claim_job(s, one.id, "first", now) == 1
        s.get(Job, one.id).status = "cancelled"
        s.commit()
        assert claim_job(s, two.id, "second", now) is None

@pytest.mark.asyncio
async def test_real_worker_releases_cancelled_lease_after_provider_exit(tmp_path,monkeypatch):
    import asyncio,contextlib,threading
    from sqlalchemy.orm import sessionmaker
    from src.jobs import admit_generation,worker_loop
    monkeypatch.setenv('ENABLE_GENERATION','true')
    e=create_engine(f'sqlite:///{tmp_path}/worker.db',connect_args={'check_same_thread':False})
    Base.metadata.create_all(e);factory=sessionmaker(e,expire_on_commit=False)
    started=threading.Event();release=threading.Event();second=threading.Event()
    async def provider(title,*args,**kwargs):
        if title=='Source1':
            started.set();release.wait(5)
        else:second.set()
        raise RuntimeError('controlled provider failure')
    monkeypatch.setattr('src.database.get_session',factory)
    monkeypatch.setattr('src.extractor.content_generator.generate_content',provider)
    with factory() as s:
        s.add_all([Post(url=f'test://loop{i}',title=f'Source{i}',source_key='test',source_name='Test',full_text='source '*100) for i in (1,2)]);s.commit()
        first=admit_generation(s,'system:first',1,'first-request',{}).id
        admit_generation(s,'system:second',2,'second-request',{})
    task=asyncio.create_task(worker_loop())
    try:
        assert await asyncio.to_thread(started.wait,5)
        with factory() as s:
            s.get(Job,first).status='cancelled';s.commit()
        release.set()
        assert await asyncio.to_thread(second.wait,6)
        with factory() as s:
            assert s.get(Job,first).lease_until is None
    finally:
        release.set();task.cancel()
        with contextlib.suppress(asyncio.CancelledError):await task
