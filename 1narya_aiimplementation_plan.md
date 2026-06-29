# Chakravyuha UI — Premium Redesign Architecture
## Inspired by NYAYA.ai (samvidhan-ai-psi.vercel.app)

Transform the current minimal UI into a visually stunning, NYAYA.ai-style legal AI demo with glassmorphism, animated stats, bottom tab navigation, and draggable modal panels.

---

## Design System

| Token | Value |
|---|---|
| Background | `#0a0f1e` (deep navy) |
| Surface | `rgba(255,255,255,0.05)` (glass) |
| Border | `rgba(255,255,255,0.1)` |
| Accent Primary | `#00d9e8` (teal/cyan) |
| Accent Secondary | `#f97316` (saffron/orange) |
| Accent Gold | `#f5c842` (gold) |
| Text Primary | `#e8edf5` |
| Text Muted | `rgba(232,237,245,0.5)` |
| Font | **Inter** (already loaded) + **Playfair Display** for headings |

**Key effects:**
- Glassmorphism: `backdrop-blur-xl bg-white/5 border border-white/10`  
- Glows: `shadow-[0_0_40px_rgba(0,217,232,0.2)]`  
- Animated grid/particle canvas background  

---

## Architecture Overview

```
src/
├── app/
│   ├── globals.css          ← [MODIFY] Full design system + glass utilities
│   └── layout.tsx           ← [MODIFY] Add Playfair Display font
├── components/
│   ├── Header.tsx           ← [MODIFY] Logo + animated pulse badge + language picker
│   ├── HomeContent.tsx      ← [MODIFY] New layout: hero → stats → features → bottom nav
│   ├── HeroSection.tsx      ← [NEW] Animated orb, title, CTA
│   ├── StatsBar.tsx         ← [NEW] Animated count-up numbers (22 langs, 500+ queries, 99% accuracy)
│   ├── FeatureGrid.tsx      ← [NEW] 3 glass feature cards (Voice AI, BNS Guide, Case Steps)
│   ├── BottomTabNav.tsx     ← [NEW] Fixed bottom tab bar (Home | Chat | Language | About)
│   ├── ChatModal.tsx        ← [NEW] Slide-up glassmorphic modal chat panel with quick chips
│   ├── VoiceCard.tsx        ← [MODIFY] Dark theme, teal accents, waveform animation
│   ├── GuidedStepsCard.tsx  ← [MODIFY] Dark glass card styling
│   └── Card.tsx             ← [MODIFY] Glass card base component
```

---

## Proposed Changes

### 1 · Design Tokens & Globals
#### [MODIFY] [globals.css](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/app/globals.css)
- Replace light background system with dark navy theme  
- Add CSS variables: `--color-bg`, `--color-surface`, `--color-accent-teal`, `--color-accent-saffron`  
- Add `.glass` utility class (backdrop-blur, border, bg)  
- Animated `@keyframes` for pulse rings, grid fade-in, spin  
- Custom scrollbar in dark teal  

---

### 2 · Layout Font
#### [MODIFY] [layout.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/app/layout.tsx)
- Add `Playfair_Display` from next/font for headings  
- Update `<html>` with dark class  

---

### 3 · Header
#### [MODIFY] [Header.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/Header.tsx)
- Dark glass sticky header  
- Logo: circular badge with ⚖️ + gradient ring + "Chakravyuha" + "Intelligence in Justice" tagline  
- Right side: language pill + animated live "Demo" badge  

---

### 4 · Hero Section (NEW)
#### [NEW] [HeroSection.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/HeroSection.tsx)
```
┌─────────────────────────────────────────┐
│    [Animated Orb — teal glowing ring]   │
│                                         │
│    CHAKRAVYUHA.ai                       │
│    "Intelligence in Justice"            │
│    Navigate Indian law with AI in       │
│    22 regional languages                │
│                                         │
│   [Start Legal Consultation →]          │
│   POWERED BY OFFICIAL LEGAL FRAMEWORKS  │
│                                         │
│  [Make in India] [BNS] [CrPC] [IPC]    │
└─────────────────────────────────────────┘
```
- Pulsing concentric rings around teal orb with ⚖️  
- Gradient text title with `Playfair Display`  
- Animated tagline chips (Make in India, BNS, NALSA, SarvamAI)  
- `framer-motion` staggered entrance  

---

### 5 · Stats Bar (NEW)
#### [NEW] [StatsBar.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/StatsBar.tsx)
```
│  22+         │  500+        │  99%        │
│  LANGUAGES   │  QUERIES     │  ACCURACY   │
```
- Animated count-up using `useInView` + `useState` counter  
- Teal accent numbers, muted labels  
- Horizontal scrollable on mobile  

---

### 6 · Feature Grid (NEW)
#### [NEW] [FeatureGrid.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/FeatureGrid.tsx)
Three glass cards with hover glow:
1. **🎤 Voice AI** — "Speak your legal concern in any Indian language"
2. **📖 BNS Guide** — "Navigate Bhartiya Nyaya Sanhita articles instantly"  
3. **🪜 Case Steps** — "Step-by-step guided legal procedure walkthrough"

Each card: icon in teal circle, title, description, "Learn More →" link  

---

### 7 · Bottom Tab Navigation (NEW)
#### [NEW] [BottomTabNav.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/BottomTabNav.tsx)
```
[ 🏠 Home ]  [ 💬 Chat ]  [ 🌐 Lang ]  [ ℹ Info ]
```
- Fixed bottom, glassmorphic bar  
- Active tab highlighted in teal with scale animation  
- "Chat" tab opens `ChatModal`  
- "Lang" tab opens language picker sheet  

