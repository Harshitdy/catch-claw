# Agentic Campaign Chatbot (OpenAI + Mem0 + Supabase)

This repository contains a full-stack agentic chatbot with memory and interactive campaign selection.

## What this project does

- Backend in **Python** using **uv** package manager
- Frontend in **React** (Vite)
- Uses **OpenAI** as the LLM provider
- Uses **Mem0** for conversational memory
- Uses **Supabase** to fetch campaign data
- When a user asks to train campaigns, the chatbot fetches campaigns and shows **clickable options** instead of requiring manual typing

---

## Folder Structure

```text
catch-claw/
├── backend/
│   ├── .env.example
│   ├── pyproject.toml
│   └── src/backend/
│       ├── __init__.py
│       ├── agent.py
│       ├── config.py
│       ├── main.py
│       ├── memory.py
│       ├── schemas.py
│       └── supabase_client.py
├── frontend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── README.md
```

---

## Architecture Flow

1. User sends message from React chat UI.
2. Frontend calls `POST /chat` on Python backend.
3. Backend stores the new message into Mem0 (with fallback if Mem0 is unavailable).
4. Backend detects intent:
   - If intent is "train campaign":
     - fetch campaigns from Supabase table
     - return campaign list as clickable options
   - If user clicked one option:
     - confirm selected campaign id and continue flow
   - Otherwise:
     - answer via OpenAI using retrieved memory context
5. Frontend renders assistant response and campaign option buttons.
6. User clicks campaign button, frontend sends selected campaign id to backend.

---

## Tech Stack

### Backend
- Python 3.12+
- uv
- FastAPI
- Uvicorn
- OpenAI Python SDK
- Mem0 (`mem0ai`)
- Supabase Python client

### Frontend
- React
- Vite

---

## Environment Variables

## Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill values:

- `OPENAI_API_KEY` - your OpenAI key
- `OPENAI_CHAT_MODEL` - default `gpt-4o-mini`
- `OPENAI_EMBEDDING_MODEL` - default `text-embedding-3-small`
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` - API key
- `SUPABASE_CAMPAIGNS_TABLE` - default `campaigns`
- `FRONTEND_ORIGIN` - default `http://localhost:5173`

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

- `VITE_API_BASE_URL` - default `http://localhost:8000`

---

## Supabase Table Contract

Create a campaigns table with at least:

- `id` (text/uuid)
- `name` (text)
- `status` (text, optional)

The backend reads from this table and converts rows into clickable options.

---

## Run Locally

## 1) Backend

```bash
cd backend
cp .env.example .env
# fill .env
~/.local/bin/uv sync
~/.local/bin/uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

## 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## API

### `GET /health`
Returns service status.

### `POST /chat`

Request body:

```json
{
  "message": "train my campaigns",
  "user_id": "user-123",
  "session_id": "session-123",
  "selected_campaign_id": null
}
```

Response (campaign selection example):

```json
{
  "reply": "Sure — choose the campaign you want me to train:",
  "options": [
    { "id": "cmp_1", "label": "Brand Awareness", "value": "cmp_1", "action": "train_campaign" }
  ],
  "metadata": { "intent": "train_campaign", "campaigns_count": 1 }
}
```

---

## Interactive UX Behavior

- If user writes: **"train my campaigns"**, assistant returns campaign chips/buttons.
- User clicks one button.
- Backend receives `selected_campaign_id` and confirms training flow.

This matches the interactive, low-friction option-selection style requested.

---

## Memory Notes (Mem0)

- Every user message and assistant response is stored by user id.
- Memory retrieval is used as context for general OpenAI responses.
- If Mem0 is not available at runtime, fallback in-memory storage keeps app functional for local testing.

---

## OpenAI Provider Note

This implementation is **OpenAI-only** as requested (no Anthropic provider integration).

---

## Validation Commands

Run frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Run backend sanity check:

```bash
cd backend
~/.local/bin/uv sync
~/.local/bin/uv run python -c "from backend.main import app; print(app.title)"
```

---

## Future Improvements

- Add auth and per-user access control
- Add persistent server-side store for selected training jobs
- Add streaming responses from OpenAI
- Add richer campaign cards (budget, objective, last-trained timestamp)
- Add Supabase RLS and migrations for production hardening
