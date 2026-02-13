"""LLM-based content generation — summary + podcast script in one call."""

import json
import logging
import os

from src.config import get_config

logger = logging.getLogger(__name__)


async def generate_content(title: str, markdown: str) -> dict:
    """Generate summary and podcast script from article content.

    Uses a single OpenAI API call to produce both a concise summary and a
    two-host podcast script. Model is configured via config.yaml
    llm.content_generation.model.

    Returns dict with keys: summary (str), podcast_script (str | None).
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for content generation")

    config = get_config()
    llm_cfg = config.llm.get("content_generation", {})
    model = llm_cfg.get("model", "gpt-5.2")

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI()
        response = await client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a technical content processor. Given a blog post title and its "
                        "full markdown content, produce TWO things:\n\n"
                        "1. **summary**: A 2-3 sentence technical summary covering what was built, "
                        "why it matters, and the key result or insight.\n\n"
                        "2. **podcast_script**: A ~3000 word two-host conversational podcast script. "
                        "Use <Person1> and <Person2> XML tags to denote speakers. Person1 is the main "
                        "host who explains concepts clearly. Person2 is the co-host who asks insightful "
                        "questions and adds context. The conversation should be engaging, educational, "
                        "and technically accurate. Cover the key points from the article naturally.\n\n"
                        'Return JSON: {"summary": "...", "podcast_script": "<Person1>...</Person1>..."}'
                    ),
                },
                {
                    "role": "user",
                    "content": f"Title: {title}\n\nContent:\n{markdown}",
                },
            ],
            temperature=0.7,
        )

        raw = response.choices[0].message.content
        if not raw:
            return {"summary": markdown[:500], "podcast_script": None}

        data = json.loads(raw)
        return {
            "summary": data.get("summary", ""),
            "podcast_script": data.get("podcast_script"),
        }

    except Exception:
        logger.exception("Content generation failed for %s", title[:60])
        return {"summary": markdown[:500], "podcast_script": None}


async def generate_summary_only(title: str, markdown: str) -> str:
    """Generate only a summary (no podcast script). Convenience wrapper."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for content generation")

    config = get_config()
    llm_cfg = config.llm.get("content_generation", {})
    model = llm_cfg.get("model", "gpt-5.2")

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI()
        response = await client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a technical content processor. Given a blog post title and its "
                        "full markdown content, produce a 2-3 sentence technical summary covering "
                        "what was built, why it matters, and the key result or insight.\n\n"
                        'Return JSON: {"summary": "..."}'
                    ),
                },
                {
                    "role": "user",
                    "content": f"Title: {title}\n\nContent:\n{markdown}",
                },
            ],
            temperature=0.7,
        )

        raw = response.choices[0].message.content
        if not raw:
            return markdown[:500]

        data = json.loads(raw)
        return data.get("summary", markdown[:500])

    except Exception:
        logger.exception("Summary generation failed for %s", title[:60])
        return markdown[:500]
