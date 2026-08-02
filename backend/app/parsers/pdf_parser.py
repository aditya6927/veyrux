import io
import fitz
from fastapi import UploadFile
from app.parsers.utils import _process_and_compress_image

from app.exceptions import CorruptedFile
from app.schemas.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page,
)


def _extract_tables(page: fitz.Page) -> list[ContentBlock]:
    blocks = []

    try:
        tables = page.find_tables()

        for table in tables:
            rows = table.extract()

            if not rows or not rows[0]:
                continue

            # Render as Markdown so the LLM understands table structure
            header = rows[0]
            separator = ["----"] * len(header)
            md_rows = [header, separator] + rows[1:]

            md_table = "\n".join(
                "| " + " | ".join(str(cell or "") for cell in row) + " |"
                for row in md_rows
            )

            blocks.append(
                ContentBlock(
                    content_type=ContentType.TABLE,
                    text_content=md_table,
                    metadata={
                        "rows": len(rows),
                        "columns": len(header),
                    },
                )
            )

    except Exception:
        pass

    return blocks


async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        pdf_bytes = await file.read()

        pages: list[Page] = []
        seen_xrefs: set[int] = set()  # Global document-wide image deduplication

        total_text_blocks = 0
        total_table_blocks = 0
        total_image_blocks = 0

        with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
            for page_index, page in enumerate(document):
                page_number = page_index + 1
                blocks: list[ContentBlock] = []

                # -----------------------
                # Text extraction
                # -----------------------
                text = page.get_text().strip()

                if text:
                    blocks.append(
                        ContentBlock(
                            content_type=ContentType.TEXT,
                            text_content=text,
                            mime_type="text/plain",
                        )
                    )
                    total_text_blocks += 1

                # -----------------------
                # Table extraction
                # -----------------------
                table_blocks = _extract_tables(page)
                blocks.extend(table_blocks)
                total_table_blocks += len(table_blocks)

                # -----------------------
                # Image extraction
                # -----------------------
                for img in page.get_images(full=True):
                    xref = img[0]

                    # Deduplicate across the ENTIRE document (skips repeated headers/logos)
                    if xref in seen_xrefs:
                        continue
                    seen_xrefs.add(xref)

                    try:
                        base_image = document.extract_image(xref)

                        processed = _process_and_compress_image(
                            base_image["image"]
                        )

                        if processed is None:
                            continue

                        (
                            compressed_bytes,
                            image_mime,
                            processed_width,
                            processed_height,
                        ) = processed

                        blocks.append(
                            ContentBlock(
                                content_type=ContentType.IMAGE,
                                byte_content=compressed_bytes,
                                mime_type=image_mime,
                                metadata={
                                    "page": page_number,
                                    "xref": xref,
                                    "original_width": base_image.get("width", 0),
                                    "original_height": base_image.get("height", 0),
                                    "width": processed_width,
                                    "height": processed_height,
                                },
                            )
                        )

                        total_image_blocks += 1

                    except Exception:
                        continue

                if blocks:
                    pages.append(Page(number=page_number, blocks=blocks))

        if not pages:
            raise CorruptedFile("PDF has no extractable content.")

        return ParsedDocument(
            filename=file.filename,
            mime_type=mime_type,
            document_type=DocumentType.PDF,
            pages=pages,
            metadata={
                "page_count": len(pages),
                "total_text_blocks": total_text_blocks,
                "total_table_blocks": total_table_blocks,
                "total_image_blocks": total_image_blocks,
            },
        )

    except CorruptedFile:
        raise

    except Exception as e:
        raise CorruptedFile(f"Invalid or corrupted PDF: {e}")