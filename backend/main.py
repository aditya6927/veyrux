from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.parsers import parser
from app.services.gemini_service import gemini_service
from app.exceptions import FileTooLarge, CorruptedFile, UnsupportedFileType, ServiceError
from app.models.chat import ChatRequest

app = FastAPI(title = 'Veyrux')

app.add_middleware(
    CORSMiddleware,
    allow_origins       = ['http://localhost:5173'],
    allow_credentials   = True,
    allow_methods       = ['*'],
    allow_headers       = ['*'],
)

@app.get('/')
def root():
    return {"status": "Veyrux backend engine working properly"}

@app.post('/analyze')
async def analyze_file(file: UploadFile = File(...)):
    try:
        doc = await parser(file)
        response = gemini_service.analyze_content(doc)
        chunks = gemini_service.chunk_document(doc)

    except FileTooLarge as e:
        raise HTTPException(status_code = 413, detail = e.message)
    except UnsupportedFileType as e:
        raise HTTPException(status_code = 400, detail = e.message)
    except CorruptedFile as e:
        raise HTTPException(status_code = 422, detail = e.message)
    except ServiceError as e:
        raise HTTPException(status_code = 502, detail = f'Model gateway error: {e.message}')
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f'Critical interal failure: {str(e)}')

    return {"result": response, "chunks": chunks}

@app.post('/chat')
async def chat_endpoint(request: ChatRequest):
    try:
        response = gemini_service.chat(request.messages, request.chunks)
    except ServiceError as e:
        raise HTTPException(status_code = 502, detail = f'Model gateway error: {e.message}')
    except Exception as e:
        raise HTTPException(status_code = 500, detail = f'Critical internal failure: {str(e)}')
    
    return {"result": response}