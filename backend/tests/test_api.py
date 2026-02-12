"""Tests for FastAPI API endpoints."""

import pytest
from unittest.mock import patch
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.database import Base
from src.models import Post, Tag
import src.api.routes as routes_module


@pytest.fixture()
def test_db():
    """Create an in-memory SQLite database with all tables.

    Uses StaticPool so that all connections share the same in-memory database,
    which is critical because SQLite :memory: databases are per-connection.
    """
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
    """Create a FastAPI test client with the in-memory database.

    Monkey-patches get_session in the routes module to use our test DB,
    and patches init_db to prevent startup from touching the real database.
    """
    engine, SessionLocal = test_db

    original_get_session = routes_module.get_session

    def _test_get_session():
        return SessionLocal()

    routes_module.get_session = _test_get_session
    try:
        with patch("src.api.app.init_db"):
            from src.api.app import create_app
            app = create_app()
            with TestClient(app) as tc:
                yield tc, SessionLocal
    finally:
        routes_module.get_session = original_get_session


class TestListPosts:
    def test_empty_initially(self, client):
        """GET /api/posts should return empty list with no posts in DB."""
        tc, _ = client
        resp = tc.get("/api/posts")
        assert resp.status_code == 200
        data = resp.json()
        assert data["posts"] == []
        assert data["total"] == 0

    def test_returns_posts(self, client):
        """GET /api/posts should return posts after insertion."""
        tc, SessionLocal = client
        session = SessionLocal()
        post = Post(
            url="https://example.com/test",
            source_key="test",
            source_name="Test Blog",
            title="Test Post",
            summary="A test summary",
        )
        session.add(post)
        session.commit()
        session.close()

        resp = tc.get("/api/posts")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["posts"][0]["title"] == "Test Post"


class TestGetPost:
    def test_nonexistent_post_returns_404(self, client):
        """GET /api/posts/{id} for a nonexistent ID should return 404."""
        tc, _ = client
        resp = tc.get("/api/posts/9999")
        assert resp.status_code == 404

    def test_existing_post(self, client):
        """GET /api/posts/{id} should return the post details."""
        tc, SessionLocal = client
        session = SessionLocal()
        post = Post(
            url="https://example.com/detail-test",
            source_key="test",
            source_name="Test Blog",
            title="Detail Test Post",
            summary="Details here",
            full_text="Full article text goes here.",
        )
        session.add(post)
        session.commit()
        post_id = post.id
        session.close()

        resp = tc.get(f"/api/posts/{post_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Detail Test Post"
        assert data["full_text"] == "Full article text goes here."


class TestListTags:
    def test_returns_tags(self, client):
        """GET /api/tags should return tag list."""
        tc, SessionLocal = client
        session = SessionLocal()
        tag = Tag(name="Infrastructure", slug="infrastructure")
        session.add(tag)
        session.commit()
        session.close()

        resp = tc.get("/api/tags")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Infrastructure"
        assert data[0]["slug"] == "infrastructure"

    def test_returns_empty_tags(self, client):
        """GET /api/tags should return empty list when no tags exist."""
        tc, _ = client
        resp = tc.get("/api/tags")
        assert resp.status_code == 200
        assert resp.json() == []


class TestListSources:
    def test_returns_sources(self, client):
        """GET /api/sources should return sources grouped by source_key."""
        tc, SessionLocal = client
        session = SessionLocal()
        for i in range(3):
            session.add(Post(
                url=f"https://example.com/post-{i}",
                source_key="uber",
                source_name="Uber Engineering",
                title=f"Post {i}",
            ))
        session.commit()
        session.close()

        resp = tc.get("/api/sources")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["key"] == "uber"
        assert data[0]["name"] == "Uber Engineering"
        assert data[0]["post_count"] == 3

    def test_returns_empty_sources(self, client):
        """GET /api/sources should return empty list when no posts exist."""
        tc, _ = client
        resp = tc.get("/api/sources")
        assert resp.status_code == 200
        assert resp.json() == []


class TestGetStatus:
    def test_returns_status_info(self, client):
        """GET /api/status should return status information."""
        tc, _ = client
        resp = tc.get("/api/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_posts" in data
        assert "posts_by_source" in data
        assert "audio_counts" in data
        assert "tag_counts" in data
        assert data["total_posts"] == 0

    def test_status_with_data(self, client):
        """GET /api/status should reflect post and tag data."""
        tc, SessionLocal = client
        session = SessionLocal()
        session.add(Post(
            url="https://example.com/status-test",
            source_key="test",
            source_name="Test Blog",
            title="Status Test",
        ))
        session.commit()
        session.close()

        resp = tc.get("/api/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_posts"] == 1
