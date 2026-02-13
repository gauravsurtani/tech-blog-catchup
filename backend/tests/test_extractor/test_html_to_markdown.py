"""Tests for HTML to markdown conversion."""

from src.extractor.html_to_markdown import html_to_markdown


class TestHtmlToMarkdown:
    def test_empty_input(self):
        assert html_to_markdown("") == ""
        assert html_to_markdown("   ") == ""

    def test_basic_heading(self):
        result = html_to_markdown("<h1>Hello World</h1>")
        assert "# Hello World" in result or "Hello World" in result

    def test_paragraph(self):
        result = html_to_markdown("<p>This is a paragraph.</p>")
        assert "This is a paragraph." in result

    def test_code_block_preserved(self):
        html = '<pre><code class="language-python">def hello():\n    pass</code></pre>'
        result = html_to_markdown(html)
        assert "```" in result
        assert "def hello():" in result

    def test_inline_code(self):
        html = "<p>Use <code>print()</code> to output text.</p>"
        result = html_to_markdown(html)
        assert "`print()`" in result

    def test_link_preserved(self):
        html = '<p>Visit <a href="https://example.com">Example</a></p>'
        result = html_to_markdown(html)
        assert "Example" in result

    def test_list_preserved(self):
        html = "<ul><li>Item 1</li><li>Item 2</li></ul>"
        result = html_to_markdown(html)
        assert "Item 1" in result
        assert "Item 2" in result

    def test_script_stripped(self):
        html = "<p>Content</p><script>alert('xss')</script>"
        result = html_to_markdown(html)
        assert "alert" not in result
        assert "Content" in result

    def test_style_stripped(self):
        html = "<style>.foo{color:red}</style><p>Content</p>"
        result = html_to_markdown(html)
        assert "color" not in result
        assert "Content" in result

    def test_excessive_newlines_normalized(self):
        html = "<p>A</p><br><br><br><br><br><p>B</p>"
        result = html_to_markdown(html)
        assert "\n\n\n" not in result

    def test_bold_and_italic(self):
        html = "<p><strong>Bold</strong> and <em>italic</em></p>"
        result = html_to_markdown(html)
        assert "Bold" in result
        assert "italic" in result
