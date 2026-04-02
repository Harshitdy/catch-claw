from __future__ import annotations

from fastapi import APIRouter, HTTPException
from supabase import Client, create_client

from ..config import settings
from ..models import LeadCreate, LeadOut, LeadUpdate

router = APIRouter(tags=["leads"])


def _get_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    return create_client(settings.supabase_url, settings.supabase_key)


@router.get("/campaigns/{campaign_id}/leads", response_model=list[LeadOut])
def list_leads(campaign_id: str) -> list[LeadOut]:
    client = _get_client()
    response = (
        client.table("leads")
        .select("*")
        .eq("campaign_id", campaign_id)
        .execute()
    )
    return [LeadOut(**row) for row in (response.data or [])]


@router.post(
    "/campaigns/{campaign_id}/leads",
    response_model=LeadOut,
    status_code=201,
)
def create_lead(campaign_id: str, body: LeadCreate) -> LeadOut:
    client = _get_client()
    payload = body.model_dump(exclude_none=True)
    payload["campaign_id"] = campaign_id
    response = client.table("leads").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create lead")
    return LeadOut(**response.data[0])


@router.put("/leads/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: str, body: LeadUpdate) -> LeadOut:
    client = _get_client()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    response = (
        client.table("leads")
        .update(updates)
        .eq("id", lead_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadOut(**response.data[0])


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: str) -> dict[str, bool]:
    client = _get_client()
    response = (
        client.table("leads")
        .delete()
        .eq("id", lead_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True}
