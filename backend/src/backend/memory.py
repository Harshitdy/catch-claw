from __future__ import annotations

import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

try:
    from mem0 import Memory
except (ImportError, ModuleNotFoundError):  # pragma: no cover
    Memory = None


class MemoryService:
    def __init__(self) -> None:
        self._fallback: dict[str, list[str]] = defaultdict(list)
        self._client = None
        if Memory is None:
            logger.warning("mem0 import failed, using in-memory fallback")
            return

        try:
            self._client = Memory()
        except Exception as exc:  # pragma: no cover
            logger.warning("mem0 init failed, using in-memory fallback: %s", exc)
            self._client = None

    def add(self, user_id: str, text: str) -> None:
        if self._client is not None:
            try:
                self._client.add(text, user_id=user_id)
                return
            except Exception as exc:  # pragma: no cover
                logger.warning("mem0 add failed, falling back: %s", exc)
        self._fallback[user_id].append(text)

    def search(self, user_id: str, query: str, limit: int = 5) -> list[str]:
        if self._client is not None:
            try:
                results = self._client.search(query, user_id=user_id, limit=limit)
                memories: list[str] = []
                for item in results or []:
                    if isinstance(item, dict):
                        memory = item.get("memory") or item.get("text") or ""
                    else:
                        memory = str(item)
                    if memory:
                        memories.append(memory)
                return memories[:limit]
            except Exception as exc:  # pragma: no cover
                logger.warning("mem0 search failed, falling back: %s", exc)

        user_memories = self._fallback.get(user_id, [])
        query_lower = query.lower()
        matched = [m for m in user_memories if query_lower in m.lower()]
        if not matched:
            matched = user_memories[-limit:]
        return matched[:limit]
