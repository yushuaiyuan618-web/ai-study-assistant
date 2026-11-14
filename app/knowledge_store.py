"""Knowledge graph and durable jobs in the existing Learning Journal database."""

from datetime import datetime, timezone
import json
import time
from uuid import uuid4

from app import journal_service as journal


MAX_ATTEMPTS = 3
LEASE_SECONDS = 600


def initialize_schema(connection):
    connection.executescript("""
        CREATE TABLE IF NOT EXISTS topics (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE,
            aliases_json TEXT NOT NULL, embedding BLOB NOT NULL, embedding_model TEXT NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS concepts (
            id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id),
            name TEXT NOT NULL, definition TEXT NOT NULL,
            aliases_json TEXT NOT NULL, keywords_json TEXT NOT NULL,
            embedding BLOB NOT NULL, embedding_model TEXT NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS concepts_topic ON concepts(topic_id);
        CREATE TABLE IF NOT EXISTS concept_sources (
            concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
            extracted_name TEXT NOT NULL, definition TEXT NOT NULL,
            PRIMARY KEY (concept_id, entry_id, definition)
        );
        CREATE INDEX IF NOT EXISTS concept_source_entry ON concept_sources(entry_id);
        CREATE TABLE IF NOT EXISTS concept_relations (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            target_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
            relation_type TEXT NOT NULL CHECK (relation_type IN
                ('prerequisite_of', 'part_of', 'related_to', 'contrasts_with', 'applied_in')),
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
            CHECK (source_id != target_id), UNIQUE(source_id, target_id, relation_type)
        );
        CREATE INDEX IF NOT EXISTS relations_target ON concept_relations(target_id);
        CREATE TABLE IF NOT EXISTS relation_sources (
            relation_id TEXT NOT NULL REFERENCES concept_relations(id) ON DELETE CASCADE,
            entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
            evidence TEXT NOT NULL, reason TEXT NOT NULL,
            PRIMARY KEY (relation_id, entry_id, evidence)
        );
        CREATE INDEX IF NOT EXISTS relation_source_entry ON relation_sources(entry_id);
        CREATE TABLE IF NOT EXISTS knowledge_jobs (
            entry_id TEXT PRIMARY KEY REFERENCES journal_entries(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
            attempts INTEGER NOT NULL DEFAULT 0,
            lease_token TEXT, lease_until REAL, next_attempt REAL NOT NULL DEFAULT 0,
            error_code TEXT, outcome TEXT, concept_count INTEGER NOT NULL DEFAULT 0,
            relation_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE INDEX IF NOT EXISTS knowledge_job_status ON knowledge_jobs(status, next_attempt);
        CREATE TABLE IF NOT EXISTS knowledge_schema (version INTEGER PRIMARY KEY);
        CREATE TRIGGER IF NOT EXISTS journal_queue_knowledge AFTER INSERT ON journal_entries
        BEGIN
            INSERT OR IGNORE INTO knowledge_jobs(entry_id) VALUES (NEW.id);
        END;
        CREATE TRIGGER IF NOT EXISTS journal_remove_knowledge AFTER DELETE ON journal_entries
        BEGIN
            DELETE FROM knowledge_jobs WHERE entry_id = OLD.id;
            DELETE FROM concept_sources WHERE entry_id = OLD.id;
            DELETE FROM relation_sources WHERE entry_id = OLD.id;
            DELETE FROM concept_relations WHERE NOT EXISTS
                (SELECT 1 FROM relation_sources WHERE relation_id = concept_relations.id);
            DELETE FROM concepts WHERE NOT EXISTS
                (SELECT 1 FROM concept_sources WHERE concept_id = concepts.id);
            UPDATE concepts SET definition = (
                SELECT definition FROM concept_sources WHERE concept_id = concepts.id
                ORDER BY rowid LIMIT 1
            );
            DELETE FROM topics WHERE NOT EXISTS
                (SELECT 1 FROM concepts WHERE topic_id = topics.id);
        END;
    """)
    if connection.execute("SELECT version FROM knowledge_schema WHERE version = 1").fetchone() is None:
        # Queue old journal rows once; do not copy their question or answer.
        connection.execute("INSERT OR IGNORE INTO knowledge_jobs(entry_id) SELECT id FROM journal_entries")
        connection.execute("INSERT OR IGNORE INTO knowledge_schema(version) VALUES (1)")


