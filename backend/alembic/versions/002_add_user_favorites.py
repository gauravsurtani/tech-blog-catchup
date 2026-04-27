"""Add user_favorites table.

Revision ID: 002
Revises: 001
Create Date: 2026-04-27
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_favorites",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("post_id", sa.Integer, sa.ForeignKey("posts.id"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.UniqueConstraint("user_id", "post_id", name="uq_user_favorite"),
    )


def downgrade() -> None:
    op.drop_table("user_favorites")
