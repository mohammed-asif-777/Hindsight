# Chakravyuha Phase 2: Advanced Features & Modern UI

## Executive Summary

**Objective**: Transform Chakravyuha from a working backend (27 tests passing) into an impressive, production-ready legal AI platform with the best features from NyayAI and NYAYA.ai, plus a modern React/Next.js frontend matching Samvidhan AI's UX.

**Timeline**: 4 phases over next 2 weeks  
**Test Coverage Target**: 85%+ across all new modules  
**Deployment**: Docker + Vercel for frontend

---

## Phase 1: Backend Features Implementation (Week 1)

### Feature 1.1: Document Drafting Agent 🎯
**Goal**: Auto-generate FIR, legal notices, complaints with legal templates  
**Integration Effort**: Medium (400 lines)

```
Input: Extracted legal facts + case context
  ↓
NyayaDocumentDrafter (new module)
  ├─ FIR Generator (fir_template.md)
  ├─ Legal Notice Generator (notice_template.md)
  ├─ Complaint Generator (complaint_template.md)
  └─ PDF Export (reportlab)
  ↓
Output: Formatted document + PDF download link
```

**Files to Create**:
- `backend/legal/document_drafter.py` - Core drafting engine
- `backend/templates/` - FIR, notice, complaint formats
- `backend/routers/documents.py` - FastAPI endpoints
- `tests/test_document_drafter.py` - 8 test cases
- `data/document_templates.json` - Template library

**Key Endpoints**:
```
POST /api/documents/draft-fir
POST /api/documents/draft-notice
POST /api/documents/draft-complaint
POST /api/documents/export-pdf
```

---

### Feature 1.2: AI Judge / Verdict Predictor 🏛️
**Goal**: Predict applicable BNS sections, outcomes, probability  
**Integration Effort**: Low-Medium (350 lines)

```
Input: Case facts + offenses
  ↓
VerdictPredictor
  ├─ Section Classification (rules engine + Groq)
  ├─ Outcome Prediction (likelihood %)
  ├─ Reasoning Trace (per-section confidence)
  └─ Case Comparison (similar cases)
  ↓
Output: {section: BNS-103, outcome: "Guilty (78%)", reasoning: [...]}
```

**Files to Create**:
- `backend/legal/verdict_predictor.py` - Prediction engine
- `backend/legal/case_similarity.py` - Find similar cases
- `backend/routers/judge.py` - FastAPI endpoints
- `tests/test_verdict_predictor.py` - 9 test cases
- `data/case_precedents.json` - ~50 real case summaries

**Key Endpoints**:
```
POST /api/judge/predict-verdict
GET /api/judge/similar-cases/{section}
GET /api/judge/case-precedents
```

---

### Feature 1.3: Strategy / Action Plan Generator 📋
**Goal**: Generate next steps, timelines, cost estimates  
**Integration Effort**: Medium (300 lines)

```
Input: Case type + legal issues
  ↓
StrategyGenerator
  ├─ Forum Selection (district, high court, supreme)
  ├─ Timeline Estimation (3 months - 5 years)
  ├─ Cost Breakdown (filing fees, lawyer fees, etc.)
  ├─ Evidence Checklist (what to gather)
  └─ Mediation Recommendation (yes/no/when)
  ↓
Output: Structured action plan with priorities
```

**Files to Create**:
- `backend/legal/strategy_generator.py` - Action planning
- `backend/legal/forum_selector.py` - Court jurisdiction logic
- `backend/routers/strategy.py` - FastAPI endpoints
- `tests/test_strategy_generator.py` - 7 test cases
- `data/strategy_rules.json` - Decision rules

**Key Endpoints**:
```
POST /api/strategy/generate-plan
GET /api/strategy/forum-options/{case_type}
GET /api/strategy/cost-estimate/{action}
```

---

### Feature 1.4: Jargon Simplifier 📚
**Goal**: Convert legalese → plain language  
**Integration Effort**: Low (200 lines)

```
Input: Legal text or section code (e.g., "BNS-103")
  ↓
JargonSimplifier
  ├─ Dictionary Lookup (500+ legal terms)
  ├─ Groq Translation to Hindi/Simple English
  └─ Example Generation
  ↓
Output: Plain language explanation + examples
```

**Files to Create**:
- `backend/legal/jargon_simplifier.py` - Simplification engine
- `backend/routers/simplify.py` - FastAPI endpoints
- `tests/test_jargon_simplifier.py` - 6 test cases
- `data/legal_glossary.json` - 500+ term definitions

