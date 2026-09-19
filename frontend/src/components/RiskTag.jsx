import React from "react";
import { useMode } from "../context/ModeContext";

// Analysis Mode config (neon glow badges)
const ANALYSIS_CONFIG = {
  critical: {
    label: "CRITICAL",
    color: "#FF3B5C",
    bg: "rgba(255,59,92,0.12)",
    border: "rgba(255,59,92,0.35)",
    glow: "0 0 8px rgba(255,59,92,0.50)",
  },
  high: {
    label: "HIGH",
    color: "#F87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.30)",
    glow: "0 0 8px rgba(248,113,113,0.40)",
  },
  medium: {
    label: "MEDIUM",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.30)",
    glow: "0 0 8px rgba(245,158,11,0.35)",
  },
  med: {
    label: "MEDIUM",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.30)",
    glow: "0 0 8px rgba(245,158,11,0.35)",
  },
  low: {
    label: "LOW",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
    glow: "0 0 8px rgba(16,185,129,0.35)",
  },
};

export default function RiskTag({ level = "low" }) {
  const { isStandardMode } = useMode();
  const key = (level || "low").toLowerCase();

  if (isStandardMode) {
    // Flat government badge — no box-shadow glow
    const govKey = key === "med" ? "medium" : key;
    return (
      <span className={`gov-risk-tag ${govKey === "critical" ? "critical" : govKey === "high" ? "high" : govKey === "medium" ? "medium" : "low"}`}>
        {key === "critical" ? "CRITICAL" : key === "high" ? "HIGH" : key === "medium" || key === "med" ? "MEDIUM" : "LOW"}
      </span>
    );
  }

  // ── Analysis Mode (original) ──────────────────────────────────────────────
  const cfg = ANALYSIS_CONFIG[key] || ANALYSIS_CONFIG.low;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold rounded tracking-widest uppercase"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow,
        letterSpacing: "0.08em",
      }}
    >
      {cfg.label}
    </span>
  );
}
