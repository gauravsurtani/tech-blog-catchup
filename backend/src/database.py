"""SQLAlchemy engine, session factory, and database initialization."""

from pathlib import Path

from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase

from src.config import get_config


class Base(DeclarativeBase):
    pass


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


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

    _engine = create_engine(
        f"sqlite:///{db_file}",
        echo=False,
        connect_args={"check_same_thread": False},
    )
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
    """Create all tables. Safe to call repeatedly (CREATE IF NOT EXISTS)."""
    if engine is None:
        engine = get_engine()

    # Import models so they register with Base.metadata
    import src.models  # noqa: F401

    Base.metadata.create_all(engine)


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
