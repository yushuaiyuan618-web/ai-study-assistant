# Open-Source Acknowledgements

AI Study Assistant intentionally builds on mature open-source software and open model releases. The project-specific contribution is the application integration and learning experience, not the creation of these foundational components.

## Major Components

| Component | Role in this project | License | Official source |
| --- | --- | --- | --- |
| FastAPI | HTTP API and static application server | MIT | [fastapi/fastapi](https://github.com/fastapi/fastapi) |
| Uvicorn | Local ASGI development server | BSD-3-Clause | [encode/uvicorn](https://github.com/encode/uvicorn) |
| Ollama | Local model runtime and OpenAI-compatible endpoints | MIT | [ollama/ollama](https://github.com/ollama/ollama) |
| Qwen3.5 4B | Local response and structured-data generation | Apache-2.0 | [Qwen/Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B) |
| BGE-M3 | Multilingual document and query embeddings | MIT | [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3) |
| OpenAI Python SDK | Compatibility client pointed only at local Ollama by default | Apache-2.0 | [openai/openai-python](https://github.com/openai/openai-python) |
| pypdf | Embedded-text extraction from PDF files | BSD-3-Clause | [py-pdf/pypdf](https://github.com/py-pdf/pypdf) |
| NumPy | Vector normalization and exact cosine similarity | BSD-3-Clause (primary project license) | [numpy/numpy](https://github.com/numpy/numpy) |
| semantic-text-splitter | Boundary-aware text and Markdown chunking | MIT | [benbrandt/text-splitter](https://github.com/benbrandt/text-splitter) |
| KaTeX 0.18.4 | Safe local rendering of model-generated mathematical notation | MIT | [KaTeX/KaTeX](https://github.com/KaTeX/KaTeX) |
| python-dotenv | Local `.env` configuration loading | BSD-3-Clause | [theskumar/python-dotenv](https://github.com/theskumar/python-dotenv) |
| python-multipart | FastAPI multipart file-upload parsing | Apache-2.0 | [Kludex/python-multipart](https://github.com/Kludex/python-multipart) |

Licenses listed here were checked against official repositories/model cards and installed package metadata during the portfolio and final-polish reviews. Users redistributing the project or model files should verify the license terms of the exact versions they distribute. Model weights are downloaded by Ollama and are not stored in this repository.

## Reused vs. Custom Work

### Reused open source

- Local model serving and model packaging
- Foundation-model generation and embedding weights
- Web/API framework and ASGI server
- PDF parsing, multipart parsing, environment loading, semantic splitting, numerical arrays, and math typesetting

### Custom project engineering

- Provider-ready local AI service integration and typed error mapping
- English/Simplified Chinese learning interface and generation behavior
- Bounded current-session multi-turn context
- Explain styles and separate learning-mode state
- Schema-constrained Quiz and Study Plan generation
- Pydantic validation, safe retries, and deterministic quiz scoring
- Bounded document ingestion and temporary storage
- Local RAG indexing, retrieval policy, grounded prompting, and source attribution
- Prompt-injection boundaries for untrusted documents
- Safe Markdown/math/plain-text rendering and responsive product UX

## Project-Level License Review

The repository does not currently contain a project-level `LICENSE`. The major integrated components use permissive licenses, so a permissive license such as MIT would generally be compatible for the original application code. Selecting a license is nevertheless a legal and ownership decision for the repository owner, so Step 12 does not add one automatically.

A future root license would apply to original project code only. It would not replace or relicense Ollama, Qwen3.5, BGE-M3, or any dependency; their notices and terms remain independent.
