from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _postgres_connection_uri() -> str:
    """mem0 / vecs need a Postgres URI. Prefer explicit var, else Supabase Dashboard 'DATABASE_URL'."""
    explicit = os.getenv("SUPABASE_DB_CONNECTION_STRING", "").strip()
    if explicit:
        return explicit
    return os.getenv("DATABASE_URL", "").strip()


@dataclass(frozen=True)
class Settings:
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_chat_model: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    openai_embedding_model: str = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
    supabase_db_connection_string: str = field(default_factory=_postgres_connection_uri)
    supabase_campaign_table: str = os.getenv("SUPABASE_CAMPAIGNS_TABLE", "campaigns")
    mem0_user_id_prefix: str = os.getenv("MEM0_USER_ID_PREFIX", "user")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
