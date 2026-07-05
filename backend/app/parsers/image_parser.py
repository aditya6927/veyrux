from fastapi import UploadFile
from app.exceptions import CorruptedFile
from app.models.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page
)

async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        image_bytes = await file.read()

        if not image_bytes:
            raise CorruptedFile('The uploaded image file is empty')
        
        block = ContentBlock(
            content_type = ContentType.IMAGE,
            byte_content = image_bytes,
            mime_type    = mime_type
        )
        
        return ParsedDocument(
            filename        = file.filename,
            mime_type       = mime_type,
            document_type   = DocumentType.IMAGE,
            pages           = [Page(number = 1, blocks = [block])],
            metadata        = {'size_bytes': len(image_bytes)}
        )
    
    except CorruptedFile:
        raise

    except Exception as e:
        raise CorruptedFile(f'Failed to process image file: {str(e)}')