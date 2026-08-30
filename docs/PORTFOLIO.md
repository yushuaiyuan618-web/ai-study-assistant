# AI Study Assistant - Portfolio Material

This document contains reusable, evidence-based project descriptions. Adapt the tone to the destination, but keep technical claims consistent with the repository.

## One-Sentence Version

Built a bilingual, local-first AI Study Assistant using FastAPI, Ollama, Qwen3.5, BGE-M3, and NumPy, with structured learning workflows and source-grounded retrieval across uploaded PDF, TXT, and Markdown study materials.

## CV Bullets

- Built a bilingual local-LLM learning application with FastAPI, Vanilla JavaScript, Ollama, and Qwen3.5 4B, supporting bounded multi-turn chat and isolated Explain, Quiz, and Study Plan workflows without paid AI APIs.
- Designed schema-constrained Quiz and Study Plan generation with Pydantic validation, safe retry behavior, and deterministic Python quiz scoring so malformed model output cannot enter core workflows.
- Implemented a local RAG pipeline that parses PDF/TXT/Markdown files, creates BGE-M3 embeddings, performs exact NumPy cosine retrieval, grounds Qwen responses in selected excerpts, and returns source attribution.

## Graduate Application Paragraph

I built AI Study Assistant to explore how generative AI can support learning through focused workflows rather than generic conversation. The system combines a bilingual FastAPI and Vanilla JavaScript application with local Qwen3.5 inference through Ollama, structured quiz and study-plan generation, and document-grounded question answering. The main engineering challenges were controlling multi-turn context, validating untrusted model output, separating feature state, and retrieving useful evidence without adding an unnecessarily heavy vector database. I implemented a local RAG pipeline using semantic chunking, BGE-M3 embeddings, normalized NumPy cosine search, grounded prompts, and source attribution. Working through these tradeoffs taught me to evaluate AI systems as complete products: model quality matters, but so do data boundaries, failure behavior, latency, validation, and clear user interaction. The project strengthened my interest in reliable AI applications and in studying how AI systems can support personalized education without obscuring their limitations.

## Chinese Project Explanation

AI Study Assistant 是一个面向学习场景的双语、本地优先 AI 应用。我希望探索生成式 AI 如何从通用对话转化为可执行的学习支持，因此设计了知识讲解、测验、学习计划和资料问答等独立工作流。系统用 FastAPI 组织接口，通过 Ollama 在本地运行 Qwen3.5 4B，并用 BGE-M3 生成多语言向量；PDF、TXT 和 Markdown 资料经过解析、语义分块与 NumPy 相似度检索后，作为受控上下文交给模型生成带来源的回答。技术重点包括上下文预算、结构化输出校验、确定性评分、提示注入边界和安全渲染。这个项目让我更具体地理解了本地模型、RAG 可靠性、产品状态隔离与工程取舍之间的关系。

## 60-Second Interview Pitch

I built a bilingual AI Study Assistant focused on practical learning workflows: chat, concept explanation, quizzes, study plans, and questions over uploaded notes. I wanted the complete AI path to run locally without a paid model API, so FastAPI communicates with Qwen3.5 and BGE-M3 through Ollama, while a lightweight HTML, CSS, and JavaScript frontend manages the user experience. The most difficult part was reliability around nondeterministic model output. I constrained conversation history, validated generated quizzes and plans with Pydantic schemas, scored quizzes in Python, and treated uploaded documents as untrusted data. For RAG, I parse and chunk documents, embed them with BGE-M3, retrieve relevant chunks using normalized NumPy cosine similarity, and send only that evidence to Qwen with source metadata. The project taught me that useful AI engineering is as much about boundaries, validation, and failure behavior as it is about calling a model.

## Technical Interview Questions and Talking Points

### 1. Why use local models instead of a hosted API?

- The project goal was to understand and demonstrate a no-paid-AI-API, local-first architecture.
- Local inference gives direct control over models, context, errors, and document flow.
- The tradeoff is hardware-dependent latency and a more involved setup; a hosted API would be easier to deploy.

### 2. Why Qwen3.5 4B?

- It offers a practical model-size/capability tradeoff for local portfolio hardware.
- Its multilingual behavior supports the English/Simplified Chinese product requirement.
- The model is integrated rather than claimed as original project work, and larger models could improve quality at higher resource cost.

### 3. Why BGE-M3 for embeddings?

- The Documents mode needs retrieval across both English and Chinese.
- BGE-M3 provides multilingual embeddings through the same Ollama runtime as generation.
- Keeping one local runtime reduces integration and deployment complexity.

### 4. How does the RAG pipeline work?

- Upload validation and local parsing produce normalized text.
- Semantic splitting creates bounded overlapping chunks, which BGE-M3 embeds once at upload.
- A question is embedded once; normalized NumPy matrix multiplication ranks chunks by cosine similarity.
- Relevant excerpts become an untrusted, grounded prompt for Qwen; the API returns the answer plus source metadata.

### 5. Why NumPy instead of a vector database?

- v1 intentionally supports at most 10 temporary documents in one process.
- Exact in-memory search is transparent, dependency-light, and sufficient at that scale.
- At production scale, persistent vector storage, metadata filtering, indexing, and multi-user isolation would justify a vector database.

### 6. How do you reduce hallucination in document answers?

- Only retrieved excerpts are supplied as evidence, and the prompt forbids general-knowledge additions.
- A relevance threshold skips generation when evidence is weak.
- Answers include source metadata so users can inspect the basis.
- This reduces risk but is not a proof of factual correctness; formal retrieval/generation evaluation remains future work.

### 7. How are multi-turn context and structured outputs made reliable?

- Chat accepts only user/assistant roles and sends recent successful turns within a 12-message, 3,000-character budget.
- Quiz and Study Plan use JSON Schema-constrained output and Pydantic validation.
- Invalid structured data is retried once, then rejected; quiz grading remains deterministic Python logic.

### 8. What would change for production scale?

- Add authentication, per-user isolation, rate limits, persistent databases/object storage, and a persistent vector index.
- Introduce background ingestion jobs, request queues, observability, security scanning, and a tested deployment target.
- Build retrieval and learning-quality evaluation sets before optimizing models or reranking.
- Keep the current service boundaries, but replace process-memory stores with production components only where scale requires them.

## Honest Scope Notes

- Do not claim that this project created Ollama, Qwen3.5, BGE-M3, FastAPI, pypdf, semantic-text-splitter, or NumPy.
- Do not claim user adoption, benchmark gains, research findings, or production readiness without evidence.
- Prefer: “Built a local RAG pipeline integrating BGE-M3 embeddings, NumPy retrieval, and Qwen generation.”
- Describe the result as a v1.0 release candidate until manual visual review and release tagging are complete.
