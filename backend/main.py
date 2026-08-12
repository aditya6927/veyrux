import asyncio
import uuid
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.exceptions import CorruptedFile, FileTooLarge, ServiceError, UnsupportedFileType
from app.parsers import parser
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.document_repository import DocumentRepository
from app.routers import conversations
from app.schemas.chat import ChatRequest
from app.services.gemini_service import gemini_service

app = FastAPI(title="Veyrux")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations.router)


@app.get("/")
def root():
    return {"status": "Veyrux backend engine working properly"}


@app.post("/analyze")
async def analyze_file(
    conversation_id: uuid.UUID = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    # Verify target conversation exists before running parsing
    conv_repo = ConversationRepository(db)
    conversation = await conv_repo.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    try:
        doc = await parser(file)

        response, chunks = await asyncio.gather(
            asyncio.to_thread(gemini_service.analyze_content, doc),
            asyncio.to_thread(gemini_service.chunk_document, doc),
        )

        # Persist document record and associated vector chunks to PostgreSQL
        doc_repo = DocumentRepository(db)
        document = await doc_repo.create(
            conversation_id=conversation_id,
            filename=doc.filename,
            mime_type=doc.mime_type,
            document_type=doc.document_type.value
                if hasattr(doc.document_type, "value")
                else str(doc.document_type),

            metadata=doc.metadata,
            chunks=[
                {
                    "content": chunk.content,
                    "embedding": chunk.embedding,
                    "source": chunk.source,
                    "page_number": chunk.page_number,
                }
                for chunk in chunks
            ],
        )

    except FileTooLarge as e:
        raise HTTPException(status_code=413, detail=e.message)
    except UnsupportedFileType as e:
        raise HTTPException(status_code=400, detail=e.message)
    except CorruptedFile as e:
        raise HTTPException(status_code=422, detail=e.message)
    except ServiceError as e:
        raise HTTPException(status_code=502, detail=f"Model gateway error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Critical internal failure: {str(e)}")

    return {
        "result": response,
        "chunks": chunks,
        "document": {
            "id": document.id,
            "conversation_id": document.conversation_id,
            "filename": document.filename,
            "mime_type": document.mime_type,
            "document_type": document.document_type,
            "metadata": document.metadata_,
            "created_at": document.created_at,
        },
    }


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response = await asyncio.to_thread(
            gemini_service.chat,
            request.messages,
            request.chunks,
            request.grounding_chunks,
        )
    except ServiceError as e:
        raise HTTPException(status_code=502, detail=f"Model gateway error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Critical internal failure: {str(e)}")

    return {"result": response}