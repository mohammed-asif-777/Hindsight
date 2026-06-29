"""Chakravyuha FastAPI backend — main application entry point."""

from __future__ import annotations

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import get_settings
from backend.routers import cases, forms, guided, legal, voice
from backend.utils.errors import ApiError, api_error_handler, generic_error_handler
from backend.utils.logger import setup_logging

# Initialize logging
logger = setup_logging()

# Create FastAPI app
app = FastAPI(
    title="Chakravyuha API",
    description="Voice-first, multilingual AI legal assistant for India",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers
app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(Exception, generic_error_handler)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request with method, path, and duration."""
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000
    logger.info(
        "Request: %s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
        extra={
            "method": request.method,
            "path": str(request.url.path),
            "status_code": response.status_code,
            "duration_ms": round(duration, 1),
        },
    )
    return response


# Mount routers
from backend.routers import legal_query as legal_query_router
from backend.routers import nyaya, documents, judge, smart_legal

app.include_router(smart_legal.router)  # Classification-first pipeline (primary)
app.include_router(legal_query_router.router)
app.include_router(nyaya.router)
app.include_router(documents.router)
app.include_router(judge.router)
app.include_router(legal.router)
app.include_router(guided.router)
app.include_router(voice.router)
app.include_router(cases.router)
app.include_router(forms.router)


@app.get("/")
async def root() -> dict:
    """Health check and API info."""
    settings = get_settings()
    return {
        "name": "Chakravyuha API",
        "version": "1.0.0",
        "description": "AI Legal Assistant for India",
        "disclaimer": settings.disclaimer_text,
        "endpoints": {
            "legal_query": "POST /api/query",
            "section_lookup": "GET /api/sections/{id}",
            "guided_flow": "POST /api/guided/start, POST /api/guided/next",
            "voice": "POST /api/voice",
            "cases": "GET/POST /api/cases",
            "forms": "GET /api/form/portals, POST /api/form/start",
            "nyaya": "POST /api/nyaya/query, GET /api/nyaya/statute/{code}, POST /api/nyaya/extract-entities",
        },
    }


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Chakravyuha API starting up...")

    # Pre-load legal data
    from backend.services.legal_service import get_legal_service
    service = get_legal_service()
    logger.info("Legal service loaded: %d sections", len(service._section_index))

    # Try to initialize RAG (non-blocking)
    try:
        service.init_rag()
    except Exception as e:
        logger.warning("RAG init skipped (will use keyword search): %s", e)

    logger.info("Chakravyuha API ready!")
