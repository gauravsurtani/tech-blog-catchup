"""Load and validate config.yaml, provide typed access to settings."""

import re
from dataclasses import dataclass, field
from pathlib import Path
from functools import lru_cache

import yaml


@dataclass
class BlogSource:
    key: str
    name: str
    feed_url: str
    sitemap_url: str | None = None
    archive_url: str | None = None
    blog_page_url: str | None = None
    blog_url_pattern: str | None = None
    platform: str | None = None
    enabled: bool = True
    needs_browser: bool = False
    article_selector: str | None = None
    strip_selectors: list[str] | None = None
    pagination_pattern: str | None = None  # e.g. "/page/{n}/"


@dataclass
class TagDefinition:
    name: str
    slug: str
    keywords: list[str]


@dataclass
class Config:
    sources: list[BlogSource]
    tags: list[TagDefinition]
    podcast: dict
    crawl: dict
    app: dict
    llm: dict
    scheduler: dict = field(default_factory=dict)


def _slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")


def load_config(path: str | None = None) -> Config:
    """Load config from YAML file and return typed Config object."""
    if path is None:
        # Look relative to this file's parent (backend/)
        path = str(Path(__file__).parent.parent / "config.yaml")

    with open(path) as f:
        raw = yaml.safe_load(f)

    sources = []
    for key, data in raw.get("sources", {}).items():
        sources.append(BlogSource(
            key=key,
            name=data["name"],
            feed_url=data.get("feed_url", ""),
            sitemap_url=data.get("sitemap_url"),
            archive_url=data.get("archive_url"),
            blog_page_url=data.get("blog_page_url"),
            blog_url_pattern=data.get("blog_url_pattern"),
            platform=data.get("platform"),
            enabled=data.get("enabled", True),
            needs_browser=data.get("needs_browser", False),
            article_selector=data.get("article_selector"),
            strip_selectors=data.get("strip_selectors"),
            pagination_pattern=data.get("pagination_pattern"),
        ))

    tags = []
    for name, data in raw.get("tags", {}).items():
        tags.append(TagDefinition(
            name=name,
            slug=_slugify(name),
            keywords=data.get("keywords", []),
        ))

    return Config(
        sources=sources,
        tags=tags,
        podcast=raw.get("podcast", {}),
        crawl=raw.get("crawl", {}),
        app=raw.get("app", {}),
        llm=raw.get("llm", {}),
        scheduler=raw.get("scheduler", {}),
    )


@lru_cache(maxsize=1)
def get_config() -> Config:
    """Singleton accessor - loads once, caches."""
    return load_config()
