from __future__ import annotations

import re
from textwrap import dedent

from openai import OpenAI

from .config import settings
from .memory import MemoryService
from .schemas import ChatOption, ChatResponse
from .supabase_client import SupabaseCampaignService

TRAIN_CAMPAIGN_PATTERN = re.compile(r"\b(train|training)\b.*\b(campaign|campaigns)\b|\b(campaign|campaigns)\b.*\b(train|training)\b", re.IGNORECASE)


class AgentService:
    def __init__(self) -> None:
        self.memory = MemoryService()
        self.campaigns = SupabaseCampaignService()
        self.openai = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def chat(self, message: str, user_id: str, selected_campaign_id: str | None = None) -> ChatResponse:
        self.memory.add(user_id, f"User: {message}")

        if selected_campaign_id:
            reply = f"Great choice. I will start training campaign `{selected_campaign_id}` now."
            self.memory.add(user_id, f"Assistant: {reply}")
            return ChatResponse(
                reply=reply,
                metadata={"intent": "campaign_selected", "campaign_id": selected_campaign_id},
            )

        if TRAIN_CAMPAIGN_PATTERN.search(message):
            campaigns = self.campaigns.list_campaigns()
            if not campaigns:
                reply = "I couldn't find campaigns right now. Please check Supabase credentials/table and try again."
                self.memory.add(user_id, f"Assistant: {reply}")
                return ChatResponse(reply=reply, metadata={"intent": "train_campaign", "campaigns_count": 0})

            options = [
                ChatOption(
                    id=campaign.id,
                    label=f"{campaign.name}{f' ({campaign.status})' if campaign.status else ''}",
                    value=campaign.id,
                )
                for campaign in campaigns
            ]
            reply = "Sure — choose the campaign you want me to train:"
            self.memory.add(user_id, f"Assistant: {reply} options={','.join(c.id for c in campaigns)}")
            return ChatResponse(
                reply=reply,
                options=options,
                metadata={"intent": "train_campaign", "campaigns_count": len(options)},
            )

        memory_context = self.memory.search(user_id, message, limit=5)
        context_blob = "\n".join(f"- {entry}" for entry in memory_context)

        if self.openai is None:
            fallback = "I can help with that. Add OPENAI_API_KEY to enable full assistant responses."
            self.memory.add(user_id, f"Assistant: {fallback}")
            return ChatResponse(reply=fallback, metadata={"intent": "general", "provider": "none"})

        completion = self.openai.chat.completions.create(
            model=settings.openai_chat_model,
            messages=[
                {
                    "role": "system",
                    "content": dedent(
                        """
                        You are an agentic campaign assistant.
                        - Be concise and actionable.
                        - If user asks to train campaigns, do not ask for typed IDs; ask them to click options.
                        - Use memory context when relevant.
                        """
                    ).strip(),
                },
                {
                    "role": "system",
                    "content": f"Retrieved memory context:\n{context_blob if context_blob else 'No prior memory found.'}",
                },
                {"role": "user", "content": message},
            ],
            temperature=0.2,
        )

        reply = completion.choices[0].message.content or "I can help with that."
        self.memory.add(user_id, f"Assistant: {reply}")
        return ChatResponse(reply=reply, metadata={"intent": "general", "provider": "openai"})
