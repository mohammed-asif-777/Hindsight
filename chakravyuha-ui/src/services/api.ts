/**
 * Typed API client for the Chakravyuha FastAPI backend.
 * All requests go through Next.js rewrites → localhost:8000.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface LegalSection {
  section_id: string;
  title: string;
  act: string;
  law?: string; // backend may return "law" instead of "act"
  description: string;
  punishment?: string;
  cognizable?: boolean | string;
  bailable?: boolean | string;
  court?: string;
  keywords?: string[];
  score?: number;
}

export interface TextQueryResponse {
  query: string;
  sections: LegalSection[];
  confidence: string;
  message: string | null;
  disclaimer: string;
}

export interface VoiceProcessResponse {
  success: boolean;
  data: {
    transcript?: string;
    text?: string;
    sections?: LegalSection[];
    audio?: string; // base64
    confidence?: number;
    language?: string;
  };
}

export interface GuidedOption {
  label: string;
  label_hi: string;
  next: string | null;
  sections: string[];
  severity: string | null;
}

export interface GuidedFlowStep {
  node_key: string;
  question: string;
  question_hi: string;
  options: GuidedOption[];
  is_leaf: boolean;
  matched_sections: LegalSection[];
  severity: string | null;
}

export interface GuidedFlowState {
  current_node: string;
  path: string[];
  selected_answer: string;
}

// ── Smart (Classification-first) Types ──────────────────────────────────────

export interface SmartResponse {
  scenario: string;
  title: string;
  guidance: string;
  sections: string[];
  outcome: string;
  severity: string;
  complaint_draft: string;
  helplines: string[];
  source: string; // "classifier" or "rag_fallback"
}

export interface SmartVoiceResponse {
  transcript: string;
  confidence: number;
  language: string;
  response: SmartResponse | null;
  audio: string | null; // base64 TTS
  error: string | null;
}

// ── API Functions ────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch("/health", { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function queryLegal(
  query: string,
  language: string
): Promise<TextQueryResponse> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function processVoice(
  audioBlob: Blob,
  language: string
): Promise<VoiceProcessResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("language", language);

  const res = await fetch("/api/voice", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Voice API error ${res.status}`);
  }

  return res.json();
}

// ── Smart (Classification-first) API Functions ─────────────────────────────

export async function smartQuery(
  query: string,
  language: string = "en-IN"
): Promise<SmartResponse> {
  const res = await fetch("/api/smart-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

export async function smartVoice(
  audioBlob: Blob,
  language: string
): Promise<SmartVoiceResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("language", language);

  const res = await fetch("/api/smart-voice", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Voice API error ${res.status}`);
  }

  return res.json();
}

export async function aiJudge(
  query: string,
  language: string = "en-IN"
): Promise<{
  scenario: string;
  title: string;
  outcome: string;
  severity: string;
  sections: string[];
}> {
  const res = await fetch("/api/judge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Judge API error ${res.status}`);
  }

  return res.json();
}

export async function draftComplaint(
  query: string,
  language: string = "en-IN"
): Promise<{
  scenario: string;
  title: string;
  draft: string;
  available: boolean;
}> {
  const res = await fetch("/api/draft-complaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Complaint API error ${res.status}`);
  }

  return res.json();
}

export async function startGuidedFlow(): Promise<GuidedFlowStep> {
  const res = await fetch("/api/guided/start", { method: "POST" });

  if (!res.ok) {
    throw new Error(`Guided flow start failed: ${res.status}`);
  }

  return res.json();
}

export async function nextGuidedStep(
  state: GuidedFlowState
): Promise<GuidedFlowStep> {
  const res = await fetch("/api/guided/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });

  if (!res.ok) {
    throw new Error(`Guided flow next failed: ${res.status}`);
  }

  return res.json();
}
