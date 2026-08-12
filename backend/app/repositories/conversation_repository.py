import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation
from app.models.document import Document


class ConversationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, title: str = "New Conversation") -> Conversation:
        conversation = Conversation(title=title)
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        
        # Eager load messages so Pydantic serialization doesn't trigger MissingGreenlet
        return await self.get(conversation.id)

    async def get(self, conversation_id: uuid.UUID | str) -> Conversation | None:
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)

        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.documents)
                    .selectinload(Document.chunks),
            )
            .where(Conversation.id == conversation_id)
        )

        return result.scalar_one_or_none()

    async def list_all(self) -> Sequence[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.documents)
                    .selectinload(Document.chunks),
            )
            .order_by(Conversation.created_at.desc())
        )

        return result.scalars().all()

    async def delete(self, conversation: Conversation) -> None:
        await self.db.delete(conversation)
        await self.db.commit()