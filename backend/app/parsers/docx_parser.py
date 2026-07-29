import io
import docx
from docx.text.paragraph import Paragraph
from docx.table import Table
from fastapi import UploadFile
from app.parsers.utils import _process_and_compress_image

from app.exceptions import CorruptedFile
from app.models.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page,
)

def _format_table_to_markdown(table: Table) -> ContentBlock | None:
    """Converts a python-docx Table object into a Markdown table block."""
    rows = []
    for row in table.rows:
        cells = [cell.text.strip() for cell in row.cells]
        rows.append(cells)

    if not rows or not rows[0]:
        return None

    header = rows[0]
    separator = ["----"] * len(header)
    md_rows = [header, separator] + rows[1:]

    md_table = "\n".join(
        "| " + " | ".join(str(cell or "") for cell in row) + " |"
        for row in md_rows
    )

    return ContentBlock(
        content_type=ContentType.TABLE,
        text_content=md_table,
        metadata={"rows": len(rows), "columns": len(header)},
    )


def _iter_block_items(parent):
    """
    Iterates through paragraphs and tables in exact document reading order.
    """
    if isinstance(parent, docx.document.Document):
        parent_elm = parent.element.body
    else:
        parent_elm = parent._element

    for child in parent_elm:
        if child.tag.endswith("p"):
            yield Paragraph(child, parent)
        elif child.tag.endswith("tbl"):
            yield Table(child, parent)


def _extract_images(document: docx.Document) -> list[ContentBlock]:
    """Extracts, deduplicates, and compresses embedded images from DOCX media parts."""
    image_blocks: list[ContentBlock] = []
    processed_parts: set[str] = set()

    for rel_id, part in document.part.related_parts.items():
        if "media/image" in part.partname.lower():
            if part.partname in processed_parts:
                continue
            processed_parts.add(part.partname)

            processed = _process_and_compress_image(part.blob)
            if processed is None:
                continue

            compressed_bytes, mime_type, width, height = processed

            image_blocks.append(
                ContentBlock(
                    content_type=ContentType.IMAGE,
                    byte_content=compressed_bytes,
                    mime_type=mime_type,
                    metadata={"width": width, "height": height},
                )
            )

    return image_blocks


async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        docx_bytes = await file.read()
        document = docx.Document(io.BytesIO(docx_bytes))

        pages: list[Page] = []
        current_blocks: list[ContentBlock] = []
        section_number = 1

        total_text_blocks = 0
        total_table_blocks = 0

        # Traverse text and tables sequentially to maintain reading flow
        for item in _iter_block_items(document):
            if isinstance(item, Paragraph):
                stripped = item.text.strip()
                if not stripped:
                    continue

                is_heading = item.style.name.startswith("Heading")

                # Split sections upon encountering new major headings
                if is_heading and current_blocks:
                    pages.append(Page(number=section_number, blocks=current_blocks))
                    section_number += 1
                    current_blocks = []

                current_blocks.append(
                    ContentBlock(
                        content_type=ContentType.TEXT,
                        text_content=stripped,
                        mime_type="text/plain",
                    )
                )
                total_text_blocks += 1

            elif isinstance(item, Table):
                table_block = _format_table_to_markdown(item)
                if table_block:
                    current_blocks.append(table_block)
                    total_table_blocks += 1

        # Flush trailing section blocks
        if current_blocks:
            pages.append(Page(number=section_number, blocks=current_blocks))

        # Extract and attach embedded image media
        images = _extract_images(document)
        if images:
            # Place images into their own logical visual section
            next_number = (pages[-1].number + 1) if pages else 1
            pages.append(Page(number=next_number, blocks=images))

        if not pages:
            raise CorruptedFile("DOCX document contains no extractable content.")

        return ParsedDocument(
            filename=file.filename,
            mime_type=mime_type,
            document_type=DocumentType.DOCX,
            pages=pages,
            metadata={
                "section_count": len(pages),
                "total_text_blocks": total_text_blocks,
                "total_table_blocks": total_table_blocks,
                "total_image_blocks": len(images),
            },
        )

    except CorruptedFile:
        raise
    except Exception as e:
        raise CorruptedFile(f"Invalid or corrupted DOCX file: {str(e)}")