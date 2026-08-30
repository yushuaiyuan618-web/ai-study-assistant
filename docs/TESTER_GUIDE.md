# AI Study Assistant - Tester Guide

This guide is the shortest realistic path for a professor, classmate, friend, or reviewer to run and explore the complete local application.

## What You Need

- Git
- Python 3.12 recommended
- [Ollama](https://ollama.com/download)
- Enough disk space for approximately 4.6 GB of model files, plus runtime overhead

No paid AI API key is required. The first model downloads take time and require an internet connection; normal inference then runs through local Ollama.

## Setup

Open a terminal and run:

```bash
git clone https://github.com/yushuaiyuan618-web/ai-study-assistant.git
cd ai-study-assistant
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
# macOS/Linux
source .venv/bin/activate
```

Install dependencies and models:

```bash
python -m pip install -r requirements.txt
ollama pull qwen3.5:4b
ollama pull bge-m3
```

Copy the local configuration:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS/Linux
cp .env.example .env
```

Ensure Ollama is running. If needed, start `ollama serve` in another terminal.

## Start

With the Python environment active:

```bash
python -m uvicorn app.main:app --reload
```

Alternatively, use `start.bat` on Windows or `sh start.sh` on macOS/Linux. Open:

- Application: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Health check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

The first request can be slower while Ollama loads a model.

## Suggested Walkthrough

### 1. AI Chat

Ask:

> Explain gradient descent simply.

Then ask:

> Give me one small example of that.

Expected: the second response follows the same topic, demonstrating current-session multi-turn context.

### 2. Explain

- Topic: `binary search`
- Style: **With Example**

Expected: a focused explanation with a concrete example.

### 3. Quiz

- Topic: `Python lists`
- Difficulty: **Medium**

Expected: exactly five questions with four options each. Submit all answers to see deterministic scoring and explanations.

### 4. Study Plan

- Goal: `Learn machine learning fundamentals`
- Level: **Beginner**
- Daily time: **60 minutes**
- Duration: **7 Days**

Expected: seven chronological days with concrete tasks, time estimates, and daily outcomes. A 30-day plan takes longer to generate.

### 5. Documents and Local RAG

1. Open **Documents**.
2. Upload `examples/sample_study_notes.txt`.
3. Keep the document selected.
4. Ask: `Why should the validation set be separate from the test set?`

Expected: a grounded answer and a **Sources** section naming `sample_study_notes.txt`.

Also try:

> What does the learning rate control in gradient descent?

For an unrelated question, the app should say that the selected material does not provide enough information.

### 6. Chinese Mode

Switch the interface to **中文**, then ask:

> 用简单的方式解释梯度下降。

Expected: Simplified Chinese UI and generated content. Chinese questions can also retrieve relevant information from the English sample document.

## Common Setup Problems

- **Cannot connect to Ollama:** start the Ollama application or run `ollama serve`.
- **Generation model not found:** run `ollama pull qwen3.5:4b`.
- **Embedding model not found:** run `ollama pull bge-m3`.
- **Python module missing:** activate `.venv`, then rerun `python -m pip install -r requirements.txt`.
- **Slow first response:** allow Ollama time to load the model; local speed depends on hardware.
- **Scanned PDF rejected:** this version extracts embedded PDF text and intentionally does not include OCR.

When reporting a problem, do not include private documents, `.env` contents, tokens, or other secrets.
