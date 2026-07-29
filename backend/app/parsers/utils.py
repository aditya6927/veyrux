from PIL import Image
import io

MIN_IMAGE_AREA = 10_000      # Equivalent to ~100x100; preserves tall/wide diagrams
MAX_IMAGE_DIMENSION = 1024   # Resolution cap for Vision models
JPEG_QUALITY = 80            # High quality with ~90% payload compression

def _process_and_compress_image(
    raw_bytes: bytes,
) -> tuple[bytes, str, int, int] | None:
    """
    Validates, downsizes, and compresses an image using Pillow.

    Returns:
        (compressed_bytes, mime_type, processed_width, processed_height)
        or None if processing fails or image is too small.
    """
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            # 1. Filter small icons/logos using Pillow's guaranteed dimension check
            if (img.width * img.height) < MIN_IMAGE_AREA:
                return None

            # 2. Normalize all image modes (CMYK, RGBA, L, 1, etc.) to RGB for JPEG compatibility
            if img.mode != "RGB":
                img = img.convert("RGB")

            # 3. Downscale while preserving aspect ratio
            if max(img.width, img.height) > MAX_IMAGE_DIMENSION:
                img.thumbnail(
                    (MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION),
                    Image.Resampling.LANCZOS,
                )

            processed_width, processed_height = img.width, img.height

            # 4. Compress to JPEG
            buffer = io.BytesIO()
            img.save(
                buffer,
                format="JPEG",
                quality=JPEG_QUALITY,
                optimize=True,
            )

            return (
                buffer.getvalue(),
                "image/jpeg",
                processed_width,
                processed_height,
            )

    except Exception:
        return None
