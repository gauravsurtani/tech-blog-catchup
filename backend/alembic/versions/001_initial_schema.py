"""Initial schema baseline.

Revision ID: 001
Revises: None
Create Date: 2026-04-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String, unique=True, nullable=False),
        sa.Column("slug", sa.String, unique=True, nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("email", sa.String, unique=True, nullable=False, index=True),
        sa.Column("name", sa.String, nullable=True),
        sa.Column("avatar_url", sa.String, nullable=True),
        sa.Column("provider", sa.String, nullable=False),
        sa.Column("created_at", sa.DateTime, default=sa.func.now()),
    )

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("url", sa.String, unique=True, nullable=False),
        sa.Column("source_key", sa.String, nullable=False, index=True),
        sa.Column("source_name", sa.String, nullable=False),
        sa.Column("title", sa.String, nullable=False),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("full_text", sa.Text, nullable=True),
        sa.Column("author", sa.String, nullable=True),
        sa.Column("published_at", sa.DateTime, nullable=True),
        sa.Column("crawled_at", sa.DateTime, nullable=False),
        sa.Column("audio_status", sa.String, nullable=False, default="pending", index=True),
        sa.Column("audio_path", sa.String, nullable=True),
        sa.Column("audio_duration_secs", sa.Integer, nullable=True),
        sa.Column("word_count", sa.Integer, nullable=True),
        sa.Column("content_quality", sa.String, nullable=True),
        sa.Column("quality_score", sa.Integer, nullable=True),
        sa.Column("extraction_method", sa.String, nullable=True),
        sa.Column("content_hash", sa.String, nullable=True),
        sa.Column("podcast_script", sa.Text, nullable=True),
        sa.Column("submitted_by_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("is_user_submitted", sa.Boolean, nullable=False, server_default="0", index=True),
        sa.Column("submission_type", sa.String, nullable=True),
    )

    op.create_table(
        "post_tags",
        sa.Column("post_id", sa.Integer, sa.ForeignKey("posts.id"), primary_key=True),
        sa.Column("tag_id", sa.Integer, sa.ForeignKey("tags.id"), primary_key=True),
    )

    op.create_table(
        "crawl_log",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("source_key", sa.String, nullable=False),
        sa.Column("crawl_type", sa.String, nullable=False),
        sa.Column("status", sa.String, nullable=False, default="running"),
        sa.Column("started_at", sa.DateTime, nullable=False),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("urls_found", sa.Integer, nullable=True),
        sa.Column("posts_added", sa.Integer, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("job_type", sa.String, nullable=False),
        sa.Column("status", sa.String, nullable=False, default="queued", index=True),
        sa.Column("params", sa.Text, nullable=True),
        sa.Column("result", sa.Text, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
    )

    op.create_table(
        "user_preferences",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), unique=True, nullable=False),
        sa.Column("theme", sa.String, default="dark"),
        sa.Column("playback_speed", sa.Float, default=1.0),
        sa.Column("notifications", sa.Boolean, default=True),
    )


def downgrade() -> None:
    op.drop_table("user_preferences")
    op.drop_table("jobs")
    op.drop_table("crawl_log")
    op.drop_table("post_tags")
    op.drop_table("posts")
    op.drop_table("users")
    op.drop_table("tags")
