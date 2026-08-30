# AI Study Assistant - Deployment and Sharing

Last reviewed: 2026-08-30

## Decision: Tester-Friendly Local Distribution

The recommended v1 sharing strategy is **Option B: local tester distribution**. No public deployment configuration is included.

This is a quality decision, not a claim that hosting is technically impossible. The complete application depends on a FastAPI server, an Ollama generation model, an Ollama embedding model, local document processing, and temporary in-memory state. The available no-cost hosting paths either cannot run that architecture or would present a slow, fragile version that is not representative of the project.

## Options Evaluated

| Option | Finding | Decision |
| --- | --- | --- |
| GitHub clone / release | Preserves the complete application and lets reviewers run the documented models locally. Model files remain outside Git. | Recommended |
| GitHub Pages | Suitable for static HTML/CSS/JS, but cannot run FastAPI, Ollama, document parsing, or RAG. | Not a full demo |
| GitHub Codespaces | Personal accounts have limited included compute/storage, but each tester needs an account/environment and model downloads; it is not a durable public app. | Optional development environment, not distribution target |
| Hugging Face Static Space | Free static hosting cannot run the Python backend or models. | Not suitable |
| Hugging Face Docker Space | Technically supports FastAPI and custom containers, but current compute-Space creation requires a paid account plan. Free hardware also sleeps and uses ephemeral disk. | Not zero-cost/reliable enough |
| Hugging Face CPU Basic | Listed as 2 vCPU, 16 GB RAM, and 50 GB non-persistent disk at no hourly hardware charge, but new Docker/Gradio compute Spaces currently require a paid plan. CPU inference would also be slow for this multi-model workflow. | Not selected |
| Hugging Face ZeroGPU | Current hosting is Gradio-only and requires an eligible paid plan for the Space owner. Adopting it would require replacing the existing frontend/runtime path rather than deploying the real app. | Architecturally inappropriate |

## Why a Hugging Face Space Was Deferred

1. **Account cost:** current Hugging Face documentation says Static Spaces are free for everyone, while new Gradio and Docker compute Spaces require a paid plan; ZeroGPU hosting also requires an eligible paid plan.
2. **Architecture mismatch:** the existing application is FastAPI plus a custom static frontend and local Ollama. A Docker Space would be required; ZeroGPU is exclusive to Gradio.
3. **Model footprint:** Ollama reports approximately 3.4 GB for `qwen3.5:4b` and 1.2 GB for `bge-m3`. A cold or rebuilt environment would need to obtain both before serving the full experience.
4. **Reliability:** free hardware sleeps after inactivity and Space disk is ephemeral, so model availability and startup time would be inconsistent unless models were built into a large image or backed by additional storage.
5. **Performance:** 2-vCPU inference would misrepresent interactive Chat, structured Quiz/Study Plan generation, and 30-day plan latency.
6. **Maintenance:** adding Docker/Ollama boot orchestration solely for a constrained demo would create a second deployment architecture without improving the local product.

The project does not substitute a hosted paid API, a canned response demo, or a smaller model while presenting it as equivalent.

## Best Current Test Path

1. Clone the GitHub repository.
2. Install Python dependencies in `.venv`.
3. Install Ollama and pull `qwen3.5:4b` plus `bge-m3`.
4. Copy `.env.example` to `.env`.
5. Run `start.bat`, `sh start.sh`, or the documented Uvicorn command.
6. Use `examples/sample_study_notes.txt` for an immediate RAG test.

See [TESTER_GUIDE.md](TESTER_GUIDE.md) for exact commands and prompts.

After manual v1.0 review, a GitHub Release is a useful distribution layer: GitHub automatically provides source ZIP/tar archives for a tag. Model weights should not be attached because Ollama manages them separately under their own licenses.

## What a Production/Public Deployment Would Require

- A paid or self-hosted machine with appropriate CPU/GPU memory for both models
- A reproducible container or service configuration for FastAPI and Ollama
- Persistent model storage to avoid multi-gigabyte cold downloads
- Authentication, per-user document isolation, upload security, and rate limiting
- Persistent object/document storage and a durable vector index
- Request queues and longer-job handling for model generation and document indexing
- TLS, reverse-proxy configuration, health/readiness checks, logs, metrics, and resource limits
- Evaluation of retrieval quality, model output, concurrency, and abuse cases
- License/notice review for any redistributed model artifacts

These changes are intentionally outside the v1 portfolio scope.

## Sources Consulted

### Hugging Face official documentation

- [Spaces overview and current account/hardware rules](https://huggingface.co/docs/hub/spaces-overview)
- [Docker Spaces](https://huggingface.co/docs/hub/spaces-sdks-docker)
- [ZeroGPU compatibility and hosting rules](https://huggingface.co/docs/hub/spaces-zerogpu)
- [Spaces disk and persistence](https://huggingface.co/docs/hub/spaces-storage)

### GitHub official documentation

- [About repository README files](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Cloning a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
- [About GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [Included Codespaces usage](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-included-usage)
- [About GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)

### Model/runtime sources

- [Ollama Qwen3.5 4B model page](https://ollama.com/library/qwen3.5:4b)
- [Ollama BGE-M3 model page](https://ollama.com/library/bge-m3)
- [Ollama Docker documentation](https://docs.ollama.com/docker)

The hosting landscape changes. Recheck these official pages before implementing a future public deployment.
