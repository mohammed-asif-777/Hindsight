"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useState, useRef, useEffect, useCallback } from "react";
import { smartQuery, smartVoice, type SmartResponse } from "@/services/api";

// ── Severity badge ──────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: "rgba(239,68,68,0.2)", text: "#ef4444", label: "CRITICAL" },
    high: { bg: "rgba(249,115,22,0.2)", text: "#f97316", label: "HIGH" },
    medium: { bg: "rgba(245,200,66,0.2)", text: "#f5c842", label: "MEDIUM" },
    low: { bg: "rgba(0,217,232,0.2)", text: "#00d9e8", label: "LOW" },
  };
  const c = config[severity] || config.medium;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

// ── Format a SmartResponse into chat messages ───────────────────────────────
function formatSmartResponse(r: SmartResponse): string {
  const parts: string[] = [];

  // Title + severity
  parts.push(`${r.title}`);

  // Guidance
  if (r.guidance) {
    parts.push(r.guidance);
  }

  // Legal sections
  if (r.sections.length > 0) {
    parts.push("Relevant Sections:\n" + r.sections.map((s) => `  - ${s}`).join("\n"));
  }

  // Outcome
  if (r.outcome) {
    parts.push(`Likely Outcome: ${r.outcome}`);
  }

  // Complaint draft (short preview)
  if (r.complaint_draft) {
    parts.push(`Complaint Draft Available — tap to view full draft.`);
  }

  // Helplines
  if (r.helplines.length > 0) {
    parts.push("Helplines:\n" + r.helplines.map((h) => `  ${h}`).join("\n"));
  }

  return parts.join("\n\n");
}

