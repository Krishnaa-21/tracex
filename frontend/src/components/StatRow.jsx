import React, { useEffect, useRef, useState } from "react";
import { ShieldAlert, Activity, Clock, CheckCircle2 } from "lucide-react";
import { useMode } from "../context/ModeContext";

/** Animated counter — counts up from 0 to target value */
function AnimatedNumber({ value, isStandardMode }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isStandardMode) { setDisplay(value); return; } // static in gov mode
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const duration = 800;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, isStandardMode]);

  return <span>{display}</span>;
}

const STAT_ITEMS = (stats) => [
  {
    label: "High-Risk Cases",
    value: stats.high_risk_cases ?? 0,
    icon: ShieldAlert,
    // Analysis Mode colors
    accentColor: "#FF3B5C",
    glowColor: "rgba(255,59,92,0.35)",
    bgColor: "rgba(255,59,92,0.08)",
    borderColor: "rgba(255,59,92,0.25)",
    topRail: "#FF3B5C",
    isUrgent: (stats.high_risk_cases || 0) > 0,
    // Standard / Government Mode colors
    govColor: "#B91C1C",
    govBg: "#FEF2F2",
    govBorder: "#FCA5A5",
    govRail: "#B91C1C",
    govIconBg: "#FEE2E2",
    govIconBorder: "#FCA5A5",
    govSublabel: (stats.high_risk_cases || 0) > 0 ? "Requires immediate action" : "No critical cases",
  },
  {
    label: "Active Case Load",
    value: stats.active_cases ?? 0,
    icon: Activity,
    accentColor: "#00D4FF",
    glowColor: "rgba(0,212,255,0.25)",
    bgColor: "rgba(0,212,255,0.06)",
    borderColor: "rgba(0,212,255,0.18)",
    topRail: "#00D4FF",
    isUrgent: false,
    govColor: "#0B3B60",
    govBg: "#EFF6FF",
    govBorder: "#BFDBFE",
    govRail: "#0B3B60",
    govIconBg: "#DBEAFE",
    govIconBorder: "#BFDBFE",
    govSublabel: "Currently under investigation",
  },
  {
    label: "Awaiting Correlation",
    value: stats.awaiting_correlation ?? 0,
    icon: Clock,
    accentColor: "#F59E0B",
    glowColor: "rgba(245,158,11,0.30)",
    bgColor: "rgba(245,158,11,0.07)",
    borderColor: "rgba(245,158,11,0.22)",
    topRail: "#F59E0B",
    isUrgent: (stats.awaiting_correlation || 0) > 0,
    govColor: "#D97706",
    govBg: "#FFFBEB",
    govBorder: "#FCD34D",
    govRail: "#D97706",
    govIconBg: "#FEF3C7",
    govIconBorder: "#FCD34D",
    govSublabel: (stats.awaiting_correlation || 0) > 0 ? "Pending multi-source analysis" : "All cases correlated",
  },
  {
    label: "Closed This Month",
    value: stats.closed_this_month ?? 0,
    icon: CheckCircle2,
    accentColor: "#10B981",
    glowColor: "rgba(16,185,129,0.25)",
    bgColor: "rgba(16,185,129,0.07)",
    borderColor: "rgba(16,185,129,0.20)",
    topRail: "#10B981",
    isUrgent: false,
    govColor: "#047857",
    govBg: "#F0FDF4",
    govBorder: "#6EE7B7",
    govRail: "#047857",
    govIconBg: "#D1FAE5",
    govIconBorder: "#6EE7B7",
    govSublabel: "Resolved & archived",
  },
];

export default function StatRow({ stats = {} }) {
  const { isStandardMode } = useMode();
  const items = STAT_ITEMS(stats);

  if (isStandardMode) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="gov-stat-card relative flex flex-col justify-between overflow-hidden"
            >
              {/* Colored top rail — solid, no glow */}
              <div
                className="gov-stat-top-rail"
                style={{ background: item.govRail }}
              />

              {/* Header: icon + label */}
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="gov-stat-label">{item.label}</span>
                <div
                  className="gov-stat-icon-box"
                  style={{ background: item.govIconBg, borderColor: item.govIconBorder }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.govColor }} />
                </div>
              </div>

              {/* Value */}
              <div
                className="gov-stat-value"
                style={{ color: item.govColor }}
              >
                <AnimatedNumber value={item.value} isStandardMode={isStandardMode} />
              </div>

              {/* Sub-label */}
              <div className="gov-stat-sublabel">{item.govSublabel}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Analysis Mode (original) ──────────────────────────────────────────────
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="relative flex flex-col justify-between rounded-md overflow-hidden transition-all duration-300"
            style={{
              background: item.bgColor,
              border: `1px solid ${item.borderColor}`,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "16px 18px 14px",
              boxShadow: item.isUrgent
                ? `0 0 24px ${item.glowColor}, inset 0 1px 0 ${item.borderColor}`
                : `inset 0 1px 0 ${item.borderColor}`,
            }}
          >
            {/* Colored top rail */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{
                background: `linear-gradient(90deg, ${item.topRail}, transparent)`,
                boxShadow: `0 0 8px ${item.glowColor}`,
              }}
            />

            {/* Subtle animated glow for urgent */}
            {item.isUrgent && (
              <div
                className="absolute inset-0 pointer-events-none rounded-md"
                style={{
                  background: `radial-gradient(ellipse at top left, ${item.bgColor} 0%, transparent 70%)`,
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
              />
            )}

            {/* Header: icon + label */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-mono font-semibold uppercase tracking-widest"
                style={{ color: `${item.accentColor}99` }}
              >
                {item.label}
              </span>
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${item.bgColor}`,
                  border: `1px solid ${item.borderColor}`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: item.accentColor }} />
              </div>
            </div>

            {/* Value */}
            <div
              className="text-[32px] font-display font-bold leading-none"
              style={{
                color: item.accentColor,
                textShadow: item.isUrgent ? `0 0 20px ${item.glowColor}` : "none",
              }}
            >
              <AnimatedNumber value={item.value} isStandardMode={false} />
            </div>

            {/* Subtle sub-label */}
            <div className="mt-1.5 text-[10px] font-mono" style={{ color: "rgba(148,163,184,0.45)" }}>
              {item.isUrgent ? "↑ Requires attention" : "Updated just now"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
