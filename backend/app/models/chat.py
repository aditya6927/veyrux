from pydantic import BaseModel
from enum import Enum
from typing import Optional, Any

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