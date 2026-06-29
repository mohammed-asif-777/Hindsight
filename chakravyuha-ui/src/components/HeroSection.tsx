"use client";

import { motion } from "framer-motion";
import { HeroLogo } from "@/components/Logo";

const CHIPS = [
  { label: "BNS 2023", icon: "\u2696\uFE0F" },
  { label: "BNSS", icon: "\uD83D\uDCDC" },
  { label: "Constitution", icon: "\uD83C\uDDEE\uD83C\uDDF3" },
  { label: "NALSA", icon: "\uD83C\uDFDB\uFE0F" },
  { label: "22 Languages", icon: "\uD83D\uDDE3\uFE0F" },
  { label: "Voice AI", icon: "\uD83C\uDFA4" },
];

interface HeroSectionProps {
  onStartChat: () => void;
}

export function HeroSection({ onStartChat }: HeroSectionProps) {
  return (
    <section className="relative flex flex-col items-center text-center gap-6 pt-10 pb-6 px-4">
      {/* Animated logo with concentric rings */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <HeroLogo />
      </motion.div>

      {/* Title */}
      <motion.div
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h1
          className="text-4xl sm:text-5xl font-bold leading-tight"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          <span className="gradient-text-hero">CHAKRAVYUHA</span>
          <span className="gradient-text-teal">.AI</span>
        </h1>
        <p
          className="text-xs tracking-[0.3em] font-medium uppercase"
          style={{ color: "var(--color-gold)" }}
        >
          Indian Law | Artificial Intelligence
        </p>
      </motion.div>

      {/* Description */}
      <motion.p
        className="text-sm max-w-sm leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        Navigate the Indian Constitution, Bhartiya Nyaya Sanhita, and legal procedures
        with classification-first AI guidance — no hallucinations, in{" "}
        <span style={{ color: "var(--color-teal)" }}>22 regional languages</span>.
      </motion.p>

      {/* CTA */}
      <motion.button
        onClick={onStartChat}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(0, 217, 232, 0.25), rgba(0, 217, 232, 0.1))",
          border: "1px solid var(--color-teal)",
          color: "var(--color-teal)",
          boxShadow: "0 0 20px rgba(0, 217, 232, 0.2)",
        }}
      >
        Start Legal Consultation
        <span aria-hidden>&#8594;</span>
      </motion.button>

      {/* Powered by */}
      <motion.p
        className="text-[10px] tracking-widest uppercase"
        style={{ color: "var(--color-text-faint)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Classification-First &middot; Zero Hallucinations &middot; Official Legal Frameworks
      </motion.p>

      {/* Chips */}
      <motion.div
        className="flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
      >
        {CHIPS.map((chip, i) => (
          <motion.span
            key={chip.label}
            className="chip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 + i * 0.07 }}
          >
            {chip.icon} {chip.label}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
}
