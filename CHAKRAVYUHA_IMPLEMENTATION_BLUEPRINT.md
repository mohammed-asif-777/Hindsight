# Chakravyuha Implementation Blueprint
**Status**: Starting Phase 1 (Week 1-2) — Voice I/O + Legal RAG MVP  
**Last Updated**: 2026-03-24

---

## Executive Plan Overview

**Goal**: Build Chakravyuha MVP in 8 weeks (voice-first legal AI for India)  
**Team**: Single agentic engineer with agent support (planner, code-reviewer, security-reviewer, tdd-guide, e2e-runner)  
**Tech Stack**: FastAPI, React, ChromaDB, Sarvam/IndicWhisper ASR, InLegalBERT RAG, Playwright automation

---

## Phase 1: MVP Foundation (Weeks 1-2)
**Objective**: Voice input → Legal query → Text/voice output pipeline  
**Deliverables**: Voice I/O API, Legal RAG backend, Minimal UI, PostgreSQL schema

### 1.1 Voice I/O Pipeline (`backend/voice/`)
- **ASR (Speech-to-Text)**:
  - [ ] IndicWhisper cascade (12 major languages)
  - [ ] Meta MMS fallback (dialects: Bhojpuri, Chhattisgarhi, Tulu)
  - [ ] Confidence scoring + clarification prompt
  - [ ] Endpoint: `POST /api/voice/asr` → JSON transcript + confidence

- **TTS (Text-to-Speech)**:
  - [ ] Sarvam Bulbul-V2 for major languages (API)
  - [ ] Piper TTS for offline fallback
  - [ ] Language-specific prosody handling
  - [ ] Endpoint: `POST /api/voice/tts` → audio stream

### 1.2 Legal RAG System (`backend/legal/`)
- **Corpus Ingestion**:
  - [ ] Scrape IPC (Indian Penal Code) sections from indiacode.nic.in
  - [ ] Scrape BNS 2023 (Bharatiya Nyaya Sanhita) sections
  - [ ] IPC→BNS mapping table (cross-reference old→new sections)
  - [ ] Parse section structure: Section ID → Text → Punishment → Illustrations

- **Vector Database Setup**:
  - [ ] ChromaDB client initialization in `backend/legal/bm25_index.py`
  - [ ] InLegalBERT embeddings (HuggingFace model: `nlp-iiitd/InLegalBERT`)
  - [ ] Hybrid retrieval: BM25 (keywords) + Dense (semantic)
  - [ ] Reranker: cross-encoder for result ranking
  - [ ] Section-level chunking with metadata (section ID, act name, punishment, court type)

- **Query Processing**:
  - [ ] Endpoint: `POST /api/legal/query` → retrieves relevant sections
  - [ ] LLM summarization: Sarvam-1 (2B) or local Llama 3.1 instruct
  - [ ] Response format: Section ID, full text, summary, relevant illustrations, applicable court

### 1.3 REST API Design (`backend/routers/`)
- **Health & Metadata**:
  - [ ] `GET /` → API info + disclaimer
  - [ ] `GET /health` → status check
  - [ ] `GET /api/sections/{section_id}` → section details

- **Voice Query Pipeline**:
  - [ ] `POST /api/voice/dictation` → accepts audio blob, returns text + confidence
  - [ ] `POST /api/legal/query` → text query → legal sections + summary
  - [ ] `POST /api/voice/response` → generates Hindi/regional speech response

- **Error Handling**:
  - [ ] Structured error responses per api-design patterns
  - [ ] User-friendly messages (no stack traces)
  - [ ] Rate limiting (500 req/min per IP)
  - [ ] Input validation (query length, audio format, language code)

### 1.4 Database Schema (`backend/models/`)
```sql
-- Users (anonymous + optional login)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone_hash VARCHAR(255) UNIQUE,
  preferred_language VARCHAR(10),
  created_at TIMESTAMP
);

-- Queries (for analytics + training)
CREATE TABLE legal_queries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  text_query TEXT,
  language VARCHAR(10),
  confidence FLOAT,
  source ('voice'|'text'),
  retrieved_sections JSONB,
  llm_answer TEXT,
  is_escalated BOOLEAN,
  created_at TIMESTAMP
);

-- Cases (for case tracking in Phase 3)
CREATE TABLE cases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  case_type VARCHAR(50),
  state VARCHAR(50),
  status ('filed'|'pending'|'resolved'),
  sections_involved JSONB,
  case_number VARCHAR(100),
  created_at TIMESTAMP
);
```

### 1.5 Testing & Validation
- [ ] Unit tests: ASR, TTS, RAG retrieval (pytest)
- [ ] Integration test: voice query end-to-end
- [ ] Legal accuracy test: 20 known IPC queries → verify section retrieval
- [ ] Language test: Hindi, Tamil, Telugu, Marathi voice samples

---

## Phase 2: Agentic Engine (Weeks 3-4)
**Objective**: Intent classification + multi-step agentic actions  
**Deliverables**: Intent classifier, orchestrator, form-filling automation, escalation routing

