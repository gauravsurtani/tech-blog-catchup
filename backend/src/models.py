"""SQLAlchemy ORM models for Tech Blog Catchup."""

from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Table, Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    source_key: Mapped[str] = mapped_column(String, nullable=False, index=True)
    source_name: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str | None] = mapped_column(String, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    crawled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    audio_status: Mapped[str] = mapped_column(String, nullable=False, default="pending", index=True)
    audio_path: Mapped[str | None] = mapped_column(String, nullable=True)
    audio_duration_secs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_quality: Mapped[str | None] = mapped_column(String, nullable=True)  # "good", "low", "rejected"
    quality_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    extraction_method: Mapped[str | None] = mapped_column(String, nullable=True)  # "trafilatura", "crawl4ai", "bs4"
    content_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    podcast_script: Mapped[str | None] = mapped_column(Text, nullable=True)

    # User submission fields
    submitted_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    is_user_submitted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="0", index=True
    )
    submission_type: Mapped[str | None] = mapped_column(
        String, nullable=True, info={"valid_values": ["url", "text"]}
    )

    tags: Mapped[list["Tag"]] = relationship(secondary=post_tags, back_populates="posts")
    submitted_by: Mapped["User | None"] = relationship(
        "User", backref="submitted_posts", foreign_keys=[submitted_by_user_id]
    )

    def __repr__(self) -> str:
        return f"<Post(id={self.id}, source={self.source_key}, title={self.title!r})>"


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    posts: Mapped[list["Post"]] = relationship(secondary=post_tags, back_populates="tags")

    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name={self.name!r})>"


class CrawlLog(Base):
    __tablename__ = "crawl_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_key: Mapped[str] = mapped_column(String, nullable=False)
    crawl_type: Mapped[str] = mapped_column(String, nullable=False)  # "full" or "incremental"
    status: Mapped[str] = mapped_column(String, nullable=False, default="running")  # running, success, error
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    urls_found: Mapped[int | None] = mapped_column(Integer, nullable=True)
    posts_added: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<CrawlLog(id={self.id}, source={self.source_key}, type={self.crawl_type}, status={self.status})>"


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_type: Mapped[str] = mapped_column(String, nullable=False)  # "crawl" or "generate"
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued", index=True)
    params: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of job parameters
    result: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of job result
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Job(id={self.id}, type={self.job_type}, status={self.status})>"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    provider: Mapped[str] = mapped_column(String, nullable=False)  # 'google' | 'github'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    preferences: Mapped["UserPreferences | None"] = relationship(
        "UserPreferences", back_populates="user", uselist=False
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email!r}, provider={self.provider})>"


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme: Mapped[str] = mapped_column(String, default="dark")
    playback_speed: Mapped[float] = mapped_column(Float, default=1.0)
    notifications: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship("User", back_populates="preferences")

    def __repr__(self) -> str:
        return f"<UserPreferences(id={self.id}, user_id={self.user_id})>"
