# Chakravyuha × OpenNyAI Integration Reference

> Strategic blueprint for leveraging OpenNyAI (Jugalbandi + InLegalNER) patterns to enhance Chakravyuha MVP

**Date**: March 24, 2026  
**Status**: Active Implementation Guide  
**Integration Target**: Phase 1 → Phase 2 transition

---

## Executive Summary

OpenNyAI has solved several problems Chakravyuha can directly adopt:

| Problem | OpenNyAI Solution | Chakravyuha Adoption |
|---------|------|-----|
| **Voice Service Coupling** | Abstract `SpeechProcessor` interface with Composite pattern | Adopt as base for ASR/TTS providers |
| **Multi-Provider Failover** | `CompositeSpeechProcessor` with selective provider filtering | Improve cascade logic with language-aware routing |
| **Stateful Conversations** | FSM + Session DB with state persistence | Implement for form-filling agent |
| **Legal Entity Extraction** | `InLegalNER` with statute clustering & coreference | Extract IPC sections from queries with >90% accuracy |
| **Provision-Statute Linking** | Automatic pair clustering (provision → statute) | Link user queries to exact sections |
| **Message Routing** | Kafka-based async message passing | Replace sync API calls for scalability |

---

## Part 1: Voice Services Architecture (Immediate Implementation)

### Current Chakravyuha Implementation

```python
# backend/voice/asr.py - Current approach
class _transcribe_sarvam(wav_bytes, language):
    # Direct API call, limited retry/fallback logic
    client = SarvamAI(api_key)
    response = client.speech_to_text.transcribe(file=wav_bytes, ...)
    return response
```

### OpenNyAI Pattern (Jugalbandi)

```python
# From: language/src/speech_processor.py
# Abstract interface for multiple providers

from abc import ABC, abstractmethod

class SpeechProcessor(ABC):
    """Base abstraction for ASR/TTS providers"""
    
    @abstractmethod
    async def speech_to_text(self, wav_data: bytes, input_language: LanguageCodes) -> str:
        pass
    
    @abstractmethod
    async def text_to_speech(self, text: str, input_language: LanguageCodes) -> bytes:
        pass


class DhruvaSpeechProcessor(SpeechProcessor):
    """Bhashini API provider (India-optimized)"""
    async def speech_to_text(self, wav_data: bytes, input_language: LanguageCodes) -> str:
        # Bhashini config call + inference
        # Includes full error handling + logging


class AzureSpeechProcessor(SpeechProcessor):
    """Azure Speech Services provider (high reliability)"""
    async def speech_to_text(self, wav_data: bytes, input_language: LanguageCodes) -> str:
        # Azure SDK integration with language mapping


class CompositeSpeechProcessor(SpeechProcessor):
    """Composite pattern: try providers in order, fallback on error"""
    
    def __init__(self, *providers: List[SpeechProcessor]):
        self.providers = providers
    
    async def speech_to_text(self, wav_data: bytes, input_language: LanguageCodes) -> str:
        exceptions = []
        for provider in self.providers:
            # Language-aware filtering: skip if provider doesn't support language
            if input_language.name in self.unsupported_languages.get(provider.__class__.__name__, []):
                continue
            
            try:
                return await provider.speech_to_text(wav_data, input_language)
            except Exception as e:
                exceptions.append(e)
        
        # All providers failed
        raise ExceptionGroup("All ASR providers failed", exceptions)
```

### Chakravyuha Refactor Target

**File**: [backend/voice/asr.py](backend/voice/asr.py)

