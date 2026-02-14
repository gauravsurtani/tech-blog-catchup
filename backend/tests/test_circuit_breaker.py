"""Tests for the per-domain circuit breaker."""

import time
from unittest.mock import patch

from src.crawler.circuit_breaker import CircuitBreaker, CircuitState, CircuitBreakerOpen


class TestCircuitBreakerCycle:
    """Test the full CLOSED -> OPEN -> HALF_OPEN -> CLOSED cycle."""

    def test_starts_closed(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=1.0)
        assert cb.can_execute("example.com") is True

    def test_stays_closed_below_threshold(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=1.0)
        cb.record_failure("example.com")
        cb.record_failure("example.com")
        assert cb.can_execute("example.com") is True

    def test_opens_after_threshold_failures(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60.0)
        for _ in range(3):
            cb.record_failure("example.com")
        assert cb.can_execute("example.com") is False

    def test_transitions_to_half_open_after_recovery_timeout(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.1)
        for _ in range(3):
            cb.record_failure("example.com")
        assert cb.can_execute("example.com") is False

        time.sleep(0.15)
        assert cb.can_execute("example.com") is True

        status = cb.get_status()
        assert status["example.com"]["state"] == "half_open"

    def test_half_open_success_closes_circuit(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.1)
        for _ in range(3):
            cb.record_failure("example.com")

        time.sleep(0.15)
        cb.can_execute("example.com")  # transition to HALF_OPEN
        cb.record_success("example.com")

        status = cb.get_status()
        assert status["example.com"]["state"] == "closed"
        assert status["example.com"]["failure_count"] == 0

    def test_half_open_failure_reopens_circuit(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.1)
        for _ in range(3):
            cb.record_failure("example.com")

        time.sleep(0.15)
        cb.can_execute("example.com")  # transition to HALF_OPEN
        cb.record_failure("example.com")

        status = cb.get_status()
        assert status["example.com"]["state"] == "open"

    def test_reset_single_domain(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60.0)
        for _ in range(3):
            cb.record_failure("example.com")
        cb.record_failure("other.com")

        cb.reset("example.com")
        # After reset, example.com is removed from tracked circuits
        status = cb.get_status()
        assert "example.com" not in status
        assert "other.com" in status
        # A new call to can_execute re-creates a fresh CLOSED circuit
        assert cb.can_execute("example.com") is True

    def test_reset_all_domains(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60.0)
        for _ in range(3):
            cb.record_failure("a.com")
            cb.record_failure("b.com")

        cb.reset()
        assert cb.get_status() == {}
        assert cb.can_execute("a.com") is True
        assert cb.can_execute("b.com") is True


class TestCircuitBreakerStatus:
    def test_status_reports_all_domains(self):
        cb = CircuitBreaker(failure_threshold=3, recovery_timeout=60.0)
        cb.record_failure("a.com")
        cb.record_success("b.com")

        status = cb.get_status()
        assert "a.com" in status
        assert "b.com" in status
        assert status["a.com"]["failure_count"] == 1
        assert status["b.com"]["failure_count"] == 0
