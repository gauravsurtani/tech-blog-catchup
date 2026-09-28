"""Classification fails closed when the provider cannot check a source."""

from src.text_client import json_completion


async def is_useful_content(title: str, text: str, url: str) -> bool:
    try:
        data = await json_completion(
            'Decide whether this is a substantive article, not navigation or a category page. Return JSON {"is_article": true or false}.',
            f"{title}\n{url}\n{text[:4000]}",
        )
        return data.get("is_article") is True
    except Exception:
        return False
