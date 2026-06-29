"""Smart legal router — classification-first pipeline.

Flow: Translate (if needed) → Classify → Safe Response → Outcome → Complaint → (RAG fallback)
"""

from __future__ import annotations

import base64
import logging

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel, Field

from backend.services.classifier import classify
from backend.services.response_engine import get_response, get_all_scenarios, LegalResponse
from backend.services.voice_service import get_voice_service

logger = logging.getLogger("chakravyuha")

router = APIRouter(prefix="/api", tags=["smart-legal"])


async def _translate_to_english(text: str, source_lang: str) -> str:
    """Translate non-English text to English for classification.

    Returns original text if already English or translation fails.
    """
    if source_lang == "en-IN" or not text:
        return text

    voice = get_voice_service()
    if not voice.is_available:
        return text

    try:
        translated = await voice.translate(text, source_lang=source_lang, target_lang="en-IN")
        if translated and translated != text:
            logger.info("Translated [%s]: '%s' -> '%s'", source_lang, text[:50], translated[:50])
            return translated
    except Exception as e:
        logger.warning("Translation failed: %s", e)

    return text


async def _classify_multilingual(text: str, language: str = "en-IN") -> str:
    """Classify text, translating to English first if needed."""
    # Try English classification first (works for English + mixed text)
    scenario = classify(text)
    if scenario not in ("unknown", "empty"):
        return scenario

    # If unknown and non-English language, translate and retry
    if language != "en-IN":
        english_text = await _translate_to_english(text, source_lang=language)
        if english_text != text:
            scenario = classify(english_text)
            if scenario not in ("unknown", "empty"):
                logger.info("Classified after translation: '%s' -> %s", english_text[:50], scenario)
                return scenario

    return scenario


# ── Request / Response Models ────────────────────────────────────────────────

class SmartQueryRequest(BaseModel):
    query: str = Field(..., description="User's legal question")
    language: str = Field(default="en-IN")


class SmartResponse(BaseModel):
    scenario: str
    title: str
    guidance: str
    sections: list[str]
    outcome: str
    severity: str
    complaint_draft: str = ""
    helplines: list[str] = []
    source: str = "classifier"  # "classifier" or "rag_fallback"


class SmartVoiceResponse(BaseModel):
    transcript: str
    confidence: float
    language: str
    response: SmartResponse | None = None
    audio: str | None = None  # base64 TTS
    error: str | None = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _response_to_dict(resp: LegalResponse) -> SmartResponse:
    return SmartResponse(
        scenario=resp.scenario,
        title=resp.title,
        guidance=resp.guidance,
        sections=resp.sections,
        outcome=resp.outcome,
        severity=resp.severity,
        complaint_draft=resp.complaint_draft,
        helplines=resp.helplines,
        source="classifier",
    )


