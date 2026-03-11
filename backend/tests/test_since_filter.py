"""Tests for --since flag on crawl and generate commands."""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base
from src.models import Post


@pytest.fixture()
def db_session():
    """Create an in-memory SQLite database with all tables."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    session = SessionLocal()
    yield session
    session.close()


# ---------------------------------------------------------------------------
# Test 1: parse_since helper
# ---------------------------------------------------------------------------
class TestParseSince:
    def test_parse_days(self):
        from run import parse_since
        now = datetime.utcnow()
        result = parse_since("5d")
        # Should be approximately 5 days ago
        diff = now - result
        assert 4.99 < diff.total_seconds() / 86400 < 5.01

    def test_parse_weeks(self):
        from run import parse_since
        now = datetime.utcnow()
        result = parse_since("2w")
        diff = now - result
        assert 13.99 < diff.total_seconds() / 86400 < 14.01

    def test_parse_hours(self):
        from run import parse_since
        now = datetime.utcnow()
        result = parse_since("24h")
        diff = now - result
        assert 23.99 < diff.total_seconds() / 3600 < 24.01

    def test_invalid_unit_raises(self):
        from run import parse_since
        with pytest.raises(ValueError, match="Invalid --since format"):
            parse_since("5x")

    def test_invalid_format_raises(self):
        from run import parse_since
        with pytest.raises(ValueError, match="Invalid --since format"):
            parse_since("abc")

    def test_zero_value(self):
        from run import parse_since
        now = datetime.utcnow()
        result = parse_since("0d")
        diff = now - result
        assert diff.total_seconds() < 1


# ---------------------------------------------------------------------------
# Test 2: generate_pending with since filter (REAL SQLite DB)
# ---------------------------------------------------------------------------
class TestGeneratePendingWithSince:
    def _create_posts(self, session):
        """Create posts with varying crawled_at dates."""
        now = datetime.utcnow()

        old_post = Post(
            url="https://example.com/old",
            source_key="test",
            source_name="Test Blog",
            title="Old Post",
            summary="Old summary",
            full_text="Old full text content here for testing purposes.",
            audio_status="pending",
            quality_score=80,
            crawled_at=now - timedelta(days=30),
        )
        recent_post = Post(
            url="https://example.com/recent",
            source_key="test",
            source_name="Test Blog",
            title="Recent Post",
            summary="Recent summary",
            full_text="Recent full text content here for testing purposes.",
            audio_status="pending",
            quality_score=80,
            crawled_at=now - timedelta(days=2),
        )
        very_recent_post = Post(
            url="https://example.com/very-recent",
            source_key="test",
            source_name="Test Blog",
            title="Very Recent Post",
            summary="Very recent summary",
            full_text="Very recent full text content here for testing.",
            audio_status="pending",
            quality_score=80,
            crawled_at=now - timedelta(hours=6),
        )
        session.add_all([old_post, recent_post, very_recent_post])
        session.commit()
        return old_post, recent_post, very_recent_post

    def test_since_filters_old_posts(self, db_session):
        """generate_pending with since=7 days ago should skip the 30-day-old post."""
        from src.podcast.manager import generate_pending

        old, recent, very_recent = self._create_posts(db_session)

        since_cutoff = datetime.utcnow() - timedelta(days=7)

        # Mock _generate_single to just return True without calling OpenAI
        with patch("src.podcast.manager._generate_single", return_value=True) as mock_gen:
            count = generate_pending(
                db_session, MagicMock(), limit=10, since=since_cutoff
            )

        # Should process 2 posts (recent + very_recent), not the old one
        assert count == 2
        assert mock_gen.call_count == 2

        # Verify the old post was NOT included
        called_posts = [call.args[1] for call in mock_gen.call_args_list]
        called_titles = {p.title for p in called_posts}
        assert "Old Post" not in called_titles
        assert "Recent Post" in called_titles
        assert "Very Recent Post" in called_titles

    def test_since_filters_all_when_very_recent(self, db_session):
        """generate_pending with since=1 hour ago should only get the 6h post if within range."""
        from src.podcast.manager import generate_pending

        self._create_posts(db_session)

        since_cutoff = datetime.utcnow() - timedelta(hours=1)

        with patch("src.podcast.manager._generate_single", return_value=True) as mock_gen:
            count = generate_pending(
                db_session, MagicMock(), limit=10, since=since_cutoff
            )

        # No posts are within 1 hour
        assert count == 0
        assert mock_gen.call_count == 0


# ---------------------------------------------------------------------------
# Test 3: generate_pending without since (backward compat)
# ---------------------------------------------------------------------------
class TestGeneratePendingBackwardCompat:
    def test_no_since_returns_all_pending(self, db_session):
        """generate_pending without since should return all pending posts."""
        from src.podcast.manager import generate_pending

        now = datetime.utcnow()
        for i, age_days in enumerate([1, 10, 100]):
            db_session.add(Post(
                url=f"https://example.com/post-{i}",
                source_key="test",
                source_name="Test Blog",
                title=f"Post {i}",
                summary=f"Summary {i}",
                full_text=f"Full text for post {i} with enough content.",
                audio_status="pending",
                quality_score=80,
                crawled_at=now - timedelta(days=age_days),
            ))
        db_session.commit()

        with patch("src.podcast.manager._generate_single", return_value=True) as mock_gen:
            count = generate_pending(db_session, MagicMock(), limit=10)

        # All 3 posts should be processed (no since filter)
        assert count == 3
        assert mock_gen.call_count == 3

    def test_since_none_is_same_as_no_since(self, db_session):
        """Explicitly passing since=None should behave identically to omitting it."""
        from src.podcast.manager import generate_pending

        now = datetime.utcnow()
        for i in range(2):
            db_session.add(Post(
                url=f"https://example.com/compat-{i}",
                source_key="test",
                source_name="Test Blog",
                title=f"Compat Post {i}",
                summary=f"Summary {i}",
                full_text=f"Full text for compat post {i} here.",
                audio_status="pending",
                quality_score=80,
                crawled_at=now - timedelta(days=60),
            ))
        db_session.commit()

        with patch("src.podcast.manager._generate_single", return_value=True) as mock_gen:
            count = generate_pending(db_session, MagicMock(), limit=10, since=None)

        assert count == 2
        assert mock_gen.call_count == 2


# ---------------------------------------------------------------------------
# Test 4: CLI argument parsing
# ---------------------------------------------------------------------------
class TestCLIArgumentParsing:
    def test_generate_accepts_since_flag(self):
        """The generate subparser should accept --since."""
        from run import main
        import argparse

        # Build parser the same way main() does, and parse --since
        parser = argparse.ArgumentParser()
        subparsers = parser.add_subparsers(dest="command")

        gen_parser = subparsers.add_parser("generate")
        gen_parser.add_argument("--post-id", type=int)
        gen_parser.add_argument("--limit", type=int, default=10)
        gen_parser.add_argument("--since", type=str)

        args = parser.parse_args(["generate", "--since", "7d", "--limit", "5"])
        assert args.since == "7d"
        assert args.limit == 5

    def test_crawl_accepts_since_flag(self):
        """The crawl subparser should accept --since."""
        import argparse

        parser = argparse.ArgumentParser()
        subparsers = parser.add_subparsers(dest="command")

        crawl_parser = subparsers.add_parser("crawl")
        crawl_parser.add_argument("--source")
        crawl_parser.add_argument("--since", type=str)

        args = parser.parse_args(["crawl", "--since", "2w"])
        assert args.since == "2w"
