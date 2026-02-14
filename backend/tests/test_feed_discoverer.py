"""Tests for the feed URL auto-discovery module."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

import httpx

from src.crawler.feed_discoverer import discover_feeds, find_best_feed, COMMON_FEED_PATHS


class TestDiscoverFeeds:
    async def test_discovers_from_html_link_tags(self):
        html = """
        <html><head>
            <link rel="alternate" type="application/rss+xml" href="/feed" title="RSS Feed">
            <link rel="alternate" type="application/atom+xml" href="/atom.xml" title="Atom">
        </head><body></body></html>
        """
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = html

        with patch("src.crawler.feed_discoverer.httpx.AsyncClient") as mock_client_cls:
            client_instance = AsyncMock()
            client_instance.get = AsyncMock(return_value=mock_resp)
            # HEAD requests for path probing return 404
            head_resp = MagicMock()
            head_resp.status_code = 404
            client_instance.head = AsyncMock(return_value=head_resp)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=client_instance)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            feeds = await discover_feeds("https://example.com/blog")
            assert len(feeds) >= 2
            methods = [f["method"] for f in feeds]
            assert "html_link" in methods

    async def test_discovers_from_path_probing(self):
        # HTML has no feed links
        html_resp = MagicMock()
        html_resp.status_code = 200
        html_resp.text = "<html><head></head><body></body></html>"

        # One path probe succeeds
        feed_resp = MagicMock()
        feed_resp.status_code = 200
        feed_resp.headers = {"content-type": "application/rss+xml"}

        not_found_resp = MagicMock()
        not_found_resp.status_code = 404

        with patch("src.crawler.feed_discoverer.httpx.AsyncClient") as mock_client_cls:
            client_instance = AsyncMock()
            client_instance.get = AsyncMock(return_value=html_resp)

            async def head_side_effect(url):
                if url.endswith("/feed"):
                    return feed_resp
                return not_found_resp

            client_instance.head = AsyncMock(side_effect=head_side_effect)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=client_instance)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            feeds = await discover_feeds("https://example.com")
            probed = [f for f in feeds if f["method"] == "path_probe"]
            assert len(probed) >= 1

    async def test_deduplicates_urls(self):
        html = """
        <html><head>
            <link rel="alternate" type="application/rss+xml" href="/feed">
        </head><body></body></html>
        """
        html_resp = MagicMock()
        html_resp.status_code = 200
        html_resp.text = html

        # /feed also found by path probing
        feed_resp = MagicMock()
        feed_resp.status_code = 200
        feed_resp.headers = {"content-type": "application/rss+xml"}

        not_found = MagicMock()
        not_found.status_code = 404

        with patch("src.crawler.feed_discoverer.httpx.AsyncClient") as mock_client_cls:
            client_instance = AsyncMock()
            client_instance.get = AsyncMock(return_value=html_resp)

            async def head_side_effect(url):
                if url.endswith("/feed"):
                    return feed_resp
                return not_found

            client_instance.head = AsyncMock(side_effect=head_side_effect)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=client_instance)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            feeds = await discover_feeds("https://example.com")
            urls = [f["url"] for f in feeds]
            assert len(urls) == len(set(urls)), "Duplicate URLs found"

    async def test_handles_html_fetch_failure(self):
        with patch("src.crawler.feed_discoverer.httpx.AsyncClient") as mock_client_cls:
            client_instance = AsyncMock()
            client_instance.get = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
            not_found = MagicMock()
            not_found.status_code = 404
            client_instance.head = AsyncMock(return_value=not_found)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=client_instance)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            feeds = await discover_feeds("https://unreachable.example.com")
            # Should not raise, just return empty or probed results only
            assert isinstance(feeds, list)

    async def test_empty_when_no_feeds_found(self):
        html_resp = MagicMock()
        html_resp.status_code = 200
        html_resp.text = "<html><head></head><body></body></html>"

        not_found = MagicMock()
        not_found.status_code = 404

        with patch("src.crawler.feed_discoverer.httpx.AsyncClient") as mock_client_cls:
            client_instance = AsyncMock()
            client_instance.get = AsyncMock(return_value=html_resp)
            client_instance.head = AsyncMock(return_value=not_found)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=client_instance)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            feeds = await discover_feeds("https://example.com")
            assert feeds == []


class TestFindBestFeed:
    async def test_prefers_html_link_over_probed(self):
        mock_feeds = [
            {"url": "https://example.com/feed", "method": "path_probe", "title": "", "type": "application/rss+xml"},
            {"url": "https://example.com/rss.xml", "method": "html_link", "title": "RSS", "type": "application/rss+xml"},
        ]
        with patch("src.crawler.feed_discoverer.discover_feeds", new_callable=AsyncMock, return_value=mock_feeds):
            best = await find_best_feed("https://example.com")
            assert best == "https://example.com/rss.xml"

    async def test_returns_none_when_no_feeds(self):
        with patch("src.crawler.feed_discoverer.discover_feeds", new_callable=AsyncMock, return_value=[]):
            best = await find_best_feed("https://example.com")
            assert best is None
