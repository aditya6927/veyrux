# Veyrux

Veyrux is an AI-powered personal assistant. The current focus is document-grounded chat — attach files, ask questions, and get answers retrieved from their content across the whole conversation. It's the foundation for a longer-term goal: a cross-device, privacy-first assistant that isn't locked into a single ecosystem (Google, Samsung, Apple, Proton).

## Current Features (v0.2)

- Multi-conversation chat with a collapsible sidebar — create, search by title, switch, and delete conversations
- Attach files directly in the chat: PDF, DOCX, images (PNG/JPG/WEBP), and plaintext formats (TXT/MD/CSV/JSON/XML/HTML), up to 10 MB each
- Multiple files can be attached to one message — each is parsed, chunked, and embedded in parallel
- Retrieval-augmented answers: replies are grounded in the most relevant chunks from every document in the active conversation, not just the latest upload
- Attach a file with no question for an instant summary — one per file when several are attached at once
- Markdown-rendered responses, with an animated typing indicator and auto-resizing input

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui (`base-nova` style)
- react-markdown
- lucide-react

### Backend
- FastAPI
- Pydantic
- PyMuPDF (PDF parsing)
- python-docx (DOCX parsing)
- google-genai (Gemini API — chat, and `gemini-embedding-001` for embeddings)

## Project Structure

```
veyrux/
├── backend/
│   ├── app/
│   │   ├── models/        # Pydantic schemas (chat, document)
│   │   ├── parsers/       # per-filetype parsing: pdf, docx, image, text
│   │   ├── prompts/       # system prompt templates
│   │   ├── services/      # GeminiService — analysis, chat, embeddings
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── main.py             # FastAPI app + routes
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/        # ChatMain, ChatWindow, ChatMessage, ChatInput
        │   ├── sidebar/     # conversation list, search, new chat
        │   ├── layout/      # Header
        │   └── ui/          # shadcn primitives
        ├── hooks/           # useChat, useConversations
        ├── services/        # api.ts
        ├── types/           # shared TypeScript types
        └── App.tsx
```

## API

| Method | Route      | Description                                                     |
|--------|-----------|-------------------------------------------------------------------|
| GET    | `/`       | Health check                                                     |
| POST   | `/analyze`| Upload a file — returns an AI summary and embedded chunks       |
| POST   | `/chat`   | Send a message, history, and banked chunks — returns a grounded reply |

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env      # add your Gemini API key
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend
- `GEMINI_API_KEY` — your Google Gemini API key
- `MODEL_NAME` — Gemini model to use (e.g. `gemini-2.0-flash`)

### Frontend
- `VITE_API_URL` — backend URL (default: `http://localhost:8000`)

## Roadmap

- Persist conversations and document chunks server-side (Postgres + pgvector) instead of browser `localStorage`
- Account system, with the sidebar settings button wired up
- Cross-device sync via Supabase
- Local AI model support alongside Gemini
- Attachment security scanning via VirusTotal

## Status

Active development. Current version: **v0.2**