def _now():
    return datetime.now(timezone.utc).isoformat()


def claim_job():
    now = time.time()
    with journal._connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        # One active extraction across workers keeps candidate snapshots consistent.
        active = connection.execute(
            "SELECT 1 FROM knowledge_jobs WHERE lease_until > ? LIMIT 1", (now,)
        ).fetchone()
        if active:
            return None
        row = connection.execute(
            """SELECT j.* FROM knowledge_jobs j JOIN journal_entries e ON e.id=j.entry_id
            WHERE j.status != 'completed' AND j.attempts < ? AND j.next_attempt <= ?
            ORDER BY e.created_at,j.entry_id LIMIT 1""",
            (MAX_ATTEMPTS, now),
        ).fetchone()
        if row is None:
            # A crash on the last attempt must not leave an unclaimable pending job.
            connection.execute(
                """UPDATE knowledge_jobs SET status='failed', error_code='interrupted',
                lease_token=NULL, lease_until=NULL WHERE status='pending' AND attempts >= ?
                AND COALESCE(lease_until,0) <= ?""", (MAX_ATTEMPTS, now),
            )
            return None
        token = str(uuid4())
        connection.execute(
            """UPDATE knowledge_jobs SET status='pending', attempts=attempts+1,
            lease_token=?, lease_until=?, error_code=NULL, updated_at=? WHERE entry_id=?""",
            (token, now + LEASE_SECONDS, _now(), row["entry_id"]),
        )
        entry = connection.execute(
            "SELECT * FROM journal_entries WHERE id=?", (row["entry_id"],)
        ).fetchone()
    return {"entry": dict(entry), "token": token, "attempts": row["attempts"] + 1}


def renew_job(entry_id, token):
    with journal._connection() as connection:
        result = connection.execute(
            "UPDATE knowledge_jobs SET lease_until=? WHERE entry_id=? AND lease_token=? AND status='pending'",
            (time.time() + LEASE_SECONDS, entry_id, token),
        )
    return result.rowcount == 1


def release_job(entry_id, token):
    with journal._connection() as connection:
        connection.execute(
            """UPDATE knowledge_jobs SET lease_token=NULL, lease_until=NULL,
            attempts=MAX(attempts-1,0) WHERE entry_id=? AND lease_token=? AND status='pending'""",
            (entry_id, token),
        )


def fail_job(job, code):
    with journal._connection() as connection:
        connection.execute(
            """UPDATE knowledge_jobs SET status='failed', lease_token=NULL, lease_until=NULL,
            error_code=?, next_attempt=?, updated_at=? WHERE entry_id=? AND lease_token=?""",
            (code, time.time() + 30 * job["attempts"], _now(), job["entry"]["id"], job["token"]),
        )


def retry_job(entry_id):
    with journal._connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute("SELECT status FROM knowledge_jobs WHERE entry_id=?", (entry_id,)).fetchone()
        if row is None:
            return "not_found"
        if row["status"] == "completed":
            return "completed"
        if row["status"] == "failed":
            connection.execute(
                """UPDATE knowledge_jobs SET status='pending', attempts=0, next_attempt=0,
                error_code=NULL, lease_token=NULL, lease_until=NULL, updated_at=? WHERE entry_id=?""",
                (_now(), entry_id),
            )
    return "pending"


def _graph_row(row):
    item = dict(row)
    item["aliases"] = json.loads(item.pop("aliases_json"))
    if "keywords_json" in item:
        item["keywords"] = json.loads(item.pop("keywords_json"))
    return item


