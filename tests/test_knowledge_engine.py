from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
from tempfile import TemporaryDirectory
from threading import Event
import time
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
import numpy as np
from pydantic import ValidationError

from app import journal_service as journal
from app import knowledge_service as engine
from app import knowledge_store as store
from app import knowledge_ai
from app.ai_service import AIConnectionError
from app.knowledge_models import KnowledgeExtraction, LearningTopic, MatchDecision
from app.knowledge_worker import KnowledgeWorker
from app.main import app


def extraction(name="Gradient Descent", definition="An iterative optimizer that minimizes loss.", aliases=None, relations=None):
    return KnowledgeExtraction.model_validate({
        "outcome": "extracted",
        "concepts": [{
            "name": name, "definition": definition, "aliases": aliases or [],
            "keywords": ["optimization"], "topic": "Machine Learning", "topic_aliases": ["机器学习"],
        }],
        "relations": relations or [],
    })


def fake_embeddings(texts):
    # Deliberately identical vectors: identity must still be confirmed by the model.
    return [[1.0, 0.0, 0.0] for text in texts]


class KnowledgeEngineTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory()
        self.database = Path(self.temporary.name) / "journal.sqlite3"
        self.database_patch = patch.object(journal, "DATABASE_PATH", self.database)
        self.database_patch.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.database_patch.stop()
        self.temporary.cleanup()

    def record(self, question="What is Gradient Descent?", answer="Gradient Descent minimizes loss."):
        self.assertEqual(journal.record_answer(question, answer, "chat"), "saved")
        return journal.list_entries()["entries"][0]["id"]

    def process(self, result, match=None):
        with patch.object(engine, "extract_knowledge", return_value=result), patch.object(
            engine, "generate_embeddings", side_effect=fake_embeddings
        ), patch.object(engine, "confirm_match", side_effect=match or (lambda kind, incoming, candidates: None)):
            return engine.process_pending_once()

    def test_journal_rows_automatically_queue_once_without_copying_chat(self):
        entry_id = self.record()
        self.assertEqual(store.get_job(entry_id)["status"], "pending")
        self.assertEqual(store.list_jobs()["total"], 1)
        journal.get_settings()
        self.assertEqual(store.list_jobs()["total"], 1)
        with journal._connection() as connection:
            columns = [row["name"] for row in connection.execute("PRAGMA table_info(knowledge_jobs)")]
            self.assertNotIn("answer", columns)
            self.assertNotIn("question", columns)

    def test_disabled_recording_and_failed_chat_create_no_jobs(self):
        journal.set_auto_record(False)
        with patch("app.main.generate_reply", return_value="An answer"):
            self.assertEqual(self.client.post("/api/chat", json={"message": "Question", "language": "en"}).status_code, 200)
        journal.set_auto_record(True)
        with patch("app.main.generate_reply", side_effect=AIConnectionError()):
            self.assertEqual(self.client.post("/api/chat", json={"message": "Question", "language": "en"}).status_code, 503)
        self.assertEqual(store.list_jobs()["total"], 0)

    def test_extract_topic_and_original_sources(self):
        entry_id = self.record()
        result = self.process(extraction())
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["concept_count"], 1)
        topics = self.client.get("/api/knowledge/topics").json()["items"]
        self.assertEqual(topics[0]["name"], "Machine Learning")
        concepts = self.client.get(f"/api/knowledge/topics/{topics[0]['id']}/concepts").json()["items"]
        concept_id = concepts[0]["id"]
        detail = self.client.get(f"/api/knowledge/concepts/{concept_id}").json()
        self.assertEqual(detail["definitions"][0]["entry_id"], entry_id)
        sources = self.client.get(f"/api/knowledge/concepts/{concept_id}/sources").json()["items"]
        self.assertEqual(sources[0]["question"], "What is Gradient Descent?")
        self.assertEqual(sources[0]["answer"], "Gradient Descent minimizes loss.")
        self.assertNotIn("embedding", detail)

    def test_semantic_similarity_alone_does_not_merge_concepts(self):
        self.record()
        self.process(extraction())
        self.record("What is Learning Rate?", "Learning Rate controls the optimizer step size.")
        self.process(extraction("Learning Rate", "A hyperparameter that scales the optimizer step."))
        topics, concepts = store.graph_snapshot()
        self.assertEqual(len(topics), 1)
        self.assertEqual(len(concepts), 2)
        self.assertEqual({concept["name"] for concept in concepts}, {"Gradient Descent", "Learning Rate"})

    def test_confirmed_bilingual_alias_merges_and_preserves_both_definitions(self):
        first_id = self.record()
        self.process(extraction(aliases=["梯度下降", "GD"]))
        self.record("解释梯度下降", "梯度下降沿着负梯度方向迭代更新参数。")
        self.process(
            extraction("梯度下降", "沿负梯度方向更新参数以减小损失。", ["Gradient Descent"]),
            match=lambda kind, incoming, candidates: candidates[0],
        )
        topics, concepts = store.graph_snapshot()
        self.assertEqual(len(concepts), 1)
        detail = store.concept_detail(concepts[0]["id"])
        self.assertEqual(detail["definition"], "An iterative optimizer that minimizes loss.")
        self.assertEqual(len(detail["definitions"]), 2)
        self.assertIn("梯度下降", detail["aliases"])
        self.assertEqual(len(store.concept_sources(concepts[0]["id"])), 2)
        journal.delete_entry(first_id)
        self.assertEqual(store.concept_detail(concepts[0]["id"])["definition"], "沿负梯度方向更新参数以减小损失。")

    def test_small_talk_creates_no_graph_or_embedding_request(self):
        self.record("Hello!", "Hello, how can I help?")
        empty = KnowledgeExtraction(concepts=[], relations=[], outcome="non_learning")
        with patch.object(engine, "extract_knowledge", return_value=empty), patch.object(engine, "generate_embeddings") as embed:
            result = engine.process_pending_once()
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["outcome"], "non_learning")
        self.assertEqual(store.list_topics(), [])
        embed.assert_not_called()

    def test_pydantic_rejects_malformed_extraction_and_candidate_indexes(self):
        base = extraction().model_dump()
        invalid = [
            {**base, "concepts": base["concepts"] * 4},
            {**base, "concepts": [{**base["concepts"][0], "definition": " "}]},
            {**base, "outcome": "non_learning"},
            {**base, "relations": [{"source": "a", "target": "b", "relation_type": "invented", "reason": "x", "evidence": "evidence text"}]},
        ]
        for value in invalid:
            with self.assertRaises(ValidationError):
                KnowledgeExtraction.model_validate(value)
        with self.assertRaises(ValidationError):
            MatchDecision.model_validate({"verdict": "same", "candidate_index": 2}, context={"candidate_count": 1})
        with self.assertRaises(ValidationError):
            MatchDecision(verdict="uncertain", candidate_index=0)

    def test_application_topic_classification_keeps_distinct_concepts(self):
        data = extraction("Backpropagation").model_dump()
        data["concepts"].append({**data["concepts"][0], "name": "Chain Rule", "topic": "Mathematics"})
        with patch.object(knowledge_ai, "_generate_structured_response", side_effect=[
            KnowledgeExtraction.model_validate(data), LearningTopic(name="Machine Learning", aliases=["机器学习"])
        ]) as structured:
            result = knowledge_ai.extract_knowledge("How does Backpropagation work?", "It uses the Chain Rule in neural networks.", [])
        self.assertEqual(structured.call_count, 2)
        self.assertEqual({concept.name for concept in result.concepts}, {"Backpropagation", "Chain Rule"})
        self.assertTrue(all(concept.topic == "Machine Learning" for concept in result.concepts))

    def test_failure_status_retry_and_no_partial_graph(self):
        entry_id = self.record()
        with patch.object(engine, "extract_knowledge", side_effect=AIConnectionError()):
            result = engine.process_pending_once()
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["error_code"], "ollama_unavailable")
        self.assertEqual(store.list_topics(), [])
        self.assertIsNone(store.claim_job())
        response = self.client.post(f"/api/knowledge/extractions/{entry_id}/retry?language=zh")
        self.assertEqual(response.status_code, 202)
        self.assertEqual(self.process(extraction())["status"], "completed")
        self.assertEqual(self.client.post(f"/api/knowledge/extractions/{entry_id}/retry").status_code, 409)
        self.assertEqual(len(store.graph_snapshot()[1]), 1)

    def test_sqlite_failure_rolls_back_topics_and_nodes(self):
        entry_id = self.record()
        with journal._connection() as connection:
            connection.executescript("CREATE TRIGGER test_abort BEFORE INSERT ON concepts BEGIN SELECT RAISE(ABORT,'test'); END;")
        self.assertEqual(self.process(extraction())["status"], "failed")
        self.assertEqual(store.graph_snapshot(), ([], []))
        self.assertEqual(store.get_job(entry_id)["concept_count"], 0)

    def test_automatic_retry_is_bounded_and_expired_leases_recover(self):
        entry_id = self.record()
        for attempt in range(1, 4):
            with patch.object(engine, "extract_knowledge", side_effect=AIConnectionError()):
                result = engine.process_pending_once()
            self.assertEqual(result["attempts"], attempt)
            with journal._connection() as connection:
                connection.execute("UPDATE knowledge_jobs SET next_attempt=0 WHERE entry_id=?", (entry_id,))
        self.assertIsNone(store.claim_job())
        self.assertEqual(store.get_job(entry_id)["status"], "failed")
        store.retry_job(entry_id)
        abandoned = store.claim_job()
        with journal._connection() as connection:
            connection.execute("UPDATE knowledge_jobs SET lease_until=0 WHERE entry_id=?", (entry_id,))
        recovered = store.claim_job()
        self.assertNotEqual(abandoned["token"], recovered["token"])
        self.assertFalse(store.save_graph(abandoned, [], [], [], "non_learning"))
        store.release_job(entry_id, recovered["token"])

    def test_concurrent_claims_only_one_active_job(self):
        self.record()
        self.record("What is Loss Function?", "Loss Function measures prediction error.")
        with ThreadPoolExecutor(max_workers=2) as pool:
            jobs = list(pool.map(lambda _: store.claim_job(), range(2)))
        active = [job for job in jobs if job is not None]
        self.assertEqual(len(active), 1)
        store.release_job(active[0]["entry"]["id"], active[0]["token"])

    def test_deletion_during_processing_cannot_recreate_source_or_graph(self):
        entry_id = self.record()
        job = store.claim_job()
        journal.delete_entry(entry_id)
        self.assertFalse(store.save_graph(job, [], [], [], "non_learning"))
        self.assertIsNone(store.get_job(entry_id))
        self.assertEqual(store.graph_snapshot(), ([], []))

    def test_grounded_relations_all_types_and_cascading_cleanup(self):
        quote = "Chain Rule is used in Backpropagation to compute derivatives."
        entry_id = self.record("How does Backpropagation use the Chain Rule?", quote)
        value = extraction("Chain Rule", "Differentiates a composition of functions.")
        data = value.model_dump()
        second = {**data["concepts"][0], "name": "Backpropagation", "definition": "Computes neural-network gradients."}
        data["concepts"].append(second)
        data["relations"] = [{"source": "Chain Rule", "target": "Backpropagation", "relation_type": kind,
                              "reason": "A test relation with explicit source evidence.", "evidence": quote}
                             for kind in ("prerequisite_of", "part_of", "related_to", "contrasts_with", "applied_in")]
        self.assertEqual(self.process(KnowledgeExtraction.model_validate(data))["relation_count"], 5)
        nodes = store.graph_snapshot()[1]
        relations = store.concept_relations(nodes[0]["id"])
        self.assertEqual(len(relations), 5)
        self.assertTrue(all(relation["sources"][0]["entry_id"] == entry_id for relation in relations))
        journal.clear_entries()
        self.assertEqual(store.graph_snapshot(), ([], []))
        self.assertEqual(store.list_jobs()["total"], 0)

    def test_unsupported_relationships_and_cycles_are_omitted(self):
        quote = "Chain Rule supports Backpropagation."
        self.record("Explain Chain Rule and Backpropagation", quote)
        data = extraction("Chain Rule").model_dump()
        data["concepts"].append({**data["concepts"][0], "name": "Backpropagation"})
        common = {"relation_type": "prerequisite_of", "reason": "An explicit dependency.", "evidence": quote}
        data["relations"] = [
            {**common, "source": "Chain Rule", "target": "Backpropagation"},
            {**common, "source": "Backpropagation", "target": "Chain Rule"},
            {**common, "source": "Chain Rule", "target": "Chain Rule"},
            {**common, "source": "Chain Rule", "target": "Unknown Concept"},
            {**common, "source": "Chain Rule", "target": "Backpropagation", "evidence": "A fabricated quote that was never taught."},
        ]
        self.assertEqual(self.process(KnowledgeExtraction.model_validate(data))["relation_count"], 1)

    def test_old_journal_schema_migrates_without_changing_records(self):
        with closing(sqlite3.connect(self.database)) as connection:
            with connection:
                connection.execute("CREATE TABLE journal_entries(id TEXT PRIMARY KEY,question TEXT,answer TEXT,created_at TEXT,module TEXT,starred INTEGER,sources_json TEXT)")
                connection.execute("INSERT INTO journal_entries VALUES(?,?,?,?,?,?,?)",
                                   ("old-id", "A question", "An answer", "2026-11-01T00:00:00+00:00", "explain", 1, "[]"))
        entries = journal.list_entries()["entries"]
        self.assertEqual(entries[0]["id"], "old-id")
        self.assertTrue(entries[0]["starred"])
        self.assertEqual(store.get_job("old-id")["status"], "pending")
        # Windows refuses this unlink if any connection or cursor still owns the file.
        self.database.unlink()
        self.assertFalse(self.database.exists())

    def test_evidence_quote_wrapping_is_cosmetic_but_pronouns_are_not_endpoints(self):
        quote = "Chain Rule supports Backpropagation."
        self.record("Explain Chain Rule and Backpropagation", quote + " It computes derivatives.")
        data = extraction("Chain Rule").model_dump()
        data["concepts"].append({**data["concepts"][0], "name": "Backpropagation"})
        data["relations"] = [
            {"source": "Chain Rule", "target": "Backpropagation", "relation_type": "applied_in",
             "reason": "An explicitly named application.", "evidence": '"' + quote + '"'},
            {"source": "Chain Rule", "target": "Backpropagation", "relation_type": "related_to",
             "reason": "An unresolvable pronoun fragment.", "evidence": "It computes derivatives."},
        ]
        result = self.process(KnowledgeExtraction.model_validate(data))
        self.assertEqual(result["relation_count"], 1)
        relation = store.concept_relations(store.graph_snapshot()[1][0]["id"])[0]
        self.assertEqual(relation["sources"][0]["evidence"], quote)

    def test_application_lifespan_starts_stops_worker_and_marks_foreground(self):
        with patch("app.main.KnowledgeWorker") as worker_type, patch(
            "app.main.generate_reply", return_value="Gradient Descent minimizes loss."
        ):
            worker = worker_type.return_value
            with TestClient(app) as client:
                worker.start.assert_called_once()
                response = client.post("/api/chat", json={"message": "What is Gradient Descent?", "language": "en"})
                self.assertEqual(response.status_code, 200)
                worker.request_started.assert_called_once()
                worker.request_finished.assert_called_once()
            worker.stop.assert_called_once()
        self.assertIsNone(app.state.knowledge_worker)

    def test_wal_journal_migration_releases_database_and_sidecars(self):
        with closing(sqlite3.connect(self.database)) as connection:
            with closing(connection.execute("PRAGMA journal_mode=WAL")) as cursor:
                self.assertEqual(cursor.fetchone()[0], "wal")
            with connection:
                connection.execute("CREATE TABLE journal_entries(id TEXT PRIMARY KEY,question TEXT,answer TEXT,created_at TEXT,module TEXT,starred INTEGER,sources_json TEXT)")
                connection.execute("INSERT INTO journal_entries VALUES(?,?,?,?,?,?,?)",
                                   ("wal-id", "Question", "Answer", "2026-11-01T00:00:00+00:00", "chat", 0, "[]"))
        self.assertEqual(journal.list_entries()["entries"][0]["id"], "wal-id")
        self.assertEqual(store.get_job("wal-id")["status"], "pending")
        self.assertFalse(Path(str(self.database) + "-wal").exists())
        self.assertFalse(Path(str(self.database) + "-shm").exists())
        self.database.unlink()
        self.assertFalse(self.database.exists())

    def test_graph_persists_in_a_new_process(self):
        self.record()
        self.process(extraction())
        code = (
            "from pathlib import Path; from app import journal_service as j; from app import knowledge_store as s; "
            f"j.DATABASE_PATH=Path({str(self.database)!r}); "
            "assert len(s.list_topics())==1; assert s.list_jobs()['items'][0]['status']=='completed'"
        )
        subprocess.run([sys.executable, "-c", code], check=True)

    def test_status_errors_are_bilingual_and_no_worker_token_is_exposed(self):
        entry_id = self.record()
        claimed = store.claim_job()
        job = self.client.get(f"/api/knowledge/extractions/{entry_id}?language=zh").json()
        self.assertIn("知识提取", job["message"])
        self.assertTrue(job["in_progress"])
        self.assertNotIn("lease_token", job)
        self.assertNotIn("lease_until", job)
        for path in ("/topics/missing/concepts", "/concepts/missing", "/concepts/missing/sources", "/concepts/missing/relations", "/extractions/missing"):
            result = self.client.get("/api/knowledge" + path + "?language=zh")
            self.assertEqual(result.status_code, 404)
            self.assertIn("未找到", result.json()["detail"]["message"])
        self.assertEqual(self.client.get("/api/knowledge/extractions?status=invalid").status_code, 422)
        store.release_job(entry_id, claimed["token"])

    def test_embedding_validation_fails_without_saving_nodes(self):
        entry_id = self.record()
        with patch.object(engine, "extract_knowledge", return_value=extraction()), patch.object(
            engine, "generate_embeddings", return_value=[[float("nan"), 0], [1, 0]]
        ):
            self.assertEqual(engine.process_pending_once()["status"], "failed")
        self.assertEqual(store.graph_snapshot(), ([], []))
        self.assertEqual(store.get_job(entry_id)["error_code"], "knowledge_generation_error")

    def test_source_sql_and_html_are_data(self):
        name = "Learning '); DROP TABLE concepts; --"
        self.record("What is " + name + "?", name + " is a test concept. <script>text</script>")
        self.assertEqual(self.process(extraction(name))["status"], "completed")
        self.assertEqual(store.graph_snapshot()[1][0]["name"], name)
        self.assertEqual(store.list_jobs()["total"], 1)

    def test_worker_prioritizes_foreground_and_does_not_block_chat(self):
        entered, release = Event(), Event()
        worker = KnowledgeWorker(idle_seconds=0)
        def extract(*args):
            entered.set()
            if not release.wait(5):
                raise RuntimeError("Test worker was not released.")
            return extraction()
        with patch.object(engine, "extract_knowledge", side_effect=extract), patch.object(
            engine, "generate_embeddings", side_effect=fake_embeddings
        ), patch.object(engine, "confirm_match", return_value=None):
            worker.request_started()
            worker.start()
            try:
                with patch("app.main.generate_reply", return_value="Gradient Descent minimizes loss."):
                    response = self.client.post("/api/chat", json={"message": "What is Gradient Descent?", "language": "en"})
                    self.assertEqual(response.status_code, 200)
                    self.assertFalse(entered.is_set())
                    worker.request_finished()
                    self.assertTrue(entered.wait(3))
                    # A blocked background extraction must not delay a normal reply.
                    response = self.client.post("/api/chat", json={"message": "What is Gradient Descent?", "language": "en"})
                    self.assertEqual(response.status_code, 200)
                    self.assertFalse(release.is_set())
            finally:
                release.set()
                worker.stop()


if __name__ == "__main__":
    unittest.main()
