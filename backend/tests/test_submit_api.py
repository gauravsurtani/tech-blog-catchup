"""Tests for POST /api/posts/submit — user content submission endpoint."""

import pytest
from unittest.mock import patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.database import Base
from src.models import Post
import src.api.routes as routes_module


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
            # Disable rate limiting for tests
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

    def test_both_url_and_text_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com",
            "text": "some text",
            "title": "Title",
        })
        assert resp.status_code == 422

    def test_text_without_title_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": "some text",
        })
        assert resp.status_code == 422

    def test_empty_url_and_empty_text_returns_422(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "url": "",
            "text": "",
        })
        assert resp.status_code == 422


class TestSubmitText:
    """Text submission tests — creates posts directly in DB."""

    def test_submit_text_returns_200_with_post_id(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": "Article about distributed systems and consensus protocols.",
            "title": "Distributed Systems 101",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "post_id" in data
        assert data["status"] in ("queued", "pending")

    def test_submit_text_creates_correct_post(self, client):
        tc, SessionLocal = client
        resp = tc.post("/api/posts/submit", json={
            "text": "Article about testing strategies.",
            "title": "TDD Guide",
        })
        assert resp.status_code == 200
        post_id = resp.json()["post_id"]

        # Verify via GET /api/posts/{id}
        detail = tc.get(f"/api/posts/{post_id}")
        assert detail.status_code == 200
        post = detail.json()
        assert post["source_key"] == "user"
        assert post["title"] == "TDD Guide"
        assert post["full_text"] == "Article about testing strategies."

    def test_submit_text_sets_user_submission_fields(self, client):
        tc, SessionLocal = client
        resp = tc.post("/api/posts/submit", json={
            "text": "Content about microservices.",
            "title": "Microservices",
        })
        post_id = resp.json()["post_id"]

        # Check DB directly for fields not exposed in API response
        session = SessionLocal()
        post = session.query(Post).filter(Post.id == post_id).first()
        assert post.is_user_submitted is True
        assert post.submission_type == "text"
        assert post.source_key == "user"
        assert post.source_name == "User Submission"
        session.close()

    def test_submit_text_sets_word_count(self, client):
        tc, SessionLocal = client
        text = "one two three four five"
        resp = tc.post("/api/posts/submit", json={
            "text": text,
            "title": "Word Count Test",
        })
        post_id = resp.json()["post_id"]

        session = SessionLocal()
        post = session.query(Post).filter(Post.id == post_id).first()
        assert post.word_count == 5
        session.close()

    def test_submit_text_queues_generate_job(self, client):
        tc, _ = client
        resp = tc.post("/api/posts/submit", json={
            "text": "Enough content to generate a podcast episode from.",
            "title": "Podcast Test",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "job_id" in data
        assert data["job_id"] is not None


class TestSubmitURL:
    """URL submission tests — mock trafilatura to avoid network calls."""

    @patch("src.api.routes.trafilatura")
    def test_submit_url_returns_200(self, mock_traf, client):
        tc, _ = client
        mock_traf.fetch_url.return_value = "<html><body>Article</body></html>"
        mock_traf.extract.return_value = "Extracted article about Kubernetes."
        mock_meta = type("Meta", (), {"title": "K8s Guide", "author": "Alice", "date": None})()
        mock_traf.extract_metadata.return_value = mock_meta

        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com/k8s-guide",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "post_id" in data

    @patch("src.api.routes.trafilatura")
    def test_submit_url_creates_correct_post(self, mock_traf, client):
        tc, SessionLocal = client
        mock_traf.fetch_url.return_value = "<html><body>Content</body></html>"
        mock_traf.extract.return_value = "Detailed article about caching strategies."
        mock_meta = type("Meta", (), {"title": "Caching 101", "author": "Bob", "date": None})()
        mock_traf.extract_metadata.return_value = mock_meta

        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com/caching",
        })
        post_id = resp.json()["post_id"]

        session = SessionLocal()
        post = session.query(Post).filter(Post.id == post_id).first()
        assert post.url == "https://example.com/caching"
        assert post.source_key == "user"
        assert post.is_user_submitted is True
        assert post.submission_type == "url"
        assert post.title == "Caching 101"
        assert post.author == "Bob"
        assert post.extraction_method == "trafilatura"
        session.close()

    @patch("src.api.routes.trafilatura")
    def test_submit_url_extraction_fails_returns_500(self, mock_traf, client):
        tc, _ = client
        mock_traf.fetch_url.return_value = None  # fetch fails

        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com/bad-url",
        })
        assert resp.status_code == 422
        assert "extract" in resp.json()["detail"].lower() or "content" in resp.json()["detail"].lower()

    @patch("src.api.routes.trafilatura")
    def test_submit_url_no_content_returns_422(self, mock_traf, client):
        tc, _ = client
        mock_traf.fetch_url.return_value = "<html></html>"
        mock_traf.extract.return_value = None  # no content extracted

        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com/empty",
        })
        assert resp.status_code == 422

    @patch("src.api.routes.trafilatura")
    def test_submit_url_uses_title_override(self, mock_traf, client):
        tc, SessionLocal = client
        mock_traf.fetch_url.return_value = "<html><body>Text</body></html>"
        mock_traf.extract.return_value = "Article content here."
        mock_meta = type("Meta", (), {"title": "Original Title", "author": None, "date": None})()
        mock_traf.extract_metadata.return_value = mock_meta

        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com/override",
            "title": "My Custom Title",
        })
        post_id = resp.json()["post_id"]

        session = SessionLocal()
        post = session.query(Post).filter(Post.id == post_id).first()
        assert post.title == "My Custom Title"
        session.close()

    @patch("src.api.routes.trafilatura")
    def test_submit_duplicate_url_returns_409(self, mock_traf, client):
        tc, SessionLocal = client
        # Pre-insert a post with this URL
        session = SessionLocal()
        session.add(Post(
            url="https://example.com/exists",
            source_key="test",
            source_name="Test",
            title="Existing Post",
        ))
        session.commit()
        session.close()

        resp = tc.post("/api/posts/submit", json={
            "url": "https://example.com/exists",
        })
        assert resp.status_code == 409
        assert "already exists" in resp.json()["detail"].lower()
