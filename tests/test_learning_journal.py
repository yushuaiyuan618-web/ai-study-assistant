"""Run with: python -m unittest discover -s tests -v (no external AI required)."""

from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from pypdf import PdfReader

from app import journal_service as journal
from app.ai_service import AIConnectionError, GeneratedQuiz, GeneratedStudyPlan
from app.main import app


class LearningJournalTests(unittest.TestCase):
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

    def records(self, **params):
        response = self.client.get("/api/journal", params=params)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_chat_and_explain_capture_only_completed_pairs(self):
        with patch("app.main.generate_reply", return_value="Sets contain unique values.") as reply:
            response = self.client.post("/api/chat", json={
                "message": "Python sets?", "language": "en",
                "history": [{"role": "user", "content": "I am learning Python."}],
            })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["journal_status"], "saved")
            self.assertEqual(reply.call_args.args[2][0]["content"], "I am learning Python.")
        with patch("app.main.generate_explanation", return_value="二分查找每次缩小一半范围。"):
            response = self.client.post("/api/explain", json={
                "topic": "二分查找", "style": "example", "language": "zh",
            })
            self.assertEqual(response.json()["journal_status"], "saved")
        entries = self.records()["entries"]
        self.assertEqual({entry["module"] for entry in entries}, {"chat", "explain"})
        self.assertEqual(len({entry["id"] for entry in entries}), 2)
        self.assertTrue(all(datetime.fromisoformat(entry["created_at"]).tzinfo for entry in entries))

    def test_rag_capture_keeps_source_metadata(self):
        source = {"document_id": "doc-1", "filename": "复习资料.pdf", "page_number": 2,
                  "chunk_index": 1, "snippet": "Local reference"}
        with patch("app.main.get_document", return_value=object()), patch(
            "app.main.answer_document_question", return_value={"reply": "Grounded answer.", "sources": [source]}
        ):
            response = self.client.post("/api/documents/ask", json={
                "question": "Explain my notes", "document_ids": ["doc-1"], "language": "en",
            })
        self.assertEqual(response.status_code, 200)
        entry = self.records()["entries"][0]
        self.assertEqual(entry["module"], "rag")
        self.assertEqual(entry["sources"], [source])

    def test_failed_blank_and_empty_answers_are_not_saved(self):
        with patch("app.main.generate_reply", side_effect=AIConnectionError()):
            self.assertEqual(self.client.post("/api/chat", json={
                "message": "test", "language": "en"
            }).status_code, 503)
        self.assertEqual(self.client.post("/api/chat", json={
            "message": " ", "language": "en"
        }).status_code, 400)
        self.assertEqual(journal.record_answer("test", " ", "chat"), "skipped")
        self.assertEqual(journal.record_answer(" ", "answer", "chat"), "skipped")
        self.assertEqual(self.records()["stats"]["total"], 0)

    def test_failed_explain_and_rag_are_not_saved(self):
        with patch("app.main.generate_explanation", side_effect=AIConnectionError()):
            response = self.client.post("/api/explain", json={
                "topic": "binary search", "style": "simple", "language": "en",
            })
            self.assertEqual(response.status_code, 503)
        with patch("app.main.get_document", return_value=object()), patch(
            "app.main.answer_document_question", side_effect=AIConnectionError()
        ):
            response = self.client.post("/api/documents/ask", json={
                "question": "test", "document_ids": ["doc-1"], "language": "en",
            })
            self.assertEqual(response.status_code, 503)
        self.assertEqual(self.records()["stats"]["total"], 0)

    def test_setting_off_and_on_is_persistent(self):
        response = self.client.put("/api/journal/settings", json={"auto_record": False})
        self.assertEqual(response.json(), {"auto_record": False})
        self.assertEqual(journal.record_answer("Question", "Answer", "chat"), "disabled")
        code = (
            "from pathlib import Path; from app import journal_service as j; "
            f"j.DATABASE_PATH=Path({str(self.database)!r}); "
            "assert j.get_settings()['auto_record'] is False"
        )
        subprocess.run([sys.executable, "-c", code], check=True)
        self.client.put("/api/journal/settings", json={"auto_record": True})
        self.assertEqual(journal.record_answer("Question", "Answer", "chat"), "saved")

    def test_star_unstar_stats_filters_and_delete(self):
        journal.record_answer("What is SQL?", "A query language.", "chat")
        entry_id = self.records()["entries"][0]["id"]
        response = self.client.patch(f"/api/journal/{entry_id}", json={"starred": True})
        self.assertEqual(response.json()["starred"], True)
        self.assertEqual(self.records(kind="starred")["stats"], {"total": 1, "normal": 0, "starred": 1})
        self.assertEqual(self.records(kind="normal")["entries"], [])
        self.client.patch(f"/api/journal/{entry_id}", json={"starred": False})
        self.assertEqual(self.records(kind="starred")["entries"], [])
        self.assertEqual(self.client.delete(f"/api/journal/{entry_id}").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/journal/{entry_id}").status_code, 404)

    def test_delete_all_requires_confirmation_and_preserves_setting(self):
        journal.record_answer("question", "answer", "chat")
        self.client.put("/api/journal/settings", json={"auto_record": False})
        self.assertEqual(self.client.request("DELETE", "/api/journal", json={"confirmed": False}).status_code, 422)
        self.assertEqual(self.records()["stats"]["total"], 1)
        self.assertEqual(self.client.request("DELETE", "/api/journal", json={"confirmed": True}).status_code, 200)
        self.assertEqual(self.records()["stats"]["total"], 0)
        self.assertFalse(journal.get_settings()["auto_record"])

    def test_persistence_in_fresh_process_and_parameterized_sql(self):
        question = "'); DROP TABLE journal_entries; -- 中文"
        journal.record_answer(question, "Safe answer <script>alert(1)</script>", "chat")
        code = (
            "from pathlib import Path; from app import journal_service as j; "
            f"j.DATABASE_PATH=Path({str(self.database)!r}); "
            f"assert j.list_entries()['entries'][0]['question']=={question!r}"
        )
        subprocess.run([sys.executable, "-c", code], check=True)
        self.assertEqual(self.records()["stats"]["total"], 1)

    def test_date_order_and_pagination_validation(self):
        for number in range(3):
            journal.record_answer(str(number), "answer", "explain")
        oldest = self.records(order="oldest", limit=1, offset=1)
        self.assertEqual(oldest["entries"][0]["question"], "1")
        self.assertEqual(oldest["filtered_count"], 3)
        tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
        self.assertEqual(self.records(start=tomorrow.isoformat())["entries"], [])
        self.assertEqual(self.client.get("/api/journal", params={"start": tomorrow.isoformat(), "end": datetime.now(timezone.utc).isoformat()}).status_code, 422)
        self.assertEqual(self.client.get("/api/journal?kind=invalid").status_code, 422)
        self.assertEqual(self.client.get("/api/journal?start=2026-11-13").status_code, 422)
        self.assertEqual(self.client.get("/api/journal?limit=0").status_code, 422)

    def test_storage_failure_does_not_lose_ai_answer(self):
        with patch.object(journal, "DATABASE_PATH", self.database.parent), patch(
            "app.main.generate_reply", return_value="Still deliver this answer."
        ):
            response = self.client.post("/api/chat", json={"message": "test", "language": "en"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["reply"], "Still deliver this answer.")
            self.assertEqual(response.json()["journal_status"], "error")
            self.assertEqual(self.client.get("/api/journal").status_code, 503)

    def test_pdf_bilingual_pagination_and_filter_scope(self):
        journal.record_answer(
            "什么是梯度下降？What is gradient descent?",
            "学习记录导出测试。English text wraps safely.\n\n" * 180 + "FINAL ANSWER MARKER",
            "explain",
        )
        entry_id = self.records()["entries"][0]["id"]
        journal.set_starred(entry_id, True)
        journal.record_answer("REGULAR QUESTION", "普通记录答案。<img src='https://invalid.example'>", "chat")
        for language in ("zh", "en"):
            response = self.client.get("/api/journal/export", params={"language": language, "utc_offset": 480})
            self.assertEqual(response.status_code, 200, response.text[:100])
            self.assertEqual(response.headers["content-type"], "application/pdf")
            reader = PdfReader(BytesIO(response.content))
            text = "\n".join(page.extract_text() for page in reader.pages)
            self.assertGreater(len(reader.pages), 3)
            for expected in ("My Learning Journal", "什么是梯度下降", "FINAL ANSWER MARKER", "★", "REGULAR QUESTION"):
                self.assertIn(expected, text)
            self.assertTrue(all(str(index) in page.extract_text() for index, page in enumerate(reader.pages, 1)))
            output = Path("tmp/step13")
            output.mkdir(parents=True, exist_ok=True)
            (output / f"journal-{language}.pdf").write_bytes(response.content)
        response = self.client.get("/api/journal/export?kind=starred&language=zh")
        text = "\n".join(page.extract_text() for page in PdfReader(BytesIO(response.content)).pages)
        self.assertNotIn("REGULAR QUESTION", text)
        self.assertIn("总问题数量: 1", text)

    def test_empty_export_and_static_routes(self):
        self.assertEqual(self.client.get("/api/journal/export").status_code, 400)
        self.assertEqual(self.client.get("/api/health").json(), {"status": "ok"})
        self.assertIn("journal.js", self.client.get("/").text)
        self.assertEqual(self.client.get("/journal.js").status_code, 200)

    def test_export_selection_spans_pagination(self):
        for number in range(51):
            journal.record_answer(f"Question {number}", "Short answer.", "chat")
        self.assertEqual(len(self.records()["entries"]), 50)
        response = self.client.get("/api/journal/export")
        self.assertEqual(response.status_code, 200)
        text = "\n".join(page.extract_text() for page in PdfReader(BytesIO(response.content)).pages)
        self.assertIn("Question 0", text)
        self.assertIn("Question 50", text)
        self.assertIn("Total questions: 51", text)

    def test_existing_quiz_and_study_plan_do_not_create_records(self):
        quiz = GeneratedQuiz(questions=[{
            "id": index, "question": f"Question {index}", "options": ["a", "b", "c", "d"],
            "correct_index": 1, "explanation": "b is correct.",
        } for index in range(1, 6)])
        with patch("app.main.generate_quiz", return_value=quiz):
            response = self.client.post("/api/quiz/generate", json={"topic": "Python", "difficulty": "medium", "language": "en"})
        self.assertNotIn("correct_index", response.json()["questions"][0])
        result = self.client.post("/api/quiz/submit", json={"quiz_id": response.json()["quiz_id"], "answers": [1] * 5})
        self.assertEqual(result.json()["score"], 5)
        plan = GeneratedStudyPlan(title="Python", overview="Foundations", days=[{
            "day": index, "focus": "Practice", "tasks": ["Read", "Try"],
            "estimated_minutes": 30, "goal": "Learn the concept",
        } for index in range(1, 8)])
        with patch("app.main.generate_study_plan", return_value=plan):
            result = self.client.post("/api/study-plan", json={"goal": "Python", "level": "beginner", "daily_minutes": 30, "duration_days": 7, "language": "en"})
        self.assertEqual(len(result.json()["days"]), 7)
        self.assertEqual(self.records()["stats"]["total"], 0)


if __name__ == "__main__":
    unittest.main()
