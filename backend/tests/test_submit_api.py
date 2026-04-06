"""Tests for POST /api/posts/submit — user content submission endpoint (text-only)."""

import pytest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.database import Base
from src.models import Post
import src.api.routes as routes_module

# Helper: text long enough to pass the 100-char minimum
SAMPLE_TEXT = (
    "This is a detailed article about distributed systems and consensus protocols. "
    "It covers topics such as Raft, Paxos, and Byzantine fault tolerance in modern "
    "cloud-native architectures."
)


@pytest.fixture()
def test_db():
    """In-memory SQLite database with all tables."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    return engine, SessionLocal


@pytest.fixture()
def client(test_db):
    """FastAPI test client with in-memory DB."""
    engine, SessionLocal = test_db

    original_get_session = routes_module.get_session

    def _test_get_session():
        return SessionLocal()

    routes_module.get_session = _test_get_session
    try:
        with patch("src.api.app.init_db"), \
             patch("src.podcast.manager.recover_stuck_processing", return_value=0):
            from src.api.app import create_app
            from src.api.rate_limit import limiter as app_limiter
            app = create_app()
            app_limiter.enabled = False
            with TestClient(app) as tc:
                yield tc, SessionLocal
            app_limiter.enabled = True
    finally:
        routes_module.get_session = original_get_session


class TestSubmitValidation:
    """Pydantic validation tests — no DB needed, just HTTP 422 checks."""

    def test_no_input_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={})
        assert resp.status_code == 422

    def test_text_without_title_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
        })
        assert resp.status_code == 422

    def test_title_without_text_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "title": "Some Title",
        })
        assert resp.status_code == 422

    def test_empty_text_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": "",
            "title": "Title",
        })
        assert resp.status_code == 422

    def test_short_text_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": "Too short",
            "title": "Title",
        })
        assert resp.status_code == 422

    def test_long_title_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
            "title": "x" * 501,
        })
        assert resp.status_code == 422

    def test_long_text_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": "x" * 50001,
            "title": "Title",
        })
        assert resp.status_code == 422


class TestSubmitText:
    """Text submission tests — creates posts directly in DB."""

    def test_submit_text_returns_200_with_post_id(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
            "title": "Distributed Systems 101",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "post_id" in data
        assert data["status"] in ("queued", "pending")

    def test_submit_text_creates_correct_post(self, client):
        tc, SessionLocal = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
            "title": "TDD Guide",
        })
        assert resp.status_code == 200
        post_id = resp.json()["post_id"]

        detail = tc.get(f"/api/posts/{post_id}")
        assert detail.status_code == 200
        post = detail.json()
        assert post["source_key"] == "user"
        assert post["title"] == "TDD Guide"
        assert post["full_text"] == SAMPLE_TEXT

    def test_submit_text_sets_user_submission_fields(self, client):
        tc, SessionLocal = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
            "title": "Microservices",
        })
        post_id = resp.json()["post_id"]

        session = SessionLocal()
        post = session.query(Post).filter(Post.id == post_id).first()
        assert post.is_user_submitted is True
        assert post.submission_type == "text"
        assert post.source_key == "user"
        assert post.source_name == "User Submission"
        session.close()

    def test_submit_text_sets_word_count(self, client):
        tc, SessionLocal = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
            "title": "Word Count Test",
        })
        post_id = resp.json()["post_id"]

        session = SessionLocal()
        post = session.query(Post).filter(Post.id == post_id).first()
        assert post.word_count == len(SAMPLE_TEXT.split())
        session.close()

    def test_submit_text_queues_generate_job(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": SAMPLE_TEXT,
            "title": "Podcast Test",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "job_id" in data
        assert data["job_id"] is not None

    def test_submit_duplicate_content_returns_409(self, client):
        tc, _ = client
        payload = {"text": SAMPLE_TEXT, "title": "First Submit"}
        resp1 = tc.post("/api/posts/submit", json=payload)
        assert resp1.status_code == 200

        resp2 = tc.post("/api/posts/submit", json=payload)
        assert resp2.status_code == 409
        assert "already been submitted" in resp2.json()["detail"].lower()