def _rag_fallback(query: str) -> SmartResponse:
    """Use keyword search as fallback for unclassified queries."""
    try:
        from backend.services.legal_service import get_legal_service
        service = get_legal_service()
        results = service.keyword_search(query, top_k=3)

        if results:
            guidance_parts = []
            section_refs = []
            for r in results:
                sec = r["section"]
                section_refs.append(f"{sec.section_id} — {sec.title} ({sec.act})")
                guidance_parts.append(
                    f"{sec.section_id}: {sec.title}\n{sec.description}"
                    + (f"\nPunishment: {sec.punishment}" if sec.punishment else "")
                )

            return SmartResponse(
                scenario="rag_result",
                title="Legal Sections Found",
                guidance="\n\n".join(guidance_parts),
                sections=section_refs,
                outcome="Please consult a qualified lawyer for specific legal advice on your situation.",
                severity="medium",
                source="rag_fallback",
            )
    except Exception as e:
        logger.error("RAG fallback failed: %s", e)

    return SmartResponse(
        scenario="unknown",
        title="Could Not Classify",
        guidance=(
            "I couldn't identify your specific legal issue. Please try:\n\n"
            "1. Describe your problem in more detail\n"
            "2. Use the guided flow for step-by-step help\n"
            "3. Call NALSA at 15100 for free legal aid\n"
            "4. Call 112 for emergencies"
        ),
        sections=[],
        outcome="Please rephrase your question or use the guided legal flow.",
        severity="low",
        helplines=["15100 (NALSA)", "112 (Emergency)"],
        source="rag_fallback",
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/smart-query", response_model=SmartResponse)
async def smart_query(request: SmartQueryRequest) -> SmartResponse:
    """Classification-first legal query.

    1. Classify the input into a known scenario
    2. Return curated, safe response
    3. If unknown, fall back to keyword search
    """
    if not request.query or not request.query.strip():
        return SmartResponse(
            scenario="empty",
            title="No Input",
            guidance="Please type or speak your legal question.",
            sections=[],
            outcome="",
            severity="low",
        )

    scenario = await _classify_multilingual(request.query, request.language)
    logger.info("Smart query: '%s' [%s] -> scenario=%s", request.query[:50], request.language, scenario)

    if scenario not in ("unknown", "empty"):
        resp = get_response(scenario)
        if resp:
            return _response_to_dict(resp)

    # Fallback to RAG keyword search
    return _rag_fallback(request.query)


@router.post("/smart-voice", response_model=SmartVoiceResponse)
async def smart_voice(
    audio: UploadFile = File(...),
    language: str = Form("hi-IN"),
) -> SmartVoiceResponse:
    """Voice pipeline with classification-first response.

    1. ASR (Sarvam) → transcript
    2. Classify transcript → scenario
    3. Safe response → guidance + outcome + complaint
    4. TTS (optional) → audio response
    """
    voice = get_voice_service()
    audio_bytes = await audio.read()

    if not audio_bytes or len(audio_bytes) < 100:
        return SmartVoiceResponse(
            transcript="",
            confidence=0.0,
            language=language,
            error="Audio too short or empty. Please try again.",
        )

    # Step 1: ASR (convert webm→wav for Sarvam compatibility)
    content_type = audio.content_type or "audio/webm"
    transcription = await voice.transcribe(audio_bytes, language, content_type=content_type)

    if not transcription.text or transcription.mode == "fallback":
        return SmartVoiceResponse(
            transcript="",
            confidence=transcription.confidence,
            language=transcription.language,
            error="Could not understand the audio. Please speak clearly or type your question.",
        )

    # Step 2: Classify (translate to English if needed)
    detected_lang = transcription.language or language
    scenario = await _classify_multilingual(transcription.text, detected_lang)
    logger.info(
        "Smart voice: transcript='%s', lang=%s, scenario=%s, confidence=%.2f",
        transcription.text[:50], detected_lang, scenario, transcription.confidence,
    )

    # Step 3: Get response
    if scenario not in ("unknown", "empty"):
        resp = get_response(scenario)
        smart_resp = _response_to_dict(resp) if resp else _rag_fallback(transcription.text)
    else:
        smart_resp = _rag_fallback(transcription.text)

    # Step 4: TTS (for non-English, synthesize the guidance summary)
    audio_b64 = None
    if voice.is_available and language != "en-IN":
        tts_text = smart_resp.guidance[:300]
        tts_bytes = await voice.synthesize(tts_text, language)
        if tts_bytes:
            audio_b64 = base64.b64encode(tts_bytes).decode("utf-8")

    return SmartVoiceResponse(
        transcript=transcription.text,
        confidence=transcription.confidence,
        language=transcription.language,
        response=smart_resp,
        audio=audio_b64,
    )


@router.get("/scenarios")
async def list_scenarios() -> dict:
    """List all known legal scenarios for the frontend."""
    return {"scenarios": get_all_scenarios()}


@router.post("/judge")
async def ai_judge(request: SmartQueryRequest) -> dict:
    """AI Judge — predict outcome for a legal scenario."""
    scenario = await _classify_multilingual(request.query, request.language)
    resp = get_response(scenario) if scenario not in ("unknown", "empty") else None

    if resp:
        return {
            "scenario": resp.scenario,
            "title": resp.title,
            "outcome": resp.outcome,
            "severity": resp.severity,
            "sections": resp.sections,
        }

    return {
        "scenario": "unknown",
        "title": "Cannot Predict",
        "outcome": "Please describe your situation more clearly for an outcome prediction.",
        "severity": "unknown",
        "sections": [],
    }


@router.post("/draft-complaint")
async def draft_complaint(request: SmartQueryRequest) -> dict:
    """Generate a complaint/FIR draft for a legal scenario."""
    scenario = await _classify_multilingual(request.query, request.language)
    resp = get_response(scenario) if scenario not in ("unknown", "empty") else None

    if resp and resp.complaint_draft:
        return {
            "scenario": resp.scenario,
            "title": resp.title,
            "draft": resp.complaint_draft,
            "available": True,
        }

    return {
        "scenario": scenario,
        "title": "No Template Available",
        "draft": "No complaint template available for this scenario. "
                 "Please consult a lawyer for drafting legal documents.",
        "available": False,
    }
