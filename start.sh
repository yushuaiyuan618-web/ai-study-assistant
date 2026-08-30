#!/usr/bin/env sh
set -eu

python_command="python3"
if [ -x ".venv/bin/python" ]; then
    python_command=".venv/bin/python"
fi

echo "Starting AI Study Assistant at http://127.0.0.1:8000/"
exec "$python_command" -m uvicorn app.main:app --reload
