# AI Study Assistant Project Rules

- This project is an AI Study Assistant web application.
- Keep the code simple, readable, modular, and beginner-friendly.
- Prefer clear implementations over unnecessary abstraction.
- Use English for:
  - filenames
  - variable names
  - function names
  - class names
  - code comments
  - Git commit messages
- Before making changes, inspect the existing repository structure and relevant files.
- Never delete or overwrite existing user code unless it is clearly necessary.
- Make changes incrementally rather than rewriting the whole project.
- Do not add unnecessary dependencies.
- Never commit API keys, passwords, tokens, `.env` files, or other secrets.
- When environment variables are needed, use `.env.example`.
- After implementing a task, run appropriate checks or tests whenever possible.
- If a task fails, diagnose the cause before making unrelated changes.

## MOST IMPORTANT — SESSION RECOVERY

If the conversation context appears incomplete, the Codex session restarts, the connection is interrupted, or you are unsure what work has already been completed:

1. Do not guess.
2. Inspect the repository.
3. Read `AGENTS.md`.
4. Read `PROJECT_STATUS.md`.
5. Check `git status`.
6. Check recent Git history using `git log --oneline -10`.
7. Inspect changed files and relevant code.
8. Reconstruct the current project state before continuing.

The repository and Git history are the source of truth, not previous chat memory.
