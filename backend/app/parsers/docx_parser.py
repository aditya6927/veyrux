import io
import docx
from fastapi import UploadFile
from app.exceptions import CorruptedFile
from app.models.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page
)

def _extract_tables(document: docx.Document) -> list[ContentBlock]:
    blocks = []
    for table in document.tables:
        rows = []
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            rows.append(cells)

        if not rows:
            continue

        header = rows[0]
        separator = ['----'] * len(header)
        md_rows = [header, separator] + rows[1:]
        md_table = '\n'.join(
            '| ' + ' | '.join(str(cell or '') for cell in row) + ' |'
            for row in md_rows
        )

        blocks.append(ContentBlock(
            content_type    = ContentType.TABLE,
            text_content    = md_table,
            metadata        = {
                'rows'   : len(rows),
                'columns': len(header)
            }
        ))

    return blocks

def _extract_images(document: docx.Document) -> list[ContentBlock]:
    blocks = []
    for rel_id, part in document.part.related_parts.items():
        if 'media/image' in part.partname.lower():
            blocks.append(ContentBlock(
                content_type    = ContentType.IMAGE,
                byte_content    = part.blob,
                mime_type       = part.content_type
            ))

    return blocks

def _extract_sections(document: docx.Document) -> list[Page]:
    sections: list[Page] = []
    current_blocks: list[ContentBlock] = []
    section_number = 1

    for paragraph in document.paragraphs:
        stripped = paragraph.text.strip()
        if not stripped:
            continue

        is_heading = paragraph.style.name.startswith('Heading')

        if is_heading and current_blocks:
            sections.append(Page(number = section_number, blocks = current_blocks))
            section_number += 1
            current_blocks = []

        current_blocks.append(ContentBlock(
            content_type    = ContentType.TEXT,
            text_content    = stripped,
            mime_type       = 'text/plain'
        ))

    if current_blocks:
        sections.append(Page(number = section_number, blocks = current_blocks))

    return sections

async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        docx_bytes = await file.read()
        document = docx.Document(io.BytesIO(docx_bytes))

        pages  = _extract_sections(document)
        tables = _extract_tables(document)
        images = _extract_images(document)

        extra_blocks = tables + images

        if extra_blocks:
            next_number = (pages[-1].number + 1) if pages else 1
            pages.append(Page(number = next_number, blocks = extra_blocks))
        
        if not pages:
            raise CorruptedFile
        
        total_text  = sum(1 for p in pages for b in p.blocks if b.content_type == ContentType.TEXT)
        total_images = len(images)
        total_tables = len(tables)

        return ParsedDocument(
            filename        = file.filename,
            mime_type       = mime_type,
            document_type   = DocumentType.DOCX,
            pages           = pages,
            metadata        = {
                'section_count': len(pages),
                "total_text_blocks":  total_text,
                "total_image_blocks": total_images,
                "total_table_blocks": total_tables,
            }
        )
    
    except CorruptedFile:
        raise
    except Exception as e:
        raise CorruptedFile(f'invalid or corrupted document file: {str(e)}')