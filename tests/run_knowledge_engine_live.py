r"""Explicit opt-in real Ollama/Qwen/BGE checks; never part of the mock unit suite.

Run: .venv\Scripts\python.exe tests/run_knowledge_engine_live.py
All questions, answers, embeddings and identity decisions use real local models.
Only the database path is isolated from the user's journal.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import httpx
from fastapi.testclient import TestClient

from app import journal_service as journal
from app import knowledge_service as engine
from app import knowledge_store as store
from app.ai_service import _load_configuration, get_embedding_model_name
from app.knowledge_models import name_key
from app.knowledge_worker import KnowledgeWorker
from app.main import app


QUESTIONS = [
    "What is Gradient Descent?",
    "What is Learning Rate?",
    "What is Loss Function?",
    "How does Backpropagation work?",
    "What is the Chain Rule?",
    "What is the difference between Forward and Backward Propagation?",
]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    base_url, model, _key = _load_configuration()
    assert model == "qwen3.5:4b", "The live test requires qwen3.5:4b."
    assert get_embedding_model_name().split(":")[0] == "bge-m3"
    with httpx.Client(trust_env=False, timeout=10) as local:
        response = local.get(base_url.split("/v1")[0] + "/api/tags")
        response.raise_for_status()
        names = {item["name"] for item in response.json()["models"]}
        assert model in names and any(name.startswith("bge-m3") for name in names), names

    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    output = ROOT / "tmp/step14" / run_id
    output.mkdir(parents=True)
    original_path = journal.DATABASE_PATH
    journal.DATABASE_PATH = output / "live.sqlite3"
    report = {"run_id": run_id, "model": model, "embedding_model": get_embedding_model_name(),
              "pairs": [], "checks": {}, "passed": False}
    # No lifespan here: first verify enqueue/HTTP separation and drain each real job explicitly.
    client = TestClient(app)
    history = []

    def save_report():
        (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    def run_pair(question, language="en", use_history=True, background=False):
        start = time.monotonic()
        response = client.post("/api/chat", json={
            "message": question, "language": language, "history": history if use_history else [],
        })
        assert response.status_code == 200, response.text
        reply = response.json()["reply"]
        assert response.json()["journal_status"] == "saved" and reply.strip()
        entry = journal.list_entries()["entries"][0]
        assert entry["question"] == question
        job = store.get_job(entry["id"])
        assert job["status"] == "pending" and job["attempts"] == 0
        pair = {"question": question, "answer": reply, "entry_id": entry["id"],
                "chat_seconds": round(time.monotonic() - start, 2)}
        report["pairs"].append(pair)
        print(f"ANSWER READY ({pair['chat_seconds']}s), extraction still pending: {question}", flush=True)
        started = time.monotonic()
        if background:
            worker = KnowledgeWorker(idle_seconds=0)
            worker.start()
            try:
                deadline = time.monotonic() + 360
                while time.monotonic() < deadline:
                    job = store.get_job(entry["id"])
                    if job["status"] in ("completed", "failed"):
                        break
                    time.sleep(0.25)
                assert job["status"] == "completed", job
            finally:
                worker.stop()
        else:
            job = engine.process_pending_once()
        pair["extraction_seconds"] = round(time.monotonic() - started, 2)
        pair["job"] = job
        save_report()
        assert job is not None and job["status"] == "completed", job
        with journal._connection() as connection:
            rows = connection.execute(
                "SELECT DISTINCT c.id,c.name,t.name AS topic FROM concepts c JOIN topics t ON t.id=c.topic_id "
                "JOIN concept_sources s ON s.concept_id=c.id WHERE s.entry_id=?", (entry["id"],),
            )
            pair["concepts"] = [dict(row) for row in rows]
        print(json.dumps({"question": question, "job": job["outcome"], "concepts": pair["concepts"],
                          "relations": job["relation_count"], "seconds": pair["extraction_seconds"]}, ensure_ascii=False), flush=True)
        if use_history:
            history.extend([{"role": "user", "content": question}, {"role": "assistant", "content": reply}])
        save_report()
        return pair

    try:
        for question in QUESTIONS:
            pair = run_pair(question)
            assert 1 <= len(pair["concepts"]) <= 3, pair

        topics, concepts = store.graph_snapshot()

        def find(*aliases):
            matches = [concept for concept in concepts if {name_key(label) for label in [concept["name"], *concept["aliases"]]} & {name_key(alias) for alias in aliases}]
            assert len(matches) == 1, (aliases, [item["name"] for item in matches])
            return matches[0]

        gradient = find("Gradient Descent", "梯度下降")
        core = [gradient, find("Learning Rate", "学习率"), find("Loss Function", "损失函数"),
                find("Backpropagation", "Backward Propagation", "反向传播"), find("Chain Rule", "链式法则")]
        assert len({concept["id"] for concept in core}) == 5, "Distinct concepts were merged."
        for concept in core:
            assert name_key(concept["topic_name"]) in {"machine learning", "机器学习"}, concept["topic_name"]
        forward = find("Forward Propagation", "Forward Pass", "前向传播")
        assert forward["id"] != core[3]["id"]
        report["checks"]["six_questions_and_ml_classification"] = True
        report["checks"]["distinct_core_concepts_and_forward_backward"] = True

        original_definition = gradient["definition"]
        duplicate = run_pair(QUESTIONS[0], use_history=False)
        translated = run_pair("请解释梯度下降，并说明它在机器学习中的作用。", language="zh", use_history=False)
        concepts = store.graph_snapshot()[1]
        after = find("Gradient Descent", "梯度下降")
        assert after["id"] == gradient["id"]
        detail = store.concept_detail(after["id"])
        source_ids = {source["entry_id"] for source in detail["definitions"]}
        assert duplicate["entry_id"] in source_ids and translated["entry_id"] in source_ids
        assert detail["definition"] == original_definition
        report["checks"]["english_chinese_dedup_and_definition_preservation"] = True

        relation_map = {}
        for concept in concepts:
            for relation in store.concept_relations(concept["id"]):
                relation_map[relation["id"]] = relation
        relations = list(relation_map.values())
        assert relations, "No evidence-supported relationship was retained."
        for relation in relations:
            assert relation["source_id"] != relation["target_id"]
            for evidence in relation["sources"]:
                pair = next(pair for pair in report["pairs"] if pair["entry_id"] == evidence["entry_id"])
                assert name_key(evidence["evidence"]) in name_key(pair["question"] + "\n" + pair["answer"])
        report["relations"] = relations
        report["checks"]["all_relations_have_original_source_quotes"] = True

        count_before = len(concepts)
        greeting = run_pair("Hello! How are you?", use_history=False, background=True)
        assert greeting["job"]["outcome"] == "non_learning" and not greeting["concepts"]
        assert len(store.graph_snapshot()[1]) == count_before
        report["checks"]["real_background_small_talk_filter"] = True

        code = (
            "from pathlib import Path; from app import journal_service as j; from app import knowledge_store as s; "
            f"j.DATABASE_PATH=Path({str(journal.DATABASE_PATH)!r}); "
            f"assert len(s.graph_snapshot()[1])=={count_before}; "
            f"assert s.list_jobs(status='completed')['total']=={len(report['pairs'])}"
        )
        subprocess.run([sys.executable, "-c", code], cwd=ROOT, check=True)
        report["checks"]["fresh_process_persistence"] = True
        report["topic_names"] = [topic["name"] for topic in store.list_topics()]
        report["concept_count"] = count_before
        report["passed"] = True
        print("PASS all real local knowledge checks", flush=True)
    except Exception as error:
        report["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        save_report()
        client.close()
        journal.DATABASE_PATH = original_path
        print(f"Live evidence report: {output / 'report.json'}", flush=True)


if __name__ == "__main__":
    main()