**Key Endpoints**:
```
POST /api/simplify/explain-term
GET /api/simplify/statute/{code}
POST /api/simplify/translate-text
```

---

### Feature 1.5: Explainability / Reasoning Trace 🔍
**Goal**: Show per-section confidence, citations, decision reasoning  
**Integration Effort**: Low (150 lines)

```
Input: Any query result
  ↓
ReasoningTracer
  ├─ Confidence Scores (per section: 0.0-1.0)
  ├─ Citation Generator (statute + line references)
  ├─ Decision Tree Visualization
  └─ Audit Trail (what data influenced output)
  ↓
Output: Transparent reasoning with traceback
```

**Files to Create**:
- `backend/legal/reasoning_tracer.py` - Reasoning engine
- `backend/routers/transparency.py` - FastAPI endpoints
- `tests/test_reasoning_tracer.py` - 5 test cases

**Key Endpoints**:
```
GET /api/transparency/trace/{query_id}
POST /api/transparency/audit-trail
GET /api/transparency/citations/{statute_code}
```

---

## Phase 2: Frontend UI Implementation (Week 1-2)

### 2.1: Modern Frontend Stack
**Tech Stack**:
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: TanStack Query + Zustand
- **Type Safety**: TypeScript
- **Voice**: Web Audio API + Sarvam integration
- **Deployment**: Vercel

**File Structure**:
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── legal-assistant/page.tsx (main chat)
│   │   ├── document-drafter/page.tsx
│   │   ├── judge/page.tsx
│   │   ├── strategy/page.tsx
│   │   ├── glossary/page.tsx
│   │   └── history/page.tsx
│   └── api/ (route handlers)
├── components/
│   ├── chat/ChatInterface.tsx
│   ├── chat/VoiceInput.tsx
│   ├── judge/VerdictCard.tsx
│   ├── documents/DocumentPreview.tsx
│   ├── strategy/ActionPlan.tsx
│   └── shared/
├── lib/
│   ├── api.ts (fetch wrappers)
│   ├── store.ts (Zustand)
│   └── types.ts
├── styles/
│   └── globals.css
└── public/
```

### 2.2: Key UI Pages

#### Dashboard (`/dashboard`)
- Welcome banner
- Quick start buttons
- Recent cases
- Shortcuts to features

#### Legal Assistant (`/dashboard/legal-assistant`)
- Chat interface with conversation history
- Voice input button (microphone icon)
- Markdown rendering for responses
- Sidebar with case context
- **Like Samvidhan**: Clean conversation, voice-first, collapsible sidebar

#### Document Drafter (`/dashboard/document-drafter`)
- Form to input case details
- Document template selector (FIR, notice, complaint)
- Live preview panel (split-screen)
- Export to PDF/Word buttons
- Signature placeholder

#### AI Judge (`/dashboard/judge`)
- Input: Case description + offenses
- Output: Verdict card with:
  - Predicted section (BNS/IPC)
  - Outcome probability (%)
  - Confidence breakdown (per evidence)
  - Similar cases
  - Reasoning trace (expandable)

#### Strategy Generator (`/dashboard/strategy`)
- Auto-generated action plan
- Timeline visualization
- Cost breakdown chart
- Step-by-step checklist
- Download as PDF/Notion

#### Legal Glossary (`/dashboard/glossary`)
- Search 500+ legal terms
- Plain language explanations
- Hindi/regional language toggle
- Example cases for each term

### 2.3: Design System (Samvidhan-inspired)
```
Color Palette:
  Primary: #1e40af (Blue) - Justice
  Secondary: #7c3aed (Purple) - Law
  Success: #16a34a (Green) - Guidance
  Warning: #f59e0b (Orange) - Alert
  
Typography:
  H1: 32px, Bold
  H2: 24px, Semi-bold
  Body: 16px, Regular
  
Components:
  Card - Rounded, shadow, hover effects
  Button - Primary, secondary, outline variants
  Input - With labels, errors, hints
  Badge - Status indicators (Ongoing, Resolved, etc.)