```python
# REFACTORED approach using OpenNyAI pattern

from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional
import httpx
import base64
import json

class LanguageCodes(Enum):
    """Support 12+ Indian languages"""
    HI = "hi"  # Hindi
    TA = "ta"  # Tamil
    TE = "te"  # Telugu
    KN = "kn"  # Kannada
    ML = "ml"  # Malayalam
    # ... etc


class ASRProvider(ABC):
    """Abstract base for ASR providers matching OpenNyAI pattern"""
    
    @abstractmethod
    async def transcribe(self, wav_data: bytes, language: LanguageCodes) -> dict:
        """
        Returns: {
            "text": str,
            "confidence": float,  # 0.0-1.0
            "language": str,
            "provider": str,
            "error": Optional[str]
        }
        """
        pass


class SarvamASR(ASRProvider):
    """Migrate from _transcribe_sarvam() to class-based provider"""
    
    async def transcribe(self, wav_data: bytes, language: LanguageCodes) -> dict:
        """Sarvam-specific implementation with error handling"""
        try:
            api_key = os.getenv("SARVAM_API_KEY")
            if not api_key:
                return {
                    "error": "SARVAM_API_KEY not set",
                    "provider": "sarvam"
                }
            
            client = SarvamAI(api_subscription_key=api_key)
            
            # CRITICAL: Correct method calling pattern (from OpenNyAI analysis)
            response = client.speech_to_text.transcribe(
                file=wav_data,
                model="saarika:v2.5",
                language_code=f"{language.value}-IN"
            )
            
            # Defensive response parsing (handles object attrs + dict keys)
            return {
                "text": getattr(response, 'text', response.get('text', '')),
                "confidence": getattr(response, 'confidence', response.get('confidence', 0.8)),
                "language": language.value,
                "provider": "sarvam"
            }
        
        except TypeError as e:
            # Handles: 'SpeechToTextClient' object is not callable
            logger.error(f"Sarvam API method calling error: {e}")
            return {
                "error": f"TypeError in Sarvam API: {str(e)[:100]}",
                "provider": "sarvam"
            }
        except Exception as e:
            return {
                "error": f"{type(e).__name__}: {str(e)[:100]}",
                "provider": "sarvam"
            }


class IndicWhisperASR(ASRProvider):
    """Fallback to open-source IndicWhisper"""
    
    async def transcribe(self, wav_data: bytes, language: LanguageCodes) -> dict:
        # Implementation using local model


class MetaMMSASR(ASRProvider):
    """Dialect support provider (Bhojpuri, Tulu, Chhattisgarhi)"""
    
    async def transcribe(self, wav_data: bytes, language: LanguageCodes) -> dict:
        # Implementation for dialect handling


class CompositeASR(ASRProvider):
    """OpenNyAI composite pattern: intelligent provider selection"""
    
    def __init__(self):
        self.providers = {
            "sarvam": SarvamASR(),
            "indicwhisper": IndicWhisperASR(),
            "meta_mms": MetaMMSASR()
        }
        
        # Language → provider mapping (OpenNyAI style)
        self.language_provider_preference = {
            LanguageCodes.HI: ["sarvam", "indicwhisper", "meta_mms"],
            LanguageCodes.TA: ["sarvam", "indicwhisper"],
            LanguageCodes.BHO: ["meta_mms", "indicwhisper"],  # Bhojpuri
            LanguageCodes.TCY: ["meta_mms"],  # Tulu
        }
    
    async def transcribe(self, wav_data: bytes, language: LanguageCodes) -> dict:
        """Try providers in language-aware order"""
        preferred_order = self.language_provider_preference.get(
            language,
            ["sarvam", "indicwhisper", "meta_mms"]
        )
        
        errors = []
        for provider_name in preferred_order:
            provider = self.providers[provider_name]
            result = await provider.transcribe(wav_data, language)
            
            if "error" not in result:
                return result
            
            errors.append({"provider": provider_name, "error": result["error"]})
        
        # All failed
        return {
            "error": f"All ASR providers failed: {errors}",
            "provider": "composite"
        }


# ORCHESTRATOR layer (new, following OpenNyAI pattern)
class ASROrchestrator:
    """Handles confidence-based cascading + logging"""
    
    def __init__(self):
        self.asr = CompositeASR()
        self.confidence_threshold_high = 0.85
        self.confidence_threshold_medium = 0.75
    
    async def transcribe(self, wav_data: bytes, language: LanguageCodes) -> dict:
        """Main entry point - handles cascade logic"""
        # First attempt
        result = await self.asr.transcribe(wav_data, language)
        
        if "error" in result:
            return result
        
        confidence = result.get("confidence", 0)
        
        # Cascade logic: low confidence → retry with fallback
        if confidence < self.confidence_threshold_medium:
            logger.warning(f"Low confidence {confidence}, cascading to fallback")
            # Trigger fallback mechanism
            result["cascade_triggered"] = True
        
        return result
```

