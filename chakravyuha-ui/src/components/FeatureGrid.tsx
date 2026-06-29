"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "\uD83C\uDFA4",
    title: "Voice AI",
    desc: "Speak your legal concern in any Indian language — instant classification",
    accent: "teal",
  },
  {
    icon: "\u2696\uFE0F",
    title: "AI Judge",
    desc: "Predict likely outcomes and severity of your legal situation",
    accent: "gold",
  },
  {
    icon: "\uD83D\uDCDD",
    title: "Draft Complaints",
    desc: "Auto-generate FIR drafts, legal notices, and consumer complaints",
    accent: "saffron",
  },
  {
    icon: "\uD83D\uDCDC",
    title: "BNS & IPC Guide",
    desc: "Navigate Bhartiya Nyaya Sanhita sections with curated guidance",
    accent: "teal",
  },
  {
    icon: "\uD83D\uDEE1\uFE0F",
    title: "Safe Responses",
    desc: "Classification-first pipeline — zero hallucinations, verified legal info",
    accent: "gold",
  },
  {
    icon: "\uD83D\uDDE3\uFE0F",
    title: "22 Languages",
    desc: "Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati, and more",
    accent: "saffron",
  },
];

const ACCENT_STYLES: Record<string, { bg: string; border: string }> = {
  teal: { bg: "var(--color-teal-dim)", border: "rgba(0, 217, 232, 0.25)" },
  gold: { bg: "var(--color-gold-dim)", border: "rgba(245, 200, 66, 0.25)" },
  saffron: { bg: "var(--color-saffron-dim)", border: "rgba(249, 115, 22, 0.25)" },
};

export function FeatureGrid() {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
      {FEATURES.map((f, i) => {
        const accent = ACCENT_STYLES[f.accent];
        return (
          <motion.div
            key={f.title}
            className="glass rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 cursor-default transition-all"
            style={{ borderColor: accent.border }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            whileHover={{ scale: 1.03, borderColor: "var(--color-teal)" }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
            >
              {f.icon}
            </div>
            <h3 className="font-semibold text-xs" style={{ color: "var(--color-text)" }}>
              {f.title}
            </h3>
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              {f.desc}
            </p>
          </motion.div>
        );
      })}
    </section>
  );
}
