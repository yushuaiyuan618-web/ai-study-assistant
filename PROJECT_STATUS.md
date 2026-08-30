# AI Study Assistant - Project Status

## Current Stage
Step 6 Explain mode implemented

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

## In Progress
- None

## Next Step
- Manually verify the Step 6 Explain interface in a browser, then review these changes before Step 7

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

## Known Issues
- Automated browser interaction was unavailable, so Explain view switching, spacing, responsive layout, and rendered output need a brief manual visual check.
- The first Ollama request after a cold model start can be slow; later requests complete normally after the model is loaded.
