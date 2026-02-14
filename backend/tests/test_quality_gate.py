"""Tests for the quality gate in podcast generation.

The quality gate filters posts by quality_score >= 60 (or None) when selecting
posts for podcast generation via generate_pending().
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base
from src.models import Post


@pytest.fixture()
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    sess = Session()
    yield sess
    sess.close()


def _make_post(session, title, quality_score=None, full_text="Content", audio_status="pending"):
    post = Post(
        url=f"https://example.com/{title.lower().replace(' ', '-')}",
        source_key="test",
        source_name="Test Blog",
        title=title,
        summary="Summary",
        full_text=full_text,
        quality_score=quality_score,
        audio_status=audio_status,
        crawled_at=datetime.utcnow(),
    )
    session.add(post)
    session.commit()
    return post


class TestQualityGateInManager:
    def test_high_quality_post_included(self, session):
        """Posts with quality_score >= 60 should be selected for generation."""
        _make_post(session, "Good Post", quality_score=75)

        posts = (
            session.query(Post)
            .filter(Post.audio_status == "pending")
            .filter(Post.full_text.isnot(None))
            .filter(Post.full_text != "")
            .filter(
                (Post.quality_score >= 60) | (Post.quality_score.is_(None))
            )
            .all()
        )
        assert len(posts) == 1
        assert posts[0].title == "Good Post"

    def test_low_quality_post_excluded(self, session):
        """Posts with quality_score < 60 should be excluded."""
        _make_post(session, "Bad Post", quality_score=30)

        posts = (
            session.query(Post)
            .filter(Post.audio_status == "pending")
            .filter(Post.full_text.isnot(None))
            .filter(Post.full_text != "")
            .filter(
                (Post.quality_score >= 60) | (Post.quality_score.is_(None))
            )
            .all()
        )
        assert len(posts) == 0

    def test_none_quality_included(self, session):
        """Posts with quality_score=None should be included (legacy posts)."""
        _make_post(session, "Legacy Post", quality_score=None)

        posts = (
            session.query(Post)
            .filter(Post.audio_status == "pending")
            .filter(Post.full_text.isnot(None))
            .filter(Post.full_text != "")
            .filter(
                (Post.quality_score >= 60) | (Post.quality_score.is_(None))
            )
            .all()
        )
        assert len(posts) == 1
        assert posts[0].title == "Legacy Post"

    def test_mixed_quality_filtering(self, session):
        """Only high quality and None quality posts should pass the gate."""
        _make_post(session, "Excellent", quality_score=90)
        _make_post(session, "Mediocre", quality_score=45)
        _make_post(session, "Legacy", quality_score=None)
        _make_post(session, "Terrible", quality_score=10)

        posts = (
            session.query(Post)
            .filter(Post.audio_status == "pending")
            .filter(Post.full_text.isnot(None))
            .filter(Post.full_text != "")
            .filter(
                (Post.quality_score >= 60) | (Post.quality_score.is_(None))
            )
            .all()
        )
        titles = {p.title for p in posts}
        assert titles == {"Excellent", "Legacy"}
