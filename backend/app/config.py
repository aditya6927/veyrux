import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self):
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        self.MODEL_NAME = os.getenv("MODEL_NAME")

        if not self.GEMINI_API_KEY:
            raise RuntimeError("Missing API key")

        if not self.MODEL_NAME:
            raise RuntimeError("Missing model name")

settings = Settings()