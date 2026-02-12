"""Tests for sitemap parsing with mocked HTTP requests."""

from unittest.mock import patch, MagicMock

from src.crawler.sitemap_parser import parse_sitemap


SAMPLE_SITEMAP_XML = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/blog/article-1</loc></url>
  <url><loc>https://example.com/blog/article-2</loc></url>
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/blog/article-3</loc></url>
</urlset>
"""

SAMPLE_SITEMAP_INDEX_XML = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-posts.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
</sitemapindex>
"""

CHILD_SITEMAP_POSTS = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/blog/post-a</loc></url>
  <url><loc>https://example.com/blog/post-b</loc></url>
</urlset>
"""

CHILD_SITEMAP_PAGES = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/contact</loc></url>
</urlset>
"""


def _mock_response(content: bytes, status_code: int = 200):
    """Create a mock requests.Response object."""
    resp = MagicMock()
    resp.content = content
    resp.status_code = status_code
    resp.raise_for_status = MagicMock()
    return resp


class TestParseSitemap:
    @patch("src.crawler.sitemap_parser.requests.get")
    def test_returns_correct_urls(self, mock_get):
        """parse_sitemap should return all <loc> URLs from a simple sitemap."""
        mock_get.return_value = _mock_response(SAMPLE_SITEMAP_XML)

        urls = parse_sitemap("https://example.com/sitemap.xml")

        assert len(urls) == 4
        assert "https://example.com/blog/article-1" in urls
        assert "https://example.com/blog/article-2" in urls
        assert "https://example.com/about" in urls
        assert "https://example.com/blog/article-3" in urls

    @patch("src.crawler.sitemap_parser.requests.get")
    def test_url_pattern_filter(self, mock_get):
        """parse_sitemap with url_pattern should only return matching URLs."""
        mock_get.return_value = _mock_response(SAMPLE_SITEMAP_XML)

        urls = parse_sitemap("https://example.com/sitemap.xml", url_pattern="/blog/")

        assert len(urls) == 3
        assert all("/blog/" in u for u in urls)
        assert "https://example.com/about" not in urls

    @patch("src.crawler.sitemap_parser.requests.get")
    def test_sitemap_index_handling(self, mock_get):
        """parse_sitemap should recursively fetch child sitemaps from a sitemap index."""

        def side_effect(url, **kwargs):
            if url == "https://example.com/sitemap.xml":
                return _mock_response(SAMPLE_SITEMAP_INDEX_XML)
            elif url == "https://example.com/sitemap-posts.xml":
                return _mock_response(CHILD_SITEMAP_POSTS)
            elif url == "https://example.com/sitemap-pages.xml":
                return _mock_response(CHILD_SITEMAP_PAGES)
            return _mock_response(b"", status_code=404)

        mock_get.side_effect = side_effect

        urls = parse_sitemap("https://example.com/sitemap.xml")

        assert len(urls) == 4
        assert "https://example.com/blog/post-a" in urls
        assert "https://example.com/blog/post-b" in urls
        assert "https://example.com/about" in urls
        assert "https://example.com/contact" in urls

    @patch("src.crawler.sitemap_parser.requests.get")
    def test_sitemap_index_with_url_pattern(self, mock_get):
        """Sitemap index + url_pattern should filter across all child sitemaps."""

        def side_effect(url, **kwargs):
            if url == "https://example.com/sitemap.xml":
                return _mock_response(SAMPLE_SITEMAP_INDEX_XML)
            elif url == "https://example.com/sitemap-posts.xml":
                return _mock_response(CHILD_SITEMAP_POSTS)
            elif url == "https://example.com/sitemap-pages.xml":
                return _mock_response(CHILD_SITEMAP_PAGES)
            return _mock_response(b"", status_code=404)

        mock_get.side_effect = side_effect

        urls = parse_sitemap("https://example.com/sitemap.xml", url_pattern="/blog/")

        assert len(urls) == 2
        assert all("/blog/" in u for u in urls)

    @patch("src.crawler.sitemap_parser.requests.get")
    def test_malformed_xml(self, mock_get):
        """parse_sitemap should return an empty list on malformed XML."""
        mock_get.return_value = _mock_response(b"<not valid xml!!!>>>>>")

        urls = parse_sitemap("https://example.com/sitemap.xml")
        assert urls == []

    @patch("src.crawler.sitemap_parser.requests.get")
    def test_empty_sitemap(self, mock_get):
        """parse_sitemap should return an empty list for an empty urlset."""
        empty_sitemap = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
"""
        mock_get.return_value = _mock_response(empty_sitemap)

        urls = parse_sitemap("https://example.com/sitemap.xml")
        assert urls == []

    @patch("src.crawler.sitemap_parser.requests.get")
    def test_network_failure(self, mock_get):
        """parse_sitemap should return an empty list on network failure."""
        import requests

        mock_get.side_effect = requests.RequestException("Connection refused")

        urls = parse_sitemap("https://example.com/sitemap.xml")
        assert urls == []
