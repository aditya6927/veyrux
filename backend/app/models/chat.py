from pydantic import BaseModel
from enum import Enum

class ChatRole(str, Enum):
    USER = 'user'
    ASSISTANT = 'assistant'
    # SYSTEM = 'system'

class ChatMessage(BaseModel):
    role: ChatRole
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]