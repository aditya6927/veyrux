from google import genai
from google.genai import types
from app.config import settings
from typing import Any, Optional
from app.exceptions import ServiceError
from app.prompts import analyze, chat
from app.models.document import (
    ParsedDocument,
    ContentType,
    ContentBlock,
    Page,
    Chunk
)
from app.models.chat import ChatMessage, ChatRole

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768
TOP_K_CHUNKS = 5

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

def _page_text(page: Page) -> str:
    # Text-only extraction for embeddings - images can't be embedded by a text model
    parts = [
        block.text_content
        for block in page.blocks
        if block.content_type in (ContentType.TEXT, ContentType.TABLE) and block.text_content
    ]
    return "\n".join(parts)

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def _top_k_chunks(chunks: list[Chunk], query_embedding: list[float], k: int = TOP_K_CHUNKS) -> list[Chunk]:
    scored = [(c, _cosine_similarity(c.embedding, query_embedding)) for c in chunks]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [c for c, _score in scored[:k]]

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

    def embed_texts(self, texts: list[str], task_type: str) -> list[list[float]]:
        try:
            response = self.client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=EMBEDDING_DIMENSIONS,
                ),
            )
            return [embedding.values for embedding in response.embeddings]
        except Exception as e:
            raise ServiceError(f"Embedding request failed: {str(e)}")

    def chunk_document(self, doc: ParsedDocument) -> list[Chunk]:
        page_texts = [(page.number, _page_text(page)) for page in doc.pages]
        page_texts = [(num, text) for num, text in page_texts if text.strip()]

        if not page_texts:
            return []

        embeddings = self.embed_texts(
            [text for _, text in page_texts],
            task_type="RETRIEVAL_DOCUMENT",
        )

        source = doc.filename or "uploaded document"
        return [
            Chunk(content=text, embedding=embedding, source=source, page_number=num)
            for (num, text), embedding in zip(page_texts, embeddings)
        ]

    def chat(self, messages: list[ChatMessage], chunks: Optional[list[Chunk]] = None) -> str:
        try:
            relevant_chunks: list[Chunk] = []
            if chunks and messages:
                query_embedding = self.embed_texts(
                    [messages[-1].content], task_type="RETRIEVAL_QUERY"
                )[0]
                relevant_chunks = _top_k_chunks(chunks, query_embedding)

            contents = []
            for i, msg in enumerate(messages):
                is_last = i == len(messages) - 1
                is_model = msg.role == ChatRole.ASSISTANT
                parts = []

                if is_last and not is_model and relevant_chunks:
                    excerpts = "\n\n".join(
                        f"[From {c.source}, page {c.page_number}]\n{c.content}"
                        for c in relevant_chunks
                    )
                    parts.append(types.Part(
                        text=f"[RELEVANT DOCUMENT EXCERPTS]\n{excerpts}\n[END EXCERPTS]\n\n"
                    ))

                parts.append(types.Part(text=msg.content))
                contents.append(
                    types.Content(
                        role="model" if is_model else "user",
                        parts=parts,
                    )
                )

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