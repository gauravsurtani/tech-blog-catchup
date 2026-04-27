"""Alembic environment configuration."""

import sys
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool, event

# Add backend/src to sys.path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database import Base, _set_sqlite_pragma, get_engine
import src.models  # noqa: F401 — register all models with Base.metadata

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — emit SQL to stdout."""
    engine = get_engine()
    url = str(engine.url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database connection."""
    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
