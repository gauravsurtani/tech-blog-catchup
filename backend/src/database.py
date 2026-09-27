"""SQLAlchemy engine, session factory, and database initialization."""

import logging
import os
from pathlib import Path

from sqlalchemy import create_engine, event, inspect, text, Engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from sqlalchemy.pool import NullPool, QueuePool

from src.config import get_config

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def _set_sqlite_pragma(dbapi_connection, connection_record):
    """Set WAL mode and busy timeout on every new SQLite connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA busy_timeout=30000;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()


def get_engine(db_path: str | None = None) -> Engine:
    """Create or return cached SQLAlchemy engine."""
    global _engine
    if _engine is not None:
        return _engine

    if db_path is None:
        config = get_config()
        db_path = os.getenv("DATABASE_PATH") or config.app.get("db_path", "data/techblog.db")

    # Resolve relative to backend/ directory
    db_file = Path(__file__).parent.parent / db_path
    db_file.parent.mkdir(parents=True, exist_ok=True)

    # NullPool for SQLite: avoids self-locking from multiple pooled connections
    # competing for the single-writer lock. Each session gets its own connection
    # that is closed when the session ends, preventing stale lock issues.
    # QueuePool is only appropriate for multi-connection databases (PostgreSQL, etc.).
    _engine = create_engine(
        f"sqlite:///{db_file}",
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )
    event.listen(_engine, "connect", _set_sqlite_pragma)
    return _engine


def get_session_factory(engine: Engine | None = None) -> sessionmaker[Session]:
    """Return a session factory bound to the engine."""
    global _session_factory
    if _session_factory is not None:
        return _session_factory

    if engine is None:
        engine = get_engine()

    _session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    return _session_factory


def init_db(engine: Engine | None = None) -> None:
    """Migrate the mounted database under one SQLite write lock."""
    from alembic.config import Config as AlembicConfig
    from alembic import command
    engine = engine or get_engine()
    cfg = AlembicConfig(str(Path(__file__).parent.parent / "alembic.ini"))
    with engine.connect() as connection:
        connection.exec_driver_sql("BEGIN IMMEDIATE")
        try:
            cfg.attributes["connection"] = connection
            command.upgrade(cfg, "head")
            connection.commit()
        except Exception:
            connection.rollback()
            raise


def get_session() -> Session:
    """Convenience: get a new session from the default factory."""
    factory = get_session_factory()
    return factory()


def reset_engine() -> None:
    """Reset cached engine and session factory. Useful for testing."""
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None
