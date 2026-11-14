"""One lightweight background thread; SQLite owns job durability and claims."""

import logging
from threading import Condition, Event, Thread
import time

from app import knowledge_store as store
from app.knowledge_service import JobCancelled, process_pending_once


logger = logging.getLogger(__name__)


class KnowledgeWorker:
    def __init__(self, idle_seconds=5):
        self.idle_seconds = idle_seconds
        self._condition = Condition()
        self._stop = Event()
        self._foreground = 0
        self._idle_since = time.monotonic()
        self._active_job = None
        self._thread = Thread(target=self._run, name="knowledge-worker", daemon=True)

    def start(self):
        self._thread.start()

    def request_started(self):
        with self._condition:
            self._foreground += 1

    def request_finished(self):
        with self._condition:
            self._foreground = max(0, self._foreground - 1)
            self._idle_since = time.monotonic()
            self._condition.notify_all()

    def _wait_for_idle(self):
        with self._condition:
            while not self._stop.is_set():
                idle_remaining = self.idle_seconds - (time.monotonic() - self._idle_since)
                if self._foreground == 0 and idle_remaining <= 0:
                    return
                self._condition.wait(timeout=0.5)
        raise JobCancelled()

    def _checkpoint(self, job):
        with self._condition:
            self._active_job = job
        self._wait_for_idle()

    def _run(self):
        while not self._stop.is_set():
            try:
                self._wait_for_idle()
                result = process_pending_once(self._checkpoint)
                with self._condition:
                    self._active_job = None
                if result is None:
                    self._stop.wait(1)
            except JobCancelled:
                break
            except Exception as error:
                logger.warning("Knowledge worker unavailable: %s", type(error).__name__)
                self._stop.wait(5)

    def stop(self):
        self._stop.set()
        with self._condition:
            active = self._active_job
            self._condition.notify_all()
        if active is not None:
            try:
                store.release_job(active["entry"]["id"], active["token"])
            except Exception as error:
                logger.warning("Unable to release knowledge job: %s", type(error).__name__)
        # In-flight Ollama calls cannot be cancelled; their stale token cannot commit.
        self._thread.join(timeout=1)
