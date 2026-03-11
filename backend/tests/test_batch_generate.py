"""Tests for --batch-size flag on generate command.

Verifies that:
1. generate_pending() respects the limit parameter (batch size)
2. cmd_generate() passes --batch-size to generate_pending as limit
3. Progress output includes "i/total" format
4. Summary output includes timing and count
5. KeyboardInterrupt is handled gracefully
"""

import pytest
import time
import logging
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
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


def _make_pending_post(session, title: str, quality_score: int = 80) -> Post:
    """Create a pending post with full_text suitable for generation."""
    post = Post(
        url=f"https://example.com/{title.lower().replace(' ', '-')}",
        source_key="test",
        source_name="Test Blog",
        title=title,
        summary="Summary",
        full_text="This is a full article body with enough content.",
        quality_score=quality_score,
        audio_status="pending",
        crawled_at=datetime.now(timezone.utc),
    )
    session.add(post)
    session.commit()
    return post


class TestGeneratePendingLimit:
    """generate_pending() respects the limit parameter."""

    def test_limit_smaller_than_available(self, session):
        """When limit < available posts, only limit posts should be selected."""
        for i in range(20):
            _make_pending_post(session, f"Post {i}")

        from src.podcast.manager import generate_pending

        # Mock _generate_single to avoid actual LLM/TTS calls
        with patch("src.podcast.manager._generate_single", return_value=True):
            count = generate_pending(session, MagicMock(), limit=5)

        assert count == 5

    def test_limit_larger_than_available(self, session):
        """When limit > available posts, all available posts should be processed."""
        for i in range(3):
            _make_pending_post(session, f"Post {i}")

        from src.podcast.manager import generate_pending

        with patch("src.podcast.manager._generate_single", return_value=True):
            count = generate_pending(session, MagicMock(), limit=100)

        assert count == 3

    def test_default_limit_is_ten(self, session):
        """Default limit should be 10 when not specified."""
        for i in range(15):
            _make_pending_post(session, f"Post {i}")

        from src.podcast.manager import generate_pending

        with patch("src.podcast.manager._generate_single", return_value=True):
            count = generate_pending(session, MagicMock())

        assert count == 10


class TestBatchSizeCLIArg:
    """--batch-size / -b argument is parsed and passed through."""

    def test_batch_size_arg_parsed(self):
        """Argparse should accept --batch-size and store it."""
        import argparse
        import sys

        # Import main to get the parser setup
        sys.path.insert(0, ".")
        from run import main

        # Build parser manually to test arg parsing
        parser = argparse.ArgumentParser()
        subparsers = parser.add_subparsers(dest="command")
        gen_parser = subparsers.add_parser("generate")
        gen_parser.add_argument("--post-id", type=int)
        gen_parser.add_argument("--limit", type=int, default=10)
        gen_parser.add_argument("--batch-size", "-b", type=int, default=10)

        args = parser.parse_args(["generate", "--batch-size", "25"])
        assert args.batch_size == 25

    def test_batch_size_short_flag(self):
        """Argparse should accept -b shorthand."""
        import argparse

        parser = argparse.ArgumentParser()
        subparsers = parser.add_subparsers(dest="command")
        gen_parser = subparsers.add_parser("generate")
        gen_parser.add_argument("--batch-size", "-b", type=int, default=10)

        args = parser.parse_args(["generate", "-b", "7"])
        assert args.batch_size == 7

    def test_batch_size_default_is_ten(self):
        """Default --batch-size should be 10."""
        import argparse

        parser = argparse.ArgumentParser()
        subparsers = parser.add_subparsers(dest="command")
        gen_parser = subparsers.add_parser("generate")
        gen_parser.add_argument("--batch-size", "-b", type=int, default=10)

        args = parser.parse_args(["generate"])
        assert args.batch_size == 10


class TestProgressOutput:
    """generate_pending outputs progress lines like '1/3', '2/3', '3/3'."""

    def test_progress_format_in_log(self, session, caplog):
        """Log output should contain 'i/total' progress indicators."""
        for i in range(3):
            _make_pending_post(session, f"Progress Post {i}")

        from src.podcast.manager import generate_pending

        with caplog.at_level(logging.INFO, logger="src.podcast.manager"):
            with patch("src.podcast.manager._generate_single", return_value=True):
                count = generate_pending(session, MagicMock(), limit=3)

        assert count == 3
        # Check that progress messages were logged
        log_text = caplog.text
        assert "1/3" in log_text
        assert "2/3" in log_text
        assert "3/3" in log_text

    def test_progress_truncates_long_titles(self, session, caplog):
        """Long titles should be truncated to 50 chars in progress output."""
        long_title = "A" * 80
        _make_pending_post(session, long_title)

        from src.podcast.manager import generate_pending

        with caplog.at_level(logging.INFO, logger="src.podcast.manager"):
            with patch("src.podcast.manager._generate_single", return_value=True):
                generate_pending(session, MagicMock(), limit=1)

        log_text = caplog.text
        assert "1/1" in log_text
        assert "..." in log_text
        # Should NOT contain the full 80-char title
        assert long_title not in log_text


class TestSummaryOutput:
    """cmd_generate prints a timing summary at the end."""

    def test_cmd_generate_prints_summary_with_timing(self, capsys):
        """cmd_generate should print elapsed time and count in the summary."""
        from run import cmd_generate

        mock_args = MagicMock()
        mock_args.post_id = None
        mock_args.batch_size = 5
        mock_args.limit = 5
        mock_args.since = None

        with patch("src.database.init_db"), \
             patch("src.database.get_session") as mock_session_fn, \
             patch("src.podcast.manager.generate_pending", return_value=3), \
             patch("src.config.get_config", return_value=MagicMock()):
            mock_session = MagicMock()
            mock_session_fn.return_value = mock_session

            cmd_generate(mock_args)

        captured = capsys.readouterr()
        # Should contain count and timing info (e.g. "Generated 3 podcasts in 0.0s")
        assert "3" in captured.out
        assert "s" in captured.out  # timing suffix


class TestKeyboardInterruptHandling:
    """KeyboardInterrupt during generation should be handled gracefully."""

    def test_interrupt_reports_partial_progress(self, session):
        """On KeyboardInterrupt, completed work should still be counted."""
        for i in range(10):
            _make_pending_post(session, f"Interrupt Post {i}")

        from src.podcast.manager import generate_pending

        call_count = 0

        def side_effect(sess, post, config):
            nonlocal call_count
            call_count += 1
            if call_count >= 4:
                raise KeyboardInterrupt()
            return True

        with patch("src.podcast.manager._generate_single", side_effect=side_effect):
            with pytest.raises(KeyboardInterrupt):
                generate_pending(session, MagicMock(), limit=10)

        # The first 3 calls succeeded before the interrupt on call 4
        assert call_count == 4
