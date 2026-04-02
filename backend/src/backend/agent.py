from __future__ import annotations

import json
import logging
from collections.abc import Iterator
from textwrap import dedent
from typing import Any

from openai import OpenAI

from .config import settings
from .schemas import ChatOption, ChatRequest, ChatResponse
from .supabase_client import Campaign, SupabaseCampaignService
from .supabase_memory import SupabaseMemoryService

logger = logging.getLogger(__name__)

LIST_CAMPAIGNS_TOOL: dict[str, Any] = {
    "type": "function",
    "function": {
        "name": "list_campaigns",
        "description": (
            "Load campaigns from the connected CRM database. Call this when the user wants to train on "
            "campaigns, see what campaigns exist, pick a campaign, compare campaigns, or needs clickable choices. "
            "Do not call this for unrelated questions. After results return, write a natural reply in markdown "
            "and invite them to use the buttons (do not paste raw IDs in your message)."
        ),
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
}


class AgentService:
    def __init__(self) -> None:
        self.memory = SupabaseMemoryService()
        self.campaigns = SupabaseCampaignService()
        self.openai = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def _system_instructions(self) -> str:
        return dedent(
            """
            You are an agentic CRM campaign assistant with access to tools.
            - Decide from the user's message whether you need live campaign data; only then call `list_campaigns`.
            - All user-visible wording is yours — never use fixed scripts from the server.
            - Use markdown when it helps (headings, bullets, bold). The client renders markdown to HTML.
            - Never expose raw database UUIDs in your reply; use campaign names. Tool results may include ids for internal use only.
            - When you have listed campaigns for training or selection, keep your text short and point users to the inline option buttons.
            - If the user shares their name or preferences, remember them in your answers and they may be stored for later turns.
            """
        ).strip()

    def _campaign_options_from_db(self, campaigns: list[Campaign]) -> list[ChatOption]:
        return [
            ChatOption(
                id=c.id,
                label=f"{c.name}{f' ({c.status})' if c.status else ''}",
                value=c.id,
            )
            for c in campaigns
        ]

    def _fetch_campaign_context(self, campaign_id: str) -> str:
        """Fetch campaign details and its leads from Supabase for system prompt context."""
        if self.memory._client is None:
            return ""

        parts: list[str] = []
        try:
            resp = self.memory._client.table("campaigns").select("*").eq("id", campaign_id).limit(1).execute()
            if resp.data:
                campaign = resp.data[0]
                parts.append(f"Campaign: {campaign.get('name', 'N/A')} (status: {campaign.get('status', 'N/A')})")
                for k, v in campaign.items():
                    if k not in ("id", "name", "status", "created_at", "updated_at"):
                        parts.append(f"  {k}: {v}")
        except Exception:
            pass

        try:
            resp = self.memory._client.table("leads").select("*").eq("campaign_id", campaign_id).limit(50).execute()
            if resp.data:
                parts.append(f"\nLeads ({len(resp.data)}):")
                for lead in resp.data:
                    fn = (lead.get("first_name") or "").strip()
                    ln = (lead.get("last_name") or "").strip()
                    nm = f"{fn} {ln}".strip() or lead.get("email") or "Lead"
                    em = lead.get("email") or ""
                    co = lead.get("company") or ""
                    parts.append(f"  - {nm} | {em}" + (f" | {co}" if co else ""))
        except Exception:
            pass

        return "\n".join(parts)

    def _build_messages(
        self,
        user_message: str,
        memory_context: str,
        campaign_id: str | None,
        selected_campaign_id: str | None,
    ) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": self._system_instructions()},
            {
                "role": "system",
                "content": f"Retrieved long-term memory context:\n{memory_context or 'No prior memory found.'}",
            },
        ]
        if campaign_id:
            ctx = self._fetch_campaign_context(campaign_id)
            if ctx:
                messages.append({"role": "system", "content": f"Active campaign context:\n{ctx}"})
        if selected_campaign_id:
            camp = self.campaigns.get_campaign(selected_campaign_id)
            label = camp.name if camp else "the selected campaign"
            messages.append(
                {
                    "role": "system",
                    "content": (
                        f"The user focused this chat on campaign **{label}** by clicking an option in the UI. "
                        "Acknowledge naturally if appropriate, then continue helping. Do not print database IDs."
                    ),
                }
            )
        messages.append({"role": "user", "content": user_message})
        return messages

    def _agent_complete(
        self,
        messages: list[dict[str, Any]],
    ) -> tuple[str, list[ChatOption]]:
        """Run tool loop until the model returns assistant text (no tool calls)."""
        if self.openai is None:
            return "Add OPENAI_API_KEY to enable the assistant.", []

        options_out: list[ChatOption] = []
        working = list(messages)

        for _ in range(10):
            try:
                resp = self.openai.chat.completions.create(
                    model=settings.openai_chat_model,
                    messages=working,
                    tools=[LIST_CAMPAIGNS_TOOL],
                    tool_choice="auto",
                    temperature=0.2,
                    stream=False,
                )
            except Exception:
                logger.exception("OpenAI completion failed (tool round)")
                return "I couldn’t reach the AI. Please try again.", options_out

            msg = resp.choices[0].message
            tcalls = msg.tool_calls

            if tcalls:
                try:
                    dumped = msg.model_dump(exclude_none=True)
                except AttributeError:
                    dumped = {
                        "role": "assistant",
                        "content": msg.content,
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments or "{}",
                                },
                            }
                            for tc in tcalls
                        ],
                    }
                working.append(dumped)
                for tc in tcalls:
                    if tc.function.name == "list_campaigns":
                        campaigns = self.campaigns.list_campaigns()
                        options_out = self._campaign_options_from_db(campaigns)
                        tool_payload = [
                            {
                                "name": c.name,
                                "status": c.status,
                                "lead_focus_id": c.id,
                            }
                            for c in campaigns
                        ]
                        working.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": json.dumps({"campaigns": tool_payload}),
                            }
                        )
                    else:
                        working.append(
                            {
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": json.dumps({"error": f"unknown tool: {tc.function.name}"}),
                            }
                        )
                continue

            text = (msg.content or "").strip() or "I can help with that."
            return text, options_out

        return "I hit a limit juggling tools for this request. Please try again in a shorter way.", options_out

    def _stream_reply_in_chunks(self, text: str) -> Iterator[str]:
        """Emit SSE delta chunks (word-ish) for live typing UX."""
        if not text:
            yield ""
            return
        parts = text.split(" ")
        for i, w in enumerate(parts):
            yield w + (" " if i < len(parts) - 1 else "")

    def chat(
        self,
        message: str,
        user_id: str,
        session_id: str = "default",
        selected_campaign_id: str | None = None,
        campaign_id: str | None = None,
    ) -> ChatResponse:
        effective_campaign_id = campaign_id or selected_campaign_id
        self.memory.add_short_term(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=message,
            campaign_id=effective_campaign_id,
        )

        memory_context = "\n".join(
            f"- {e}" for e in self.memory.search_long_term(user_id, message, campaign_id, limit=5)
        )
        messages = self._build_messages(message, memory_context, campaign_id, selected_campaign_id)

        if self.openai is None:
            fb = "I can help with that. Add OPENAI_API_KEY to enable full assistant responses."
            self.memory.add_short_term(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=fb,
                campaign_id=effective_campaign_id,
            )
            return ChatResponse(reply=fb, options=[], metadata={"intent": "general", "provider": "none"})

        reply, options = self._agent_complete(messages)
        self.memory.add_short_term(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=reply,
            campaign_id=effective_campaign_id,
        )
        self.memory.add_long_term(
            user_id=user_id,
            content=f"User: {message}\nAssistant: {reply}",
            campaign_id=effective_campaign_id,
        )
        meta: dict[str, Any] = {"intent": "general", "provider": "openai"}
        if options:
            meta["has_options"] = True
        if selected_campaign_id:
            meta["campaign_id"] = selected_campaign_id
        return ChatResponse(reply=reply, options=options, metadata=meta)

    def _sse(self, obj: dict) -> str:
        return f"data: {json.dumps(obj)}\n\n"

    def iter_chat_sse(self, payload: ChatRequest) -> Iterator[str]:
        message = payload.message
        user_id = payload.user_id
        session_id = payload.session_id
        selected_campaign_id = payload.selected_campaign_id
        campaign_id = payload.campaign_id
        effective_campaign_id = campaign_id or selected_campaign_id

        self.memory.add_short_term(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=message,
            campaign_id=effective_campaign_id,
        )

        memory_context = "\n".join(
            f"- {e}" for e in self.memory.search_long_term(user_id, message, campaign_id, limit=5)
        )
        messages = self._build_messages(message, memory_context, campaign_id, selected_campaign_id)

        if self.openai is None:
            fb = "I can help with that. Add OPENAI_API_KEY to enable full assistant responses."
            self.memory.add_short_term(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=fb,
                campaign_id=effective_campaign_id,
            )
            yield self._sse({"type": "final", "reply": fb, "options": [], "metadata": {"intent": "general", "provider": "none"}})
            return

        try:
            reply, options = self._agent_complete(messages)
        except Exception:
            logger.exception("Agent completion error")
            err = "Something went wrong while generating a reply. Please try again."
            self.memory.add_short_term(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=err,
                campaign_id=effective_campaign_id,
            )
            yield self._sse({"type": "final", "reply": err, "options": [], "metadata": {"intent": "error"}})
            return

        if options:
            yield self._sse({"type": "meta", "options": [o.model_dump() for o in options]})

        for chunk in self._stream_reply_in_chunks(reply):
            if chunk:
                yield self._sse({"type": "delta", "text": chunk})

        self.memory.add_short_term(
            user_id=user_id,
            session_id=session_id,
            role="assistant",
            content=reply,
            campaign_id=effective_campaign_id,
        )
        self.memory.add_long_term(
            user_id=user_id,
            content=f"User: {message}\nAssistant: {reply}",
            campaign_id=effective_campaign_id,
        )

        meta: dict[str, Any] = {
            "intent": "general",
            "provider": "openai",
            "after_stream": True,
        }
        if options:
            meta["has_options"] = True
        if selected_campaign_id:
            meta["campaign_id"] = selected_campaign_id

        yield self._sse(
            {
                "type": "final",
                "reply": reply,
                "options": [o.model_dump() for o in options],
                "metadata": meta,
            }
        )
        yield self._sse({"type": "done", "metadata": meta})
