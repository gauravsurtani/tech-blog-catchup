#!/usr/bin/env python3
"""End-to-end deployment verification script.

Validates the entire deployed stack by running 9 sequential checks
against backend API and frontend endpoints.  Works against local
docker-compose or production Railway URLs.

Usage:
    python scripts/verify_deployment.py                         # local defaults
    python scripts/verify_deployment.py --verbose               # detailed output
    python scripts/verify_deployment.py \
        --backend-url https://techblog-api.up.railway.app \
        --frontend-url https://techblog.up.railway.app

Exit codes:
    0 — all checks passed
    1 — one or more checks failed
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from typing import Optional


# ---------------------------------------------------------------------------
# ANSI helpers
# ---------------------------------------------------------------------------

def _supports_color() -> bool:
    """Return True when stdout is a TTY that likely supports ANSI."""
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


_COLOR = _supports_color()

GREEN = "\033[32m" if _COLOR else ""
RED = "\033[31m" if _COLOR else ""
YELLOW = "\033[33m" if _COLOR else ""
BOLD = "\033[1m" if _COLOR else ""
RESET = "\033[0m" if _COLOR else ""


def _tag(label: str, color: str) -> str:
    return f"  [{color}{label}{RESET}]"


PASS = _tag("PASS", GREEN)
FAIL = _tag("FAIL", RED)
SKIP = _tag("SKIP", YELLOW)


# ---------------------------------------------------------------------------
# HTTP helpers (stdlib only)
# ---------------------------------------------------------------------------

def _request(
    url: str,
    method: str = "GET",
    headers: Optional[dict] = None,
    timeout: int = 15,
) -> tuple[int, dict, bytes]:
    """Issue an HTTP request and return (status, headers_dict, body_bytes).

    On HTTP errors the status code is still returned so callers can
    inspect it rather than catching exceptions.
    """
    req = urllib.request.Request(url, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            resp_headers = {k.lower(): v for k, v in resp.getheaders()}
            return resp.status, resp_headers, body
    except urllib.error.HTTPError as exc:
        body = exc.read() if exc.fp else b""
        return exc.code, {}, body
    except Exception as exc:
        raise ConnectionError(str(exc)) from exc


def _get_json(url: str, timeout: int = 15) -> tuple[int, object]:
    """GET a URL and parse JSON response.  Returns (status, parsed_json)."""
    status, _, body = _request(url, timeout=timeout)
    return status, json.loads(body)


# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------

def check_health(backend: str, verbose: bool) -> tuple[str, str]:
    """GET /api/health -> 200, JSON with db_status."""
    url = f"{backend}/api/health"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    db_connected = data.get("db_connected", data.get("db_status", "unknown"))
    detail = f"200 OK, db {'connected' if db_connected is True else db_connected}"
    if verbose:
        detail += f" | {json.dumps(data, indent=2)}"
    return "PASS", detail


def check_posts_exist(backend: str, verbose: bool) -> tuple[str, str]:
    """GET /api/posts?limit=5 -> 200, data array non-empty."""
    url = f"{backend}/api/posts?limit=5"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    posts = data.get("posts", data.get("data", []))
    if not posts:
        return "FAIL", "posts array is empty (no posts in DB)"
    detail = f"{len(posts)} posts found"
    if verbose:
        titles = [p.get("title", "?")[:60] for p in posts[:3]]
        detail += f" | first: {titles}"
    return "PASS", detail


def check_audio_exists(backend: str, verbose: bool) -> tuple[str, str]:
    """GET /api/playlist -> 200, at least 1 post with audio_file."""
    url = f"{backend}/api/playlist"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    posts = data.get("posts", data.get("data", []))
    with_audio = [p for p in posts if _audio_ref(p)]
    if not with_audio:
        return "FAIL", "no posts with audio in playlist"
    detail = f"{len(with_audio)} tracks with audio"
    if verbose:
        files = [_audio_ref(p) for p in with_audio[:3]]
        detail += f" | files: {files}"
    return "PASS", detail


def _audio_ref(post: dict) -> str:
    """Return audio file/path value from a post dict, or empty string."""
    return post.get("audio_file") or post.get("audio_path") or ""


def _audio_url(backend: str, ref: str) -> tuple[str, str]:
    """Build a full audio URL and display name from an audio ref.

    Handles both 'filename.mp3' and 'audio/filename.mp3' formats.
    Returns (full_url, display_name).
    """
    if ref.startswith("audio/"):
        return f"{backend}/{ref}", ref.removeprefix("audio/")
    return f"{backend}/audio/{ref}", ref


def check_audio_playable(backend: str, verbose: bool) -> tuple[str, str]:
    """HEAD /audio/<first_audio_file> -> 200, Content-Type contains audio."""
    # First fetch playlist to get an audio filename
    url = f"{backend}/api/playlist"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"playlist fetch failed ({status})"
    posts = data.get("posts", data.get("data", []))
    with_audio = [p for p in posts if _audio_ref(p)]
    if not with_audio:
        return "FAIL", "no audio files to test"
    ref = _audio_ref(with_audio[0])
    full_url, display_name = _audio_url(backend, ref)
    head_status, headers, _ = _request(full_url, method="HEAD")
    if head_status != 200:
        return "FAIL", f"HEAD {display_name} returned {head_status}"
    content_type = headers.get("content-type", "")
    if "audio" not in content_type:
        return "FAIL", f"Content-Type is '{content_type}', expected audio/*"
    detail = f"{display_name} ({content_type})"
    if verbose:
        detail += f" | url: {full_url}"
    return "PASS", detail


def check_sources(backend: str, verbose: bool) -> tuple[str, str]:
    """GET /api/sources -> 200, at least 1 source."""
    url = f"{backend}/api/sources"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    sources = data if isinstance(data, list) else data.get("data", [])
    if not sources:
        return "FAIL", "sources array is empty"
    detail = f"{len(sources)} sources"
    if verbose:
        names = [s.get("name", "?") for s in sources[:5]]
        detail += f" | names: {names}"
    return "PASS", detail


def check_tags(backend: str, verbose: bool) -> tuple[str, str]:
    """GET /api/tags -> 200, tags array non-empty."""
    url = f"{backend}/api/tags"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    tags = data if isinstance(data, list) else data.get("data", [])
    if not tags:
        return "FAIL", "tags array is empty"
    detail = f"{len(tags)} tags"
    if verbose:
        names = [t.get("name", "?") for t in tags[:5]]
        detail += f" | names: {names}"
    return "PASS", detail


def check_status_dashboard(backend: str, verbose: bool) -> tuple[str, str]:
    """GET /api/status -> 200, valid JSON."""
    url = f"{backend}/api/status"
    status, data = _get_json(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    detail = "valid JSON"
    if verbose:
        detail += f" | keys: {list(data.keys())}"
    return "PASS", detail


def check_frontend_loads(frontend: str, verbose: bool) -> tuple[str, str]:
    """GET <frontend-url>/ -> 200, HTML response."""
    url = f"{frontend}/"
    status, headers, body = _request(url)
    if status != 200:
        return "FAIL", f"expected 200, got {status}"
    content_type = headers.get("content-type", "")
    if "html" not in content_type.lower():
        return "FAIL", f"Content-Type is '{content_type}', expected HTML"
    detail = "200 OK, HTML"
    if verbose:
        detail += f" | size: {len(body)} bytes"
    return "PASS", detail


def check_cors_headers(backend: str, verbose: bool) -> tuple[str, str]:
    """OPTIONS /api/posts with Origin header -> ACAO present."""
    url = f"{backend}/api/posts"
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    status, resp_headers, _ = _request(url, method="OPTIONS", headers=headers)
    acao = resp_headers.get("access-control-allow-origin", "")
    if not acao:
        return "FAIL", "Access-Control-Allow-Origin header missing"
    detail = f"Access-Control-Allow-Origin present"
    if verbose:
        detail += f" | value: {acao} | status: {status}"
    return "PASS", detail


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="E2E deployment verification for Tech Blog Catchup",
    )
    parser.add_argument(
        "--backend-url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--frontend-url",
        default="http://localhost:3000",
        help="Frontend base URL (default: http://localhost:3000)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed response data for each check",
    )
    args = parser.parse_args()

    backend = args.backend_url.rstrip("/")
    frontend = args.frontend_url.rstrip("/")

    print(f"\n{BOLD}Verifying deployment...{RESET}")
    print(f"  Backend:  {backend}")
    print(f"  Frontend: {frontend}\n")

    # Ordered list of (name, callable).
    # Backend checks receive backend URL; frontend check receives frontend URL.
    checks: list[tuple[str, str, object]] = [
        ("Health check",       "backend",  check_health),
        ("Posts exist",        "backend",  check_posts_exist),
        ("Audio exists",      "backend",  check_audio_exists),
        ("Audio playable",    "backend",  check_audio_playable),
        ("Sources list",      "backend",  check_sources),
        ("Tags list",         "backend",  check_tags),
        ("Status dashboard",  "backend",  check_status_dashboard),
        ("Frontend loads",    "frontend", check_frontend_loads),
        ("CORS headers",      "backend",  check_cors_headers),
    ]

    passed = 0
    failed = 0
    skipped = 0
    posts_empty = False

    for name, target, fn in checks:
        # Skip audio checks when no posts exist
        if posts_empty and name in ("Audio exists", "Audio playable"):
            print(f"{SKIP} {name} — skipped (no posts in DB)")
            skipped += 1
            continue

        url = backend if target == "backend" else frontend
        try:
            result, detail = fn(url, args.verbose)
        except ConnectionError as exc:
            result, detail = "FAIL", f"connection error: {exc}"
        except json.JSONDecodeError as exc:
            result, detail = "FAIL", f"invalid JSON: {exc}"
        except Exception as exc:
            result, detail = "FAIL", f"unexpected error: {exc}"

        if result == "PASS":
            print(f"{PASS} {name} — {detail}")
            passed += 1
        else:
            print(f"{FAIL} {name} — {detail}")
            failed += 1
            if name == "Posts exist":
                posts_empty = True

    total = passed + failed + skipped
    print()
    if failed == 0:
        print(f"  {GREEN}{BOLD}Result: {passed}/{total} passed{RESET}")
        if skipped:
            print(f"  ({skipped} skipped)")
    else:
        print(f"  {RED}{BOLD}Result: {passed}/{total} passed, {failed} failed{RESET}")
        if skipped:
            print(f"  ({skipped} skipped)")

    print()
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
