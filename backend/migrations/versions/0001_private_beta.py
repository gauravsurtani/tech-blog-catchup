"""Adopt the legacy SQLite database and explicitly establish beta constraints."""

from alembic import op
from sqlalchemy import inspect, text

revision = "0001_private_beta"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    existing = inspect(connection)
    legacy = existing.has_table("posts") and "visibility" not in {
        c["name"] for c in existing.get_columns("posts")
    }
    # Baseline adoption supports historical deployments with additive legacy fields.
    # Subsequent revisions must contain their own explicit operations.
    from src.database import Base
    import src.models

    Base.metadata.create_all(connection)
    inspector = inspect(connection)
    for name, table in Base.metadata.tables.items():
        columns = {c["name"] for c in inspector.get_columns(name)}
        for col in table.columns:
            if col.name not in columns:
                default = (
                    f" DEFAULT '{col.server_default.arg}'"
                    if col.server_default is not None
                    else ""
                )
                nullable = "" if col.nullable else " NOT NULL"
                reference = ""
                for foreign_key in col.foreign_keys:
                    target_table, target_column = foreign_key.target_fullname.split(".")
                    reference = f' REFERENCES "{target_table}"("{target_column}")'
                connection.execute(
                    text(
                        f'ALTER TABLE "{name}" ADD COLUMN "{col.name}" {col.type.compile(connection.dialect)}{nullable}{default}{reference}'
                    )
                )
    connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_job_request ON jobs(actor_key, idempotency_key)"
        )
    )
    connection.execute(
        text("CREATE UNIQUE INDEX IF NOT EXISTS uq_user_subject ON users(subject)")
    )
    if legacy:
        # Previously anonymous catalog is retained; ambiguous user input is excluded.
        connection.execute(
            text(
                "UPDATE posts SET visibility='public' WHERE is_user_submitted=0 AND source_key!='user' AND url NOT LIKE 'user:%'"
            )
        )
        connection.execute(
            text(
                "INSERT OR IGNORE INTO audio_artifacts(path,post_id,public) SELECT audio_path,id,1 FROM posts WHERE visibility='public' AND audio_path IS NOT NULL AND audio_status='ready'"
            )
        )


def downgrade():
    raise RuntimeError(
        "Restore the verified pre-migration backup; destructive downgrade is not automatic"
    )
