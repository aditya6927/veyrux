import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Message


class MessageRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self, conversation_id: uuid.UUID | str, role: str, content: str
    ) -> Message:
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_by_conversation(
        self, conversation_id: uuid.UUID | str
    ) -> Sequence[Message]:
        if isinstance(conversation_id, str):
            conversation_id = uuid.UUID(conversation_id)

        result = await self.db.execute(
            select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.asc())
        )
        return result.scalars().all()