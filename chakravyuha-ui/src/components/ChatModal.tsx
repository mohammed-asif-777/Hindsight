"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { smartQuery, type SmartResponse } from "@/services/api";
import { Logo } from "@/components/Logo";

const QUICK_CHIPS = [
  "My license is lost",
  "Traffic challan help",
  "File an FIR",
  "Domestic violence",
  "Consumer complaint",
  "Bail process",
  "Property dispute",
  "Right to Information",
];

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  smartData?: SmartResponse;
}

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Severity config ─────────────────────────────────────────────────────────
const SEVERITY: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "rgba(239,68,68,0.2)", text: "#ef4444", label: "CRITICAL" },
  high: { bg: "rgba(249,115,22,0.2)", text: "#f97316", label: "HIGH" },
  medium: { bg: "rgba(245,200,66,0.2)", text: "#f5c842", label: "MEDIUM" },
  low: { bg: "rgba(0,217,232,0.2)", text: "#00d9e8", label: "LOW" },
};

// ── Structured response card ────────────────────────────────────────────────
function ResponseCard({ data }: { data: SmartResponse }) {
  const [showDraft, setShowDraft] = useState(false);
  const sev = SEVERITY[data.severity] || SEVERITY.medium;

  return (
    <div
      className="rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs"
      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--color-border)" }}
    >
      {/* Header: title + severity */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm" style={{ color: "var(--color-teal)" }}>
          {data.title}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase shrink-0"
          style={{ background: sev.bg, color: sev.text }}
        >
          {sev.label}
        </span>
      </div>

      {/* Guidance */}
      <div className="whitespace-pre-line leading-relaxed" style={{ color: "var(--color-text)" }}>
        {data.guidance}
      </div>

      {/* Sections */}
      {data.sections.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="font-semibold uppercase tracking-wider text-[9px]" style={{ color: "var(--color-gold)" }}>
            Applicable Sections
          </span>
          <div className="flex flex-wrap gap-1">
            {data.sections.map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: "var(--color-gold-dim)", color: "var(--color-gold)", border: "1px solid rgba(245,200,66,0.2)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Outcome */}
      {data.outcome && (
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: "var(--color-teal-dim)", border: "1px solid rgba(0,217,232,0.15)" }}
        >
          <span className="font-semibold" style={{ color: "var(--color-teal)" }}>Likely Outcome: </span>
          <span style={{ color: "var(--color-text)" }}>{data.outcome}</span>
        </div>
      )}

      {/* Complaint draft */}
      {data.complaint_draft && (
        <div>
          <button
            onClick={() => setShowDraft((p) => !p)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "var(--color-saffron-dim)", color: "var(--color-saffron)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            {showDraft ? "Hide Draft" : "View Complaint Draft"}
          </button>
          <AnimatePresence>
            {showDraft && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-1.5 whitespace-pre-wrap text-[11px] leading-relaxed rounded-xl p-2.5 overflow-hidden"
                style={{ background: "rgba(0,0,0,0.3)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
              >
                {data.complaint_draft}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Helplines */}
      {data.helplines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.helplines.map((h, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Source */}
      <div className="text-[9px] uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>
        {data.source === "classifier" ? "Verified Legal Database" : "Keyword Search"}
      </div>
    </div>
  );
}

export function ChatModal({ open, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await smartQuery(trimmed, "en-IN");

        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "", smartData: res },
        ]);
      } catch (err) {
        console.error("Chat query error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "Could not reach the legal engine. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          {/* Panel */}
          <motion.div
            className="relative glass-bright rounded-t-3xl flex flex-col max-h-[85vh]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-2">
                <Logo size={24} />
                <h2 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                  Chakravyuha
                  <span className="gradient-text-teal text-xs font-normal ml-0.5">.AI</span>
                </h2>
              </div>
              <button onClick={onClose} className="text-lg" style={{ color: "var(--color-text-muted)" }}>
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-[200px]">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
                    Ask any legal question
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
                    Classification-first AI — no hallucinations, curated legal guidance
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[90%] ${m.role === "user" ? "self-end" : "self-start"}`}
                >
                  {m.role === "user" ? (
                    <div
                      className="rounded-2xl rounded-br-sm px-4 py-2.5 text-sm"
                      style={{ background: "var(--color-saffron-dim)", color: "var(--color-saffron)" }}
                    >
                      {m.text}
                    </div>
                  ) : m.smartData ? (
                    <ResponseCard data={m.smartData} />
                  ) : (
                    <div
                      className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm whitespace-pre-line border-l-2"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-teal)",
                        color: "var(--color-text)",
                      }}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="self-start flex items-center gap-2 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--color-teal)" }}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                    />
                  ))}
                  <span className="text-xs ml-1" style={{ color: "var(--color-text-faint)" }}>
                    Classifying legal issue...
                  </span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
              {QUICK_CHIPS.map((c) => (
                <button key={c} onClick={() => send(c)} disabled={isLoading} className="chip shrink-0">
                  {c}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Describe your legal problem..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
                style={{ color: "var(--color-text)" }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 rounded-full text-xs font-semibold disabled:opacity-40"
                style={{
                  background: "var(--color-teal-dim)",
                  color: "var(--color-teal)",
                  border: "1px solid var(--color-teal)",
                }}
              >
                Send
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