---

### 8 · Chat Modal (NEW)
#### [NEW] [ChatModal.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/ChatModal.tsx)
- Slide-up modal panel (like NYAYA.ai's Rights & Rules panel)  
- Glass header with title + close button  
- Quick chip suggestions: "Fundamental Rights", "File FIR", "Bail", "NALSA Aid"  
- Full chat interface (reuses VoiceCard logic)  
- Microphone button + text input at bottom  

---

### 9 · VoiceCard (dark theme)
#### [MODIFY] [VoiceCard.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/VoiceCard.tsx)
- Dark glass chat bubble background  
- User messages: saffron/orange background  
- AI messages: dark glass with teal border-left  
- Animated waveform bars during recording (SVG)  
- Mic button: teal glow with concentric pulse rings  

---

### 10 · HomeContent (orchestration)
#### [MODIFY] [HomeContent.tsx](file:///c:/code/HINDSIGHT/chakravyuha-ui/src/components/HomeContent.tsx)
```
<dark canvas bg>
  <Header />
  <HeroSection />         ← new
  <StatsBar />            ← new
  <FeatureGrid />         ← new
  <GuidedStepsCard />     ← re-styled glass card
  <BottomTabNav />        ← new fixed bottom
  <ChatModal />           ← new slide-up panel
```

---

## Verification Plan

### Manual Visual Check
1. Run `npm run dev` in `c:\code\HINDSIGHT\chakravyuha-ui`  
2. Open `http://localhost:3000` in browser  
3. Confirm:
   - **Dark navy background** — no white/gray background visible  
   - **Hero orb** animates with concentric teal rings  
   - **Stats bar** numbers count up on load  
   - **Feature cards** show glass effect with hover glow  
   - **Bottom nav** visible and tabs switch correctly  
   - **Chat modal** slides up when "Chat" tab is tapped with chip suggestions  
   - **Voice mic button** shows pulsing ring when active  
   - **Language picker** works and changes UI text  

### Build Check
```bash
cd c:\code\HINDSIGHT\chakravyuha-ui
npm run build
```
Must complete with **0 TypeScript errors**.

---

## ✅ Full implementation completion plan

### Phase 1: Backend baseline (already completed)
- [x] FastAPI backend (port 8000) with core APIs for:
  - `/api/judge/predict-verdict`
  - `/api/judge/case-precedents`
  - `/api/judge/similar-cases/{section}`
  - `/api/documents/draft-fir`
  - `/api/documents/draft-legal-notice`
  - `/api/documents/draft-complaint`
  - `/api/simplify/explain-term`
  - `/api/simplify/statute/{code}`
  - `/api/simplify/translate-text`
- [x] Data assets populated under `data/`:
  - `legal_glossary.json`
  - `case_precedents.json`
  - `document_templates.json`
- [x] Unit tests covering all core modules (49 tests Phase 2 + 27 tests legacy)

### Phase 2: Backend feature expansion (next development)
- [ ] PDF generation and export
  - Add route: `POST /api/documents/draft-fir/pdf`
  - Add utility in `backend/legal/document_drafter.py`:
    - `export_to_pdf(html_or_text, filename)`
- [ ] OCR/Document ingestion
  - Add module: `backend/legal/pdf_ocr.py`
  - Endpoints:
    - `POST /api/analysis/upload-pdf`
    - `POST /api/analysis/extract-text`
    - `POST /api/analysis/analyze-fir`
- [ ] Voice search and speech pipelines
  - Add route: `POST /api/voice/transcribe`
  - Existing module `backend/voice/asr.py` should call Whisper/VOSK
  - Add route: `POST /api/voice/query` (Hinglish intent support)
- [ ] LLM retrieval + embeddings stack (Groq + Pinecone)
  - Add provider connector in `backend/llm/groq_provider.py`
  - Add embedding pipeline in `backend/llm/embedding.py` using `all-mpnet-base-v2`
  - Add route: `POST /api/llm/ask`

### Phase 3: Frontend premium UX (complete values:
- [ ] Build out `chakravyuha-ui` components as described in this plan (HeroSection, StatsBar, FeatureGrid, ChatModal, etc.)
- [ ] Add live interactions to backend endpoints
- [ ] Add global error-handling and mobile gestures
- [ ] Add deployment pipeline to Vercel/Netlify with branch preview

### Phase 4: QA and deployment
- [ ] Load tests + gputest for LLM model
- [ ] Security hardening (CSRF, rate limits, auth checks)
- [ ] CI `pytest --cov`; fail on <80%
- [ ] Dockerization
- [ ] Integration tests for URL flows (Cypress Playwright)
- [ ] Release docs for judges + feature tour

### Deployment config (ports):
- Backend: `8000` (FastAPI)
- Frontend: `3000` (Next.js)
- LLM (locally if Groq on GPU): `5005` (optional)
- Pinecone / Vector DB: managed cloud service

### MVP success criteria
- Fully functional 5 key features
- UI same as Samvidhan style (dark glassmorphism + animation)
- All endpoints stable and documented `/docs`
- 100% tests pass
- Bug-free demo flow: 3-minute show

---

## 🧪 Post-plan validation
- Run this after dev finish:
  1. `uvicorn backend.main:app --reload --port 8000`
  2. `npm run dev` in UI
  3. Smoke test endpoints and UI workflows
  4. `python -m pytest tests/ -q`
  5. `npm run build` in UI
  6. `docker compose up --build` (optional)
- Document all APIs in `API_USAGE_EXAMPLES.md`
- Add demo script for judges.

