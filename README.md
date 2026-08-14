# Veyrux

Veyrux is an AI-powered personal assistant currently focused on **document-grounded conversations**.

Upload documents, ask questions about them, and continue the conversation without losing the context of previous messages or uploaded files. Veyrux combines a React frontend, FastAPI backend, Google Gemini, and PostgreSQL with pgvector to build a persistent document-aware chat system.

The current architecture is designed as a foundation for a longer-term goal: a personal, cross-device assistant that can work across applications and services rather than being locked into a single ecosystem.

## Current Features

### Persistent Conversations

- Create and manage multiple conversations
- Switch between conversations from the sidebar
- Automatically generate conversation titles
- Persist messages in PostgreSQL
- Delete conversations and their associated data
- Restore conversations after restarting the application

### Document-Aware Chat

- Attach documents directly to conversations
- Support for PDF, DOCX, image, and plaintext-based documents
- Attach multiple documents
- Parse uploaded documents into structured pages and content blocks
- Chunk document content for retrieval
- Generate vector embeddings for document chunks
- Persist documents and chunks in PostgreSQL
- Associate documents with individual conversations
- Display persisted documents inside the conversation
- Retrieve relevant document context when generating answers

### Retrieval-Augmented Generation

Veyrux uses a document-grounded RAG pipeline:

```text
Document
   ↓
Parser
   ↓
ParsedDocument
   ↓
Chunking
   ↓
Embeddings
   ↓
PostgreSQL + pgvector
   ↓
Conversation Query
   ↓
Relevant Context
   ↓
Gemini
   ↓
Grounded Response
```

Documents are not treated as temporary frontend state. Their metadata, chunks, ordering, and embeddings are persisted server-side so they can remain associated with their conversations.

### Chat Experience

- Markdown-rendered AI responses
- Animated typing/thinking indicator
- Auto-resizing chat input
- Conversation-specific loading state
- Persistent document display
- Multi-message conversation history

## Architecture

Veyrux is organized around a separation between the frontend, API layer, persistence layer, document processing pipeline, and AI services.

```text
┌──────────────────────────────┐
│          React UI            │
│       TypeScript + Vite      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Frontend Services      │
│       Conversation API       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          FastAPI             │
│       Conversation API       │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│ Repositories │ │ AI Services  │
│              │ │              │
│ Conversations│ │    Gemini    │
│ Documents    │ │  Embeddings  │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
┌────────────────────────────────┐
│           PostgreSQL            │
│                                │
│ conversations                  │
│ messages                       │
│ documents                      │
│ chunks + vector embeddings     │
└────────────────────────────────┘
```

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui
- react-markdown
- lucide-react

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy 2.x
- asyncpg
- Alembic
- PyMuPDF
- python-docx
- Pillow
- google-genai

### AI

- Google Gemini
- `gemini-embedding-001` for document embeddings
- Gemini for document analysis and conversational generation

### Database

- PostgreSQL
- pgvector
- SQLAlchemy ORM
- Alembic migrations

PostgreSQL stores the application's persistent structured data, including conversations, messages, documents, and document chunks. pgvector provides the database-side foundation for vector-based document retrieval.

## Project Structure

```text
veyrux/
├── backend/
│   ├── alembic/
│   │   └── versions/          # Database migrations
│   │
│   ├── app/
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── conversation.py
│   │   │   └── document.py
│   │   │
│   │   ├── parsers/           # Document parsing
│   │   ├── prompts/            # Gemini system prompts
│   │   ├── repositories/      # Database access layer
│   │   ├── routers/            # FastAPI API routes
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Gemini and application services
│   │   ├── config.py
│   │   ├── db.py
│   │   └── exceptions.py
│   │
│   ├── alembic.ini
│   ├── main.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/
        │   ├── layout/
        │   ├── sidebar/
        │   └── ui/
        │
        ├── hooks/
        │   ├── useChat.ts
        │   └── useConversations.ts
        │
        ├── services/
        │   └── api.ts
        │
        ├── types/
        └── App.tsx
```

## Data Model

The current persistence layer is centered around four main entities:

```text
Conversation
    │
    ├── Messages
    │      ├── User message
    │      └── Assistant message
    │
    └── Documents
           │
           └── Chunks
                  └── Embedding vector
```

This allows the application to keep the relationship between a conversation and the documents used within that conversation.

A document can therefore remain available when the user returns to the conversation instead of existing only as temporary browser state.

## API

The backend is now centered around the conversation API rather than the previous standalone `/chat` flow.

| Method   | Route                                       | Description                          |
| -------- | ------------------------------------------- | ------------------------------------ |
| `POST`   | `/conversations/`                           | Create a conversation                |
| `GET`    | `/conversations/`                           | List conversations                   |
| `GET`    | `/conversations/{conversation_id}`          | Retrieve a conversation              |
| `DELETE` | `/conversations/{conversation_id}`          | Delete a conversation                |
| `POST`   | `/conversations/{conversation_id}/messages` | Send a message within a conversation |

The conversation response can include its persisted messages and associated documents.

## Getting Started

### Prerequisites

Make sure the following are installed:

- Python 3.11+
- Node.js
- PostgreSQL
- A Google Gemini API key

The database must also have the `vector` extension available for pgvector-based storage.

### Backend

```bash
cd backend

pip install -r requirements.txt
```

Create a `.env` file and configure the required application settings, including your Gemini API key and PostgreSQL connection details.

Then run the API:

```bash
uvicorn main:app --reload
```

The backend will be available at:

```text
http://localhost:8000
```

### Database

Run PostgreSQL and make sure the Veyrux database is available.

Apply the Alembic migrations:

```bash
cd backend

alembic upgrade head
```

The database schema is managed through Alembic rather than manually maintained SQL scripts.

### Frontend

```bash
cd frontend

npm install
npm run dev
```

The Vite development server will normally be available at:

```text
http://localhost:5173
```

Configure the frontend API URL through:

```text
VITE_API_URL
```

## Environment Variables

### Backend

```text
GEMINI_API_KEY=your_gemini_api_key
MODEL_NAME=your_gemini_model
DATABASE_URL=your_postgresql_connection_string
```

### Frontend

```text
VITE_API_URL=http://localhost:8000
```

Use the project's `.env.example` files as the source of truth for the exact environment configuration.

## Development Status

Veyrux is currently under active development.

The project has moved from its original browser-persistent prototype toward a **server-backed architecture** with:

- PostgreSQL persistence
- SQLAlchemy models
- Alembic migrations
- Repository-based database access
- Persistent conversations and messages
- Persistent documents and chunks
- Conversation-associated documents
- Vector embeddings prepared for database-backed retrieval
- A frontend consuming persistent conversation records

The current focus is completing and stabilizing the transition from the earlier in-memory/localStorage architecture to the persistent backend architecture.

## Roadmap

### Near Term

- Complete and test database-backed document retrieval with pgvector
- Remove remaining legacy frontend/backend paths from the original architecture
- Improve document retrieval and ranking
- Improve error handling and loading states
- Strengthen document lifecycle management

### Planned

- User authentication and accounts
- Cross-device synchronization
- User-specific conversations and documents
- More advanced document management
- Additional AI capabilities beyond document chat
- Local model support alongside Gemini
- Attachment security scanning

## Project Status

**Active development**

Current milestone:

> **Persistent conversations + persistent documents + database-backed RAG architecture**

Veyrux is still evolving, but the core architecture is being built around persistent server-side state rather than browser-only storage.
