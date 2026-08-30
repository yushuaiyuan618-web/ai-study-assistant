# AI Study Assistant - Project Status

## Current Stage
Step 8 AI Study Plan mode implemented

## Completed
- Git repository initialized
- GitHub remote configured
- Codex workflow configuration created
- Basic FastAPI backend structure created
- Basic static frontend structure created
- Root API endpoint created
- Responsive AI chat-style frontend interface created
- Frontend-only user message interaction created
- English and Simplified Chinese interface switching added
- Selected interface language is saved in the browser
- Existing frontend is served through FastAPI
- Chat and health API endpoints created
- Frontend displays temporary bilingual backend responses
- Loading and connection error states added
- Provider-aware AI service layer created
- Ollama Responses API integration created
- Local AI loading and error states added
- Local AI setup and architecture documented
- Current-session multi-turn conversation context added
- Chat history is validated as user and assistant messages only
- Frontend sends previous completed messages with each new chat request
- Ollama receives the latest 12 history messages plus the current message
- English and Simplified Chinese contextual follow-ups verified with Qwen3.5 4B
- Model input is limited to 3,000 characters while preserving recent context
- Default AI instructions now favor direct, concise answers and simple Unicode notation
- Empty Ollama responses retry once without duplicating the user message
- Ollama connection, model, timeout, empty-response, and generation errors are distinguished
- Assistant Markdown is rendered safely without a frontend dependency
- Dedicated Explain view added without replacing the existing Chat view
- Explain requests support Simple, Detailed, and With Example teaching styles
- English and Simplified Chinese Explain UI, loading, output, and error states added
- `/api/explain` validates one-shot explanation requests separately from chat history
- Explain mode uses the existing local Ollama and Qwen3.5 4B generation pipeline
- Explain output uses the existing safe Markdown renderer
- Dedicated bilingual Quiz view added with topic and Easy / Medium / Hard controls
- Local Qwen generates exactly 5 structured multiple-choice questions with 4 options each
- Generated quiz JSON is constrained by schema and validated with Pydantic before use
- `/api/quiz/generate` returns questions without answer keys or explanations
- Quiz answer keys are stored temporarily in process memory under random UUIDs
- `/api/quiz/submit` uses deterministic Python scoring and returns per-question explanations
- Completed quizzes are removed from temporary storage and cannot be submitted again
- Quiz loading, incomplete-answer, expired-session, result, and New Quiz states added
- Quiz state remains separate from Chat conversation history and Explain state
- English Easy, Medium, Hard and Simplified Chinese quiz generation verified with Qwen3.5 4B
- Existing multi-turn Chat and Explain endpoints passed live regression checks
- Dedicated bilingual Study Plan view added with learning goal, level, daily time, and duration controls
- Study Plan supports Beginner / Intermediate / Advanced and 7-day / 30-day plans
- `/api/study-plan` validates goals, levels, 15–480 daily minutes, durations, and language
- Local Qwen generates structured plan titles, overviews, and exactly 7 or 30 ordered daily entries
- Study Plan JSON reuses the Quiz JSON Schema flow and is validated with Pydantic before use
- Each validated day contains a focus, 2–5 tasks, an in-budget time estimate, and a daily outcome
- Study Plan loading, inline validation, failure, result, and Create New Plan states added
- Study Plan state remains separate from Chat, Explain, and Quiz state
- English and Simplified Chinese 7-day and 30-day plans verified with local Qwen3.5 4B
- Beginner and advanced plan behavior and daily time-budget behavior verified with local Qwen3.5 4B
- Health, static frontend, Study Plan API, Chat context, Explain, Quiz generation, and scoring passed HTTP regression checks

## In Progress
- None

## Next Step
- Manually verify the Step 8 interface in a browser, then review the uncommitted changes before starting Step 9

## Important Decisions
- Development will be incremental.
- Each major completed step should be committed to Git.
- Secrets must never be committed.
- The backend uses Python and FastAPI.
- The frontend uses HTML, CSS, and vanilla JavaScript.
- Step 2 was frontend-only; Step 3 connects it to FastAPI without AI functionality.
- Language switching uses a simple JavaScript translation object and localStorage.
- Step 3 uses deterministic responses and does not include an AI model.
- Step 4 defaults to local Ollama with the Qwen3.5 4B model.
- The OpenAI Python SDK communicates only with the configured local Ollama URL.
- The frontend and `/api/chat` contract remain independent of the AI provider.
- Conversation memory exists only in the current browser page session.
- Only successful user and assistant messages become conversation context.
- Model context is capped at the latest 12 messages and 3,000 input characters without tokenizer dependencies.
- Conversation history is not stored in a database, server session, or browser storage.
- The backend retries only empty model output and reuses the same non-duplicated model input.
- Frontend Markdown rendering uses DOM text nodes instead of injecting model-generated HTML.
- Explain mode is intentionally one-shot and does not read or modify Chat conversation history.
- Explanation style and language are enforced through backend-controlled tutor instructions.
- Chat and Explain share the same local model configuration, retry behavior, and typed error handling.
- Quiz generation uses Ollama's OpenAI-compatible JSON Schema response format plus Pydantic validation.
- Quiz generation disables model thinking, uses deterministic settings, and retries malformed structured output once.
- Quiz sessions use a small process-memory dictionary; server restarts invalidate unfinished quizzes.
- Correct answers and explanations remain backend-only until the quiz is submitted.
- Multiple-choice scoring is deterministic Python logic and does not make a second AI request.
- Study Plan generation reuses the Quiz structured-output helper instead of adding another Ollama client.
- Study Plan prompts and validation enforce the selected level, exact duration, and daily time ceiling.
- Generated study plans exist only in the current page session and are not persisted.
- Study Plan rendering uses DOM text content and never injects AI-generated HTML.

## Known Issues
- Automated browser interaction was unavailable, so Study Plan navigation, controls, generated layout, language switching, reset behavior, and responsive styling need a brief manual visual check.
- Local quiz generation took roughly 10–20 seconds in warm-model tests and may be slower after a cold start.
- Local 30-day Study Plan generation took roughly 95 seconds in warm-model tests and may be slower after a cold start.
- Unfinished quizzes are intentionally lost when the FastAPI process restarts.
- Generated study plans are intentionally lost when the page is refreshed.
