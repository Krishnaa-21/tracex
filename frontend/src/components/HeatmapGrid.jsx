import React, { useState } from "react";
import { MapPin, Info, Flame, X } from "lucide-react";

const LEVEL_CONFIG = {
  high: {
    color: "#F87171",
    bg: "rgba(248,113,113,0.10)",
    border: "rgba(248,113,113,0.28)",
    glow: "rgba(248,113,113,0.35)",
    barColor: "#F87171",
  },
  medium: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.30)",
    barColor: "#F59E0B",
  },
  med: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.25)",
    glow: "rgba(245,158,11,0.30)",
    barColor: "#F59E0B",
  },
  low: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.20)",
    glow: "rgba(16,185,129,0.25)",
    barColor: "#10B981",
  },
};

function getTileConfig(level, isSelected) {
  const norm = (level || "low").toLowerCase();
  return LEVEL_CONFIG[norm] || LEVEL_CONFIG.low;
}

export default function HeatmapGrid({
  heatmap = [],
  isLoading = false,
  selectedDistrict = null,
  onSelectDistrict = () => {},
}) {
  const [filterLevel, setFilterLevel] = useState("all");

  if (isLoading) {
    return (
      <div
        className="py-10 text-center font-mono text-[12px] rounded-md"
        style={{
          background: "rgba(6,10,22,0.60)",
          border: "1px solid rgba(0,212,255,0.10)",
          color: "rgba(0,212,255,0.40)",
        }}
      >
        <span className="animate-data-blink">Analyzing jurisdictional fraud telemetry...</span>
      </div>
    );
  }

  const filteredHeatmap = (heatmap || []).filter((item) => {
    if (filterLevel === "all") return true;
    return (item.level || "").toLowerCase() === filterLevel;
  });

  const sortedByCount = [...(heatmap || [])].sort((a, b) => b.case_count - a.case_count);
  const topHotspot = sortedByCount[0];

  return (
    <div className="space-y-4">
      {/* Top banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-md"
        style={{
          background: "rgba(6,10,22,0.70)",
          border: "1px solid rgba(0,212,255,0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.25)",
            }}
          >
            <Flame className="w-4 h-4" style={{ color: "#F87171" }} />
          </div>
          <div className="text-[12.5px]">
            <span className="font-semibold text-text">Regional Fraud Telemetry: </span>
            {topHotspot ? (
              <span className="text-textDim">
                Primary concentration in{" "}
                <strong style={{ color: "#F87171", textShadow: "0 0 8px rgba(248,113,113,0.50)" }}>
                  {topHotspot.district}
                </strong>
                {" "}({topHotspot.case_count} cases) across {heatmap.length} jurisdictions.
              </span>
            ) : (
              <span className="text-textDim">Resolved from static IFSC and Postal PIN databases.</span>
            )}
          </div>
        </div>

        {/* Level filter buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {["all", "high", "medium", "low"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className="px-2.5 py-1 text-[10px] uppercase font-mono rounded transition-all cursor-pointer"
              style={{
                background: filterLevel === lvl ? "rgba(0,212,255,0.15)" : "rgba(0,0,0,0.30)",
                border: filterLevel === lvl ? "1px solid rgba(0,212,255,0.45)" : "1px solid rgba(0,212,255,0.12)",
                color: filterLevel === lvl ? "#00D4FF" : "rgba(148,163,184,0.60)",
                boxShadow: filterLevel === lvl ? "0 0 8px rgba(0,212,255,0.20)" : "none",
                fontWeight: filterLevel === lvl ? "700" : "400",
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* District filter active banner */}
      {selectedDistrict && (
        <div
          className="flex items-center justify-between px-4 py-2 rounded-md text-[12px] font-medium animate-fade-in-up"
          style={{
            background: "rgba(0,212,255,0.06)",
            border: "1px solid rgba(0,212,255,0.25)",
            color: "#00D4FF",
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Filtering cases for <strong>{selectedDistrict}</strong></span>
          </div>
          <button
            onClick={() => onSelectDistrict(null)}
            className="flex items-center gap-1 text-[11px] font-mono transition-opacity hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* District tiles grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {filteredHeatmap.map((item, idx) => {
          const isSelected = selectedDistrict?.toLowerCase() === item.district.toLowerCase();
          const cfg = getTileConfig(item.level, isSelected);
          const percent = Math.min(100, Math.round((item.case_count / Math.max(1, topHotspot?.case_count || 1)) * 100));

          return (
            <div
              key={item.district}
              onClick={() => onSelectDistrict(isSelected ? null : item.district)}
              className="p-3 rounded-md border cursor-pointer transition-all select-none flex flex-col justify-between"
              style={{
                background: isSelected ? "rgba(0,212,255,0.10)" : cfg.bg,
                border: isSelected
                  ? "1px solid rgba(0,212,255,0.55)"
                  : `1px solid ${cfg.border}`,
                boxShadow: isSelected
                  ? "0 0 16px rgba(0,212,255,0.25), inset 0 1px 0 rgba(0,212,255,0.15)"
                  : `0 0 0px transparent`,
                backdropFilter: "blur(8px)",
                animation: `fade-in-up 0.2s ease ${idx * 0.03}s both`,
                minHeight: "90px",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = `0 0 14px ${cfg.glow}`;
                  e.currentTarget.style.borderColor = cfg.color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = cfg.border;
                }
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[12px] font-bold text-text truncate">{item.district}</span>
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: `${cfg.color}70` }} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className="text-[9px] font-mono font-bold tracking-widest uppercase"
                    style={{ color: `${cfg.color}90` }}
                  >
                    {item.level || "low"}
                  </span>
                  <span
                    className="text-[18px] font-display font-bold"
                    style={{
                      color: cfg.color,
                      textShadow: `0 0 10px ${cfg.glow}`,
                    }}
                  >
                    {item.case_count}
                  </span>
                </div>
              </div>

              {/* Intensity bar */}
              <div
                className="mt-2 w-full h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percent}%`,
                    background: cfg.barColor,
                    boxShadow: `0 0 6px ${cfg.glow}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11.5px]"
        style={{ borderTop: "1px solid rgba(0,212,255,0.08)" }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.40)" }}>
            Density Legend:
          </span>
          {[
            { color: "#10B981", glow: "rgba(16,185,129,0.60)", label: "Low (1–2)" },
            { color: "#F59E0B", glow: "rgba(245,158,11,0.60)", label: "Medium (3–5)" },
            { color: "#F87171", glow: "rgba(248,113,113,0.60)", label: "High (6+)" },
          ].map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5 text-textDim">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: l.color, boxShadow: `0 0 6px ${l.glow}` }}
              />
              <span>{l.label}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5" style={{ color: "rgba(0,212,255,0.30)" }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[11px] font-mono">runs fully offline, from locally bundled lookups</span>
        </div>
      </div>
    </div>
  );
}