### 2.1 Intent Classifier (`backend/agent/intent_classifier.py`)
**Intents**:
- `LEGAL_LOOKUP` → Section retrieval (Phase 1)
- `CASE_STATUS` → Check court/case status (new)
- `FORM_HELP` → Government form guidance (new)
- `EMERGENCY_ESCALATE` → Police/NALSA routing (new)
- `GENERAL_ADVICE` → disclaimer-based advice (new)

**Implementation**:
- [ ] Fine-tune Sarvam-1 on 500 labeled examples (GitHub: OpenNyAI)
- [ ] Confidence threshold: 0.8 (else: ask clarification)
- [ ] Multi-turn: maintain context across 5-turn conversations

### 2.2 Multi-Agent Orchestrator (`backend/agent/orchestrator.py`)
**Agents**:
1. **Retrieval Agent** (legal lookup) → ChromaDB query
2. **Form Agent** (auto-fill) → Playwright + portal detection
3. **Escalation Agent** (emergency) → SMS + hotline dispatch
4. **Case Tracker Agent** (status) → Public portal scraping
5. **Defense Strategy Agent** → RAG over defense templates

**Orchestration Loop**:
```
User Voice Input
    ↓
ASR → Transcript
    ↓
Intent Classification (Sarvam-1)
    ↓
Select Agent(s) based on intent
    ↓
[Parallel] Retrieve context, check escalation, fetch forms
    ↓
Generate Response (Sarvam-1)
    ↓
TTS → Voice Output
```

