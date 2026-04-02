from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .agent import AgentService
from .config import settings
from .routes.campaigns import router as campaigns_router
from .routes.leads import router as leads_router
from .schemas import ChatRequest, ChatResponse

app = FastAPI(title="Agentic Chatbot API", version="0.1.0")
agent_service = AgentService()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(campaigns_router)
app.include_router(leads_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    return agent_service.chat(
        message=payload.message,
        user_id=payload.user_id,
        session_id=payload.session_id,
        selected_campaign_id=payload.selected_campaign_id,
        campaign_id=payload.campaign_id,
    )


@app.post("/chat/stream")
def chat_stream(payload: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        agent_service.iter_chat_sse(payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def main() -> None:
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
