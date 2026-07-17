from pydantic import BaseModel
from enum import Enum
from typing import Optional
from app.models.document import Chunk

class ChatRole(str, Enum):
    USER = 'user'
    ASSISTANT = 'assistant'
    # SYSTEM = 'system'

class ChatMessage(BaseModel):
    id: Optional[str] = None
    role: ChatRole
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    chunks: Optional[list[Chunk]] = None