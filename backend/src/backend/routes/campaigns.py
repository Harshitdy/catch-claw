from __future__ import annotations

from fastapi import APIRouter, HTTPException
from supabase import Client, create_client

from ..config import settings
from ..models import CampaignCreate, CampaignOut, CampaignUpdate

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _get_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    return create_client(settings.supabase_url, settings.supabase_key)


@router.get("/", response_model=list[CampaignOut])
def list_campaigns() -> list[CampaignOut]:
    client = _get_client()
    response = client.table("campaigns").select("*").execute()
    return [CampaignOut(**row) for row in (response.data or [])]


@router.post("/", response_model=CampaignOut, status_code=201)
def create_campaign(body: CampaignCreate) -> CampaignOut:
    client = _get_client()
    response = (
        client.table("campaigns")
        .insert(body.model_dump(exclude_none=True))
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create campaign")
    return CampaignOut(**response.data[0])


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: str) -> CampaignOut:
    client = _get_client()
    response = (
        client.table("campaigns")
        .select("*")
        .eq("id", campaign_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignOut(**response.data[0])


@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(campaign_id: str, body: CampaignUpdate) -> CampaignOut:
    client = _get_client()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = (
        client.table("campaigns")
        .update(updates)
        .eq("id", campaign_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignOut(**response.data[0])


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: str) -> dict[str, bool]:
    client = _get_client()
    response = (
        client.table("campaigns")
        .delete()
        .eq("id", campaign_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"ok": True}
