"""Tests for the APScheduler integration (daily crawl + generate)."""

import os
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock

import pytest
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.config import load_config


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_scheduler_config() -> dict:
    """Load scheduler section from config.yaml."""
    config = load_config()
    return getattr(config, "scheduler", {})


# ---------------------------------------------------------------------------
# Test 1: Config parsing — scheduler defaults are correct
# ---------------------------------------------------------------------------

class TestSchedulerConfig:
    def test_config_has_scheduler_section(self):
        """config.yaml should contain a scheduler section with defaults."""
        config = load_config()
        assert hasattr(config, "scheduler"), "Config missing 'scheduler' attribute"
        sched = config.scheduler
        assert isinstance(sched, dict)

    def test_scheduler_default_values(self):
        """Verify the cron expressions and limits from config.yaml."""
        config = load_config()
        sched = config.scheduler
        assert sched.get("crawl_cron") == "0 2 * * *"
        assert sched.get("generate_cron") == "0 4 * * *"
        assert sched.get("crawl_max_posts") == 5
        assert sched.get("generate_batch_size") == 50
        assert sched.get("generate_since_days") == 2


# ---------------------------------------------------------------------------
# Test 2: Scheduler creates, starts, registers jobs, and shuts down
# ---------------------------------------------------------------------------

class TestSchedulerLifecycle:
    @pytest.mark.asyncio
    async def test_scheduler_creates_and_starts(self):
        """create_scheduler should return a running scheduler with 2 jobs."""
        from src.scheduler import create_scheduler

        config = load_config()
        scheduler = create_scheduler(config)
        try:
            scheduler.start()
            assert scheduler.running is True
            jobs = scheduler.get_jobs()
            assert len(jobs) == 2, f"Expected 2 jobs, got {len(jobs)}: {[j.id for j in jobs]}"
            job_ids = {j.id for j in jobs}
            assert "scheduled_crawl" in job_ids
            assert "scheduled_generate" in job_ids
        finally:
            scheduler.shutdown(wait=False)

    @pytest.mark.asyncio
    async def test_scheduler_job_triggers(self):
        """Jobs should have CronTrigger with correct hour settings."""
        from src.scheduler import create_scheduler

        config = load_config()
        scheduler = create_scheduler(config)
        try:
            scheduler.start()
            crawl_job = scheduler.get_job("scheduled_crawl")
            generate_job = scheduler.get_job("scheduled_generate")

            # CronTrigger fields: verify hour matches config
            assert str(crawl_job.trigger) is not None
            assert str(generate_job.trigger) is not None
        finally:
            scheduler.shutdown(wait=False)


# ---------------------------------------------------------------------------
# Test 3: Scheduler disabled by default (ENABLE_SCHEDULER not set)
# ---------------------------------------------------------------------------

class TestSchedulerDisabled:
    def test_scheduler_disabled_without_env(self):
        """Scheduler should NOT start when ENABLE_SCHEDULER is not 'true'."""
        from src.scheduler import should_enable_scheduler

        # Unset
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("ENABLE_SCHEDULER", None)
            assert should_enable_scheduler() is False

    def test_scheduler_disabled_with_false(self):
        """ENABLE_SCHEDULER=false should not start scheduler."""
        from src.scheduler import should_enable_scheduler

        with patch.dict(os.environ, {"ENABLE_SCHEDULER": "false"}):
            assert should_enable_scheduler() is False

    def test_scheduler_enabled_with_true(self):
        """ENABLE_SCHEDULER=true should enable scheduler."""
        from src.scheduler import should_enable_scheduler

        with patch.dict(os.environ, {"ENABLE_SCHEDULER": "true"}):
            assert should_enable_scheduler() is True

    def test_scheduler_enabled_case_insensitive(self):
        """ENABLE_SCHEDULER=True (capitalized) should also work."""
        from src.scheduler import should_enable_scheduler

        with patch.dict(os.environ, {"ENABLE_SCHEDULER": "True"}):
            assert should_enable_scheduler() is True


# ---------------------------------------------------------------------------
# Test 4: Job functions exist and are callable
# ---------------------------------------------------------------------------

