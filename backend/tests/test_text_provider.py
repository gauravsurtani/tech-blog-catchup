import pytest


@pytest.mark.asyncio
async def test_missing_key_fails_closed(monkeypatch):
    monkeypatch.delenv("OLLAMA_API_KEY", raising=False)
    from src.extractor.content_generator import generate_content

    with pytest.raises(RuntimeError):
        await generate_content("Title", "body " * 100)


def test_script_rejects_dropped_text_and_oversize():
    from src.podcast.script import parse_script

    for bad in [
        "<Person1>Hello</Person1>ignored",
        "<Person1>" + "x" * 1600 + "</Person1>",
        "<Person3>Hello</Person3>",
    ]:
        with pytest.raises(ValueError):
            parse_script(bad)
    assert (
        parse_script("<Person1>Hello</Person1><Person2>Why?</Person2>")[1]["speaker"]
        == "Person2"
    )


def test_fenced_provider_json_is_unwrapped_without_accepting_prose():
    from src.text_client import parse_json

    assert parse_json('```json\n{"summary":"hello"}\n```') == {"summary": "hello"}
    with pytest.raises(ValueError):
        parse_json('Here you go: {"summary":"hello"}')
