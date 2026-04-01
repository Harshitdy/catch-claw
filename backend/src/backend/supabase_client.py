from __future__ import annotations

from dataclasses import dataclass

from supabase import Client, create_client

from .config import settings


@dataclass
class Campaign:
    id: str
    name: str
    status: str | None = None


class SupabaseCampaignService:
    def __init__(self) -> None:
        self._client: Client | None = None
        if settings.supabase_url and settings.supabase_key:
            self._client = create_client(settings.supabase_url, settings.supabase_key)

    def list_campaigns(self, limit: int = 20) -> list[Campaign]:
        if self._client is None:
            return []

        response = (
            self._client.table(settings.supabase_campaign_table)
            .select("id,name,status")
            .limit(limit)
            .execute()
        )

        campaigns: list[Campaign] = []
        for item in response.data or []:
            campaign_id = str(item.get("id", "")).strip()
            name = str(item.get("name", "")).strip()
            status = item.get("status")
            if campaign_id and name:
                campaigns.append(Campaign(id=campaign_id, name=name, status=status))
        return campaigns