export function VoiceCard() {
  const { state, addMessage, toggleRecording } = useApp();
  const { recorderState, audioBlob, startRecording, stopRecording, clearRecording, error } =
    useAudioRecorder();
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [lastResponse, setLastResponse] = useState<SmartResponse | null>(null);
  const [showComplaint, setShowComplaint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isRecording = recorderState === "recording";

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chatHistory]);

  // Process audio blob when recording stops
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return;

    const sendAudio = async () => {
      setIsProcessing(true);
      setStatusText("Transcribing voice...");
      addMessage("user", "Processing voice...");

      try {
        const res = await smartVoice(audioBlob, state.language.code);

        if (res.error || !res.transcript) {
          addMessage(
            "assistant",
            res.error || "I couldn't understand the audio. Please try again or type your question."
          );
          return;
        }

        // Show transcript
        addMessage("user", `"${res.transcript}"`);

        // Show classified response
        if (res.response) {
          setLastResponse(res.response);
          setShowComplaint(false);
          addMessage("assistant", formatSmartResponse(res.response));
        } else {
          addMessage("assistant", "I couldn't classify your legal issue. Please try again with more details.");
        }

        // Play TTS audio if available
        if (res.audio) {
          try {
            const audioBytes = Uint8Array.from(atob(res.audio), (c) => c.charCodeAt(0));
            const blob = new Blob([audioBytes], { type: "audio/wav" });
            const url = URL.createObjectURL(blob);
            if (audioRef.current) {
              audioRef.current.src = url;
              audioRef.current.play().catch(() => {});
            }
          } catch {
            // TTS playback failed silently
          }
        }
      } catch (err) {
        console.error("Voice processing error:", err);
        addMessage(
          "assistant",
          "Voice processing failed. Please check your connection or type your question below."
        );
      } finally {
        setIsProcessing(false);
        setStatusText("");
        clearRecording();
      }
    };

    sendAudio();
  }, [audioBlob]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
      if (state.isRecording) toggleRecording();
    } else {
      await startRecording();
      if (!state.isRecording) toggleRecording();
    }
  };

  const handleSend = useCallback(async () => {
    const text = textInput.trim();
    if (!text || isProcessing) return;

    addMessage("user", text);
    setTextInput("");
    setIsProcessing(true);
    setStatusText("Classifying your legal issue...");

    try {
      const res = await smartQuery(text, state.language.code);
      setLastResponse(res);
      setShowComplaint(false);
      addMessage("assistant", formatSmartResponse(res));
    } catch (err) {
      console.error("Query error:", err);
      addMessage("assistant", "Could not reach the legal engine. Please try again.");
    } finally {
      setIsProcessing(false);
      setStatusText("");
    }
  }, [textInput, isProcessing, state.language.code, addMessage]);

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />

      {/* Chat history */}
      <div
        className="rounded-2xl min-h-[200px] max-h-[360px] overflow-y-auto p-4 flex flex-col gap-3"
        style={{ background: "var(--color-surface)" }}
      >
        {state.chatHistory.length === 0 && (
          <p className="text-sm text-center mt-8" style={{ color: "var(--color-text-faint)" }}>
            Tap the microphone or type your legal question below.
          </p>
        )}
        <AnimatePresence initial={false}>
          {state.chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm border-l-2"
                }`}
                style={
                  msg.role === "user"
                    ? { background: "var(--color-saffron-dim)", color: "var(--color-saffron)" }
                    : {
                        background: "var(--color-surface)",
                        borderColor: "var(--color-teal)",
                        color: "var(--color-text)",
                        border: "1px solid var(--color-border)",
                        borderLeft: "3px solid var(--color-teal)",
                      }
                }
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--color-teal)" }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
                />
              ))}
              {statusText && (
                <span className="text-xs ml-2" style={{ color: "var(--color-text-faint)" }}>
                  {statusText}
                </span>
              )}
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Structured Response Card (below chat, above mic) */}
      {lastResponse && lastResponse.scenario !== "empty" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {/* Title + Severity */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: "var(--color-teal)" }}>
              {lastResponse.title}
            </h3>
            <SeverityBadge severity={lastResponse.severity} />
          </div>

          {/* Outcome prediction */}
          {lastResponse.outcome && (
            <div
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: "var(--color-teal-dim)", border: "1px solid rgba(0,217,232,0.2)" }}
            >
              <span className="font-semibold" style={{ color: "var(--color-teal)" }}>
                Likely Outcome:{" "}
              </span>
              <span style={{ color: "var(--color-text)" }}>{lastResponse.outcome}</span>
            </div>
          )}

          {/* Sections chips */}
          {lastResponse.sections.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lastResponse.sections.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{
                    background: "var(--color-gold-dim)",
                    color: "var(--color-gold)",
                    border: "1px solid rgba(245,200,66,0.2)",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Complaint draft toggle */}
          {lastResponse.complaint_draft && (
            <div>
              <button
                onClick={() => setShowComplaint((prev) => !prev)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                style={{
                  background: "var(--color-saffron-dim)",
                  color: "var(--color-saffron)",
                  border: "1px solid rgba(249,115,22,0.25)",
                }}
              >
                {showComplaint ? "Hide Complaint Draft" : "View Complaint Draft"}
              </button>
              <AnimatePresence>
                {showComplaint && (
                  <motion.pre
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 text-xs leading-relaxed whitespace-pre-wrap rounded-xl p-3 overflow-hidden"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      color: "var(--color-text)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {lastResponse.complaint_draft}
                  </motion.pre>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Helplines */}
          {lastResponse.helplines.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lastResponse.helplines.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Source label */}
          <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>
            Source: {lastResponse.source === "classifier" ? "Verified Legal Database" : "Keyword Search"}
          </div>
        </motion.div>
      )}

      {/* Microphone */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleMicClick}
          disabled={isProcessing}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          aria-pressed={isRecording}
          className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-full disabled:opacity-50"
        >
          {isRecording && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full opacity-25"
                style={{ background: "var(--color-saffron)" }}
                animate={{ scale: [1, 1.6, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              />
              <motion.span
                className="absolute inset-0 rounded-full opacity-15"
                style={{ background: "var(--color-saffron)" }}
                animate={{ scale: [1, 2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.3 }}
              />
            </>
          )}
          <span
            className="relative flex items-center justify-center w-16 h-16 rounded-full text-3xl transition-colors duration-200"
            style={
              isRecording
                ? { background: "var(--color-saffron)", boxShadow: "0 0 30px rgba(249,115,22,0.4)" }
                : { background: "var(--color-teal-dim)", border: "1px solid var(--color-teal)" }
            }
          >
            🎤
          </span>
        </button>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {isRecording
            ? "Recording... tap to stop"
            : isProcessing
              ? statusText || "Processing..."
              : error
                ? error
                : "Tap microphone to speak"}
        </span>

        {/* Waveform bars when recording */}
        {isRecording && (
          <div className="flex items-end gap-1 h-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="waveform-bar" style={{ height: "100%" }} />
            ))}
          </div>
        )}
      </div>

      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Or type your legal question..."
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none transition-colors disabled:opacity-50"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!textInput.trim() || isProcessing}
          className="px-5 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-40"
          style={{
            background: "var(--color-teal-dim)",
            border: "1px solid var(--color-teal)",
            color: "var(--color-teal)",
          }}
        >
          Send
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: "var(--color-text-faint)" }}>
        This is not legal advice. Contact a lawyer for case-specific guidance.
      </p>
    </div>
  );
}
