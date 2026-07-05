import os
from fastapi import UploadFile
from app.parsers import (
    text_parser,
    pdf_parser,
    image_parser,
    docx_parser,
)

from app.exceptions import (
    UnsupportedFileType,
    FileTooLarge,
    CorruptedFile,
)

# from app.models.document import ParsedDocument


MAX_SIZE_MB = 10

MIME_TYPES = {
    '.txt' : 'text/plain',
    '.md'  : 'text/markdown',
    '.csv' : 'text/csv',
    '.json': 'application/json',
    '.xml' : 'application/xml',
    '.html': 'text/html',
    '.htm' : 'text/html',

    '.pdf' : 'application/pdf',

    '.png' :'image/png',
    '.jpg' :'image/jpeg',
    '.jpeg':'image/jpeg',
    '.webp':'image/webp',

    '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
}

PARSERS = {
    '.txt' : text_parser,
    '.md'  : text_parser,
    '.csv' : text_parser,
    '.json': text_parser,
    '.xml' : text_parser,
    '.html': text_parser,
    '.htm' : text_parser,

    '.pdf' : pdf_parser,

    '.png' : image_parser,
    '.jpg' : image_parser,
    '.jpeg': image_parser,
    '.webp': image_parser,

    '.docx': docx_parser,

}

async def parser(file: UploadFile) -> dict:
    ''' 
    detects file type, sends the file for parsing to required parser
    returns data and type
    '''

    if(file.size and file.size > MAX_SIZE_MB * 1024 * 1024):
        raise FileTooLarge(f"File too large. Maximum allowed size is {MAX_SIZE_MB} MB.")

    filename = file.filename.lower() if file.filename else ""
    _, extension = os.path.splitext(filename)

    mime_type = MIME_TYPES.get(extension)

    if mime_type is None:
        raise UnsupportedFileType(f'Unsupported file type: {extension}')
    
    # rest file pointer if it was read elsewhere
    await file.seek(0)
    selected_parser = PARSERS.get(extension)

    try:
        return await PARSERS[extension].parse(file, mime_type)
    
    except CorruptedFile:
        raise

    except Exception as e:
        raise CorruptedFile(f'Failed to process: {str(e)}')