**Why This Matters**:
- ✅ Matches OpenNyAI's proven pattern for multi-provider orchestration
- ✅ Language-aware routing prevents incompatible API calls
- ✅ Centralized error handling (no scattered try-except blocks)
- ✅ Easy to add new providers (just inherit `ASRProvider`)
- ✅ Testable: mock individual providers independently

---

## Part 2: Legal Entity Extraction (Phase 2 Foundation)

### Problem: Chakravyuha query → IPC sections

**Current Approach**:
```
User Query: "Mere sath kisi ne marof kiya" 
→ RAG retrieval by vector similarity
→ Returns IPC-323 (hurt)
```

**Issue**: 90% accuracy ceiling because:
1. No statute coreference (multiple ways to refer to same section)
2. No provision-statute linking (doesn't know which section applies)
3. No named entity alignment (doesn't extract statutes from user queries)

### OpenNyAI Solution: InLegalNER + Statute Clustering

**Architecture from OpenNyAI**:

```python
# From: opennyai/ner/InLegalNER/InLegalNER.py
# 3-stage pipeline:
# 1. Named Entity Recognition (spaCy-based)
# 2. Entity linking (statute/provision clustering)  
# 3. Post-processing (coreference resolution)

class InLegalNER:
    def __init__(self, model_name='en_legal_ner_trf', use_gpu=True):
        self.nlp = spacy.load(model_name)  # HuggingFace model
    
    def __call__(self, text: str, do_postprocess: bool = True) -> spacy.Doc:
        # Stage 1: Entity extraction
        doc = self.nlp(text)  # Extracts: STATUTE, PROVISION, PETITIONER, etc.
        
        if do_postprocess:
            # Stage 2: Statute clustering (map "IPC 302" → "Indian Penal Code section 302")
            statute_clusters = pro_statute_coref_resol(doc)
            
            # Stage 3: Coreference (map "it" → specific statute)
            precedent_clusters = precedent_coref_resol(doc)
        
        return doc
```

**Key Entities Extracted**:
- `STATUTE`: "Indian Penal Code", "Code of Criminal Procedure", "Bharatiya Nyaya Sanhita"
- `PROVISION`: "Section 302", "Article 15"
- `PETITIONER` / `RESPONDENT`: Party names (for case context)
- `JUDGE` / `LAWYER` / `WITNESS`: Roles

### Chakravyuha Integration (Phase 2)

**New File**: `backend/legal/entity_extractor.py`

```python
# Adapted from OpenNyAI for Indian legal text

import spacy
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class LegalEntity:
    text: str
    entity_type: str  # STATUTE, PROVISION, PETITIONER, etc.
    start_char: int
    end_char: int
    confidence: float = 0.95


@dataclass
class StatuteCluster:
    """Map variations of same statute to canonical form"""
    canonical_name: str  # "Indian Penal Code section 323"
    variations: List[str]  # ["IPC 323", "Section 323", "Hurting"]
    year: int  # 1860 for IPC, 2023 for BNS
    ipc_code: str  # "IPC-323" for indexing


class LegalEntityExtractor:
    """Chakravyuha's legal NER engine (OpenNyAI-based)"""
    
    def __init__(self):
        # Load OpenNyAI's fine-tuned legal NER model
        try:
            self.nlp = spacy.load("en_legal_ner_trf")
        except OSError:
            # Fallback: simple regex-based extraction
            self.nlp = None
            self.regex_patterns = self._init_regex_patterns()
    
    def extract_entities(self, text: str) -> List[LegalEntity]:
        """Extract legal entities from text"""
        if self.nlp:
            return self._extract_with_spacy(text)
        else:
            return self._extract_with_regex(text)
    
    def _extract_with_spacy(self, text: str) -> List[LegalEntity]:
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            entities.append(LegalEntity(
                text=ent.text,
                entity_type=ent.label_,
                start_char=ent.start_char,
                end_char=ent.end_char,
                confidence=0.95  # spaCy confidence
            ))
        
        return entities
    
    def _extract_with_regex(self, text: str) -> List[LegalEntity]:
        """Fallback: regex patterns for statute/provision extraction"""
        entities = []
        
        # Pattern: "Section 323" or "IPC 323" → PROVISION
        provision_pattern = r'(?:Section|Sec|Article|S\.)\s*(\d+)'
        for match in re.finditer(provision_pattern, text, re.IGNORECASE):
            entities.append(LegalEntity(
                text=match.group(0),
                entity_type="PROVISION",
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.85
            ))
        
        # Pattern: "Indian Penal Code" → STATUTE
        statute_patterns = {
            "STATUTE": [
                r"Indian Penal Code|IPC(?:\s|\d)",
                r"Code of Criminal Procedure|CrPC",
                r"Bharatiya Nyaya Sanhita|BNS",
            ]
        }
        
        for pattern in statute_patterns["STATUTE"]:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entities.append(LegalEntity(
                    text=match.group(0),
                    entity_type="STATUTE",
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=0.90
                ))
        
        return entities
    
    def cluster_statutes(self, entities: List[LegalEntity]) -> Dict[str, StatuteCluster]:
        """OpenNyAI pattern: cluster statute variations to canonical forms"""
        
        # Statute variation mapping (from OpenNyAI postprocessing_utils.py)
        statute_mappings = {
            "Indian Penal Code": StatuteCluster(
                canonical_name="Indian Penal Code 1860",
                variations=["IPC", "Indian Penal Code", "Penal Code"],
                year=1860,
                ipc_code="IPC"
            ),
            "Bharatiya Nyaya Sanhita": StatuteCluster(
                canonical_name="Bharatiya Nyaya Sanhita 2023",
                variations=["BNS", "Bharatiya Nyaya Sanhita"],
                year=2023,
                ipc_code="BNS"
            ),
            # ... more mappings
        }
        
        # Fuzzy match extracted statutes to canonical forms
        clusters = {}
        for entity in entities:
            if entity.entity_type == "STATUTE":
                for canonical, cluster in statute_mappings.items():
                    if self._fuzzy_match(entity.text, cluster.variations):
                        clusters[entity.text] = cluster
                        break
        
        return clusters
    
    def link_provisions_to_statutes(self, entities: List[LegalEntity]) -> List[tuple]:
        """OpenNyAI pattern: link provisions to their statutes"""
        # E.g., ("Section 323", "Indian Penal Code")
        
        provisions = [e for e in entities if e.entity_type == "PROVISION"]
        statutes = [e for e in entities if e.entity_type == "STATUTE"]
        
        links = []
        for prov in provisions:
            # Find nearest statute (before or after provision)
            nearest_statute = min(
                statutes,
                key=lambda s: abs(s.start_char - prov.start_char),
                default=None
            )
            if nearest_statute:
                links.append((prov.text, nearest_statute.text))
        
        return links


# Usage in RAG pipeline
async def query_with_entity_extraction(user_query: str, language: str = "hi"):
    """Enhanced RAG query with entity extraction"""
    
    # Step 1: Extract legal entities from query
    extractor = LegalEntityExtractor()
    entities = extractor.extract_entities(user_query)
    
    # Step 2: Cluster statutes (handle IPC→BNS transition)
    statute_clusters = extractor.cluster_statutes(entities)
    
    # Step 3: Link provisions to statutes
    provision_statute_links = extractor.link_provisions_to_statutes(entities)
    
    # Step 4: Use links as metadata filters for RAG
    # Instead of pure semantic search, combine with statute metadata
    
    # Example: If user query mentions "Section 323", 
    # filter RAG results to only IPC/BNS sections with that number
    provision_ids = [f"{cluster.ipc_code}-{prov.split()[-1]}" 
                     for prov, stat in provision_statute_links 
                     for cluster in statute_clusters.values()]
    
    # Query RAG with filters
    rag_results = await rag_engine.query(
        text=user_query,
        metadata_filters={"section_id": provision_ids}
    )
    
    return rag_results
```

**Benefits**:
- 📚 Canonical statute mapping handles IPC→BNS transition
- 🔗 Provision-statute linking = exact section matching
- 🎯 Metadata-filtered RAG = higher accuracy
- 🌐 Works across 10+ Indian languages

---

## Part 3: Stateful Conversation FSM (Phase 2+)

### OpenNyAI Pattern: Finite State Machines

**Jugalbandi Architecture**:

```python
# From: jb-lib/lib/data_models/flow.py

class FSMIntent(Enum):
    CONVERSATION_RESET = "CONVERSATION_RESET"
    LANGUAGE_CHANGE = "LANGUAGE_CHANGE"
    SEND_MESSAGE = "SEND_MESSAGE"
    RAG_CALL = "RAG_CALL"
    WEBHOOK = "WEBHOOK"


class FSMOutput(BaseModel):
    """FSM determines what action to take next"""
    intent: FSMIntent
    message: Optional[Message] = None  # Send text/audio
    rag_query: Optional[RAGQuery] = None  # Query knowledge base
    webhook: Optional[Webhook] = None  # Call external service


# Example Flow:
# User Input → FSM State Machine → FSM Output → Channel Backend
# 
# State: "AWAITING_COMPLAINT"
# User says: "Mere sath marof hua"
# FSM decides: RAG_CALL(query="hurt case law")
# → RAG returns IPC-323, IPC-324
# → FSM decides: SEND_MESSAGE("IPC-323 applies in your case...")
# → Channel (WhatsApp/Web) sends response
```

### Chakravyuha Form-Filling FSM

**Use Case**: Auto-fill FIR form based on user's description

```python
# backend/agent/form_fsm.py

class FormIntent(Enum):
    """Extended FSM intents for form-filling"""
    ASK_FOR_FIR_DETAILS = "ASK_FOR_FIR_DETAILS"
    ASK_FOR_ACCUSED_NAME = "ASK_FOR_ACCUSED_NAME"
    ASK_FOR_INCIDENT_DATE = "ASK_FOR_INCIDENT_DATE"
    FILL_FORM_FIELD = "FILL_FORM_FIELD"
    VALIDATE_FORM = "VALIDATE_FORM"
    SUBMIT_FORM = "SUBMIT_FORM"
    ESCALATE_TO_POLICE = "ESCALATE_TO_POLICE"


class FormState:
    """Represents current state of FIR form"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.form_data = {}
        self.current_field = "incident_description"
        self.required_fields = [
            "incident_description",
            "accused_name",
            "incident_date",
            "incident_location"
        ]
        self.filled_fields = set()


class FormFillingFSM:
    """State machine for guided form-filling"""
    
    async def process_user_input(
        self,
        user_query: str,
        state: FormState
    ) -> "FSMOutput":
        """Determine next action based on current state"""
        
        # Step 1: Extract relevant info from query
        extractor = LegalEntityExtractor()
        entities = extractor.extract_entities(user_query)
        
        # Step 2: Determine what field user is answering
        current_field = state.current_field
        
        # Step 3: Validate/parse user input
        parsed_value = self._parse_field_value(user_query, current_field)
        
        if parsed_value:
            # Store in form
            state.form_data[current_field] = parsed_value
            state.filled_fields.add(current_field)
            
            # Determine next action
            if len(state.filled_fields) >= len(state.required_fields):
                # All fields filled → validate & submit
                return FSMOutput(
                    intent=FormIntent.VALIDATE_FORM,
                    form_data=state.form_data
                )
            else:
                # Move to next field
                next_field = [
                    f for f in state.required_fields 
                    if f not in state.filled_fields
                ][0]
                return FSMOutput(
                    intent=FormIntent.ASK_FOR_FIR_DETAILS,
                    message=Message(
                        text=f"Aage {self._field_to_label(next_field)} bataiye"
                    )
                )
        else:
            # Couldn't parse input → ask for clarification
            return FSMOutput(
                intent=FormIntent.ASK_FOR_FIR_DETAILS,
                message=Message(
                    text="Thoda aur details se samjhaye..."
                )
            )
    
    def _parse_field_value(self, user_query: str, field: str) -> Optional[str]:
        """Extract structured value from natural language"""
        
        if field == "incident_date":
            # Extract date from "5 March ko", "aaj subah", etc.
            return self._extract_date(user_query)
        elif field == "accused_name":
            # Extract person name using NER
            return self._extract_name(user_query)
        elif field == "incident_location":
            # Extract location using NER
            return self._extract_location(user_query)
        else:
            return user_query  # Use as-is for description
    
    async def escalate_to_police(self, state: FormState) -> dict:
        """Integrate with Playwright for FIR submission"""
        # This would use browser automation to fill eCourts portal
        # (Phase 3 feature)
        pass
```

---

## Part 4: Logging & Observability (OpenNyAI Pattern)

### Issue: How to debug why RAG returned wrong section?

**OpenNyAI Solution**: Comprehensive logging repository

```python
# From: jb-lib/lib/logging_repository.py

class LoggingRepository:
    """Centralized logging for all AI operations"""
    
    async def insert_stt_log(
        self,
        qa_id: str,
        audio_input_bytes: str,
        model_name: str,
        text: str,
        status_code: int,
        status_message: str,
        response_time: int
    ):
        """Log every ASR call"""
        await self.db.execute("""
            INSERT INTO jb_stt_log (qa_id, audio_input_bytes, model_name, text, 
                                     status_code, status_message, response_time, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        """, ...)
    
    async def insert_qa_log(
        self,
        qa_id: str,
        query: str,
        answer: str,
        retrieved_chunks: list,
        model_name: str,
        status_code: int,
        response_time: int
    ):
        """Log every RAG query"""
        await self.db.execute("""
            INSERT INTO jb_qa_log (qa_id, query, answer, retrieved_chunks, 
                                    model_name, status_code, response_time, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        """, ...)
```

### Chakravyuha Logging Adapter

```python
# backend/utils/observability.py

class ChakravyuhaLogger:
    """Logging to match OpenNyAI structure but for legal queries"""
    
    def __init__(self, db_pool):
        self.db = db_pool
    
    async def log_voice_query(
        self,
        user_id: str,
        audio_bytes: bytes,
        language: str,
        asr_text: str,
        asr_confidence: float,
        asr_model: str,
        asr_latency_ms: int
    ):
        """Log complete voice query pipeline"""
        
        await self.db.execute("""
            INSERT INTO voice_logs 
            (user_id, audio_hash, language, transcript, confidence, 
             model, latency_ms, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        """, user_id, hash(audio_bytes), language, asr_text, 
           asr_confidence, asr_model, asr_latency_ms)
    
    async def log_rag_retrieval(
        self,
        user_id: str,
        query: str,
        retrieved_sections: list,
        retrieval_latency_ms: int,
        relevance_scores: list
    ):
        """Log what sections were retrieved for debugging"""
        
        await self.db.execute("""
            INSERT INTO rag_logs 
            (user_id, query, sections, latency_ms, scores, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
        """, user_id, query, json.dumps(retrieved_sections), 
           retrieval_latency_ms, json.dumps(relevance_scores))
    
    async def log_tts_generation(
        self,
        user_id: str,
        text: str,
        language: str,
        audio_bytes: bytes,
        tts_model: str,
        latency_ms: int
    ):
        """Log text-to-speech output for quality tracking"""
        
        await self.db.execute("""
            INSERT INTO tts_logs 
            (user_id, text, language, audio_hash, model, latency_ms, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        """, user_id, text, language, hash(audio_bytes), tts_model, latency_ms)
```

---

## Part 5: Multi-Provider Management (Immediate)

### Issue: How to manage Sarvam vs. Bhashini vs. Azure efficiently?

**OpenNyAI Approach**: Configuration-driven provider selection

```python
# From: language/src/extension.py

# Configure providers at startup
speech_processor = CompositeSpeechProcessor(
    DhruvaSpeechProcessor(),      # Bhashini (India-optimized)
    AzureSpeechProcessor()         # Azure (Fallback)
)

# Environment-driven configuration
os.environ["BHASHINI_USER_ID"] = "..."
os.environ["AZURE_SPEECH_KEY"] = "..."
```

### Chakravyuha Refactor

**File**: `backend/services/llm/router.py` (existing)

```python
# Extend to manage speech providers the same way

from enum import Enum

class SpeechProvider(Enum):
    SARVAM = "sarvam"      # Free tier, <2s latency
    BHASHINI = "bhashini"  # Indian government, BHASHINI models
    AZURE = "azure"        # Premium, most reliable
    WHISPER = "whisper"    # Open-source fallback
    PIPER = "piper"        # Local TTS


class SpeechProviderRouter:
    """Route to best provider based on language + constraints"""
    
    def __init__(self):
        self.providers = {
            SpeechProvider.SARVAM: SarvamASR(),
            SpeechProvider.BHASHINI: BhashiniASR(),
            SpeechProvider.AZURE: AzureASR(),
        }
        
        # Language preference order
        self.language_preferences = {
            "hi": [SpeechProvider.SARVAM, SpeechProvider.BHASHINI],
            "ta": [SpeechProvider.SARVAM, SpeechProvider.WHISPER],
            "bho": [SpeechProvider.WHISPER, SpeechProvider.AZURE],  # Bhojpuri
        }
    
    async def transcribe(
        self,
        audio_bytes: bytes,
        language: str,
        max_latency_ms: int = 2000,
        prefer_free: bool = True
    ) -> dict:
        """Route to best provider given constraints"""
        
        providers = self.language_preferences.get(language, [])
        
        if prefer_free:
            # Try free providers first
            free_providers = [
                p for p in providers 
                if p in [SpeechProvider.SARVAM, SpeechProvider.WHISPER]
            ]
            providers = free_providers + [
                p for p in providers if p not in free_providers
            ]
        
        # Try each provider
        for provider_enum in providers:
            provider = self.providers[provider_enum]
            
            # Check cost/quota (Sarvam free tier: 10k requests free)
            if provider_enum == SpeechProvider.SARVAM:
                if not self._has_sarvam_quota():
                    continue
            
            result = await provider.transcribe(audio_bytes, language)
            
            if "error" not in result:
                return result
        
        # All failed
        return {"error": "All providers failed"}
    
    def _has_sarvam_quota(self) -> bool:
        """Check if Sarvam quota available"""
        # Query metrics DB
        pass
```

---

## Part 6: Kafka Message Queue (Phase 2+)

### Why: Decouple components for scalability

**OpenNyAI Pattern**:

```
User Input (WhatsApp) 
→ Channel Service (Kafka: flow_topic)
→ Flow Service (FSM processing)
→ RAG Service (knowledge retrieval)
→ Language Service (TTS)
→ Channel Service (Kafka: channel_topic)
→ WhatsApp user gets response
```

### Chakravyuha Roadmap

```python
# Phase 2: Async voice processing

# Current (sync):
@app.post("/api/voice/query")
async def voice_query(audio: UploadFile):
    asr_result = await transcribe(audio.file)  # Wait
    rag_result = await rag_query(asr_result.text)  # Wait
    tts_result = await synthesize(rag_result.text)  # Wait
    return tts_result  # Return after ~2-3 seconds


# Future (async with Kafka):
@app.post("/api/voice/query")
async def voice_query(audio: UploadFile, user_id: str):
    job_id = str(uuid.uuid4())
    
    # Send audio to Kafka topic "asr_requests"
    await kafka_producer.send("asr_requests", {
        "job_id": job_id,
        "user_id": user_id,
        "audio_bytes": base64.b64encode(await audio.read()),
        "language": "hi"
    })
    
    # Return immediately - user polls for result
    return {"job_id": job_id, "status": "processing"}


# Background workers consume from Kafka:
async def asr_worker():
    async for msg in kafka_consumer.subscribe("asr_requests"):
        result = await transcribe(msg.audio_bytes, msg.language)
        await kafka_producer.send("rag_requests", {
            **msg,
            "transcript": result.text
        })


async def rag_worker():
    async for msg in kafka_consumer.subscribe("rag_requests"):
        legal_sections = await rag_query(msg.transcript)
        await kafka_producer.send("tts_requests", {
            **msg,
            "legal_summary": legal_sections
        })


async def tts_worker():
    async for msg in kafka_consumer.subscribe("tts_requests"):
        audio = await synthesize(msg.legal_summary, msg.language)
        
        # Store in user's result queue
        await cache.set(f"result:{msg.job_id}", {
            "status": "complete",
            "audio_url": upload_to_storage(audio)
        }, ttl=3600)
```

---

## Implementation Checklist (Immediate Priority)

### Phase 1 (Weeks 1-2) - Voice Service Refactor
- [ ] Create `ASRProvider` abstract base class (adopt Jugalbandi pattern)
- [ ] Refactor `_transcribe_sarvam()` → `SarvamASR` class
- [ ] Implement `IndicWhisperASR` provider
- [ ] Create `CompositeASR` orchestrator with language-aware routing
- [ ] Create tests for all ASR providers
- [ ] **Verify**: All tests green, Sarvam API works in provider class

### Phase 1 (Weeks 3-4) - TTS Refactor + Entity Extraction
- [ ] Apply same ASR refactor pattern to TTS
- [ ] Add `LegalEntityExtractor` (OpenNyAI NER adapter)
- [ ] Build statute clustering logic
- [ ] Integrate entity extraction into RAG filtering
- [ ] Test legal accuracy on 20 IPC queries
- [ ] **Verify**: >85% accuracy on section matching

### Phase 2 (Weeks 5-6) - FSM + Form-Filling
- [ ] Define `FormFillingFSM` state machine
- [ ] Implement field parsing (date, name, location extraction)
- [ ] Add PostgreSQL schema for form state persistence
- [ ] Create FSM transition tests
- [ ] **Verify**: Form auto-fills without user errors

### Phase 2 (Weeks 7-8) - Observability + Deployment
- [ ] Implement `ChakravyuhaLogger` (OpenNyAI pattern)
- [ ] Add logging to all ASR/RAG/TTS operations
- [ ] Create observability dashboard (Grafana)
- [ ] Set up CI/CD with logging checks
- [ ] Deploy to Railway with monitoring
- [ ] **Verify**: All operations logged, dashboards functional

---

## Key Files to Create/Modify

| File | Action | Status | Priority |
|------|--------|--------|----------|
| `backend/voice/asr_providers.py` | Create | NEW | 🔴 HIGH |
| `backend/voice/tts_providers.py` | Create | NEW | 🔴 HIGH |
| `backend/legal/entity_extractor.py` | Create | NEW | 🟡 MEDIUM |
| `backend/agent/form_fsm.py` | Create | NEW | 🟡 MEDIUM |
| `backend/utils/observability.py` | Create | NEW | 🟡 MEDIUM |
| `backend/voice/asr.py` | Refactor | EXISTING | 🔴 HIGH |
| `backend/voice/tts.py` | Refactor | EXISTING | 🔴 HIGH |
| `backend/services/llm/router.py` | Extend | EXISTING | 🟡 MEDIUM |

---

## References

### OpenNyAI Repositories
1. **Jugalbandi-Manager**: Architecture patterns for composable providers
   - Speech processor abstraction: `language/src/speech_processor.py`
   - FSM execution: `flow/src/handlers/bot_input.py`
   - Logging: `jb-lib/lib/logging_repository.py`

2. **OpenNyAI Legal NLP**: Entity extraction for legal documents
   - NER: `opennyai/ner/InLegalNER/InLegalNER.py`
   - Statute clustering: `opennyai/ner/InLegalNER/postprocessing_utils.py`
   - Pipeline: `opennyai/pipeline.py`

### Chakravyuha Current Implementation
- Voice I/O: [backend/voice/](backend/voice/)
- RAG: [backend/legal/rag.py](backend/legal/rag.py)
- API: [backend/routers/legal.py](backend/routers/legal.py)

---

## Next Steps

**Immediate**: 
1. Create `ASRProvider` base class + refactor Sarvam integration
2. Run tests to verify improvements
3. Measure latency + accuracy changes

**Week 2**:
1. Implement `LegalEntityExtractor` 
2. Integrate into RAG metadata filtering
3. Test on 20 sample queries

**Week 3+**:
1. FSM for form-filling
2. Deployment with logging

---

**Document Version**: 1.0  
**Last Updated**: March 24, 2026  
**Maintainer**: Chakravyuha Team  
**Related Issues**: Phase 1 voice fixes, Phase 2 agentic actions
