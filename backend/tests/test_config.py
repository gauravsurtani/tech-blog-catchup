"""Tests for config loading from config.yaml."""

from src.config import load_config, Config, BlogSource, TagDefinition


def test_load_config_returns_config():
    """load_config() should return a Config instance."""
    config = load_config()
    assert isinstance(config, Config)


def test_config_has_15_sources():
    """Config should have exactly 15 blog sources."""
    config = load_config()
    assert len(config.sources) == 15


def test_all_sources_have_name_and_url():
    """Every source must have a name and at least one of feed_url, sitemap_url, or archive_url."""
    config = load_config()
    for source in config.sources:
        assert isinstance(source, BlogSource)
        assert source.name, f"Source {source.key!r} has no name"
        has_url = bool(source.feed_url) or bool(source.sitemap_url) or bool(source.archive_url)
        assert has_url, (
            f"Source {source.key!r} ({source.name}) must have at least one of "
            f"feed_url, sitemap_url, or archive_url"
        )


def test_config_has_12_tags():
    """Config should have exactly 12 tag definitions."""
    config = load_config()
    assert len(config.tags) == 12


def test_each_tag_has_keywords():
    """Every tag definition must have a non-empty keywords list."""
    config = load_config()
    for tag in config.tags:
        assert isinstance(tag, TagDefinition)
        assert tag.name, "Tag has no name"
        assert tag.slug, f"Tag {tag.name!r} has no slug"
        assert len(tag.keywords) > 0, f"Tag {tag.name!r} has no keywords"


def test_config_has_podcast_section():
    """Config should contain a podcast configuration dict."""
    config = load_config()
    assert isinstance(config.podcast, dict)
    assert len(config.podcast) > 0


def test_config_has_crawl_section():
    """Config should contain a crawl configuration dict."""
    config = load_config()
    assert isinstance(config.crawl, dict)
    assert len(config.crawl) > 0


def test_config_has_app_section():
    """Config should contain an app configuration dict."""
    config = load_config()
    assert isinstance(config.app, dict)
    assert "db_path" in config.app
