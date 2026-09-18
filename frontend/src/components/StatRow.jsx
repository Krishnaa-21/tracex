import React, { useEffect, useRef, useState } from "react";
import { ShieldAlert, Activity, Clock, CheckCircle2 } from "lucide-react";

/** Animated counter — counts up from 0 to target value */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
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
  }, [value]);

  return <span>{display}</span>;
}

const STAT_ITEMS = (stats) => [
  {
    label: "High-Risk Cases",
    value: stats.high_risk_cases ?? 0,
    icon: ShieldAlert,
    accentColor: "#FF3B5C",
    glowColor: "rgba(255,59,92,0.35)",
    bgColor: "rgba(255,59,92,0.08)",
    borderColor: "rgba(255,59,92,0.25)",
    topRail: "#FF3B5C",
    isUrgent: (stats.high_risk_cases || 0) > 0,
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
  },
];

export default function StatRow({ stats = {} }) {
  const items = STAT_ITEMS(stats);

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
              <AnimatedNumber value={item.value} />
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
