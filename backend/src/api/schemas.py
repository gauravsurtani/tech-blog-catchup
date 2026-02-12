"""Pydantic models for API request/response."""

from pydantic import BaseModel
from datetime import datetime


class PostSummary(BaseModel):
    id: int
    url: str
    source_key: str
    source_name: str
    title: str
    summary: str | None
    author: str | None
    published_at: datetime | None
    tags: list[str]
    audio_status: str
    audio_duration_secs: int | None
    word_count: int | None

    model_config = {"from_attributes": True}


class PostDetail(PostSummary):
    full_text: str | None
    audio_path: str | None
    crawled_at: datetime

    model_config = {"from_attributes": True}


class TagInfo(BaseModel):
    name: str
    slug: str
    post_count: int


class SourceInfo(BaseModel):
    key: str
    name: str
    post_count: int


class StatusInfo(BaseModel):
    total_posts: int
    posts_by_source: list[SourceInfo]
    audio_counts: dict[str, int]
    tag_counts: list[TagInfo]


class CrawlRequest(BaseModel):
    source: str | None = None
    mode: str = "incremental"  # "full" or "incremental"


class GenerateRequest(BaseModel):
    post_id: int | None = None
    limit: int = 10


class PaginatedPosts(BaseModel):
    posts: list[PostSummary]
    total: int
    offset: int
    limit: int
