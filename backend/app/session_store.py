"""
Session store abstraction with in-memory and file-backed implementations.

InMemorySessionStore: default, sessions lost on restart (development).
FileSessionStore: JSON file persistence with atomic writes (production).

The store is selected via SESSION_STORE env var ("memory" or "file").
File store path is controlled by SESSION_FILE_PATH (default: sessions.json in working dir).
"""

import json
import os
import threading
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional


class SessionStore(ABC):
    @abstractmethod
    def get(self, session_id: str) -> Optional[dict]:
        pass

    @abstractmethod
    def set(self, session_id: str, data: dict) -> None:
        pass

    @abstractmethod
    def delete(self, session_id: str) -> None:
        pass


class InMemorySessionStore(SessionStore):
    def __init__(self):
        self._sessions: dict[str, dict] = {}

    def get(self, session_id: str) -> Optional[dict]:
        session = self._sessions.get(session_id)
        if not session:
            return None
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if isinstance(expires_at, datetime) and expires_at <= datetime.now(timezone.utc):
            self._sessions.pop(session_id, None)
            return None
        return session

    def set(self, session_id: str, data: dict) -> None:
        self._sessions[session_id] = data

    def delete(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)


class FileSessionStore(SessionStore):
    def __init__(self, file_path: str = "sessions.json"):
        self._file_path = file_path
        self._lock = threading.Lock()
        self._sessions = self._load()

    def _load(self) -> dict[str, dict]:
        if not os.path.exists(self._file_path):
            return {}
        try:
            with open(self._file_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def _save(self) -> None:
        tmp_path = self._file_path + ".tmp"
        with open(tmp_path, "w") as f:
            json.dump(self._sessions, f, default=str)
        os.replace(tmp_path, self._file_path)

    def get(self, session_id: str) -> Optional[dict]:
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                return None
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at)
                except ValueError:
                    self._sessions.pop(session_id, None)
                    self._save()
                    return None
            if isinstance(expires_at, datetime) and expires_at <= datetime.now(timezone.utc):
                self._sessions.pop(session_id, None)
                self._save()
                return None
            return session

    def set(self, session_id: str, data: dict) -> None:
        with self._lock:
            self._sessions[session_id] = data
            self._save()

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)
            self._save()


def create_session_store() -> SessionStore:
    store_type = os.getenv("SESSION_STORE", "memory").lower()
    if store_type == "file":
        file_path = os.getenv("SESSION_FILE_PATH", "sessions.json")
        return FileSessionStore(file_path)
    return InMemorySessionStore()