def graph_snapshot():
    with journal._connection() as connection:
        topics = [_graph_row(row) for row in connection.execute("SELECT * FROM topics ORDER BY created_at, id")]
        concepts = [_graph_row(row) for row in connection.execute(
            "SELECT c.*, t.name AS topic_name FROM concepts c JOIN topics t ON t.id=c.topic_id ORDER BY c.created_at, c.id"
        )]
    return topics, concepts


def _would_cycle(connection, source, target, relation_type):
    if relation_type not in ("prerequisite_of", "part_of"):
        return False
    return connection.execute(
        """WITH RECURSIVE reachable(id) AS (
            SELECT target_id FROM concept_relations WHERE source_id=? AND relation_type=?
            UNION SELECT r.target_id FROM concept_relations r JOIN reachable ON r.source_id=reachable.id
            WHERE r.relation_type=?
        ) SELECT 1 FROM reachable WHERE id=? LIMIT 1""",
        (target, relation_type, relation_type, source),
    ).fetchone() is not None


def save_graph(job, topics, concepts, relations, outcome):
    entry_id, token = job["entry"]["id"], job["token"]
    now = _now()
    with journal._connection() as connection:
        connection.execute("BEGIN IMMEDIATE")
        if connection.execute(
            "SELECT 1 FROM knowledge_jobs WHERE entry_id=? AND lease_token=? AND status='pending'",
            (entry_id, token),
        ).fetchone() is None:
            return False
        for topic in topics:
            connection.execute(
                """INSERT INTO topics VALUES (?,?,?,?,?,?,?,?)
                ON CONFLICT(id) DO UPDATE SET aliases_json=excluded.aliases_json, updated_at=excluded.updated_at""",
                (topic["id"], topic["name"], topic["name_key"], json.dumps(topic["aliases"], ensure_ascii=False),
                 topic["embedding"], topic["embedding_model"], now, now),
            )
        for concept in concepts:
            connection.execute(
                """INSERT INTO concepts VALUES (?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(id) DO UPDATE SET aliases_json=excluded.aliases_json,
                keywords_json=excluded.keywords_json, updated_at=excluded.updated_at""",
                (concept["id"], concept["topic_id"], concept["name"], concept["definition"],
                 json.dumps(concept["aliases"], ensure_ascii=False), json.dumps(concept["keywords"], ensure_ascii=False),
                 concept["embedding"], concept["embedding_model"], now, now),
            )
            extracted = concept["extracted"]
            connection.execute(
                "INSERT OR IGNORE INTO concept_sources VALUES (?,?,?,?)",
                (concept["id"], entry_id, extracted.name, extracted.definition),
            )
        relation_count = 0
        for relation in relations:
            source, target, kind = relation["source_id"], relation["target_id"], relation["relation_type"]
            if _would_cycle(connection, source, target, kind):
                continue
            connection.execute(
                """INSERT INTO concept_relations VALUES (?,?,?,?,?,?)
                ON CONFLICT(source_id,target_id,relation_type) DO UPDATE SET updated_at=excluded.updated_at""",
                (str(uuid4()), source, target, kind, now, now),
            )
            relation_id = connection.execute(
                "SELECT id FROM concept_relations WHERE source_id=? AND target_id=? AND relation_type=?",
                (source, target, kind),
            ).fetchone()["id"]
            connection.execute(
                "INSERT OR IGNORE INTO relation_sources VALUES (?,?,?,?)",
                (relation_id, entry_id, relation["evidence"], relation["reason"]),
            )
            relation_count += 1
        connection.execute(
            """UPDATE knowledge_jobs SET status='completed', lease_token=NULL, lease_until=NULL,
            error_code=NULL, outcome=?, concept_count=?, relation_count=?, updated_at=? WHERE entry_id=?""",
            (outcome, len({concept["id"] for concept in concepts}), relation_count, now, entry_id),
        )
    return True


