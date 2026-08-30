@echo off
setlocal

set "PYTHON_COMMAND=python"
if exist ".venv\Scripts\python.exe" set "PYTHON_COMMAND=.venv\Scripts\python.exe"

echo Starting AI Study Assistant at http://127.0.0.1:8000/
%PYTHON_COMMAND% -m uvicorn app.main:app --reload
