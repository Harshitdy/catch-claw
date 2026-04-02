from __future__ import annotations

import logging
from typing import Any

from mem0 import Memory
from supabase import Client, create_client

from .config import settings

logger = logging.getLogger(__name__)


class SupabaseMemoryService:
    """Stores short-term memory as raw rows in Supabase; long-term via mem0 + Supabase (pgvector / vecs)."""

    def __init__(self) -> None:
        self._client: Client | None = None
        self._mem0: Memory | None = None

        if settings.supabase_url and settings.supabase_key:
            self._client = create_client(settings.supabase_url, settings.supabase_key)

        if settings.supabase_db_connection_string and settings.openai_api_key:
            try:
                config = {
                    "vector_store": {
                        "provider": "supabase",
                        "config": {
                            "connection_string": settings.supabase_db_connection_string,
                            "collection_name": "memories",
                        },
                    },
                }
                self._mem0 = Memory.from_config(config)
            except Exception as exc:
                logger.warning("mem0 long-term memory (Supabase vector store) unavailable: %s", exc)
                self._mem0 = None

    def add_short_term(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str,
        campaign_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Store a raw message in short_term_memory table."""
        if self._client is None:
            logger.warning("Supabase not configured, skipping short-term memory store")
            return

        row: dict[str, Any] = {
            "user_id": user_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "metadata": metadata or {},
        }
        if campaign_id:
            row["campaign_id"] = campaign_id

        try:
            self._client.table("short_term_memory").insert(row).execute()
        except Exception as exc:
            logger.warning("Failed to store short-term memory: %s", exc)

    def get_short_term(
        self,
        user_id: str,
        session_id: str,
        campaign_id: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Retrieve recent short-term memory for a session."""
        if self._client is None:
            return []

        try:
            query = (
                self._client.table("short_term_memory")
                .select("*")
                .eq("user_id", user_id)
                .eq("session_id", session_id)
                .order("created_at", desc=False)
                .limit(limit)
            )
            if campaign_id:
                query = query.eq("campaign_id", campaign_id)
            response = query.execute()
            return response.data or []
        except Exception as exc:
            logger.warning("Failed to retrieve short-term memory: %s", exc)
            return []

    def add_long_term(
        self,
        user_id: str,
        content: str,
        campaign_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Store content in mem0's Supabase-backed vector collection."""
        if self._mem0 is None:
            logger.warning("mem0 not configured, skipping long-term memory store")
            return

        meta: dict[str, Any] = dict(metadata or {})
        if campaign_id:
            meta["campaign_id"] = campaign_id

        try:
            self._mem0.add(content, user_id=user_id, metadata=meta, infer=False)
        except Exception as exc:
            logger.warning(
                "Failed to store long-term memory (mem0 → Supabase pgvector/vecs `memories`, not REST table long_term_memory): %s",
                exc,
            )

    def search_long_term(
        self,
        user_id: str,
        query: str,
        campaign_id: str | None = None,
        limit: int = 5,
    ) -> list[str]:
        """Vector similarity search over long-term memories scoped to user (and optional campaign)."""
        if self._mem0 is None:
            return []

        filters: dict[str, Any] = {}
        if campaign_id:
            filters["campaign_id"] = campaign_id

        try:
            response = self._mem0.search(
                query,
                user_id=user_id,
                limit=limit,
                filters=filters or None,
                rerank=False,
            )
        except Exception as exc:
            logger.warning("Failed to search long-term memory: %s", exc)
            return []

        memories: list[str] = []
        for item in response.get("results") or []:
            if not isinstance(item, dict):
                text = str(item)
            else:
                text = item.get("memory") or item.get("text") or ""
            if text:
                memories.append(text)
        return memories[:limit]