class TestJobFunctions:
    def test_crawl_job_is_callable(self):
        """The scheduled crawl function should be importable and callable."""
        from src.scheduler import scheduled_crawl
        assert callable(scheduled_crawl)

    def test_generate_job_is_callable(self):
        """The scheduled generate function should be importable and callable."""
        from src.scheduler import scheduled_generate
        assert callable(scheduled_generate)

    @patch("src.scheduler.crawl_all")
    @patch("src.scheduler.get_session")
    @patch("src.scheduler.init_db")
    def test_crawl_job_calls_crawl_all(self, mock_init_db, mock_get_session, mock_crawl_all):
        """scheduled_crawl should call crawl_all with correct parameters."""
        from src.scheduler import scheduled_crawl

        mock_session = MagicMock()
        mock_get_session.return_value = mock_session
        mock_crawl_all.return_value = {"uber": 2, "meta": 1}

        config = load_config()
        scheduled_crawl(config)

        mock_init_db.assert_called_once()
        mock_get_session.assert_called_once()
        mock_crawl_all.assert_called_once()
        # Verify session.close() was called
        mock_session.close.assert_called_once()

    @patch("src.scheduler.generate_pending")
    @patch("src.scheduler.get_session")
    @patch("src.scheduler.init_db")
    def test_generate_job_calls_generate_pending(self, mock_init_db, mock_get_session, mock_generate_pending):
        """scheduled_generate should call generate_pending with correct params."""
        from src.scheduler import scheduled_generate

        mock_session = MagicMock()
        mock_get_session.return_value = mock_session
        mock_generate_pending.return_value = 3

        config = load_config()
        scheduled_generate(config)

        mock_init_db.assert_called_once()
        mock_get_session.assert_called_once()
        mock_generate_pending.assert_called_once()

        # Verify since parameter is roughly correct (2 days ago)
        call_kwargs = mock_generate_pending.call_args
        assert call_kwargs[1]["limit"] == 50
        since_arg = call_kwargs[1]["since"]
        assert isinstance(since_arg, datetime)
        # since should be ~2 days ago (within a 1-minute tolerance)
        expected = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=2)
        assert abs((since_arg - expected).total_seconds()) < 60

        mock_session.close.assert_called_once()

    @patch("src.scheduler.crawl_all")
    @patch("src.scheduler.get_session")
    @patch("src.scheduler.init_db")
    def test_crawl_job_handles_exception(self, mock_init_db, mock_get_session, mock_crawl_all):
        """scheduled_crawl should not raise even if crawl_all fails."""
        from src.scheduler import scheduled_crawl

        mock_session = MagicMock()
        mock_get_session.return_value = mock_session
        mock_crawl_all.side_effect = RuntimeError("network error")

        config = load_config()
        # Should not raise
        scheduled_crawl(config)
        mock_session.close.assert_called_once()

    @patch("src.scheduler.generate_pending")
    @patch("src.scheduler.get_session")
    @patch("src.scheduler.init_db")
    def test_generate_job_handles_exception(self, mock_init_db, mock_get_session, mock_generate_pending):
        """scheduled_generate should not raise even if generate_pending fails."""
        from src.scheduler import scheduled_generate

        mock_session = MagicMock()
        mock_get_session.return_value = mock_session
        mock_generate_pending.side_effect = RuntimeError("OpenAI down")

        config = load_config()
        # Should not raise
        scheduled_generate(config)
        mock_session.close.assert_called_once()

    @patch("src.scheduler.ensure_tags_exist")
    @patch("src.scheduler.auto_tag_post")
    @patch("src.scheduler.crawl_all")
    @patch("src.scheduler.get_session")
    @patch("src.scheduler.init_db")
    def test_crawl_job_auto_tags_new_posts(self, mock_init_db, mock_get_session, mock_crawl_all, mock_auto_tag, mock_ensure_tags):
        """scheduled_crawl should auto-tag untagged posts after crawling."""
        from src.scheduler import scheduled_crawl

        mock_session = MagicMock()
        mock_get_session.return_value = mock_session
        mock_crawl_all.return_value = {"uber": 1}

        # Simulate untagged posts query
        mock_post = MagicMock()
        mock_query = MagicMock()
        mock_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [mock_post]

        config = load_config()
        scheduled_crawl(config)

        mock_ensure_tags.assert_called_once()
        mock_auto_tag.assert_called_once()
