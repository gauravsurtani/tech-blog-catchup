from sqlalchemy import create_engine, text, inspect
from src.database import init_db


def test_legacy_migration_repeatable(tmp_path):
    e = create_engine(f"sqlite:///{tmp_path}/legacy.db")
    with e.begin() as c:
        c.execute(
            text(
                "CREATE TABLE posts (id INTEGER PRIMARY KEY, url VARCHAR UNIQUE NOT NULL, source_key VARCHAR NOT NULL, source_name VARCHAR NOT NULL, title VARCHAR NOT NULL, crawled_at DATETIME NOT NULL, audio_status VARCHAR NOT NULL, is_user_submitted BOOLEAN NOT NULL DEFAULT 0)"
            )
        )
        c.execute(
            text(
                "CREATE TABLE jobs (id INTEGER PRIMARY KEY, job_type VARCHAR NOT NULL, status VARCHAR NOT NULL, created_at DATETIME NOT NULL)"
            )
        )
        c.execute(
            text(
                "INSERT INTO posts VALUES(42,'https://example.test/post','test','Test','Kept','2026-01-01','ready',0)"
            )
        )
        c.execute(
            text(
                "INSERT INTO posts VALUES(43,'user://private','user','User','Private','2026-01-01','pending',1)"
            )
        )
    init_db(e)
    init_db(e)
    with e.connect() as c:
        assert (
            c.execute(text("SELECT visibility FROM posts WHERE id=42")).scalar()
            == "public"
        )
        assert (
            c.execute(text("SELECT visibility FROM posts WHERE id=43")).scalar()
            == "private"
        )
        assert c.execute(text("SELECT count(*) FROM alembic_version")).scalar() == 1
    indexes = inspect(e).get_indexes("jobs")
    constraints = inspect(e).get_unique_constraints("jobs")
    assert any(
        set(i["column_names"]) == {"actor_key", "idempotency_key"}
        for i in indexes + constraints
    )

    assert {fk["referred_table"] for fk in inspect(e).get_foreign_keys("jobs")} == {
        "users",
        "posts",
    }
    with e.connect() as c:
        assert c.execute(text("PRAGMA foreign_key_check")).fetchall() == []
