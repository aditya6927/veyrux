from fastapi import UploadFile

from app.exceptions import CorruptedFile
from app.schemas.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page,
)


def _decode_bytes(content: bytes) -> tuple[str, str]:
    """Tries common text encodings before falling back to lossy decoding."""
    encodings = ["utf-8", "utf-8-sig", "cp1252", "latin-1"]

    for enc in encodings:
        try:
            return content.decode(enc), enc
        except (UnicodeDecodeError, UnicodeError):
            continue

    return content.decode("utf-8", errors="replace"), "utf-8 (lossy)"


async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        content = await file.read()

        if not content:
            raise CorruptedFile("The uploaded text file is empty.")

        text, encoding = _decode_bytes(content)

        if not text.strip():
            raise CorruptedFile("The text file contains no readable content.")

        # Split into paragraph blocks, leaving chunking decisions to the chunker
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

        blocks = [
            ContentBlock(
                content_type=ContentType.TEXT,
                text_content=paragraph,
                mime_type="text/plain",
            )
            for paragraph in paragraphs
        ]

        if not blocks:
            raise CorruptedFile("No text content found in file.")

        return ParsedDocument(
            filename=file.filename,
            mime_type=mime_type,
            document_type=DocumentType.TEXT,
            pages=[Page(number=1, blocks=blocks)],
            metadata={
                "encoding": encoding,
                "character_count": len(text),
                "word_count": len(text.split()),
                "paragraph_count": len(blocks),
            },
        )

    except CorruptedFile:
        raise
    except Exception as e:
        raise CorruptedFile(f"Failed to process text file: {str(e)}")