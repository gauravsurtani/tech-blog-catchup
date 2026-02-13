"""Tests for the unified smart-crawl system."""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import Base
from src.models import Post
from src.config import BlogSource, Config
from src.crawler.crawl_manager import (
    _filter_new_urls,
    discover_urls,
    crawl_source,
    crawl_all,
)


@pytest.fixture()
def db_session():
    """In-memory SQLite session for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def sample_source():
    return BlogSource(
        key="test-blog",
        name="Test Blog",
        feed_url="https://test.com/feed",
        sitemap_url="https://test.com/sitemap.xml",
        blog_page_url="https://test.com/blog",
        blog_url_pattern="/blog/",
        enabled=True,
    )


@pytest.fixture()
def medium_source():
    return BlogSource(
        key="netflix",
        name="Netflix TechBlog",
        feed_url="https://netflixtechblog.medium.com/feed",
        archive_url="https://netflixtechblog.medium.com/archive",
        blog_url_pattern="netflixtechblog",
        platform="medium",
        enabled=True,
    )


@pytest.fixture()
def minimal_config():
    return Config(
        sources=[],
        tags=[],
        podcast={},
        crawl={"delay_between_requests": 0.1, "request_timeout": 10, "max_retries": 1},
        app={},
        llm={},
    )


class TestFilterNewUrls:
    def test_all_new(self, db_session):
        urls = ["https://a.com/1", "https://a.com/2", "https://a.com/3"]
        result = _filter_new_urls(db_session, urls)
        assert result == urls

    def test_filters_existing(self, db_session):
        db_session.add(Post(
            url="https://a.com/1",
            source_key="test",
            source_name="Test",
            title="Existing",
        ))
        db_session.commit()

        urls = ["https://a.com/1", "https://a.com/2"]
        result = _filter_new_urls(db_session, urls)
        assert result == ["https://a.com/2"]

    def test_empty_list(self, db_session):
        assert _filter_new_urls(db_session, []) == []

    def test_all_existing(self, db_session):
        for i in range(3):
            db_session.add(Post(
                url=f"https://a.com/{i}",
                source_key="test",
                source_name="Test",
                title=f"Post {i}",
            ))
        db_session.commit()

        urls = ["https://a.com/0", "https://a.com/1", "https://a.com/2"]
        result = _filter_new_urls(db_session, urls)
        assert result == []

    def test_batch_chunking(self, db_session):
        """Verify batch query works with >500 URLs."""
        urls = [f"https://a.com/{i}" for i in range(600)]
        # Add a few to DB
        for i in range(10):
            db_session.add(Post(
                url=f"https://a.com/{i}",
                source_key="test",
                source_name="Test",
                title=f"Post {i}",
            ))
        db_session.commit()

        result = _filter_new_urls(db_session, urls)
        assert len(result) == 590
        assert "https://a.com/0" not in result
        assert "https://a.com/10" in result


class TestDiscoverUrls:
    @patch("src.crawler.crawl_manager.parse_sitemap")
    @patch("src.crawler.crawl_manager.parse_feed")
    @patch("src.crawler.crawl_manager._scrape_blog_page_urls")
    def test_merges_and_deduplicates(self, mock_blog, mock_feed, mock_sitemap, sample_source):
        mock_sitemap.return_value = ["https://test.com/blog/a", "https://test.com/blog/b"]
        mock_blog.return_value = ["https://test.com/blog/b", "https://test.com/blog/c"]
        mock_feed.return_value = [
            MagicMock(url="https://test.com/blog/a"),
            MagicMock(url="https://test.com/blog/d"),
        ]

        combined, methods = discover_urls(sample_source)

        assert len(combined) == 4
        assert "sitemap" in methods
        assert "blog_page" in methods
        assert "feed" in methods
        # Deduplication: b appears in sitemap and blog_page but only once in combined
        assert combined.count("https://test.com/blog/b") == 1

    @patch("src.crawler.crawl_manager.parse_sitemap")
    @patch("src.crawler.crawl_manager.parse_feed")
    def test_sitemap_failure_continues(self, mock_feed, mock_sitemap, sample_source):
        mock_sitemap.side_effect = Exception("network error")
        mock_feed.return_value = [MagicMock(url="https://test.com/blog/x")]

        combined, methods = discover_urls(sample_source)
        assert "sitemap" not in methods
        assert "feed" in methods
        assert len(combined) == 1

    @patch("src.crawler.crawl_manager.scrape_medium_archive_urls")
    @patch("src.crawler.crawl_manager.parse_feed")
    def test_medium_source_uses_archive(self, mock_feed, mock_archive, medium_source):
        mock_archive.return_value = ["https://medium.com/article-1", "https://medium.com/article-2"]
        mock_feed.return_value = [MagicMock(url="https://medium.com/article-1")]

        combined, methods = discover_urls(medium_source)
        assert "medium_archive" in methods
        assert "feed" in methods
        assert len(combined) == 2  # article-1 deduplicated

    def test_no_urls_configured(self):
        source = BlogSource(key="empty", name="Empty", feed_url="", enabled=True)
        combined, methods = discover_urls(source)
        assert combined == []
        assert methods == {}


class TestCrawlSource:
    @patch("src.crawler.crawl_manager.discover_urls")
    def test_dry_run_returns_zero(self, mock_discover, db_session, sample_source, minimal_config):
        mock_discover.return_value = (
            ["https://test.com/blog/new1", "https://test.com/blog/new2"],
            {"feed": ["https://test.com/blog/new1", "https://test.com/blog/new2"]},
        )

        count = crawl_source(db_session, sample_source, minimal_config, dry_run=True)
        assert count == 0

    @patch("src.crawler.crawl_manager.discover_urls")
    def test_no_new_urls(self, mock_discover, db_session, sample_source, minimal_config):
        mock_discover.return_value = ([], {})
        count = crawl_source(db_session, sample_source, minimal_config)
        assert count == 0

    @patch("src.crawler.crawl_manager.parse_feed")
    @patch("src.crawler.crawl_manager.extract_articles_batch")
    @patch("src.crawler.crawl_manager.discover_urls")
    def test_stores_extracted_posts(
        self, mock_discover, mock_extract, mock_feed,
        db_session, sample_source, minimal_config,
    ):
        mock_discover.return_value = (
            ["https://test.com/blog/new1"],
            {"feed": ["https://test.com/blog/new1"]},
        )
        mock_feed.return_value = []

        mock_result = MagicMock()
        mock_result.url = "https://test.com/blog/new1"
        mock_result.title = "New Post"
        mock_result.summary = "A summary"
        mock_result.markdown = "Full text here"
        mock_result.author = "Author"
        mock_result.published_at = datetime(2024, 1, 1)
        mock_result.word_count = 100
        mock_result.quality.quality_label = "good"
        mock_result.quality.score = 75
        mock_result.extraction_method = "trafilatura"
        mock_result.podcast_script = None

        async def fake_extract(*args, **kwargs):
            return [mock_result]

        mock_extract.side_effect = fake_extract

        count = crawl_source(db_session, sample_source, minimal_config)
        assert count == 1

        post = db_session.query(Post).first()
        assert post.title == "New Post"
        assert post.source_key == "test-blog"


class TestCrawlAll:
    @patch("src.crawler.crawl_manager.crawl_source")
    def test_crawls_enabled_sources(self, mock_crawl, db_session, minimal_config):
        sources = [
            BlogSource(key="a", name="A", feed_url="https://a.com/feed", enabled=True),
            BlogSource(key="b", name="B", feed_url="https://b.com/feed", enabled=True),
            BlogSource(key="c", name="C", feed_url="https://c.com/feed", enabled=False),
        ]
        minimal_config.sources = sources
        mock_crawl.return_value = 5

        results = crawl_all(db_session, minimal_config)
        assert results == {"a": 5, "b": 5}
        assert mock_crawl.call_count == 2  # 'c' is disabled

    @patch("src.crawler.crawl_manager.crawl_source")
    def test_dry_run_passed_through(self, mock_crawl, db_session, minimal_config):
        sources = [BlogSource(key="a", name="A", feed_url="https://a.com/feed", enabled=True)]
        minimal_config.sources = sources
        mock_crawl.return_value = 0

        crawl_all(db_session, minimal_config, dry_run=True)
        mock_crawl.assert_called_once_with(db_session, sources[0], minimal_config, dry_run=True)

    @patch("src.crawler.crawl_manager.crawl_source")
    def test_error_handling(self, mock_crawl, db_session, minimal_config):
        sources = [BlogSource(key="a", name="A", feed_url="https://a.com/feed", enabled=True)]
        minimal_config.sources = sources
        mock_crawl.side_effect = RuntimeError("boom")

        results = crawl_all(db_session, minimal_config)
        assert results == {"a": 0}
