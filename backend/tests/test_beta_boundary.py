"""Private beta regressions: real SQLite and HTTP, no providers called."""

import time
from unittest.mock import patch
import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.database import Base
from src.models import Post, User, Job


@pytest.fixture
def beta(monkeypatch):
    from src.api.rate_limit import limiter

    monkeypatch.setattr(limiter, "enabled", False)
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setenv("API_SIGNING_SECRET", "b" * 40)
    monkeypatch.setenv("ENABLE_GENERATION", "false")
    monkeypatch.setattr("src.api.routes.get_session", factory)
    monkeypatch.setattr("src.api.auth_middleware.get_session", factory)
    with (
        patch("src.api.app.init_db"),
        patch("src.podcast.manager.recover_stuck_processing", return_value=0),
    ):
        from src.api.app import create_app

        with TestClient(create_app()) as client:
            yield client, factory


def token(subject="google:123", **extra):
    return jwt.encode(
        dict(
            sub=subject,
            email="member@example.test",
            email_verified=True,
            iss="blog2podcast-web",
            aud="blog2podcast-api",
            iat=int(time.time()),
            exp=int(time.time()) + 60,
            **extra,
        ),
        "b" * 40,
        algorithm="HS256",
    )


@pytest.mark.parametrize(
    "path,body",
    [
        ("/api/generate", {"post_id": 1}),
        ("/api/crawl", {}),
        ("/api/posts/submit", {"title": "Test", "text": "a " * 100}),
        ("/api/import", []),
    ],
)
def test_anonymous_cannot_start_work(beta, path, body):
    c, factory = beta
    assert c.post(path, json=body).status_code == 401
    with factory() as s:
        assert s.query(Job).count() == 0


def test_default_draft_not_public(beta):
    c, factory = beta
    with factory() as s:
        s.add(
            Post(
                url="https://example.test/private",
                title="Secret",
                source_key="user",
                source_name="Private",
                full_text="Secret source",
            )
        )
        s.commit()
    assert c.get("/api/posts").json()["total"] == 0
    assert c.get("/api/posts/1").status_code == 404
    assert c.get("/api/status").json()["total_posts"] == 0
    assert c.get("/api/sources").json() == []
    assert c.get("/api/health").json()["total_posts"] == 0


def test_jobs_require_auth(beta):
    c, _ = beta
    assert c.get("/api/jobs").status_code == 401
    assert c.get("/api/audio-inventory").status_code == 401


def test_identity_provisions_pending_and_cannot_generate(beta):
    c, factory = beta
    headers = {"Authorization": "Bearer " + token()}
    assert c.get("/api/users/me", headers=headers).status_code == 200
    assert c.get("/api/users/me", headers=headers).json()["user"]["role"] == "pending"
    assert (
        c.post("/api/generate", json={"post_id": 1}, headers=headers).status_code == 403
    )
    c.get("/api/users/me", headers=headers)
    with factory() as s:
        assert s.query(User).count() == 1


def test_sort_contract(beta):
    c, _ = beta
    assert c.get("/api/posts?sort=-quality_score").status_code == 200
    assert c.get("/api/posts?sort=created_at").status_code == 400

def test_private_only_tag_names_do_not_leak(beta):
    from src.models import Tag
    c,factory=beta
    with factory() as s:
        p=Post(url='private://one',title='Secret',source_key='private',source_name='Secret source',tags=[Tag(name='Confidential project',slug='confidential-project')])
        s.add(p);s.commit()
    assert c.get('/api/tags').json()==[]
    assert c.get('/api/status').json()['tag_counts']==[]

def test_real_filter_sort_and_pagination_contract(beta):
    from src.models import Tag
    c,factory=beta
    with factory() as s:
        a=Tag(name='Machine Learning',slug='machine-learning')
        b=Tag(name='Systems',slug='systems')
        s.add_all([Post(url='https://example.test/high',title='Cache high',source_key='demo',source_name='Demo',quality_score=90,visibility='public',tags=[a,b]),Post(url='https://example.test/low',title='Cache low',source_key='demo',source_name='Demo',quality_score=40,visibility='public',tags=[a])]);s.commit()
    r=c.get('/api/posts?source=demo&tag=machine-learning,systems&search=Cache&sort=-quality_score&limit=1&offset=0')
    assert r.status_code==200
    assert r.json()['total']==2
    assert r.json()['posts'][0]['title']=='Cache high'
    second=c.get('/api/posts?source=demo&tag=machine-learning,systems&search=Cache&sort=-quality_score&limit=1&offset=1')
    assert second.json()['posts'][0]['title']=='Cache low'
