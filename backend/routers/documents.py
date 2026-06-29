"""FastAPI router for document generation endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

from backend.legal.document_drafter import DocumentDrafter, DocumentType, PartyInfo, CaseContext

router = APIRouter(prefix="/api/documents", tags=["Documents"])
drafter = DocumentDrafter()


# ── Request/Response Models ────────────────────────────────────────────────

class PartyRequest(BaseModel):
    """Party information for documents."""
    name: str = Field(..., description="Full name")
    phone: str = Field(..., description="Contact phone")
    email: Optional[EmailStr] = None
    address: str = Field(default="", description="Full address")
    occupation: Optional[str] = None


class DocumentGenerationRequest(BaseModel):
    """Request to generate a legal document."""
    document_type: str = Field(..., description="FIR, LEGAL_NOTICE, or COMPLAINT")
    complainant: PartyRequest
    accused: PartyRequest
    case_type: str = Field(..., description="Type of case (e.g., Theft, Assault)")
    incident_date: str = Field(..., description="YYYY-MM-DD format")
    incident_location: str
    description: str = Field(..., description="Detailed narrative of incident")
    offense_sections: List[str] = Field(..., description="BNS section codes")
    evidence: Optional[List[str]] = []
    witnesses: Optional[List[str]] = []


class DocumentResponse(BaseModel):
    """Response with generated document."""
    document_type: str
    content: str
    generated_at: str
    status: str = "success"


class DocumentPreviewResponse(BaseModel):
    """Preview of document before generation."""
    document_type: str
    parties_summary: dict
    sections: List[str]
    case_summary: str
    estimated_length: str


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/draft-fir", response_model=DocumentResponse)
async def draft_fir(request: DocumentGenerationRequest):
    """
    Generate a First Information Report (FIR).
    
    **Use case**: Police complaint for criminal case
    **Output**: Ready-to-file FIR document
    
    **Example request**:
    ```json
    {
        "document_type": "FIR",
        "complainant": {
            "name": "Raj Kumar",
            "phone": "9876543210",
            "address": "123 Main Street, Delhi"
        },
        "accused": {
            "name": "John Doe",
            "phone": "9123456789",
            "address": "456 Court Road, Delhi"
        },
        "case_type": "Theft",
        "incident_date": "2024-03-20",
        "incident_location": "Delhi",
        "description": "My mobile phone was stolen...",
        "offense_sections": ["BNS-303"]
    }
    ```
    """
    try:
        context = _create_context(request)
        fir_content = drafter.draft_fir(context)
        
        return DocumentResponse(
            document_type="FIR",
            content=fir_content,
            generated_at=datetime.now().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"FIR generation failed: {str(e)}")


@router.post("/draft-legal-notice", response_model=DocumentResponse)
async def draft_legal_notice(request: DocumentGenerationRequest):
    """
    Generate a legal notice (sent before FIR).
    
    **Use case**: Formal warning to accused before filing FIR
    **Output**: Formatted legal notice
    
    A legal notice is often sent first to give the accused time to respond 
    or settle the matter out of court.
    """
    try:
        context = _create_context(request)
        notice_content = drafter.draft_legal_notice(context)
        
        return DocumentResponse(
            document_type="LEGAL_NOTICE",
            content=notice_content,
            generated_at=datetime.now().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Legal notice generation failed: {str(e)}")


@router.post("/draft-complaint", response_model=DocumentResponse)
async def draft_complaint(request: DocumentGenerationRequest):
    """
    Generate a consumer/civil complaint.
    
    **Use case**: Consumer disputes, civil matters
    **Output**: Complaint petition ready for filing
    
    Use this for consumer complaints or civil cases, not criminal complaints.
    """
    try:
        context = _create_context(request)
        complaint_content = drafter.draft_complaint(context)
        
        return DocumentResponse(
            document_type="COMPLAINT",
            content=complaint_content,
            generated_at=datetime.now().isoformat(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Complaint generation failed: {str(e)}")


@router.post("/preview", response_model=DocumentPreviewResponse)
async def preview_document(request: DocumentGenerationRequest):
    """
    Preview a document before full generation.
    
    **Use case**: Verify details are correct before generating
    **Output**: Summary of what will be generated
    """
    try:
        return DocumentPreviewResponse(
            document_type=request.document_type,
            parties_summary={
                "complainant": request.complainant.name,
                "accused": request.accused.name,
            },
            sections=request.offense_sections,
            case_summary=request.description[:100] + "..." if len(request.description) > 100 else request.description,
            estimated_length="2-4 pages",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preview failed: {str(e)}")


@router.get("/templates")
async def list_templates():
    """List all available document templates."""
    return {
        "templates": [
            {
                "name": "FIR",
                "description": "First Information Report for criminal cases",
                "use_case": "Police complaint",
            },
            {
                "name": "LEGAL_NOTICE",
                "description": "Legal notice sent before filing FIR",
                "use_case": "Pre-FIR formal notice",
            },
            {
                "name": "COMPLAINT",
                "description": "Complaint petition for civil/consumer cases",
                "use_case": "Consumer disputes, civil matters",
            },
        ]
    }


@router.get("/help")
async def document_help():
    """Get help about document generation."""
    return {
        "help": "Use the /api/documents endpoints to generate legal documents",
        "endpoints": [
            {
                "method": "POST",
                "path": "/api/documents/draft-fir",
                "description": "Generate FIR",
            },
            {
                "method": "POST",
                "path": "/api/documents/draft-legal-notice",
                "description": "Generate legal notice",
            },
            {
                "method": "POST",
                "path": "/api/documents/draft-complaint",
                "description": "Generate complaint",
            },
        ],
    }


# ── Helper Functions ───────────────────────────────────────────────────────

def _create_context(request: DocumentGenerationRequest) -> CaseContext:
    """Convert API request to CaseContext."""
    return CaseContext(
        complainant=PartyInfo(
            name=request.complainant.name,
            phone=request.complainant.phone,
            email=request.complainant.email,
            address=request.complainant.address,
            occupation=request.complainant.occupation,
        ),
        accused=PartyInfo(
            name=request.accused.name,
            phone=request.accused.phone,
            address=request.accused.address,
        ),
        case_type=request.case_type,
        incident_date=request.incident_date,
        incident_location=request.incident_location,
        description=request.description,
        offense_sections=request.offense_sections,
        evidence=request.evidence or [],
        witnesses=request.witnesses or [],
    )
