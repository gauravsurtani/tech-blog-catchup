import pytest


def test_request_rejects_paths_and_unapproved_voices(tmp_path):
    from src.podcast.kokoro_worker import validate_request

    base = {
        "turns": [
            {"speaker": "Person1", "text": "Hello", "voice": "af_sarah"},
            {"speaker": "Person2", "text": "Hi", "voice": "am_michael"},
        ],
        "source_hash": "a" * 64,
        "run_spec_hash": "b" * 64,
        "script_hash": "c" * 64,
    }
    assert validate_request(base)["turns"][0]["voice"] == "af_sarah"
    for field, value in [("voice", "unknown"), ("text", "x" * 1600)]:
        bad = {**base, "turns": [dict(t) for t in base["turns"]]}
        bad["turns"][0][field] = value
        with pytest.raises(ValueError):
            validate_request(bad)
