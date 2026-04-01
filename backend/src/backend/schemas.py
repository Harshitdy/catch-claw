from __future__ import annotations

from pydantic import BaseModel, Field


class ChatOption(BaseModel):
    id: str
    label: str
    value: str
    action: str = "train_campaign"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    user_id: str = Field(min_length=1, default="default-user")
    session_id: str = Field(min_length=1, default="default-session")
    selected_campaign_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    options: list[ChatOption] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
