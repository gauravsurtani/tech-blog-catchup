"""Pydantic models for API request/response."""

from pydantic import BaseModel, model_validator
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
    audio_path: str | None
    audio_duration_secs: int | None
    word_count: int | None

    model_config = {"from_attributes": True}


class PostDetail(PostSummary):
    full_text: str | None
    audio_path: str | None
    crawled_at: datetime
    content_quality: str | None = None
    quality_score: int | None = None
    extraction_method: str | None = None

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


class GenerateRequest(BaseModel):
    post_id: int | None = None
    limit: int = 10


class PaginatedPosts(BaseModel):
    posts: list[PostSummary]
    total: int
    offset: int
    limit: int


class CrawlStatusItem(BaseModel):
    source_key: str
    source_name: str
    enabled: bool
    feed_url: str
    blog_url: str | None
    status: str  # "success", "error", "running", "never"
    post_count: int
    total_discoverable: int | None = None
    last_crawl_at: datetime | None
    last_crawl_type: str | None
    posts_added_last: int | None
    urls_found_last: int | None
    error_message: str | None


class JobInfo(BaseModel):
    id: int
    job_type: str
    status: str
    params: str | None
    result: str | None
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class UserInfo(BaseModel):
    id: int
    email: str
    name: str | None
    avatar_url: str | None
    provider: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPreferencesInfo(BaseModel):
    theme: str = "dark"
    playback_speed: float = 1.0
    notifications: bool = True

    model_config = {"from_attributes": True}


class UserMeResponse(BaseModel):
    user: UserInfo
    preferences: UserPreferencesInfo


class UpdatePreferencesRequest(BaseModel):
    theme: str | None = None
    playback_speed: float | None = None
    notifications: bool | None = None


class SubmitRequest(BaseModel):
    url: str | None = None
    text: str | None = None
    title: str | None = None

    @model_validator(mode='after')
    def validate_input(self) -> "SubmitRequest":
        # Treat empty strings as None
        if self.url is not None and self.url.strip() == "":
            self.url = None
        if self.text is not None and self.text.strip() == "":
            self.text = None

        if not self.url and not self.text:
            raise ValueError("Either 'url' or 'text' must be provided")
        if self.url and self.text:
            raise ValueError("Provide either 'url' or 'text', not both")
        if self.text and not self.title:
            raise ValueError("'title' is required when submitting text")
        return self
