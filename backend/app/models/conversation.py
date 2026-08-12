import uuid

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db import Base

if TYPE_CHECKING:
    from app.models.document import Document


# represents a chat session holding messages and attached documents
class Conversation(Base):
    __tablename__ = "conversations"

    # primary key uuid generated automatically by postgresql through gen_randon_uuid() function
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    title: Mapped[str] = mapped_column(
        default="New Conversation",
        server_default=text("'New Conversation'")
    )

    # timezone-aware timestamps with db-level default to current time
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
    )

    # timezone-aware timestamps with db-level default and automatic update trigger
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=text("now()"),
    )

    # cascade delete removes child messages and documents when a conversation is deleted
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    documents: Mapped[list["Document"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
    )

# represents individual chat messages within a conversation
class Message(Base):
    __tablename__ = "messages"
    # check constraint limits role values to user, assistant, or system
    __table_args__ = (
        CheckConstraint("role IN ('user', 'assistant', 'system')", name="messages_role_check"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    # foreign key linking to conversation; ondelete cascade mirrors database integrity
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"),
    )
    role: Mapped[str]
    content: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("now()"),
    )

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")