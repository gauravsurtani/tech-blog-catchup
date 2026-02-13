"""LLM extraction strategy — gives URL to LLM with web search, gets back clean content."""

import json
import logging
import os

from src.extractor.strategies.base import ExtractionStrategy
from src.config import get_config

logger = logging.getLogger(__name__)

_EXTRACTION_PROMPT = (
    "Visit this URL and extract the full blog article content and metadata.\n\n"
    "URL: {url}\n\n"
    "Return a JSON object with these exact keys:\n"
    '- "title": the article title (string or null)\n'
    '- "author": the author name (string or null)\n'
    '- "published_date": the publication date in YYYY-MM-DD format (string or null)\n'
    '- "content": the full article body as clean Markdown (string)\n'
    '- "summary": a 2-3 sentence summary of the article (string)\n\n'
    "Rules for the content field:\n"
    "- Preserve ALL structure: headings (# ## ###), bullet/numbered lists, "
    "code blocks (``` with language tag), tables, bold/italic\n"
    "- Preserve links as [text](url)\n"
    "- Remove navigation, headers, footers, ads, sidebars, cookie banners\n"
    "- Do NOT include the title as a heading in the content — it goes in the title field\n"
    "- Return only the article body, not boilerplate\n"
    "- Return ONLY valid JSON, nothing else\n"
)


class LLMStrategy(ExtractionStrategy):
    """LLM-based extraction — gives URL to LLM with web search to browse and extract."""

    name: str = "llm"

    async def extract(self, url: str, timeout: int = 30) -> dict | None:
        """Give URL to LLM with web search and get back structured content."""
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set — skipping LLM extraction for %s", url)
            return None

        try:
            return await self._extract_with_web_search(url)
        except Exception:
            logger.exception("LLM extraction failed for %s", url)
            return None

    async def _extract_with_web_search(self, url: str) -> dict | None:
        """Use Responses API with web_search_preview to browse and extract."""
        from openai import AsyncOpenAI

        config = get_config()
        llm_cfg = config.llm.get("extraction", {})
        model = llm_cfg.get("model", "gpt-5.2")
        use_web_search = llm_cfg.get("web_search", True)

        client = AsyncOpenAI()

        tools = [{"type": "web_search_preview"}] if use_web_search else []

        response = await client.responses.create(
            model=model,
            tools=tools,
            input=_EXTRACTION_PROMPT.format(url=url),
        )

        # Extract text from response output
        raw_text = ""
        for item in response.output:
            if item.type == "message":
                for content in item.content:
                    if content.type == "output_text":
                        raw_text = content.text
                        break

        if not raw_text:
            logger.warning("LLM returned empty response for %s", url)
            return None

        # Parse JSON — handle markdown code fences if present
        text = raw_text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)

        return {
            "html": "",
            "text": data.get("content", ""),
            "title": data.get("title"),
            "author": data.get("author"),
            "published_at": data.get("published_date"),
        }
