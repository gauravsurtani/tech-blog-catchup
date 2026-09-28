"""The former remote parallel-TTS contract is replaced by a bounded local child."""

import pytest
from src.podcast.script import parse_script
from src.podcast.generator import render_episode


def test_preserves_turn_order():
    parts = [f"<Person{1 + i % 2}>Segment {i}</Person{1 + i % 2}>" for i in range(20)]
    assert [t["text"] for t in parse_script("".join(parts))] == [
        f"Segment {i}" for i in range(20)
    ]


@pytest.mark.parametrize(
    "script",
    [
        "",
        "<Person1></Person1><Person2>Words</Person2>",
        "<Person1>One</Person1>trailing",
        "<!DOCTYPE x><Person1>Hello</Person1>",
    ],
)
def test_invalid_script_cannot_start_speech(script, tmp_path, monkeypatch):
    monkeypatch.setenv("AUDIO_DIR", str(tmp_path))
    with pytest.raises(ValueError):
        render_episode(script, "test", "a" * 64, "b" * 64)
    assert list(tmp_path.iterdir()) == []


def test_path_traversal_rejected(tmp_path, monkeypatch):
    monkeypatch.setenv("AUDIO_DIR", str(tmp_path))
    with pytest.raises(ValueError):
        render_episode(
            "<Person1>One</Person1><Person2>Two</Person2>",
            "../escape",
            "a" * 64,
            "b" * 64,
        )
