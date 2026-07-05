from fastapi import UploadFile
from app.models.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page
)

async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:

    content = await file.read()
    text = content.decode('utf-8', errors = 'replace')

    block = ContentBlock(
        content_type = ContentType.TEXT,
        text_content = text,
        mime_type    = mime_type
    )
    return ParsedDocument(
        filename        = file.filename,
        mime_type       = mime_type,
        document_type   = DocumentType.TEXT,
        pages           = [Page(number = 1, blocks = [block])],
        metadata        = {'encoding': 'utf-8'}
    )
