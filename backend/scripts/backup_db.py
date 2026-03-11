"""Create a timestamped SQLite backup using the safe .backup() API.

Usage:
    python scripts/backup_db.py          # from backend/ directory

Resolves DB path from DATABASE_URL env var (sqlite:///...) or defaults
to data/techblog.db.  Backups land in data/backups/ and only the last
5 are kept.
"""

import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

BACKUP_DIR = Path("data/backups")
MAX_BACKUPS = 5


def resolve_db_path() -> Path:
    """Return the SQLite database file path."""
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("sqlite:///"):
        return Path(db_url.removeprefix("sqlite:///"))
    return Path("data/techblog.db")


def prune_old_backups(backup_dir: Path) -> None:
    """Keep only the most recent MAX_BACKUPS files."""
    backups = sorted(backup_dir.glob("techblog_*.db"), key=lambda p: p.stat().st_mtime)
    while len(backups) > MAX_BACKUPS:
        oldest = backups.pop(0)
        oldest.unlink()
        print(f"  Pruned old backup: {oldest.name}")


def backup() -> None:
    db_path = resolve_db_path()
    if not db_path.exists():
        print(f"ERROR: database not found at {db_path.resolve()}", file=sys.stderr)
        sys.exit(1)

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest_path = BACKUP_DIR / f"techblog_{timestamp}.db"

    print(f"Source:  {db_path.resolve()}")
    print(f"Backup:  {dest_path.resolve()}")

    src_conn = sqlite3.connect(str(db_path))
    dst_conn = sqlite3.connect(str(dest_path))
    try:
        src_conn.backup(dst_conn)
        size_mb = dest_path.stat().st_size / (1024 * 1024)
        print(f"Done.    {size_mb:.2f} MB written.")
    finally:
        dst_conn.close()
        src_conn.close()

    prune_old_backups(BACKUP_DIR)
    remaining = list(BACKUP_DIR.glob("techblog_*.db"))
    print(f"Backups retained: {len(remaining)}/{MAX_BACKUPS}")


if __name__ == "__main__":
    backup()
