"""LLM-based content generation — summary + podcast script in one call."""

import json
import logging
import os

from src.config import get_config

logger = logging.getLogger(__name__)


async def generate_content(title: str, markdown: str) -> dict:
    """Generate summary and podcast script from article content.

    Uses a single OpenAI API call to produce both a concise summary and a
    two-host podcast script. Script length scales with article length to
    avoid padding short articles or truncating long ones.

    Model is configured via config.yaml llm.content_generation.model.

    Returns dict with keys: summary (str), podcast_script (str | None).
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set — returning basic summary without LLM")
        first_para = markdown.split("\n\n")[0][:500] if markdown else ""
        return {"summary": first_para, "podcast_script": None}

    config = get_config()
    llm_cfg = config.llm.get("content_generation", {})
    model = llm_cfg.get("model", "gpt-5.2")

    # Scale script length to article size — short articles get short podcasts
    word_count = len(markdown.split())
    if word_count < 500:
        script_words = 600
        duration_hint = "3-4 minute"
    elif word_count < 800:
        script_words = 800
        duration_hint = "4-5 minute"
    elif word_count < 1500:
        script_words = 2000
        duration_hint = "10-12 minute"
    elif word_count < 3000:
        script_words = 3000
        duration_hint = "15-18 minute"
    else:
        script_words = 4000
        duration_hint = "20-25 minute"

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
                        f"2. **podcast_script**: A two-host conversational podcast script, "
                        f"STRICTLY {script_words} words or fewer ({duration_hint} when read aloud). "
                        f"Do NOT exceed {script_words} words — shorter articles must produce shorter podcasts. "
                        "Use <Person1> and <Person2> XML tags to denote speakers. Person1 is the main "
                        "host who explains concepts clearly. Person2 is the co-host who asks insightful "
                        "questions and adds context. The conversation should be engaging, educational, "
                        "and technically accurate.\n\n"
                        "IMPORTANT: Cover every key point from the article — do not skip or oversimplify "
                        "any technical detail. Use natural conversation (rephrasing, examples, reactions) "
                        "to make the content accessible, but stay faithful to the source material. "
                        "Do not invent facts, statistics, or examples not present in the original article. "
                        "The depth should match the article — short articles get concise discussions, "
                        "long detailed articles get thorough deep dives.\n\n"
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
        logger.warning("OPENAI_API_KEY not set — returning first paragraph as summary")
        return markdown.split("\n\n")[0][:500] if markdown else ""

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
