"""Tests for extraction type dataclasses."""

from src.extractor.types import ExtractionResult, QualityResult


class TestQualityResult:
    def test_frozen(self):
        result = QualityResult(
            score=75, grade="B", word_count=1000, heading_count=3,
            code_block_count=1, list_count=2, link_density=0.05,
            has_raw_html=False,
        )
        assert result.score == 75
        assert result.grade == "B"

    def test_is_acceptable_true(self):
        result = QualityResult(
            score=50, grade="C", word_count=500, heading_count=1,
            code_block_count=0, list_count=0, link_density=0.1,
            has_raw_html=False,
        )
        assert result.is_acceptable

    def test_is_acceptable_false(self):
        result = QualityResult(
            score=15, grade="F", word_count=30, heading_count=0,
            code_block_count=0, list_count=0, link_density=0.5,
            has_raw_html=True,
        )
        assert not result.is_acceptable

    def test_quality_labels(self):
        good = QualityResult(score=70, grade="B", word_count=1000, heading_count=2, code_block_count=0, list_count=0, link_density=0.05, has_raw_html=False)
        low = QualityResult(score=45, grade="C", word_count=200, heading_count=0, code_block_count=0, list_count=0, link_density=0.1, has_raw_html=False)
        rejected = QualityResult(score=10, grade="F", word_count=20, heading_count=0, code_block_count=0, list_count=0, link_density=0.5, has_raw_html=True)

        assert good.quality_label == "good"
        assert low.quality_label == "low"
        assert rejected.quality_label == "rejected"


class TestExtractionResult:
    def test_basic_creation(self):
        quality = QualityResult(
            score=75, grade="B", word_count=1000, heading_count=3,
            code_block_count=1, list_count=2, link_density=0.05,
            has_raw_html=False,
        )
        result = ExtractionResult(
            url="https://example.com/article",
            title="Test Article",
            markdown="# Test\n\nContent here.",
            summary="Content here.",
            word_count=1000,
            quality=quality,
            extraction_method="trafilatura",
            author="John Doe",
            podcast_script="<Person1>Hello</Person1>",
        )
        assert result.url == "https://example.com/article"
        assert result.title == "Test Article"
        assert result.is_acceptable
        assert result.extraction_method == "trafilatura"
        assert result.podcast_script == "<Person1>Hello</Person1>"

    def test_podcast_script_defaults_to_none(self):
        quality = QualityResult(
            score=75, grade="B", word_count=1000, heading_count=3,
            code_block_count=1, list_count=2, link_density=0.05,
            has_raw_html=False,
        )
        result = ExtractionResult(
            url="https://example.com/article",
            title="Test Article",
            markdown="# Test\n\nContent here.",
            summary="Content here.",
            word_count=1000,
            quality=quality,
            extraction_method="trafilatura",
        )
        assert result.podcast_script is None

    def test_is_acceptable_delegates_to_quality(self):
        low_quality = QualityResult(
            score=10, grade="F", word_count=20, heading_count=0,
            code_block_count=0, list_count=0, link_density=0.5,
            has_raw_html=True,
        )
        result = ExtractionResult(
            url="https://example.com/bad",
            title="Bad",
            markdown="Short",
            summary="Short",
            word_count=1,
            quality=low_quality,
            extraction_method="bs4",
        )
        assert not result.is_acceptable
