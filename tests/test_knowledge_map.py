from contextlib import closing
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app import journal_service as journal
from app import knowledge_store as store
from app.main import app


class KnowledgeMapTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.database = Path(self.temporary.name) / "map.sqlite3"
        self.database_patch = patch.object(journal, "DATABASE_PATH", self.database)
        self.database_patch.start()
        self.addCleanup(self.database_patch.stop)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        with journal._connection() as connection:
            for topic in ("ml", "other", "empty"):
                connection.execute("INSERT INTO topics VALUES(?,?,?,?,?,?,?,?)",
                                   (topic, topic, topic, "[]", b"", "test", "2026-11-14", "2026-11-14"))
            for index, name in enumerate(("Alpha", "Beta", "Gamma", "Delta")):
                connection.execute(
                    "INSERT INTO concepts VALUES(?,?,?,?,?,?,?,?,?,?)",
                    (str(index), "ml" if index < 3 else "other", name, "A definition", "[]", "[]", b"", "test", "2026-11-14", "2026-11-14"),
                )
            for index, kind in enumerate(("prerequisite_of", "part_of", "related_to", "contrasts_with", "applied_in")):
                connection.execute(
                    "INSERT INTO concept_relations VALUES(?,?,?,?,?,?)",
                    (f"r{index}", "0", "1", kind, "2026-11-14", "2026-11-14"),
                )
            connection.execute("INSERT INTO concept_relations VALUES(?,?,?,?,?,?)",
                               ("external", "0", "3", "related_to", "2026-11-14", "2026-11-14"))

    def test_topic_edges_preserve_all_five_types_and_actual_direction(self):
        response = self.client.get("/api/knowledge/topics/ml/relations")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["cache-control"], "no-store")
        edges = response.json()["items"]
        self.assertEqual(len(edges), 5)
        self.assertEqual({edge["relation_type"] for edge in edges},
                         {"prerequisite_of", "part_of", "related_to", "contrasts_with", "applied_in"})
        self.assertTrue(all(edge["source_id"] == "0" and edge["target_id"] == "1" for edge in edges))
        self.assertTrue(all(set(edge) == {"id", "source_id", "target_id", "relation_type"} for edge in edges))

    def test_node_limit_matches_existing_concept_order_and_excludes_external_nodes(self):
        nodes = self.client.get("/api/knowledge/topics/ml/concepts?limit=1").json()["items"]
        self.assertEqual(nodes[0]["name"], "Alpha")
        self.assertEqual(self.client.get("/api/knowledge/topics/ml/relations?limit=1").json(), {"items": [], "truncated": False})
        self.assertEqual(len(self.client.get("/api/knowledge/topics/ml/relations?limit=2").json()["items"]), 5)

    def test_empty_unknown_invalid_limits_and_parameterized_lookup(self):
        self.assertEqual(self.client.get("/api/knowledge/topics/empty/relations").json(), {"items": [], "truncated": False})
        for topic in ("missing", "ml' OR '1'='1"):
            self.assertEqual(store.topic_relations(topic), None)
        self.assertEqual(self.client.get("/api/knowledge/topics/missing/relations?language=zh").status_code, 404)
        for limit in (0, -1, 501, "nope"):
            self.assertEqual(self.client.get(f"/api/knowledge/topics/ml/relations?limit={limit}").status_code, 422)

    def test_storage_failure_is_safe_and_localized(self):
        with patch.object(store, "topic_relations", side_effect=journal.JournalStorageError("private path")):
            response = self.client.get("/api/knowledge/topics/ml/relations?language=zh")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private path", response.text)
        self.assertIn("暂时无法", response.json()["detail"]["message"])

    def test_dense_topic_is_bounded_without_changing_saved_edges(self):
        with journal._connection() as connection:
            for index in range(25):
                connection.execute("INSERT INTO concepts VALUES(?,?,?,?,?,?,?,?,?,?)",
                                   (f"n{index}", "ml", f"Node {index}", "Definition", "[]", "[]", b"", "test", "now", "now"))
            connection.executemany("INSERT INTO concept_relations VALUES(?,?,?,?,?,?)", [
                (f"dense-{source}-{target}-{kind}", f"n{source}", f"n{target}", kind, "now", "now")
                for source in range(25) for target in range(25) if source != target
                for kind in ("related_to", "part_of", "applied_in", "contrasts_with")
            ])
        result = self.client.get("/api/knowledge/topics/ml/relations").json()
        self.assertEqual(len(result["items"]), 2000)
        self.assertTrue(result["truncated"])
        with journal._connection() as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM concept_relations").fetchone()[0], 2406)

    def test_map_reads_preserve_graph_and_require_no_ai(self):
        with closing(sqlite3.connect(self.database)) as connection:
            before = list(connection.iterdump())
        with patch("app.knowledge_ai.extract_knowledge", side_effect=AssertionError("No AI in map reads")):
            self.assertEqual(self.client.get("/api/knowledge/topics").status_code, 200)
            self.assertEqual(self.client.get("/api/knowledge/topics/ml/concepts").status_code, 200)
            self.assertEqual(self.client.get("/api/knowledge/topics/ml/relations").status_code, 200)
            detail = self.client.get("/api/knowledge/concepts/0").json()
            self.assertEqual(detail["topic_name"], "ml")
            self.assertEqual(len(self.client.get("/api/knowledge/concepts/0/relations").json()["items"]), 6)
        with closing(sqlite3.connect(self.database)) as connection:
            self.assertEqual(list(connection.iterdump()), before)


if __name__ == "__main__":
    unittest.main()
