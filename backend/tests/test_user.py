"""Tests for User model, auth middleware, and user API endpoints."""

import jwt
import pytest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.database import Base
from src.models import User, UserPreferences
import src.api.routes as routes_module
import src.api.auth_middleware as auth_module

TEST_SECRET = "test-jwt-secret-for-unit-tests"


@pytest.fixture()
def test_db():
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
    _engine, SessionLocal = test_db

    original_routes_get_session = routes_module.get_session
    original_auth_get_session = auth_module.get_session

    def _test_get_session():
        return SessionLocal()

    routes_module.get_session = _test_get_session
    auth_module.get_session = _test_get_session

    try:
        with patch("src.api.app.init_db"), \
             patch("src.podcast.manager.recover_stuck_processing", return_value=0), \
             patch.dict("os.environ", {"NEXTAUTH_SECRET": TEST_SECRET}):
            from src.api.app import create_app
            app = create_app()
            with TestClient(app) as tc:
                yield tc, SessionLocal
    finally:
        routes_module.get_session = original_routes_get_session
        auth_module.get_session = original_auth_get_session


def _make_token(email: str, secret: str = TEST_SECRET) -> str:
    return jwt.encode({"email": email}, secret, algorithm="HS256")


def _seed_user(session_factory, email: str = "test@example.com", provider: str = "google") -> User:
    session = session_factory()
    user = User(email=email, name="Test User", provider=provider)
    session.add(user)
    session.commit()
    session.refresh(user)
    session.close()
    return user


class TestUserModel:
    def test_create_user(self, test_db):
        _engine, SessionLocal = test_db
        session = SessionLocal()
        user = User(email="alice@example.com", name="Alice", provider="github")
        session.add(user)
        session.commit()

        fetched = session.query(User).filter(User.email == "alice@example.com").first()
        assert fetched is not None
        assert fetched.name == "Alice"
        assert fetched.provider == "github"
        assert fetched.created_at is not None
        session.close()

    def test_user_email_unique(self, test_db):
        _engine, SessionLocal = test_db
        session = SessionLocal()
        session.add(User(email="dup@example.com", provider="google"))
        session.commit()
        session.add(User(email="dup@example.com", provider="github"))
        with pytest.raises(Exception):
            session.commit()
        session.close()

    def test_user_repr(self, test_db):
        _engine, SessionLocal = test_db
        user = User(id=1, email="repr@test.com", provider="google")
        assert "repr@test.com" in repr(user)


class TestUserPreferencesModel:
    def test_create_preferences(self, test_db):
        _engine, SessionLocal = test_db
        session = SessionLocal()
        user = User(email="prefs@example.com", provider="google")
        session.add(user)
        session.commit()

        prefs = UserPreferences(user_id=user.id, theme="light", playback_speed=1.5, notifications=False)
        session.add(prefs)
        session.commit()

        fetched = session.query(UserPreferences).filter(UserPreferences.user_id == user.id).first()
        assert fetched is not None
        assert fetched.theme == "light"
        assert fetched.playback_speed == 1.5
        assert fetched.notifications is False
        session.close()

    def test_defaults(self, test_db):
        _engine, SessionLocal = test_db
        session = SessionLocal()
        user = User(email="defaults@example.com", provider="github")
        session.add(user)
        session.commit()

        prefs = UserPreferences(user_id=user.id)
        session.add(prefs)
        session.commit()

        fetched = session.query(UserPreferences).filter(UserPreferences.user_id == user.id).first()
        assert fetched.theme == "dark"
        assert fetched.playback_speed == 1.0
        assert fetched.notifications is True
        session.close()


class TestGetMe:
    def test_get_me_success(self, client):
        tc, SessionLocal = client
        user = _seed_user(SessionLocal)
        token = _make_token(user.email)

        resp = tc.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
        assert data["preferences"]["theme"] == "dark"
        assert data["preferences"]["playback_speed"] == 1.0

    def test_get_me_no_token(self, client):
        tc, _SessionLocal = client
        resp = tc.get("/api/users/me")
        assert resp.status_code == 401

    def test_get_me_invalid_token(self, client):
        tc, _SessionLocal = client
        resp = tc.get("/api/users/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert resp.status_code == 401

    def test_get_me_wrong_secret(self, client):
        tc, SessionLocal = client
        _seed_user(SessionLocal)
        token = _make_token("test@example.com", secret="wrong-secret")

        resp = tc.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401

    def test_get_me_user_not_found(self, client):
        tc, _SessionLocal = client
        token = _make_token("nonexistent@example.com")

        resp = tc.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401


class TestUpdateMe:
    def test_update_preferences(self, client):
        tc, SessionLocal = client
        user = _seed_user(SessionLocal)
        token = _make_token(user.email)

        resp = tc.patch(
            "/api/users/me",
            json={"theme": "light", "playback_speed": 2.0},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["preferences"]["theme"] == "light"
        assert data["preferences"]["playback_speed"] == 2.0
        assert data["preferences"]["notifications"] is True  # unchanged

    def test_update_creates_preferences_if_missing(self, client):
        tc, SessionLocal = client
        user = _seed_user(SessionLocal)
        token = _make_token(user.email)

        resp = tc.patch(
            "/api/users/me",
            json={"notifications": False},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["preferences"]["notifications"] is False

    def test_update_without_auth(self, client):
        tc, _SessionLocal = client
        resp = tc.patch("/api/users/me", json={"theme": "light"})
        assert resp.status_code == 401

    def test_partial_update(self, client):
        tc, SessionLocal = client
        user = _seed_user(SessionLocal)
        token = _make_token(user.email)

        # First set all preferences
        tc.patch(
            "/api/users/me",
            json={"theme": "light", "playback_speed": 1.5, "notifications": False},
            headers={"Authorization": f"Bearer {token}"},
        )

        # Then update only one field
        resp = tc.patch(
            "/api/users/me",
            json={"playback_speed": 2.5},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        prefs = resp.json()["preferences"]
        assert prefs["theme"] == "light"  # unchanged
        assert prefs["playback_speed"] == 2.5  # updated
        assert prefs["notifications"] is False  # unchanged
