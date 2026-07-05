# Veyrux

Veyrux is an AI-powered personal assistant currently under development.

## Current Features (v0.1)

- AI-powered document analysis
- Upload support for PDF, DOCX, images, and text files
- FastAPI backend
- React + TypeScript frontend
- Gemini API integration

## Tech Stack

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Backend

- FastAPI
- Pydantic
- PyMuPDF
- python-docx
- Google Gemini API

## Project Structure

    veyrux/
    ├── backend/
    └── frontend/

## Getting Started

### Backend

    cd backend
    cp .env.example .env      # add your Gemini API key
    pip install -r requirements.txt
    uvicorn main:app --reload

### Frontend

    cd frontend
    cp .env.example .env
    npm install
    npm run dev

## Environment Variables

### Backend

- `GEMINI_API_KEY` — your Google Gemini API key
- `MODEL_NAME` — Gemini model to use (e.g. `gemini-2.0-flash`)

### Frontend

- `VITE_API_URL` — backend URL (default: `http://localhost:8000`)

## Status

Active development. Current version: **v0.1**
