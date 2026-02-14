"""Per-domain circuit breaker for resilient crawling."""

import threading
import time
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, skip requests
    HALF_OPEN = "half_open"  # Testing one request


class CircuitBreakerOpen(Exception):
    """Raised when circuit is open and requests should be skipped."""
    def __init__(self, domain: str, retry_after: float):
        self.domain = domain
        self.retry_after = retry_after
        super().__init__(f"Circuit open for {domain}, retry after {retry_after:.0f}s")


class DomainCircuit:
    """Circuit state for a single domain."""
    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 300.0):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = 0.0
        self.last_success_time = 0.0


class CircuitBreaker:
    """Per-domain circuit breaker for managing crawl failures.

    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Too many failures, skip requests for recovery_timeout
    - HALF_OPEN: Recovery timeout elapsed, allow one test request

    Usage:
        cb = CircuitBreaker()
        if cb.can_execute("example.com"):
            try:
                result = crawl(url)
                cb.record_success("example.com")
            except Exception:
                cb.record_failure("example.com")
        else:
            # Skip this domain, it's in cooldown
    """

    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 300.0):
        self._circuits: dict[str, DomainCircuit] = {}
        self._lock = threading.Lock()
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout

    def _get_circuit(self, domain: str) -> DomainCircuit:
        if domain not in self._circuits:
            self._circuits[domain] = DomainCircuit(
                failure_threshold=self._failure_threshold,
                recovery_timeout=self._recovery_timeout,
            )
        return self._circuits[domain]

    def can_execute(self, domain: str) -> bool:
        """Check if a request to this domain should proceed."""
        with self._lock:
            circuit = self._get_circuit(domain)

            if circuit.state == CircuitState.CLOSED:
                return True

            if circuit.state == CircuitState.OPEN:
                elapsed = time.time() - circuit.last_failure_time
                if elapsed >= circuit.recovery_timeout:
                    circuit.state = CircuitState.HALF_OPEN
                    logger.info("Circuit half-open for %s (testing)", domain)
                    return True
                return False

            # HALF_OPEN: allow one test request
            return True

    def record_success(self, domain: str) -> None:
        """Record a successful request."""
        with self._lock:
            circuit = self._get_circuit(domain)
            circuit.failure_count = 0
            circuit.last_success_time = time.time()
            if circuit.state != CircuitState.CLOSED:
                logger.info("Circuit closed for %s (recovered)", domain)
                circuit.state = CircuitState.CLOSED

    def record_failure(self, domain: str) -> None:
        """Record a failed request."""
        with self._lock:
            circuit = self._get_circuit(domain)
            circuit.failure_count += 1
            circuit.last_failure_time = time.time()

            if circuit.state == CircuitState.HALF_OPEN:
                circuit.state = CircuitState.OPEN
                logger.warning("Circuit re-opened for %s (half-open test failed)", domain)
            elif circuit.failure_count >= circuit.failure_threshold:
                circuit.state = CircuitState.OPEN
                logger.warning(
                    "Circuit opened for %s (%d failures, cooldown %.0fs)",
                    domain, circuit.failure_count, circuit.recovery_timeout,
                )

    def get_status(self) -> dict[str, dict]:
        """Return status of all tracked domains."""
        with self._lock:
            return {
                domain: {
                    "state": circuit.state.value,
                    "failure_count": circuit.failure_count,
                    "last_failure": circuit.last_failure_time,
                    "last_success": circuit.last_success_time,
                }
                for domain, circuit in self._circuits.items()
            }

    def reset(self, domain: str | None = None) -> None:
        """Reset circuit(s). If domain is None, reset all."""
        with self._lock:
            if domain:
                if domain in self._circuits:
                    del self._circuits[domain]
            else:
                self._circuits.clear()
