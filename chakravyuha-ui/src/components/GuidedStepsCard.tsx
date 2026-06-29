"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useState, useId } from "react";

const STEPS_EN = [
  "Tell us your problem",
  "Understand the law",
  "Take action",
  "Fill forms",
  "How it works",
];

const STEPS_TA = [
  "உங்கள் பிரச்சினையைச் சொல்லுங்கள்",
  "சட்டத்தைப் புரிந்துகொள்ளுங்கள்",
  "நடவடிக்கை எடுக்கவும்",
  "படிவங்களை நிரப்பவும்",
  "இது எவ்வாறு செயல்படுகிறது",
];

export function GuidedStepsCard() {
  const { state, setStep } = useApp();
  const isTamil = state.language.code === "ta-IN";
  const steps = isTamil ? STEPS_TA : STEPS_EN;

  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = state.currentStep === stepNum;
        const isDone = state.currentStep > stepNum;

        return (
          <button
            key={stepNum}
            onClick={() => setStep(stepNum)}
            aria-label={`Step ${stepNum}: ${label}`}
            aria-current={isActive ? "step" : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400
              ${isActive
                ? "bg-orange-100 border border-orange-300 text-gray-800 shadow-sm"
                : isDone
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
          >
            <motion.span
              layout
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${isActive
                  ? "bg-orange-500 text-white"
                  : isDone
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
                }`}
            >
              {isDone ? "✓" : stepNum}
            </motion.span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
