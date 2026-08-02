import io
from PIL import Image
from fastapi import UploadFile

from app.exceptions import CorruptedFile
from app.schemas.document import (
    ParsedDocument,
    DocumentType,
    ContentType,
    ContentBlock,
    Page,
)

MAX_IMAGE_DIMENSION = 1024   # Optimal resolution bound for Gemini Vision
JPEG_QUALITY = 80            # High quality compression ratio (~80-90% payload reduction)


async def parse(file: UploadFile, mime_type: str) -> ParsedDocument:
    try:
        raw_bytes = await file.read()

        if not raw_bytes:
            raise CorruptedFile("The uploaded image file is empty.")

        # Validate and process image through Pillow
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                original_width, original_height = img.width, img.height

                # Normalize color spaces (e.g. RGBA, CMYK, Palette) to standard RGB
                if img.mode != "RGB":
                    img = img.convert("RGB")

                # Downscale large images while preserving aspect ratio
                if max(img.width, img.height) > MAX_IMAGE_DIMENSION:
                    img.thumbnail(
                        (MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION),
                        Image.Resampling.LANCZOS,
                    )

                processed_width, processed_height = img.width, img.height

                # Compress image buffer to JPEG
                buffer = io.BytesIO()
                img.save(
                    buffer,
                    format="JPEG",
                    quality=JPEG_QUALITY,
                    optimize=True,
                )
                compressed_bytes = buffer.getvalue()

        except Exception as img_err:
            raise CorruptedFile(f"Unreadable or unsupported image format: {str(img_err)}")

        block = ContentBlock(
            content_type=ContentType.IMAGE,
            byte_content=compressed_bytes,
            mime_type="image/jpeg",
            metadata={
                "original_width": original_width,
                "original_height": original_height,
                "width": processed_width,
                "height": processed_height,
                "original_size_bytes": len(raw_bytes),
                "compressed_size_bytes": len(compressed_bytes),
            },
        )

        return ParsedDocument(
            filename=file.filename,
            mime_type=mime_type,
            document_type=DocumentType.IMAGE,
            pages=[Page(number=1, blocks=[block])],
            metadata={
                "size_bytes": len(compressed_bytes),
                "width": processed_width,
                "height": processed_height,
            },
        )

    except CorruptedFile:
        raise
    except Exception as e:
        raise CorruptedFile(f"Failed to process image file: {str(e)}")