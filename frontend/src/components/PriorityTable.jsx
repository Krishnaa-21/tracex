import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldAlert, MapPin, Eye, EyeOff, Zap } from "lucide-react";
import RiskTag from "./RiskTag";

const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

const RAIL_COLORS = {
  critical: { color: "#FF3B5C", glow: "rgba(255,59,92,0.60)" },
  high:     { color: "#F87171", glow: "rgba(248,113,113,0.50)" },
  medium:   { color: "#F59E0B", glow: "rgba(245,158,11,0.50)" },
  med:      { color: "#F59E0B", glow: "rgba(245,158,11,0.50)" },
  low:      { color: "#10B981", glow: "rgba(16,185,129,0.40)" },
};

function scoreOf(c) {
  if (c.risk_score !== null && c.risk_score !== undefined) return Math.round(c.risk_score);
  const level = (c.risk_level || "").toLowerCase();
  if (level === "critical") return 95;
  if (level === "high") return 80;
  if (level === "medium" || level === "med") return 50;
  if (level === "low") return 20;
  return 0;
}

function ScoreBar({ score, riskLevel }) {
  const level = (riskLevel || "").toLowerCase();
  const color = level === "critical" || level === "high" ? "#F87171"
    : level === "medium" || level === "med" ? "#F59E0B"
    : "#10B981";
  const glow = level === "critical" || level === "high" ? "rgba(248,113,113,0.50)"
    : level === "medium" || level === "med" ? "rgba(245,158,11,0.40)"
    : "rgba(16,185,129,0.35)";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-mono" style={{ color: color }}>{score}</span>
      <div
        className="w-12 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 6px ${glow}`,
          }}
        />
      </div>
    </div>
  );
}

export default function PriorityTable({ cases = [], isLoading = false, selectedDistrict = null }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const filteredCases = selectedDistrict
    ? cases.filter((c) => (c.district || "").toLowerCase() === selectedDistrict.toLowerCase())
    : cases;

  const rankedCases = [...filteredCases].sort((a, b) => scoreOf(b) - scoreOf(a));
  const displayedCases = showAll ? rankedCases : rankedCases.slice(0, 5);

  if (isLoading) {
    return (
      <div
        className="py-12 text-center text-[13px] rounded-md"
        style={{
          background: "rgba(8,14,28,0.60)",
          border: "1px solid rgba(0,212,255,0.12)",
          color: "rgba(148,163,184,0.60)",
        }}
      >
        <div className="animate-pulse flex flex-col items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: "rgba(0,212,255,0.40)" }} />
          <span className="font-mono text-[12px]">Loading high-priority incident queue...</span>
        </div>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div
        className="py-12 text-center text-[13px] rounded-md"
        style={{
          background: "rgba(8,14,28,0.60)",
          border: "1px solid rgba(0,212,255,0.12)",
          color: "rgba(148,163,184,0.60)",
        }}
      >
        No cases registered yet. Click "+ New investigation" above to begin.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[12px] uppercase tracking-widest font-mono font-semibold" style={{ color: "rgba(0,212,255,0.80)" }}>
            {selectedDistrict
              ? `District: ${selectedDistrict} (${filteredCases.length})`
              : `Priority Incident Queue`}
          </h2>
          <span
            className="text-[10.5px] font-mono px-2 py-0.5 rounded"
            style={{
              background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.18)",
              color: "rgba(0,212,255,0.60)",
            }}
          >
            {filteredCases.length} active
          </span>
        </div>

        {rankedCases.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ color: "rgba(0,212,255,0.70)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4FF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,212,255,0.70)")}
          >
            {showAll ? <><EyeOff className="w-3.5 h-3.5" /><span>Show top 5 only</span></>
              : <><Eye className="w-3.5 h-3.5" /><span>View all ({rankedCases.length}) cases</span></>}
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-md overflow-hidden"
        style={{
          background: "rgba(6,10,22,0.70)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0,212,255,0.12)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(0,212,255,0.06)",
        }}
      >
        {displayedCases.map((c, idx) => {
          const scamLabel = SCAM_TYPE_LABELS[c.scam_type] || c.scam_type;
          const score = scoreOf(c);
          const isTop1 = idx === 0 && !selectedDistrict;
          const riskKey = (c.risk_level || "").toLowerCase();
          const rail = RAIL_COLORS[riskKey] || RAIL_COLORS.low;

          return (
            <div
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}/graph`)}
              className="flex items-stretch gap-0 cursor-pointer transition-all group relative"
              style={{ borderBottom: "1px solid rgba(0,212,255,0.07)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,212,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Risk rail — colored gradient bar on left */}
              <div
                className="w-1 flex-shrink-0"
                style={{
                  background: `linear-gradient(180deg, ${rail.color}, transparent)`,
                  boxShadow: `2px 0 8px ${rail.glow}`,
                }}
              />

              {/* Scan line on hover */}
              <div
                className="absolute left-0 right-0 h-px pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(90deg, transparent, ${rail.color}40, transparent)`,
                  top: "50%",
                }}
              />

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3.5 min-w-0">
                {/* Case ID + victim */}
                <div className="flex items-center gap-2.5 min-w-0 sm:w-[220px] flex-shrink-0">
                  {isTop1 && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: "#FF3B5C",
                        boxShadow: "0 0 8px rgba(255,59,92,0.90)",
                        animation: "pulse-red 1.5s ease-in-out infinite",
                      }}
                      title="Highest risk case"
                    />
                  )}
                  <div className="min-w-0">
                    <div
                      className="font-mono font-bold text-[13px] leading-tight"
                      style={{
                        color: "#00D4FF",
                        textShadow: "0 0 10px rgba(0,212,255,0.40)",
                      }}
                    >
                      {c.case_number}
                    </div>
                    <div className="font-semibold text-text text-[13px] leading-tight truncate">{c.victim_name}</div>
                  </div>
                </div>

                {/* Risk badge + score bar */}
                <div className="flex items-center gap-2.5 sm:w-[200px] flex-shrink-0">
                  <RiskTag level={c.risk_level} />
                  {c.risk_score !== null && c.risk_score !== undefined && (
                    <div className="hidden md:block">
                      <ScoreBar score={score} riskLevel={c.risk_level} />
                    </div>
                  )}
                </div>

                {/* Rationale */}
                <div className="flex-1 min-w-0 text-[12.5px]">
                  {c.why_flagged ? (
                    <span className="inline-flex items-center gap-1.5 text-textDim">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                      <span className="truncate">{c.why_flagged}</span>
                    </span>
                  ) : (
                    <span className="text-textFaint italic text-[12px]">Awaiting correlation</span>
                  )}
                </div>

                {/* District + type */}
                <div className="flex items-center gap-3 sm:w-[200px] flex-shrink-0 text-[12px] text-textDim">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: "rgba(0,212,255,0.40)" }} />
                    {c.district || "Pending"}
                  </span>
                  <span className="hidden lg:inline text-textFaint">·</span>
                  <span className="hidden lg:inline truncate">{scamLabel}</span>
                </div>

                {/* Investigate button */}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/cases/${c.id}/graph`); }}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-mono font-semibold rounded transition-all self-start sm:self-center cursor-pointer"
                  style={{
                    background: "rgba(0,212,255,0.06)",
                    border: "1px solid rgba(0,212,255,0.25)",
                    color: "#00D4FF",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,212,255,0.15)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(0,212,255,0.30)";
                    e.currentTarget.style.borderColor = "rgba(0,212,255,0.50)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,212,255,0.06)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "rgba(0,212,255,0.25)";
                  }}
                >
                  <span>Investigate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
