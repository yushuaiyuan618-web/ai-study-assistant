"""Local, single-user learning records. No AI or document state lives here."""

from contextlib import contextmanager
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import sqlite3
from uuid import uuid4


logger = logging.getLogger(__name__)
DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "learning_journal.sqlite3"


class JournalStorageError(Exception):
    pass


@contextmanager
def _connection():
    connection = None
    try:
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(DATABASE_PATH, timeout=5)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TEXT NOT NULL,
                module TEXT NOT NULL CHECK (module IN ('chat', 'explain', 'rag')),
                starred INTEGER NOT NULL DEFAULT 0 CHECK (starred IN (0, 1)),
                sources_json TEXT NOT NULL DEFAULT '[]'
            );
            CREATE INDEX IF NOT EXISTS journal_time ON journal_entries(created_at);
            CREATE TABLE IF NOT EXISTS journal_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                auto_record INTEGER NOT NULL CHECK (auto_record IN (0, 1))
            );
            INSERT OR IGNORE INTO journal_settings (id, auto_record) VALUES (1, 1);
        """)
        from app.knowledge_store import initialize_schema
        initialize_schema(connection)
        connection.commit()
        with connection:
            yield connection
    except (sqlite3.Error, OSError) as error:
        logger.warning("Learning Journal storage failed: %s", type(error).__name__)
        raise JournalStorageError() from error
    finally:
        if connection is not None:
            connection.close()


def get_settings():
    with _connection() as connection:
        row = connection.execute(
            "SELECT auto_record FROM journal_settings WHERE id = 1"
        ).fetchone()
    return {"auto_record": bool(row["auto_record"])}


def set_auto_record(enabled):
    with _connection() as connection:
        connection.execute(
            "UPDATE journal_settings SET auto_record = ? WHERE id = 1", (int(enabled),)
        )
    return {"auto_record": enabled}


def record_answer(question, answer, module, sources=None):
    """Called once after a successful answer; storage failure must not lose the answer."""
    if not question.strip() or not answer.strip():
        return "skipped"
    try:
        with _connection() as connection:
            enabled = connection.execute(
                "SELECT auto_record FROM journal_settings WHERE id = 1"
            ).fetchone()["auto_record"]
            if not enabled:
                return "disabled"
            connection.execute(
                """INSERT INTO journal_entries
                (id, question, answer, created_at, module, sources_json)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    str(uuid4()), question, answer,
                    datetime.now(timezone.utc).isoformat(), module,
                    json.dumps(sources or [], ensure_ascii=False),
                ),
            )
        return "saved"
    except JournalStorageError:
        return "error"


def _filters(kind, start, end):
    clauses, values = [], []
    if kind in ("starred", "normal"):
        clauses.append("starred = ?")
        values.append(1 if kind == "starred" else 0)
    if start is not None:
        clauses.append("created_at >= ?")
        values.append(start.astimezone(timezone.utc).isoformat())
    if end is not None:
        clauses.append("created_at < ?")
        values.append(end.astimezone(timezone.utc).isoformat())
    return (" WHERE " + " AND ".join(clauses) if clauses else ""), values


def _entry(row):
    entry = dict(row)
    entry["starred"] = bool(entry["starred"])
    entry["sources"] = json.loads(entry.pop("sources_json"))
    return entry


def list_entries(kind="all", start=None, end=None, order="newest", limit=50, offset=0):
    where, values = _filters(kind, start, end)
    # Only these two constants become SQL syntax; all user data uses placeholders.
    direction = "ASC" if order == "oldest" else "DESC"
    query = f"SELECT * FROM journal_entries{where} ORDER BY created_at {direction}, id {direction}"
    with _connection() as connection:
        counts = connection.execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(starred), 0) AS starred FROM journal_entries"
        ).fetchone()
        filtered_count = connection.execute(
            "SELECT COUNT(*) FROM journal_entries" + where, values
        ).fetchone()[0]
        if limit is not None:
            query += " LIMIT ? OFFSET ?"
            values = [*values, limit, offset]
        entries = [_entry(row) for row in connection.execute(query, values)]
    return {
        "entries": entries,
        "filtered_count": filtered_count,
        "stats": {
            "total": counts["total"], "starred": counts["starred"],
            "normal": counts["total"] - counts["starred"],
        },
    }


def set_starred(entry_id, starred):
    with _connection() as connection:
        result = connection.execute(
            "UPDATE journal_entries SET starred = ? WHERE id = ?", (int(starred), entry_id)
        )
    return result.rowcount == 1


def delete_entry(entry_id):
    with _connection() as connection:
        result = connection.execute("DELETE FROM journal_entries WHERE id = ?", (entry_id,))
    return result.rowcount == 1


def clear_entries():
    with _connection() as connection:
        connection.execute("DELETE FROM journal_entries")
