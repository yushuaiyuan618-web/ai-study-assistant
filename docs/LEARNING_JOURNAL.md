# Step 13 - Learning Journal

## Storage and boundaries

Successful `/api/chat`, `/api/explain` and `/api/documents/ask` responses are recorded
once in the backend after generation. The original question and answer, a UUID,
UTC timestamp, source mode and the user's difficulty flag are stored in
`data/learning_journal.sqlite3`. RAG source metadata is retained alongside its answer.
Failures and blank messages/answers are not recorded. There is no AI difficulty classifier.

Auto-recording defaults to on. Its setting lives in the same database and survives
service restarts. Turning it off affects future answers; existing records remain.
A storage failure returns a `journal_status: "error"` alongside the successful AI
answer so the frontend can warn without discarding the answer or retrying generation.

SQLite comes from Python's standard library. Each operation uses its own connection,
bound SQL parameters and a transaction. Connections close after use. All local data
and SQLite sidecars are ignored by Git. Journal data does not enter the AI context,
RAG retrieval index, quizzes or study plans. This remains a local, single-user app.

## Reuse and PDF selection

Research included the [fpdf2 GitHub repository](https://github.com/py-pdf/fpdf2),
a [Hugging Face PDF example](https://huggingface.co/spaces/awacke1/Book-Maker-CVLM-AI-UI-UX/blob/main/app.py),
[ReportLab font documentation](https://docs.reportlab.com/reportlab/userguide/ch3_fonts/),
[Platypus documentation](https://docs.reportlab.com/reportlab/userguide/ch5_platypus/)
and the [SQLite API](https://docs.python.org/3/library/sqlite3.html).

ReportLab was chosen for its BSD license, mature paragraph splitting, flowing page
layout and embedded TrueType font subsets. Only `reportlab` is added as a direct
runtime dependency; neither a browser engine nor a hosted service is needed.
The Hugging Face example was inspected for practical use of the library; its
Streamlit application and AI integrations were not copied.

The bundled static Noto Sans SC weight-400 font is under SIL OFL 1.1, with the
upstream license and provenance in `assets/fonts/`. FontTools was used once to
create the static font; it is not a runtime dependency. PDFs use embedded subsets,
so their Chinese text and red star do not depend on system fonts or a network.

Exports contain a cover with counts for the exported selection, then important
difficulties first and regular records second. Each section retains the chosen
time ordering. Paragraphs wrap and split across A4 pages; each page has a footer
and page number. Marked titles and stars are red. Original answer text is escaped
before entering ReportLab's paragraph parser; HTML is never executed or fetched.
Markdown and LaTeX remain original text in PDF output; the browser journal reuses
the existing Markdown/KaTeX renderer. PDF export does not run an additional LLM call.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/journal` | Records, global counts and matching count |
| GET / PUT | `/api/journal/settings` | Read/update `{ "auto_record": true }` |
| PATCH | `/api/journal/{id}` | Set `{ "starred": true }` or `false` |
| DELETE | `/api/journal/{id}` | Delete one record |
| DELETE | `/api/journal` | Clear all; requires `{ "confirmed": true }` |
| GET | `/api/journal/export` | PDF download for all matching records |

List/export filters: `kind=all|starred|normal`, `order=newest|oldest`, timezone-aware
`start` (inclusive) and `end` (exclusive). The browser converts selected local dates
to these bounds, including the entire end date. Listing uses `limit` (1-100, default
50) and `offset`. Export intentionally ignores pagination, and accepts `language=en|zh`
and `utc_offset` in minutes for displayed timestamps. Journal responses are not cached.

## Automated checks

From the repository root on Windows:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m unittest discover -s tests -v
node tests/journal_frontend_test.cjs
node --check frontend/script.js
node --check frontend/journal.js
```

The Python tests use temporary databases, mock AI responses for deterministic
checks, reopen the database in a new Python process, exercise failure paths and
produce long bilingual PDFs under ignored `tmp/step13/` for visual verification.
The Node tests exercise the new DOM behavior and translation contract without a
frontend framework or extra package. They are not a replacement for browser checks.

## Exact manual acceptance checks

1. Start Ollama if it is not already running, then run:

   ```powershell
   .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

   Open `http://127.0.0.1:8000/`. If another server is using that port, stop it first.

2. Open Learning Journal. Confirm automatic recording is checked. In AI Chat ask
   `I am learning Python sets.`, then `Give me a small exercise about that.`
   Confirm two separate question/answer records, and that the follow-up uses context.
   Submit an empty question: it must not create a record.

3. In Explain, enter `binary search`, select With Example, and submit. In Documents,
   upload `examples/sample_study_notes.txt`, ask `What is supervised learning?`, and
   wait for the answer with sources. Confirm one Explain record and one RAG record.

4. In the journal, expand records to see original questions, rendered answers,
   time, mode, ID and RAG source filenames. Click an outlined star: the title and
   filled star become red, and counts update. Click again: normal colors return.
   Filter Important difficulties and Regular records to check each count/list.

5. Choose today's From and Through dates, and try both Newest first and Oldest
   first. Choose an end date before the start date: an inline message should appear.
   Reset filters to restore the full list. More than 50 records use Previous/Next.

6. Switch off automatic recording, ask another successful Chat question, and verify
   the count does not increase. Restart Uvicorn and refresh: previous records and
   the off setting must remain. Switch it back on and verify the next answer records.

7. Choose All records and Export PDF, then choose Important difficulties and export
   the Current filter. The filtered PDF must exclude normal records, include all
   matching pages, and count only its exported records on the cover. Repeat in 中文.
   Check Chinese and English, the red title/star, both sections, wrapping and page
   numbers. Use a long Detailed explanation to check multi-page output.

8. Delete a disposable test record. Open Clear all records and Cancel or press Esc:
   nothing should change. Reopen and confirm: all records should disappear, including
   records hidden by filters. The auto-recording setting should remain unchanged.

9. Switch EN/中文 while records are expanded; check controls, errors, source labels,
   star tooltips and the clear dialog. At widths below 720px use the existing mode
   selector to reach Learning Journal. Test at 390px and a desktop width: only the
   active view should scroll; sidebar/header should retain their existing behavior.

10. Visit Chat, Explain, Quiz (Python loops, Medium, five questions and submission),
    Study Plan (7 days, 30 minutes) and Documents/RAG. Switching views must preserve
    their page-session state. Quiz and Study Plan must not add journal records.