```

---

## Phase 3: Integration & Testing (Week 2)

### 3.1: Backend Integration
```
✓ All 5 new features mounted on FastAPI routers
✓ Database: PostgreSQL for case history (optional for MVP)
✓ Cache: Redis for verdict cache (optional)
✓ Error handling: Standardized across all endpoints
✓ Logging: Structured logs for debugging
```

### 3.2: Frontend-Backend Integration
```
✓ API client (frontend/lib/api.ts) wraps all backend calls
✓ Error boundaries for graceful failures
✓ Loading states + skeleton screens
✓ Real-time updates via WebSocket (for long-running tasks)
✓ Auth (optional JWT if adding user accounts)
```

### 3.3: Test Coverage
```
Backend:
  - Unit tests: 40+ new tests (one per feature)
  - Integration tests: 5+ cross-feature tests
  - Coverage target: 85%+

Frontend:
  - Component tests: Jest + React Testing Library
  - E2E tests: Playwright (critical user journeys)
  - Coverage target: 75%+
```

---

## Phase 4: Documentation & Deployment (Week 2-3)

### 4.1: Documentation Files

#### 📄 ARCHITECTURE_PHASE2.md
- System diagram (Mermaid)
- Feature relationships
- Data flow diagrams
- Integration points

#### 📖 FEATURE_GUIDE.md
- Document Drafting: How to use, templates
- AI Judge: How verdict prediction works
- Strategy Generator: Understanding timelines
- Jargon Simplifier: Term examples
- Explainability: How reasoning works

#### 🎮 UI_WALKTHROUGH.md
- Screenshots of each page
- User journey (typical flow)
- Keyboard shortcuts
- Mobile responsiveness

#### 🚀 DEPLOYMENT_GUIDE.md
- Docker setup (backend)
- Vercel deployment (frontend)
- Environment variables
- Database setup (optional)

#### 🧪 TESTING_GUIDE.md
- How to run unit tests
- How to run E2E tests
- Coverage reports
- CI/CD pipeline

### 4.2: Deployment

**Backend (Docker)**:
```bash
docker build -f Dockerfile -t chakravyuha:latest .
docker run -p 8000:8000 chakravyuha:latest
```

**Frontend (Vercel)**:
```bash
vercel deploy
```

**Sub-domain**:
```
Frontend: https://chakravyuha.vercel.app
Backend: https://api.chakravyuha.com
```

---

## Metrics for Success

| Metric | Target | Current | 📊 |
|--------|--------|---------|-----|
| Test Coverage | 85% | 27 tests (42%) | 🔄 |
| Backend Features | 5 | 1 (Nyaya extractor) | 🔄 |
| Frontend Pages | 7 | 0 (Gradio only) | 🔄 |
| API Endpoints | 20+ | 7 (Nyaya) | 🔄 |
| UI Response Time | <500ms | TBD | ⏳ |
| Voice Accuracy | >90% | Via Sarvam | ✅ |

---

## Critical Dependencies

| Feature | Requires | Status |
|---------|----------|--------|
| Document Drafting | Groq API, reportlab | ✅ Available |
| Verdict Predictor | Case data (50+ summaries) | 📝 Needs creation |
| Strategy Generator | Forum rules engine | 📝 Needs creation |
| Jargon Simplifier | 500-term glossary | 📝 Needs creation |
| Frontend UI | Next.js, TailwindCSS | ✅ Can scaffold |

---

## Implementation Order (Priority)

1. **Week 1, Day 1-2**: Document Drafting (highest judge impact)
2. **Week 1, Day 2-3**: AI Judge / Verdict Predictor (impressive demo)
3. **Week 1, Day 3-4**: Strategy Generator (practical value)
4. **Week 1, Day 4-5**: Jargon Simplifier + Explainability (quick wins)
5. **Week 1, Day 5 - Week 2, Day 3**: Modern React UI (Samvidhan-inspired)
6. **Week 2, Day 4-5**: Integration testing + documentation
7. **Week 3**: Deploy to production + final polish

---

## Success Criteria (Hackathon)

✅ All 5 backend features working  
✅ 20+ API endpoints functional  
✅ Modern responsive UI (mobile + desktop)  
✅ 30+ unit + integration tests passing  
✅ Comprehensive documentation  
✅ Hosted demo (frontend on Vercel, backend on cloud)  
✅ Judges can test end-to-end workflow  

---

## Notes for Implementation

- **Reuse existing patterns**: StatuteResolver, NyayaEntityExtractor patterns
- **Groq API**: Already in requirements; use Llama-3.3 70B for generation
- **Database**: Start with JSON files; upgrade to PostgreSQL later
- **Voice**: Leverage existing Sarvam integration
- **Icons**: Use Lucide React (lightweight, modern)
