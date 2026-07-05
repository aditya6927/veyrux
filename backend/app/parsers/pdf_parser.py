import fitz
from fastapi import UploadFile
from app.exceptions import CorruptedFile
from app.models.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page
)

def _extract_tables(page: fitz.Page) -> list[ContentBlock]:
    blocks = []
    try:
        tables = page.find_tables()
        for table in tables:
            rows = table.extract()
            if not rows:
                continue

            # rendering as markdowns so llm read it correctly
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
                    'rows': len(rows),
                    'columns': len(header)
                }
            ))

    except Exception:
        pass
    return blocks


def _extract_images(page: fitz.Page, document: fitz.Document, page_number: int) -> list[ContentBlock]:
    blocks = []

    for img in page.get_images(full = True):
        xref = img[0]
        try:
            base_image = document.extract_image(xref)
            blocks.append(ContentBlock(
                content_type    = ContentType.IMAGE,
                byte_content    = base_image['image'],
                mime_type       = f"image/{base_image['ext']}",
                metadata        = {
                    'page'  : page_number,
                    'width' : base_image.get('width'),
                    'height': base_image.get('height')
                }
            ))
        
        except Exception:
            continue # skip unextractable

    return blocks

async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        pdf_bytes = await file.read()
        pages : list[Page] = []

        total_text_blocks = 0
        total_image_blocks = 0
        total_table_blocks = 0

        with fitz.open(stream = pdf_bytes, filetype = 'pdf') as document:
            for page_index, page in enumerate(document):
                page_number = page_index + 1
                blocks: list[ContentBlock] = []

                text = page.get_text().strip()

                if text:
                    blocks.append(ContentBlock(
                        content_type    = ContentType.TEXT,
                        text_content    = f'Page {page_number}\n{text}',
                        mime_type       = 'text/plain'
                    ))
                    total_text_blocks += 1

                # tables
                table_blocks = _extract_tables(page)
                blocks.extend(table_blocks)
                total_table_blocks += len(table_blocks)

                # images
                table_images = _extract_images(page, document, page_number)
                blocks.extend(table_images)
                total_image_blocks += len(table_images)

                if blocks:
                    pages.append(Page(number = page_number, blocks = blocks))

        if not pages:
            raise CorruptedFile("PDF has no extractable content.")
        
        return ParsedDocument(
            filename        = file.filename,
            mime_type       = mime_type,
            document_type   = DocumentType.PDF,
            pages           = pages,
            metadata        = {
                'page_count'        : len(pages),
                'total_text_blocks' : total_text_blocks,
                'total_table_blocks': total_table_blocks,
                'total_image_blocks': total_image_blocks
            }
        )
    
    except CorruptedFile:
        raise

    except Exception as e:
        raise CorruptedFile(f"Invalid or corrupted PDF: {str(e)}")