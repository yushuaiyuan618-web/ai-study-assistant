# Step 14 - Local Knowledge Engine

Step 14 adds backend extraction, storage and query APIs without visualization.
Step 15 adds a separate [read-only Knowledge Map](KNOWLEDGE_MAP.md); extraction,
graph storage, identity and evidence rules described here remain unchanged.

## Reuse and research

The implementation reuses the existing Learning Journal database, Ollama client,
JSON Schema/Pydantic helper, BGE-M3 embedding API and NumPy dense cosine retrieval
approach. There are no new runtime dependencies.

Sources reviewed:

- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs)
  recommends JSON Schema generation followed by application-side Pydantic validation.
- [BGE-M3 on Hugging Face](https://huggingface.co/BAAI/bge-m3) describes multilingual
  dense retrieval. The existing local Ollama embedding endpoint supplies these vectors.
- [LightRAG on GitHub](https://github.com/HKUDS/LightRAG) demonstrates entity/relation
  extraction with source associations and local-model support. Its broader retrieval
  stack was reviewed, not installed or copied: the current project already has the
  lightweight components needed for this single-user backend.
- [FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/) supplies the
  application startup/shutdown hook for the worker.
- [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html) and
  [Python sqlite3](https://docs.python.org/3/library/sqlite3.html) informed cascades,
  transactions, bound parameters and explicit connection cleanup.

## Processing flow

1. Chat, Explain or RAG produces a successful non-empty answer.
2. Step 13 saves its existing journal row. A SQLite trigger inserts a job containing
   only that row's ID, in the same transaction. Disabled auto-recording creates neither
   a journal row nor a knowledge job.
3. A single background worker waits for five idle seconds after foreground AI work.
   It claims a durable job, reads the original pair and asks local `qwen3.5:4b` for
   schema-constrained JSON.
4. Pydantic validates 1-3 central concepts, definitions, aliases, keywords and up to
   five supported relationships. A separate small Qwen structured decision selects
   the pair's dominant application topic, so calculus tools used in model training
   are organized under that learning context rather than their abstract discipline.
   This domain decision never merges distinct concepts. Non-educational chat returns
   `non_learning` with empty arrays and creates no nodes or embeddings.
5. BGE-M3 embeds concepts and topics. NumPy normalizes `float32` vectors and retrieves
   up to three candidates using cosine similarity (threshold 0.62); exact normalized
   aliases also nominate candidates.
6. Existing topic names/aliases are reused first. Otherwise local Qwen checks whether
   a topic candidate is the same subject. Concept candidates always require Qwen's
   explicit identity confirmation. Similarity, shared subject matter or a prerequisite
   relationship alone never authorize a concept merge. Uncertain matches stay separate.
7. Relations are checked against the original pair. Nodes, source associations,
   relation evidence and job completion are committed together in a short transaction.

Only the model input is bounded (800 question characters, 2,200 answer characters,
and at most 12 existing topics). The journal retains the complete original pair.
Both extraction and identity checking use the established structured-output helper
with model thinking disabled and one malformed-output retry.

## Identity, definitions and relations

Names use Unicode NFKC, whitespace normalization and case folding for lookup.
Aliases can contain English and Simplified Chinese labels. Keywords do not serve
as identity labels. Distinct concepts such as Gradient Descent, Learning Rate and
Loss Function stay separate even when their vectors are similar.

A confirmed merge retains the original canonical definition and adds the newly
extracted definition with its journal ID to `concept_sources`. It also accumulates
aliases and keywords. Definitions are not overwritten by later model responses.
Sources are retrieved from `journal_entries` at query time rather than storing
another copy of each question and answer.

Supported relation types:

| Type | Direction/meaning |
| --- | --- |
| `prerequisite_of` | Source is needed to understand target |
| `part_of` | Source is a component of target |
| `related_to` | A specific explained association; symmetric |
| `contrasts_with` | An explicit distinction; symmetric |
| `applied_in` | Source is used in target |

Each relation keeps a reason, a source quote and its journal ID. Cosmetic surrounding
quotation marks are removed before verification; quote contents are not rewritten.
The quote must
match the original pair after Unicode/case/whitespace normalization and mention
both resolved endpoints. Unknown or ambiguous endpoint names, self-relations and
unsupported quotes are omitted. Symmetric endpoints have a stable ordering;
prerequisite and component cycles are rejected. These checks establish traceability,
not mathematical proof of the model's interpretation of every relationship.

## SQLite schema and migration

All tables share `data/learning_journal.sqlite3`, already ignored by Git.

| Table | Stored data |
| --- | --- |
| `journal_entries`, `journal_settings` | Existing Step 13 source pairs and preference; retained |
| `topics` | Stable IDs, names, normalized names, aliases, embeddings/model and timestamps |
| `concepts` | Stable IDs, topic, canonical definition, aliases, keywords, embeddings/model and timestamps |
| `concept_sources` | Concept ID, journal ID, extracted name and each source-specific definition |
| `concept_relations` | Typed source/target edges with stable IDs and timestamps |
| `relation_sources` | Relation ID, journal ID, evidence quote and reason |
| `knowledge_jobs` | Journal ID, state, attempts, lease, retry time, safe error code and result counts |
| `knowledge_schema` | Additive schema/backfill version |

The first migration queues existing journal entries once, without changing their
IDs, text, dates or stars. New rows queue automatically. Foreign keys are enabled
on every connection. Each database operation closes its connection in `finally`.

Deleting a journal entry removes its pending job and evidence associations. Nodes
and edges without remaining sources, plus empty topics, are removed. A surviving
concept's displayed definition comes from a remaining source. A stale in-flight
worker cannot recreate deleted data because its source/lease is checked at commit.

The Windows migration test explicitly closes its setup connection with
`contextlib.closing`. Its nested connection context still commits/rolls back the
transaction. Both DELETE-journal and WAL-mode tests immediately unlink the database
after migration checks, and the WAL test checks that `-wal` and `-shm` files have
been released. No cleanup exceptions are ignored.

## Queue lifecycle and failure behavior

- Public states are `pending`, `completed`, and `failed`; `in_progress` distinguishes
  an active leased job from a queued pending job.
- Claiming uses `BEGIN IMMEDIATE`. Only one active lease is permitted across workers,
  so candidate snapshots are processed sequentially.
- A lease lasts ten minutes and is renewed at processing checkpoints. A crashed
  process's job can be recovered after its lease expires. Graceful shutdown releases
  the active job; its old token can no longer commit.
- Failed jobs retry automatically, with delays of 30 and 60 seconds, for up to three
  job attempts. A user can request a fresh retry cycle through the retry endpoint.
  Completed jobs reject retry to prevent duplicate processing.
- Failure rolls back graph writes and never changes the already-delivered AI answer.
  Status APIs return safe error codes and English/Chinese messages, not exception text.
- Foreground Chat, Explain, Quiz generation, Study Plan, document upload and RAG
  requests defer new background model stages. An already-running Ollama call cannot
  be preempted; it still shares local GPU/CPU resources. A single Uvicorn process is
  recommended for this local app; foreground-idle accounting is process-local.

## API

All routes use `/api/knowledge`. Optional `language=en|zh` selects status/error
messages, not a new translation of saved definitions. Responses use `Cache-Control:
no-store`; internal lease tokens and embedding blobs are never exposed.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/topics` | All topics with aliases and concept counts |
| GET | `/topics/{topic_id}/concepts` | Topic's nodes; `limit=1..1000`, `offset>=0` |
| GET | `/topics/{topic_id}/relations` | Step 15 read-only edges among the first `limit=1..500` nodes, ordered like the concept list; at most 2,000 edges and an explicit `truncated` flag |
| GET | `/concepts/{concept_id}` | Node metadata and source-specific definitions |
| GET | `/concepts/{concept_id}/relations` | Incoming/outgoing edges and original evidence |
| GET | `/concepts/{concept_id}/sources` | Original journal pairs; `limit=1..100`, `offset>=0` |
| GET | `/extractions` | Jobs; optional `status=pending|completed|failed`, `limit=1..100`, `offset>=0` |
| GET | `/extractions/{entry_id}` | Status, attempts, outcome, counts and localized message |
| POST | `/extractions/{entry_id}/retry` | HTTP 202 for a queued retry; no body required |

Unknown objects return 404, completed retries return 409, invalid query values
return 422, and local storage errors return 503. Non-learning pairs are completed
jobs with `outcome=non_learning` and zero result counts.

## Automated and real-model checks

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
node tests/journal_frontend_test.cjs
.venv\Scripts\python.exe tests/run_knowledge_engine_live.py
```

The unittest suite isolates its SQLite files and mocks model responses for reproducible
schema, identity, evidence, deletion, retry, concurrency and failure-path tests.
The explicit live script uses actual local Chat generation, Qwen extraction/identity
decisions and BGE-M3 embeddings, including all six required questions, an English
repeat, a Chinese repeat, small talk processed by the real background worker and
fresh-process persistence. It writes its source answers, jobs and graph evidence
under ignored `tmp/step14/<run-id>/`, never to the user's database. Run it only when
Ollama and both models are available. Actual results are recorded in PROJECT_STATUS.

### Verified results on 2026-11-14

- The original 34 tests plus four additions (WAL cleanup, evidence quote wrapping,
  application lifecycle and application-topic classification) all passed: 38/38.
- The original Windows migration test and WAL migration test each passed in isolation,
  including immediate database unlink and absence of lingering WAL/SHM sidecars.
- All five existing frontend DOM/translation/confirmation checks passed unchanged.
- The final real `qwen3.5:4b` / `bge-m3` run used newly generated answers and embeddings,
  not simulated fixtures. All nine jobs completed, with one topic and eight nodes.

| Actual question | Retained concepts in the final real run |
| --- | --- |
| What is Gradient Descent? | Gradient Descent, Loss Function, Gradient |
| What is Learning Rate? | Learning Rate, Gradient Descent |
| What is Loss Function? | Loss Function, Gradient Descent |
| How does Backpropagation work? | Backpropagation, Gradient Descent, Forward Pass |
| What is the Chain Rule? | Chain Rule, Backpropagation |
| What is the difference between Forward and Backward Propagation? | Forward Pass, Backpropagation |

All these nodes belonged to Machine Learning. Forward Pass and Backpropagation
had different IDs. Repeated English and Chinese Gradient Descent questions added
sources to the same node while preserving its canonical definition. The Chinese
pair also extracted a separate Loss Function Minimization concept. Small talk
produced `non_learning`, zero concepts and no additional graph data.

The retained relation was `Backpropagation applied_in Gradient Descent`, supported
by the original sentence: "Backpropagation efficiently calculates how much each
weight in a neural network contributed to the error, allowing for precise updates
via Gradient Descent." The reason and quote were inspected. No missing relations
were filled in merely to make the graph denser. A new Python process verified the
persisted graph and all completed job statuses.

Earlier real runs exposed domain classification that placed Chain Rule under
Mathematics even in a neural-network explanation. The independent application-topic
decision corrected that case, and the complete real suite was rerun successfully.
The final raw evidence remains in ignored
`tmp/step14/20261114T081955646075Z/report.json`; it contains only generated test pairs.

Additional real HTTP checks passed Chinese Explain, five-question conceptual Quiz
generation and deterministic 5/5 scoring, a validated seven-day Study Plan, TXT
parsing, BGE-M3 retrieval, a grounded RAG answer with sources and document removal.
Explain/RAG created pending jobs using their existing journal IDs; Quiz and Study
Plan created neither journal rows nor knowledge jobs. README, frontend and the
original AI/RAG/document-parsing service files remained unchanged.

## Manual acceptance

1. Keep Ollama running with `qwen3.5:4b` and `bge-m3` installed. Restart the application:

   ```powershell
   .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

2. At `http://127.0.0.1:8000/`, enable Learning Journal auto-recording. In AI Chat,
   ask the following in order, retaining the conversation context:
   - What is Gradient Descent?
   - What is Learning Rate?
   - What is Loss Function?
   - How does Backpropagation work?
   - What is the Chain Rule?
   - What is the difference between Forward and Backward Propagation?

3. Open `http://127.0.0.1:8000/docs`. Use `GET /api/knowledge/extractions` to observe
   pending/completed/failed jobs. Background work begins after an idle interval;
   local model speed and earlier journal backlog affect completion time.
4. Use `GET /api/knowledge/topics`, copy the Machine Learning topic ID, then request
   its concepts. Inspect node details, original sources and relation quotes through
   the corresponding APIs. Every saved edge must have a source ID and evidence.
5. Repeat Gradient Descent in English and ask `请解释梯度下降，并说明它在机器学习中的作用。`.
   Confirm that a justified identity match adds sources/definitions to the same ID,
   while Learning Rate, Loss Function and Backpropagation remain separate nodes.
6. Ask `Hello! How are you?` in a fresh Chat context. Its job should complete as
   `non_learning` and add no nodes. Try Explain and RAG as well: successful saved
   answers should enqueue jobs without a separate user action.
7. Restart FastAPI and query the APIs again: topics, nodes, sources and statuses
   should persist. Delete a disposable journal entry and confirm that its evidence
   disappears and no deleted source is recreated by an in-flight task.
8. To exercise real failure recovery, stop Ollama before a queued job runs. Its state
   should become failed without altering the original answer. Restart Ollama and
   use the retry endpoint for that journal ID, then verify completed state. Unit
   tests cover this path without stopping the user's actual model service.

## Limits

Qwen is probabilistic: structural validation and source quotes do not prove factual
correctness. Conservative matching may keep duplicate nodes, and strict quote checks
may omit legitimate relationships. English and Chinese topic/alias quality depends
on the model. Long answers and larger topic catalogs are bounded for local context.
Exact NumPy retrieval is suitable for a small personal graph, not a large shared
knowledge service. Changing embedding model/dimensions fails safely rather than
silently comparing incompatible vectors; a reindexing tool is outside Step 14.
