"""Tests for SQLAlchemy ORM models (Post, Tag, CrawlLog)."""

from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from src.database import Base
from src.models import Post, Tag, CrawlLog, post_tags


@pytest.fixture()
def engine():
    """Create an in-memory SQLite engine with all tables."""
    eng = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(eng)
    return eng


@pytest.fixture()
def session(engine):
    """Provide a transactional session for tests."""
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    sess = Session()
    yield sess
    sess.close()


class TestPost:
    def test_create_and_query_post(self, session):
        """Creating a post and querying it back should return the same data."""
        post = Post(
            url="https://example.com/article-1",
            source_key="test",
            source_name="Test Blog",
            title="Test Article",
            summary="A summary",
            published_at=datetime(2024, 1, 15),
        )
        session.add(post)
        session.commit()

        fetched = session.query(Post).filter(Post.url == "https://example.com/article-1").first()
        assert fetched is not None
        assert fetched.title == "Test Article"
        assert fetched.source_key == "test"
        assert fetched.source_name == "Test Blog"
        assert fetched.summary == "A summary"
        assert fetched.audio_status == "pending"

    def test_post_url_uniqueness(self, session):
        """Inserting two posts with the same URL should raise IntegrityError."""
        post1 = Post(
            url="https://example.com/duplicate",
            source_key="test",
            source_name="Test Blog",
            title="First",
        )
        session.add(post1)
        session.commit()

        post2 = Post(
            url="https://example.com/duplicate",
            source_key="test",
            source_name="Test Blog",
            title="Second",
        )
        session.add(post2)
        with pytest.raises(IntegrityError):
            session.commit()

    def test_post_repr(self, session):
        """Post __repr__ should include id, source, and title."""
        post = Post(
            url="https://example.com/repr-test",
            source_key="blog",
            source_name="Blog",
            title="Repr Test",
        )
        session.add(post)
        session.commit()

        assert "blog" in repr(post)
        assert "Repr Test" in repr(post)


class TestTag:
    def test_create_tag(self, session):
        """Creating a tag and querying it should return correct data."""
        tag = Tag(name="Infrastructure", slug="infrastructure")
        session.add(tag)
        session.commit()

        fetched = session.query(Tag).filter(Tag.slug == "infrastructure").first()
        assert fetched is not None
        assert fetched.name == "Infrastructure"
        assert fetched.slug == "infrastructure"

    def test_tag_repr(self, session):
        """Tag __repr__ should include id and name."""
        tag = Tag(name="DevOps", slug="devops")
        session.add(tag)
        session.commit()

        assert "DevOps" in repr(tag)


class TestPostTagRelationship:
    def test_many_to_many(self, session):
        """A post should be able to have multiple tags, and a tag multiple posts."""
        tag1 = Tag(name="LLMs", slug="llms")
        tag2 = Tag(name="Infrastructure", slug="infrastructure")
        session.add_all([tag1, tag2])
        session.commit()

        post = Post(
            url="https://example.com/m2m",
            source_key="test",
            source_name="Test",
            title="M2M Test",
        )
        post.tags.append(tag1)
        post.tags.append(tag2)
        session.add(post)
        session.commit()

        fetched = session.query(Post).filter(Post.url == "https://example.com/m2m").first()
        assert len(fetched.tags) == 2
        tag_names = {t.name for t in fetched.tags}
        assert tag_names == {"LLMs", "Infrastructure"}

        # Reverse: tag -> posts
        fetched_tag = session.query(Tag).filter(Tag.name == "LLMs").first()
        assert len(fetched_tag.posts) == 1
        assert fetched_tag.posts[0].title == "M2M Test"


class TestCrawlLog:
    def test_create_crawl_log(self, session):
        """Creating a CrawlLog and querying it should return correct data."""
        log = CrawlLog(
            source_key="uber",
            crawl_type="full",
            started_at=datetime(2024, 6, 1, 12, 0, 0),
            urls_found=100,
            posts_added=42,
        )
        session.add(log)
        session.commit()

        fetched = session.query(CrawlLog).first()
        assert fetched is not None
        assert fetched.source_key == "uber"
        assert fetched.crawl_type == "full"
        assert fetched.urls_found == 100
        assert fetched.posts_added == 42
        assert fetched.completed_at is None

    def test_crawl_log_repr(self, session):
        """CrawlLog __repr__ should include id, source, and type."""
        log = CrawlLog(source_key="netflix", crawl_type="incremental")
        session.add(log)
        session.commit()

        assert "netflix" in repr(log)
        assert "incremental" in repr(log)
