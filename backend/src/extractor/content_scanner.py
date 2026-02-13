"""LLM-based content scanner — decides if extracted content is a real article or junk."""

import json
import logging
import os

from src.config import get_config

logger = logging.getLogger(__name__)


async def is_useful_content(title: str, text: str, url: str) -> bool:
    """Ask LLM whether this page is a real blog article.

    Model is configured via config.yaml llm.content_scanner.model.
    Returns True if it's a real article worth keeping, False if it's a
    category page, landing page, placeholder, or other junk.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for content scanning")

    config = get_config()
    llm_cfg = config.llm.get("content_scanner", {})
    model = llm_cfg.get("model", "gpt-4o-mini")

    # Only send first ~2000 chars — enough to judge
    snippet = text[:2000]

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
                        "You classify web pages. Given a page title, URL, and text snippet, "
                        "decide if this is a REAL blog article/engineering post with substantial "
                        "technical content, or if it's a category page, landing page, navigation "
                        "page, placeholder, product page, or other non-article content.\n\n"
                        'Return JSON: {"is_article": true} or {"is_article": false}'
                    ),
                },
                {
                    "role": "user",
                    "content": f"Title: {title}\nURL: {url}\n\nContent:\n{snippet}",
                },
            ],
            temperature=0,
        )

        raw = response.choices[0].message.content
        if not raw:
            return False

        data = json.loads(raw)
        result = data.get("is_article", True)
        if not result:
            logger.info("Content scanner rejected: %s (%s)", title[:60], url)
        return result

    except Exception:
        logger.exception("Content scanner failed for %s", url)
        return False
