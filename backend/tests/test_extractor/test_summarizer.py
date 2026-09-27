"""Provider contract: explicit Ollama transport, complete turns and source evidence."""

import json
from unittest.mock import patch
import httpx
import pytest
from openai import AsyncOpenAI
from src.extractor.content_generator import generate_content, generate_summary_only

SOURCE = "A cache stores recently used data. Cached data can become stale. " * 10
SCRIPT = "<Person1>A cache stores recently used data.</Person1><Person2>Cached data can become stale.</Person2>"


@pytest.mark.asyncio
async def test_ollama_request_and_grounding(monkeypatch):
    monkeypatch.setenv("OLLAMA_API_KEY", "fixture-only")
    monkeypatch.setenv("ENABLE_GENERATION", "true")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    requests = []

    def respond(request):
        requests.append(request)
        data = {
            "summary": "A cache may contain stale data.",
            "turns": [
                {"speaker": "Person1", "text": "A cache stores recently used data."},
                {"speaker": "Person2", "text": "Cached data can become stale."},
            ],
            "evidence": ["A cache stores recently used data."],
        }
        return httpx.Response(
            200,
            json={
                "id": "fixture",
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {"role": "assistant", "content": json.dumps(data)},
                    }
                ],
                "model": "fixture",
                "object": "chat.completion",
                "created": 0,
            },
        )

    def client(**kwargs):
        return AsyncOpenAI(
            **kwargs,
            http_client=httpx.AsyncClient(transport=httpx.MockTransport(respond)),
        )

    with patch("src.text_client.AsyncOpenAI", side_effect=client):
        result = await generate_content("Caching", SOURCE)
        assert result["podcast_script"] == SCRIPT
        assert await generate_summary_only("Caching", SOURCE)
    assert len(requests) == 2
    assert all(r.url.host == "ollama.com" for r in requests)
    assert SOURCE in json.loads(requests[0].content)["messages"][1]["content"]


@pytest.mark.asyncio
@pytest.mark.parametrize("code", [401, 429, 500])
async def test_provider_errors_do_not_fallback(monkeypatch, code):
    monkeypatch.setenv("OLLAMA_API_KEY", "fixture-only")
    monkeypatch.setenv("ENABLE_GENERATION", "true")
    seen = []

    def respond(request):
        seen.append(request.url.host)
        return httpx.Response(code, json={"error": {"message": "fixture"}})

    def client(**kw):
        return AsyncOpenAI(
            **kw, http_client=httpx.AsyncClient(transport=httpx.MockTransport(respond))
        )

    with (
        patch("src.text_client.AsyncOpenAI", side_effect=client),
        pytest.raises(Exception),
    ):
        await generate_content("Caching", SOURCE)
    assert seen == ["ollama.com"]


@pytest.mark.asyncio
async def test_unattributed_evidence_rejected():
    with patch(
        "src.extractor.content_generator.json_completion",
        return_value={
            "summary": "Claim",
            "turns": [
                {"speaker": "Person1", "text": "A cache stores recently used data."},
                {"speaker": "Person2", "text": "Cached data can become stale."},
            ],
            "evidence": ["Invented unsupported claim"],
        },
    ):
        with pytest.raises(ValueError, match="Evidence"):
            await generate_content("Caching", SOURCE)
