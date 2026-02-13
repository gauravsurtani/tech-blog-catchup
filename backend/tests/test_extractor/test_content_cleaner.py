"""Tests for HTML and markdown content cleaning."""

from src.extractor.content_cleaner import clean_html, clean_markdown, strip_html_tags


class TestCleanHtml:
    def test_empty_input(self):
        assert clean_html("") == ""
        assert clean_html("   ") == ""

    def test_removes_nav(self):
        html = "<html><body><nav>Menu</nav><article>Content</article></body></html>"
        result = clean_html(html)
        assert "Menu" not in result
        assert "Content" in result

    def test_removes_footer(self):
        html = "<html><body><p>Article</p><footer>Copyright</footer></body></html>"
        result = clean_html(html)
        assert "Copyright" not in result

    def test_article_selector(self):
        html = '<html><body><div class="sidebar">Ads</div><article>Main Content</article></body></html>'
        result = clean_html(html, article_selector="article")
        assert "Main Content" in result

    def test_removes_script_and_style(self):
        html = "<html><body><script>evil()</script><style>.bad{}</style><p>Good</p></body></html>"
        result = clean_html(html)
        assert "evil" not in result
        assert ".bad" not in result
        assert "Good" in result

    def test_custom_strip_selectors(self):
        html = '<html><body><div class="custom-ad">Buy now</div><p>Article</p></body></html>'
        result = clean_html(html, strip_selectors=[".custom-ad"])
        assert "Buy now" not in result
        assert "Article" in result


class TestCleanMarkdown:
    def test_empty_input(self):
        assert clean_markdown("") == ""

    def test_removes_nav_lines(self):
        md = "Skip to content\n\n# Title\n\nArticle text here."
        result = clean_markdown(md)
        assert "Skip to content" not in result
        assert "Title" in result

    def test_removes_share_buttons(self):
        md = "# Article\n\nContent here.\n\nShare this on Twitter\nTweet this article"
        result = clean_markdown(md)
        assert "Share this" not in result
        assert "Content here" in result

    def test_preserves_normal_content(self):
        md = "# Great Article\n\nThis is a well-written paragraph.\n\n## Section 2\n\nMore content."
        result = clean_markdown(md)
        assert "Great Article" in result
        assert "well-written paragraph" in result

    def test_normalizes_blank_lines(self):
        md = "Line 1\n\n\n\n\n\nLine 2"
        result = clean_markdown(md)
        assert "\n\n\n\n" not in result


class TestStripHtmlTags:
    def test_empty_input(self):
        assert strip_html_tags("") == ""
        assert strip_html_tags(None) == ""

    def test_strips_basic_tags(self):
        assert "Hello World" in strip_html_tags("<p>Hello <b>World</b></p>")

    def test_strips_links(self):
        result = strip_html_tags('<a href="http://example.com">Click here</a>')
        assert "Click here" in result
        assert "<a" not in result

    def test_strips_complex_html(self):
        html = '<div class="summary"><p>A <strong>great</strong> article about <a href="/tech">technology</a>.</p></div>'
        result = strip_html_tags(html)
        assert "<" not in result
        assert "great" in result
        assert "technology" in result

    def test_preserves_text_spacing(self):
        html = "<p>First paragraph</p><p>Second paragraph</p>"
        result = strip_html_tags(html)
        assert "First paragraph" in result
        assert "Second paragraph" in result