def list_topics():
    with journal._connection() as connection:
        rows = connection.execute(
            """SELECT t.id,t.name,t.aliases_json,t.created_at,t.updated_at,COUNT(c.id) AS concept_count
            FROM topics t LEFT JOIN concepts c ON c.topic_id=t.id GROUP BY t.id ORDER BY t.name,t.id"""
        )
        return [_graph_row(row) for row in rows]


def list_concepts(topic_id, limit=100, offset=0):
    with journal._connection() as connection:
        if not connection.execute("SELECT 1 FROM topics WHERE id=?", (topic_id,)).fetchone():
            return None
        total = connection.execute("SELECT COUNT(*) FROM concepts WHERE topic_id=?", (topic_id,)).fetchone()[0]
        rows = connection.execute(
            """SELECT id,topic_id,name,definition,aliases_json,keywords_json,created_at,updated_at
            FROM concepts WHERE topic_id=? ORDER BY name,id LIMIT ? OFFSET ?""", (topic_id, limit, offset),
        )
        return {"items": [_graph_row(row) for row in rows], "total": total}


def concept_detail(concept_id):
    with journal._connection() as connection:
        row = connection.execute(
            """SELECT c.id,c.topic_id,c.name,c.definition,c.aliases_json,c.keywords_json,
            c.created_at,c.updated_at,t.name AS topic_name FROM concepts c JOIN topics t
            ON t.id=c.topic_id WHERE c.id=?""", (concept_id,),
        ).fetchone()
        if row is None:
            return None
        item = _graph_row(row)
        item["definitions"] = [dict(row) for row in connection.execute(
            "SELECT entry_id,extracted_name,definition FROM concept_sources WHERE concept_id=? ORDER BY rowid",
            (concept_id,),
        )]
    return item


def concept_sources(concept_id, limit=50, offset=0):
    with journal._connection() as connection:
        rows = connection.execute(
            """SELECT * FROM journal_entries WHERE id IN
            (SELECT entry_id FROM concept_sources WHERE concept_id=?)
            ORDER BY created_at DESC,id LIMIT ? OFFSET ?""", (concept_id, limit, offset),
        )
        return [journal._entry(row) for row in rows]


def concept_relations(concept_id):
    with journal._connection() as connection:
        rows = connection.execute(
            """SELECT r.*,s.name AS source_name,t.name AS target_name FROM concept_relations r
            JOIN concepts s ON s.id=r.source_id JOIN concepts t ON t.id=r.target_id
            WHERE r.source_id=? OR r.target_id=? ORDER BY r.created_at,r.id""", (concept_id, concept_id),
        ).fetchall()
        items = []
        for row in rows:
            item = dict(row)
            item["sources"] = [dict(source) for source in connection.execute(
                "SELECT entry_id,evidence,reason FROM relation_sources WHERE relation_id=? ORDER BY rowid",
                (row["id"],),
            )]
            items.append(item)
    return items


def _public_job(row):
    item = dict(row)
    lease_until = item.pop("lease_until")
    item["in_progress"] = item["status"] == "pending" and (lease_until or 0) > time.time()
    item.pop("lease_token")
    return item


def get_job(entry_id):
    with journal._connection() as connection:
        row = connection.execute("SELECT * FROM knowledge_jobs WHERE entry_id=?", (entry_id,)).fetchone()
    return _public_job(row) if row else None


def list_jobs(status=None, limit=50, offset=0):
    where, values = (" WHERE status=?", [status]) if status else ("", [])
    with journal._connection() as connection:
        total = connection.execute("SELECT COUNT(*) FROM knowledge_jobs" + where, values).fetchone()[0]
        rows = connection.execute(
            "SELECT * FROM knowledge_jobs" + where + " ORDER BY created_at DESC,entry_id LIMIT ? OFFSET ?",
            [*values, limit, offset],
        )
        items = [_public_job(row) for row in rows]
    return {"items": items, "total": total}
