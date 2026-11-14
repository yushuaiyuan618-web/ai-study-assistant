"""Optional isolated browser server; copies real SQLite data, never seeds fake nodes."""
import argparse
from contextlib import asynccontextmanager, closing
from pathlib import Path
import sqlite3
import sys
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import uvicorn
from fastapi.responses import JSONResponse

from app import journal_service as journal
from app.main import app


@asynccontextmanager
async def no_worker(application):
    # Visualization checks do not need background inference or mutate the source DB.
    yield


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=journal.DATABASE_PATH)
    parser.add_argument("--port", type=int, default=8015)
    parser.add_argument("--empty", action="store_true")
    parser.add_argument("--fail-knowledge", action="store_true")
    args = parser.parse_args()
    with TemporaryDirectory(prefix="knowledge-map-browser-") as directory:
        target = Path(directory) / "browser.sqlite3"
        if not args.empty:
            with closing(sqlite3.connect(args.database.resolve().as_uri() + "?mode=ro", uri=True)) as source:
                with closing(sqlite3.connect(target)) as destination:
                    source.backup(destination)
        journal.DATABASE_PATH = target
        app.router.lifespan_context = no_worker
        if args.fail_knowledge:
            @app.middleware("http")
            async def fail_knowledge(request, call_next):
                if request.url.path.startswith("/api/knowledge/"):
                    return JSONResponse({"detail": "Test-only unavailable storage"}, status_code=503)
                return await call_next(request)
        uvicorn.run(app, host="127.0.0.1", port=args.port)
