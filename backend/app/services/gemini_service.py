from google import genai
from google.genai import types
from app.config import settings
from typing import Optional, Any
from app.exceptions import ServiceError
from app.prompts import analyze, chat
from app.models.document import (
    ParsedDocument,
    ContentType,
    ContentBlock
)
from app.models.chat import ChatMessage, ChatRole

def _text_block(payload: list, block: ContentBlock) -> None:
    if(block.text_content):
        payload.append(block.text_content)

def _image_block(payload: list, block: ContentBlock) -> None:
    if(block.byte_content and block.mime_type):
        payload.append(types.Part.from_bytes(
            data        = block.byte_content,
            mime_type   = block.mime_type
        ))

def _table_block(payload: list, block: ContentBlock) -> None:
    if(block.text_content):
        payload.append(block.text_content)

BLOCK_BUILDERS = {
    ContentType.TEXT : _text_block,
    ContentType.IMAGE: _image_block,
    ContentType.TABLE: _table_block,
}

class GeminiService:
    def __init__(self):
        # api key from config
        self.client = genai.Client(api_key = settings.GEMINI_API_KEY)
        self.model  = settings.MODEL_NAME

    def _build_payload(self, doc: ParsedDocument) -> list[Any]:
        payload = []

        for page in doc.pages:
            payload.append(f"\n========== PAGE {page.number} ==========\n")

            for block in page.blocks:
                builder = BLOCK_BUILDERS.get(block.content_type)
                if builder:
                    builder(payload, block)

            payload.append(f"\n========== END PAGE {page.number} ==========\n")

        return payload

    def analyze_content(self, doc: ParsedDocument) -> str:
        try:
            payload = self._build_payload(doc)

            response = self.client.models.generate_content(
                model=self.model,
                contents=payload,
                config=types.GenerateContentConfig(
                    system_instruction=analyze.prompt
                ),
            )

            return response.text
        
        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Gemini request failed: {str(e)}")
    
    def chat(self, messages: list[ChatMessage]) -> str:
        try:
            contents = [
                types.Content(
                    role="model" if msg.role == ChatRole.ASSISTANT else "user",
                    parts=[types.Part(text=msg.content)],
                )
                for msg in messages
            ]

            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=chat.prompt
                ),
            )

            return response.text

        except ServiceError:
            raise
        except Exception as e:
            raise ServiceError(f"Gemini request failed: {str(e)}")

# single reusable instance
gemini_service = GeminiService()