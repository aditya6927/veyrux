import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

# Vector dimension size matching embedding model output
EMBEDDING_DIMENSIONS = 768


class Document(Base):
    """Represents an uploaded document tied to a conversation."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )

    filename: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    mime_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    document_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    metadata_: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        server_default=text("'{}'::jsonb"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="documents",
    )

    # Deleting a document cleans up all associated text chunks automatically
    chunks: Mapped[list["Chunk"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="Chunk.chunk_index",
    )


class Chunk(Base):
    """Represents processed text chunks with pgvector embeddings for RAG searches."""

    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Stores dense vector embedding float array of fixed dimension size
    embedding: Mapped[list[float]] = mapped_column(
        Vector(EMBEDDING_DIMENSIONS),
        nullable=False,
    )

    source: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    page_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    document: Mapped["Document"] = relationship(
        back_populates="chunks",
    )