from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: str = Field(default="draft", pattern="^(draft|active|paused|completed)$")


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: str | None = Field(default=None, pattern="^(draft|active|paused|completed)$")


class CampaignOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    status: str
    lead_count: int = 0
    created_at: datetime
    updated_at: datetime


class LeadCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = None
    email: str = Field(min_length=1, max_length=255)
    company: str | None = None
    phone: str | None = None
    notes: str | None = None
    status: str = Field(default="new", pattern="^(new|contacted|qualified|converted)$")


class LeadUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = None
    email: str | None = Field(default=None, min_length=1, max_length=255)
    company: str | None = None
    phone: str | None = None
    notes: str | None = None
    status: str | None = Field(default=None, pattern="^(new|contacted|qualified|converted)$")


class LeadOut(BaseModel):
    id: str
    campaign_id: str
    first_name: str
    last_name: str | None = None
    email: str
    company: str | None = None
    phone: str | None = None
    notes: str | None = None
    status: str
    created_at: datetime
