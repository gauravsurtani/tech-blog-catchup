"""SQLAlchemy engine, session factory, and database initialization."""

import logging
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
    cursor.close()


def get_engine(db_path: str | None = None) -> Engine:
    """Create or return cached SQLAlchemy engine."""
    global _engine
    if _engine is not None:
        return _engine

    if db_path is None:
        config = get_config()
        db_path = config.app.get("db_path", "data/techblog.db")

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


def _migrate_missing_columns(engine: Engine) -> None:
    """Add columns that exist in models but not in the DB (SQLite-safe)."""
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table_name, table in Base.metadata.tables.items():
            if not inspector.has_table(table_name):
                continue
            existing = {col["name"] for col in inspector.get_columns(table_name)}
            for col in table.columns:
                if col.name in existing:
                    continue
                col_type = col.type.compile(engine.dialect)
                nullable = "NULL" if col.nullable else "NOT NULL"
                default = ""
                if col.server_default is not None:
                    default = f" DEFAULT {col.server_default.arg}"
                elif col.nullable:
                    default = " DEFAULT NULL"
                sql = f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type} {nullable}{default}"
                conn.execute(text(sql))
                logger.info("Migrated column: %s.%s", table_name, col.name)


def init_db(engine: Engine | None = None) -> None:
    """Create all tables and migrate missing columns."""
    if engine is None:
        engine = get_engine()

    # Import models so they register with Base.metadata
    import src.models  # noqa: F401

    Base.metadata.create_all(engine)
    _migrate_missing_columns(engine)


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
