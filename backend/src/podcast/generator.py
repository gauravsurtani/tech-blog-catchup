"""Bounded local speech subprocess. No API key is sent to the child."""

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import signal
from src.podcast.script import parse_script


def audio_directory():
    return Path(
        os.getenv("AUDIO_DIR", str(Path(__file__).parents[2] / "audio"))
    ).resolve()


def _parse_script_segments(script):
    return [(t["speaker"], t["text"]) for t in parse_script(script)]


def render_episode(
    script, job_version, source_hash, run_spec_hash, cancelled=lambda: False
):
    if not re.fullmatch(r"[a-zA-Z0-9-]{1,80}", job_version):
        raise ValueError("Invalid job directory")
    from src.podcast.kokoro_worker import VOICES

    turns = [{**t, "voice": VOICES[t["speaker"]]} for t in parse_script(script)]
    output = audio_directory() / "jobs" / job_version
    output.mkdir(parents=True, exist_ok=True)
    request = {
        "turns": turns,
        "source_hash": source_hash,
        "run_spec_hash": run_spec_hash,
        "script_hash": hashlib.sha256(script.encode()).hexdigest(),
    }
    request_path = output / "request.json"
    request_path.write_text(json.dumps(request))
    request_path.chmod(0o600)
    env = {
        k: v
        for k, v in os.environ.items()
        if k in ("PATH", "LANG", "TMPDIR", "SYSTEMROOT", "KOKORO_ASSET_DIR")
    }
    env["OMP_NUM_THREADS"] = "2"
    process = subprocess.Popen(
        [
            os.getenv("SPEECH_PYTHON", sys.executable),
            "-m",
            "src.podcast.kokoro_worker",
            "--request",
            str(request_path),
            "--output-dir",
            str(output),
        ],
        cwd=Path(__file__).parents[2],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    deadline = time.monotonic() + 900
    try:
        while True:
            if cancelled() or time.monotonic() > deadline:
                raise RuntimeError("Speech cancelled or timed out")
            try:
                stdout, _ = process.communicate(timeout=1)
                break
            except subprocess.TimeoutExpired:
                continue
    except BaseException:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL)
        process.communicate()
        raise
    if process.returncode:
        raise RuntimeError("Speech process failed")
    manifest = json.loads(stdout)
    expected = f"audio/jobs/{job_version}/episode.mp3"
    if manifest.get("audio_path") != expected:
        raise ValueError("Invalid artifact path")
    return manifest


def generate_podcast_for_post(post, config):
    """Legacy CLI compatibility; callers must use durable job admission."""
    raise RuntimeError(
        "Use the durable generation queue; direct post mutation is disabled"
    )