### 2.3 Form-Filling Automation (`backend/agent/form_filler.py`)
**Target Portals**:
- [ ] NALSA e-filing (https://nalsa.gov.in)
- [ ] CSC e-Governance portal
- [ ] Police FIR portal (state-specific)
- [ ] Online court case filing

**Implementation**:
- [ ] Playwright-based DOM automation
- [ ] Form field detection (XPath + accessibility tree)
- [ ] Auto-fill logic: extract user info from query context
- [ ] Fallback: generate filled PDF form

### 2.4 Auto-Escalation Routing (`backend/agent/escalation.py`)
**Escalation Triggers**:
- Violence/abuse query → Police hotline (dial 100)
- Custody concern → NALSA case filing + legal aid notification
- Human trafficking → NGO alert (NTOP)
- Mental health crisis → Amayi helpline link

**Implementation**:
- [ ] Keyword detection + context analysis
- [ ] SMS dispatch to NALSA authorized centers
- [ ] Generate case number for follow-up
- [ ] Prevent false escalations (confidence >0.95)

---

## Phase 3: Multilingual + Optimization (Weeks 5-6)
**Objective**: Scale to dialects, enable offline mode  
**Deliverables**: Dialect ASR, language-specific RAG, PWA, case dashboard

### 3.1 Dialect ASR Integration (`backend/voice/asr.py`)
**Cascade Strategy**:
```
1. Try IndicWhisper (12 major langs) — fast, good WER
2. If confidence < 0.75 → retry with Meta MMS (dialects)
3. If user selects dialect → use Meta MMS directly
4. Fallback: Google STT (cost-optimized batching)
```

**Supported Languages/Dialects**:
- Hindi, Tamil, Telugu, Kannada, Malayalam (IndicWhisper)
- Bhojpuri, Chhattisgarhi, Tulu, Awadhi (Meta MMS)

### 3.2 Language-Specific Legal RAG
- [ ] Separate ChromaDB collections per language
- [ ] BNS + regional statutes (Tamil Nadu, Maharashtra, etc.)
- [ ] State-specific legal resources (e.g., Bombay HC vs Delhi HC precedents)
- [ ] Translate key IPC sections to regional languages

### 3.3 Offline Mode (PWA + local indices)
- [ ] React PWA with service workers
- [ ] SQLite (via sql.js) for local query history
- [ ] ONNX models for ASR (quantized IndicWhisper) + TTS (Piper)
- [ ] Pre-cached legal sections (BNS + top 500 IPC sections)
- [ ] Sync on reconnection to cloud

### 3.4 Case Tracking Dashboard
- [ ] User profile page (cases, queries, escalations)
- [ ] Case status timeline
- [ ] Document upload (for evidence)
- [ ] Chat history export (for court)

---

## Phase 4: Integration + Testing (Weeks 7-8)
**Objective**: Production-ready system, government integration  
**Deliverables**: Hardened APIs, security audit, E2E tests, deployment

### 4.1 Tele-Law Integration
- [ ] Query routing to Tele-Law centers for human follow-up
- [ ] Case referral API (state-wise legal aid center mapping)
- [ ] Performance metrics dashboard (queries served, escalations)

### 4.2 Security & Privacy (DPDP Act 2023 compliance)
- [ ] [ ] Data minimization: no unnecessary PII storage
- [ ] [ ] Purpose limitation: queries used only for legal assistance
- [ ] [ ] Encryption: TLS 1.3 for all APIs
- [ ] [ ] Secrets: environment variables, no hardcoding
- [ ] [ ] Input validation: prevent prompt injection
- [ ] [ ] Audit logs: track all escalations + data access

### 4.3 Performance Testing
- [ ] [ ] Load test: 1000 concurrent voice queries
- [ ] [ ] Latency SLA: <2s ASR, <1s RAG retrieval, <1s TTS
- [ ] [ ] Cost optimization: batch API calls, cache results

### 4.4 E2E Testing (`tests/e2e/`)
- [ ] Test voice query end-to-end (ASR → RAG → TTS)
- [ ] Test form-filling on mock portal
- [ ] Test escalation SMS dispatch
- [ ] Test case tracking workflow

---

## Resource Requirements

| Resource | Source | Cost | Notes |
|----------|--------|------|-------|
| **ASR** | IndicWhisper (local) | Free | ~500MB model, self-hosted |
| **ASR Dialect** | Meta MMS (local) | Free | ~1.5GB, CC-BY-NC license |
| **TTS** | Sarvam Bulbul-V2 API | Free tier (100 req/day) | Fallback to Piper (local) |
| **LLM** | Sarvam-1 or Llama 3.1 quantized | Free | Run on CPU (~2GB RAM) |
| **Vector DB** | ChromaDB | Free | Self-hosted, persistent storage |
| **Legal Corpus** | IndiaCode.nic.in + ILDC | Free | Scraping + open data |
| **Database** | PostgreSQL | Free (Docker) | ~2GB disk for initial data |
| **Hosting** | Render, Railway, or Heroku free tier | Free | Sufficient for MVP |
| **Browser Automation** | Playwright | Free | Self-hosted tests and form-filling |

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Dialect ASR accuracy <70%** | Wrong legal sections retrieved | Confidence threshold + manual review UI |
| **Legal corpus incomplete** | Missing sections for queries | Start with IPC/BNS, add state laws incrementally |
| **Form-filling scraping breaks** | Escalation fails | Fallback to SMS + PDF generation |
| **Cold start: no users** | No training data | Start with hardcoded test queries + friendly UI |
| **DPDP Act enforcement (May 2027)** | Privacy violations → fines | Compliance audit in Phase 4 |
| **Government portal instability** | Form-filling failure | Rate limiting + manual fallback |

---

## Success Criteria (MVP Launch)

- [ ] **Accuracy**: Legal retrieval >85% on 50 test queries (Hindi voice + text)
- [ ] **Speed**: <5s end-to-end latency (ASR → RAG → TTS)
- [ ] **Languages**: Hindi + 2 dialects (Bhojpuri, Tamil)
- [ ] **Escalations**: Auto-escalation triggers correctly 100% of time
- [ ] **Security**: DPDP-compliant, 0 PII leaks in logs
- [ ] **Testing**: >80% code coverage, all E2E flows working
- [ ] **Deployment**: 1-click deployment on free tier

---

## Weekly Checkpoint Schedule

| Week | Checkpoint | Go/No-Go |
|------|-----------|----------|
| **1** | ASR + TTS working, RAG query<500ms | Must-have |
| **2** | MVP REST API deployed, voice end-to-end working | Must-have |
| **3** | Intent classifier trained, orchestrator routing | Should-have |
| **4** | Form-filling + escalation working on 2 portals | Must-have |
| **5** | Dialect ASR integrated, offline mode skeleton | Should-have |
| **6** | Case tracking dashboard MVP | Should-have |
| **7** | Security audit complete, E2E tests 80%+ pass | Must-have |
| **8** | Production deployment, Tele-Law integration test | Must-have |

---

## Agent Support & Skills

- **planning**: Phase sequencing, risk assessment, resource allocation
- **code-reviewer**: Review all pull requests before merge
- **security-reviewer**: Audit sensitive code (auth, escalation, data handling)
- **tdd-guide**: Enforce 80%+ test coverage per phase
- **e2e-runner**: Maintain E2E test suite for critical flows
- **architect**: Design agent harness if scaling beyond single orchestrator
- **build-error-resolver**: Fix build failures in CI/CD
- **python-reviewer**: Review Python code quality (PEP 8, type hints)
- **database-reviewer**: Optimize SQL queries and schema design

---

## Starting Now: Phase 1 Immediate Tasks

1. [ ] Set up Fast API project structure (routers, services, utils)
2. [ ] Implement ASR endpoint with IndicWhisper
3. [ ] Implement TTS endpoint with Piper (local) + Sarvam API fallback
4. [ ] Build legal corpus loader (indiacode.nic.in scraper)
5. [ ] Set up ChromaDB with BNS sections + vector indexing
6. [ ] Implement hybrid RAG retrieval (BM25 + semantic)
7. [ ] Create REST API endpoints documented in OpenAPI
8. [ ] Write unit + integration tests (pytest)
9. [ ] Deploy to free tier (Render or Railway)
10. [ ] Set up CI/CD pipeline with GitHub Actions

---

Generated: 2026-03-24 | Next Review: End of Week 1
