# Step 15 - Knowledge Map

The map reads the existing local Knowledge Engine. It does not run inference,
edit concepts, save positions, change relations, or copy learning records.

## Open-source choice

Official sources checked on 2026-11-14:

- [Cytoscape.js repository](https://github.com/cytoscape/cytoscape.js),
  [official layouts/API](https://js.cytoscape.org/),
  [npm metadata](https://registry.npmjs.org/cytoscape/latest).
  Version 3.35.0 is MIT licensed with no runtime dependencies. Built-in
  `breadthfirst` and `cose` layouts cover both requested modes in one library;
  selection, pan, zoom and touch interaction are already implemented upstream.
  GitHub reported about 11.3k stars, not archived, last push 2026-11-10.
- [Mind Elixir Core repository](https://github.com/SSShooter/mind-elixir-core),
  [official documentation](https://docs.mind-elixir.com/),
  [npm metadata](https://registry.npmjs.org/mind-elixir/latest).
  Version 6.0.1 is MIT licensed, dependency-free and focused on interactive mind
  maps/editing. GitHub reported about 3.2k stars, not archived, last push 2026-11-13.
  It is maintained, but Cytoscape is a closer fit for typed directed graphs as
  well as topic hierarchies. Mind Elixir was researched, not installed.

Only the pinned Cytoscape browser bundle and its license are vendored under
`frontend/vendor/cytoscape/`. `VERSION.md` records the official download and
SHA-256. No repository copy, framework, npm project or runtime CDN was added.

## Data flow and API fields

1. Opening Knowledge Map fetches `GET /api/knowledge/topics` (`items`: `id`,
   `name`, `aliases`, `concept_count`, timestamps).
2. Topic selection fetches the existing
   `GET /api/knowledge/topics/{id}/concepts?limit=500` (`items`, `total`). Node
   fields are `id`, `topic_id`, `name`, `definition`, `aliases`, `keywords` and dates.
3. One small new read-only endpoint replaces up to 500 per-node relation requests:
   `GET /api/knowledge/topics/{id}/relations?limit=500`.
4. Selecting a concept uses both existing endpoints:
   `GET /api/knowledge/concepts/{id}` and
   `GET /api/knowledge/concepts/{id}/relations`. Details use `topic_name`,
   `definition`, optional aliases/keywords, and the unique neighboring IDs for
   the related-concept count (including neighbors outside the visible topic).

The aggregate endpoint returns:

```json
{
  "items": [
    {"id": "stored-edge-id", "source_id": "stored-source-id",
     "target_id": "stored-target-id", "relation_type": "applied_in"}
  ],
  "truncated": false
}
```

IDs above illustrate the format, not seeded knowledge. The SQL uses bound parameters
and a CTE selecting the same first nodes (`ORDER BY name,id`) as the concept list.
Both endpoints must belong to that set. The query returns at most 2,000 edges and
an explicit truncation flag; it never returns embeddings, source answers or leases.
`limit` accepts 1-500. Missing topics return 404; invalid limits return 422;
storage failures return a safe bilingual 503. Responses use `Cache-Control: no-store`.
There are no schema/migration or AI-processing changes.

## Layout and interactions

- Mind Map uses the built-in `breadthfirst` hierarchy. The topic root and dotted
  topic-membership branches are presentation only, not new knowledge relations.
  A concept becomes a sub-branch only for a single unambiguous acyclic `part_of`
  parent in the loaded topic. The stored child-to-parent direction is reversed
  only for this organizational display. Multiple-parent or missing-parent cases
  remain at the topic level; all real edges remain available in Graph mode.
  When the edge response is truncated, no concept hierarchy is inferred from it.
- Knowledge Graph uses the built-in CoSE layout. `prerequisite_of`, `part_of` and
  `applied_in` preserve source-to-target arrows. `related_to` and `contrasts_with`
  have no arrows. Typed labels, restrained line styles and a bilingual legend
  distinguish all five types. No topic-membership edges appear in this mode.
- Search matches normalized names, aliases and keywords. Repeating Find cycles
  through matches. Hidden ancestors expand when a result is selected. A native
  concept selector offers keyboard selection without relying on canvas gestures.
- Zoom, Fit, Reset, temporary node dragging, canvas pan and native pinch gestures
  use Cytoscape. Mode switching retains the topic; Reset restores layout and
  expands branches without modifying stored knowledge. Selection emphasizes its
  real neighborhood; search focuses small graph neighborhoods when possible.
- Requests are cancelled on newer topic/detail selections, time out after 20
  seconds, and settle loading state on success/failure. Refresh retries failed
  data loads. Missing optional fields have localized fallbacks.
- API text uses text nodes and canvas labels, never AI-generated HTML. Map state
  is independent of Chat/Explain/Quiz/Plan/Documents/Journal and is not persisted.

The existing viewport shell stays unchanged. The map is an active-view scroll
region. On desktop, long details scroll inside their bounded side panel so they
cannot stretch the canvas; below 1100px details stack beneath the canvas and use
the main view's scrolling. Below 720px the existing mobile mode selector includes
Knowledge Map. The body and application root remain non-scrolling.

## Tests

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
node tests/journal_frontend_test.cjs
node tests/knowledge_map_frontend_test.cjs
.venv\Scripts\python.exe -m compileall -q app tests
node --check frontend/script.js
node --check frontend/journal.js
node --check frontend/knowledge-map.js
.venv\Scripts\python.exe -m pip check
git diff --check
```

The Python suite includes the unchanged 38 engine/journal tests plus six new
map API tests: real field mapping, all relation types/directions, topic/limit
isolation, safe errors, parameterized lookup, no-write/no-inference reads and
dense-edge bounds. The seven frontend groups run the actual vendored Cytoscape
layouts using a small DOM harness and clearly test-only API fixtures. They
cover hierarchy, cycles/multiple parents, collapse/search reveal, directions,
optional fields, bilingual labels, safe text, stale responses and error recovery.
A 500-node CoSE smoke plus unavailable-library recovery took about 0.8 seconds
on the verification machine; this is a headless smoke, not a browser benchmark.
The original five Journal frontend groups remain intact.

### Actual browser verification on 2026-11-14

Edge was opened against an isolated SQLite backup of the successful Step 14 real
Qwen/BGE-M3 run, not generated demo nodes. It displayed Machine Learning and all
eight saved nodes covering the six required questions: Gradient Descent, Learning
Rate, Loss Function, Backpropagation, Chain Rule and Forward Pass, plus Gradient
and Loss Function Minimization. The only saved edge was Backpropagation
`applied_in` Gradient Descent, with its correct direction; no missing edges were
filled in. Reload read the same saved graph through the APIs.

Verified in the browser: both modes, node click/details, Chinese alias search,
zoom/Fit/Reset, node dragging, canvas pan, root collapse/reveal, bilingual controls
and legend, preserved existing mode drafts, and navigation through all seven modes.
Desktop and 320px/~354px CSS-width mobile checks retained a fixed header, contained
scrolling and accessible navigation; mobile details stacked and remained readable.
Separate isolated empty/error servers verified localized empty and 503/retry states.
No application JavaScript errors were found; unrelated Zotero extension errors
were identified separately. Multi-topic isolation and deeper `part_of` branches
use test-only fixtures because the real corpus has one topic and no component edges.

### Safe isolated browser server

To repeat checks without changing the user's database or running background AI:

```powershell
.venv\Scripts\python.exe tests/serve_knowledge_map_test.py --port 8015
# Optional: choose an existing real graph instead of the default local journal.
.venv\Scripts\python.exe tests/serve_knowledge_map_test.py --database "path\to\real.sqlite3" --port 8015
# Run these separately for empty/error acceptance:
.venv\Scripts\python.exe tests/serve_knowledge_map_test.py --empty --port 8016
.venv\Scripts\python.exe tests/serve_knowledge_map_test.py --empty --fail-knowledge --port 8017
```

The helper opens the source SQLite file read-only, backs it up into a temporary
directory, and disables only its own background worker. It never seeds knowledge.
Stop with Ctrl+C; temporary files are explicitly closed/cleaned up on normal exit.

## Manual acceptance in the normal application

1. Restart FastAPI to register the new route:

   ```powershell
   .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

2. Open `http://127.0.0.1:8000/`, hard-refresh if needed, and click Knowledge Map.
   Select Machine Learning. If empty, first complete the six questions in the
   Step 14 guide with journal recording on and wait for extraction to complete.
3. In Mind Map, confirm topic membership and only justified component sub-branches.
   Click the root, Collapse branch, then Expand branch. Search `Gradient Descent`
   or `梯度下降`; a hidden matching node should become visible and load its details.
4. Switch to Knowledge Graph. The same topic remains selected. Compare displayed
   edges with the relation API: arrows follow actual stored semantics; symmetric
   relations have none. Sparse/disconnected knowledge is expected, not an error.
5. Use the native concept list and keyboard, Zoom In/Out, Fit and Reset. Drag a
   node and pan the canvas. Reload: original knowledge remains, positions reset.
6. Switch EN/中文. Controls, states, details labels, relation labels and legend
   translate; saved names/definitions stay in their original language.
7. At phone widths (320-720px), choose Knowledge Map in the top mode selector.
   Search/select a node and scroll to the details below the canvas. Check that
   the header remains fixed and no browser/body scrollbar or horizontal overflow
   appears. Switch through Chat, Explain, Quiz, Plan, Documents and Journal.
8. Use the isolated empty/error commands above for safe boundary checks. Neither
   case should expose an exception, leave a spinner running or break navigation.

## Deliberate limits

- One topic is visible at a time; cross-topic edges are not drawn, although node
  related-counts include them. No full chat tracing, editing or stars are added.
- At most the first 500 concepts and 2,000 internal edges render at once. A visible
  notice discloses truncation and search scope; larger-topic paging is future work.
- Dense graphs still need zoom/search; CoSE runs locally with fewer iterations
  for more than 150 nodes and hides edges during viewport gestures for responsiveness.
- Collapse state, mode, search and dragged positions are page-session UI state.
  New extracted knowledge appears on Refresh or page reload, not via streaming.
- Bilingual UI does not translate stored content or infer new knowledge relations.
- The existing strict Step 14 corpus contains no real `part_of` edge. Deeper
  branch logic is automatically tested, not misrepresented as a real-model result.
