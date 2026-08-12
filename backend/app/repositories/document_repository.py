import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document import Chunk, Document


class DocumentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        conversation_id: uuid.UUID | str,
        filename: str | None,
        mime_type: str,
        document_type: str,
        metadata: dict,
        chunks: list[dict],
    ) -> Document:
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)

        document = Document(
            conversation_id=conversation_id,
            filename=filename,
            mime_type=mime_type,
            document_type=document_type,
            metadata_=metadata,
        )

        # Leverage SQLAlchemy relationship assignment; cascades document_id automatically on commit
        document.chunks = [
            Chunk(
                content=chunk["content"],
                embedding=chunk["embedding"],
                source=chunk["source"],
                page_number=chunk["page_number"],
                chunk_index=idx,
            )
            for idx, chunk in enumerate(chunks)
        ]

        self.db.add(document)
        await self.db.commit()

        # Reload with eager-loaded chunks to prevent async greenlet errors during serialization
        return await self.get(document.id)

    async def get(
        self,
        document_id: uuid.UUID | str,
    ) -> Document | None:
        if isinstance(document_id, str):
            document_id = uuid.UUID(document_id)

        result = await self.db.execute(
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def get_by_conversation(
        self,
        conversation_id: uuid.UUID | str,
    ) -> Sequence[Document]:
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)

        result = await self.db.execute(
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.conversation_id == conversation_id)
            .order_by(Document.created_at.asc())
        )
        return result.scalars().all()

    async def search_similar_chunks(
        self,
        conversation_id: uuid.UUID | str,
        query_embedding: list[float],
        top_k: int = 5,
    ) -> Sequence[Chunk]:
        """Performs pgvector cosine distance similarity search scoped to a conversation."""
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)

        result = await self.db.execute(
            select(Chunk)
            .join(Document, Chunk.document_id == Document.id)
            .options(selectinload(Chunk.document))  # Prevents MissingGreenlet if chunk.document is accessed
            .where(Document.conversation_id == conversation_id)
            .order_by(Chunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        return result.scalars().all()

    async def delete(self, document: Document) -> None:
        await self.db.delete(document)
        await self.db.commit()