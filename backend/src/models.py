"""SQLAlchemy ORM models for Tech Blog Catchup."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Table, ForeignKey
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

    tags: Mapped[list["Tag"]] = relationship(secondary=post_tags, back_populates="posts")

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
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    urls_found: Mapped[int | None] = mapped_column(Integer, nullable=True)
    posts_added: Mapped[int | None] = mapped_column(Integer, nullable=True)

    def __repr__(self) -> str:
        return f"<CrawlLog(id={self.id}, source={self.source_key}, type={self.crawl_type})>"
