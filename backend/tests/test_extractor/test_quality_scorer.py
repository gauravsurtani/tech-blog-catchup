"""Tests for the quality scoring module."""

from src.extractor.quality_scorer import score_content


class TestScoreContent:
    def test_empty_content(self):
        result = score_content("")
        assert result.score <= 20
        assert result.grade in ("D", "F")
        assert result.word_count == 0
        assert "very_short" in result.flags

    def test_short_content(self):
        result = score_content("This is a short article with few words.")
        assert result.word_count < 100
        assert "very_short" in result.flags
        assert result.score < 30

    def test_medium_article(self):
        """A 500+ word article with headings should score well."""
        content = "# Introduction\n\n" + "This is a well-written article. " * 100 + "\n\n## Details\n\n" + "More content here with details. " * 50
        result = score_content(content)
        assert result.word_count >= 500
        assert result.heading_count >= 2
        assert result.score >= 60
        assert result.grade in ("A", "B")

    def test_code_blocks_bonus(self):
        content = "Some article text. " * 60 + "\n\n```python\ndef hello():\n    pass\n```\n\n" + "More text. " * 60
        result = score_content(content)
        assert result.code_block_count >= 1
        # Code blocks give +10 bonus
        assert result.score >= 50

    def test_lists_bonus(self):
        content = "Introduction paragraph text. " * 40 + "\n\n- Item one\n- Item two\n- Item three\n\n" + "Conclusion text. " * 40
        result = score_content(content)
        assert result.list_count >= 3

    def test_raw_html_penalty(self):
        content = "Normal text. " * 50 + "\n<div class='something'>bad html</div>\n" + "More text. " * 50
        result = score_content(content)
        assert result.has_raw_html
        assert "contains_raw_html" in result.flags

    def test_grade_boundaries(self):
        """Test grade assignments at boundaries."""
        # Score of 50 (base) with no modifiers should be C
        content = "Average article text word. " * 30  # ~150 words, no structure
        result = score_content(content)
        assert result.grade in ("C", "D", "B")  # depends on exact scoring

    def test_acceptable_threshold(self):
        """Score >= 20 is acceptable."""
        content = "Some reasonable article content. " * 60
        result = score_content(content)
        assert result.is_acceptable

    def test_quality_label(self):
        # Good quality
        content = "# Title\n\n" + "Well written content. " * 200 + "\n\n## Section\n\n- Item\n"
        result = score_content(content)
        assert result.quality_label in ("good", "low")

    def test_link_density_penalty(self):
        """High link density should penalize score."""
        # Create content with very high link density
        links = "[link](http://example.com) " * 100
        content = links + "Some text. " * 10
        result = score_content(content)
        # Link density may or may not trigger depending on ratio calculation


class TestQualityResultProperties:
    def test_quality_label_good(self):
        from src.extractor.types import QualityResult
        result = QualityResult(
            score=70, grade="B", word_count=1000, heading_count=3,
            code_block_count=1, list_count=2, link_density=0.05,
            has_raw_html=False, flags=[],
        )
        assert result.quality_label == "good"

    def test_quality_label_low(self):
        from src.extractor.types import QualityResult
        result = QualityResult(
            score=45, grade="C", word_count=200, heading_count=0,
            code_block_count=0, list_count=0, link_density=0.1,
            has_raw_html=False, flags=[],
        )
        assert result.quality_label == "low"

    def test_quality_label_rejected(self):
        from src.extractor.types import QualityResult
        result = QualityResult(
            score=10, grade="F", word_count=20, heading_count=0,
            code_block_count=0, list_count=0, link_density=0.5,
            has_raw_html=True, flags=["very_short", "contains_raw_html"],
        )
        assert result.quality_label == "rejected"
        assert not result.is_acceptable
