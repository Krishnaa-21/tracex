import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UrgentBanner({ cases = [] }) {
  const navigate = useNavigate();

  // Find the highest-risk case requiring immediate action
  const urgentCase = cases.find(
    (c) => (c.risk_level || "").toLowerCase() === "critical" && c.freeze_recommended
  );

  if (!urgentCase) return null;

  return (
    <div
      className="relative flex items-center justify-between gap-4 px-4 py-3 rounded-md overflow-hidden animate-fade-in-up"
      style={{
        background: "rgba(255,59,92,0.07)",
        border: "1px solid rgba(255,59,92,0.35)",
        boxShadow: "0 0 30px rgba(255,59,92,0.15), inset 0 1px 0 rgba(255,59,92,0.15)",
        animation: "pulse-red 2s ease-in-out infinite",
      }}
    >
      {/* Animated left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{
          background: "linear-gradient(180deg, transparent, #FF3B5C, transparent)",
          boxShadow: "0 0 10px rgba(255,59,92,0.80)",
        }}
      />

      {/* Scanning line overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-md"
        style={{ opacity: 0.4 }}
      >
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,59,92,0.6), transparent)",
            animation: "scan-line 2.5s linear infinite",
          }}
        />
      </div>

      <div className="flex items-center gap-3 min-w-0 pl-2">
        {/* Pulsing icon */}
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(255,59,92,0.15)",
            border: "1px solid rgba(255,59,92,0.40)",
            boxShadow: "0 0 12px rgba(255,59,92,0.40)",
          }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: "#FF3B5C" }} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
              style={{
                color: "#FF3B5C",
                background: "rgba(255,59,92,0.15)",
                border: "1px solid rgba(255,59,92,0.30)",
                animation: "data-blink 1.5s step-end infinite",
              }}
            >
              ⚡ CRITICAL ALERT
            </span>
          </div>
          <p className="text-[13px] font-semibold text-text leading-snug truncate">
            <span className="font-mono" style={{ color: "#FF8BA0" }}>{urgentCase.case_number}</span>
            {" · "}
            {urgentCase.victim_name} — Freeze action recommended
          </p>
          {urgentCase.why_flagged && (
            <p className="text-[11.5px] text-textDim mt-0.5 truncate">{urgentCase.why_flagged}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate(`/cases/${urgentCase.id}/graph`)}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-all cursor-pointer"
        style={{
          background: "rgba(255,59,92,0.15)",
          border: "1px solid rgba(255,59,92,0.40)",
          color: "#FF8BA0",
          boxShadow: "0 0 10px rgba(255,59,92,0.20)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,59,92,0.25)";
          e.currentTarget.style.boxShadow = "0 0 18px rgba(255,59,92,0.40)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,59,92,0.15)";
          e.currentTarget.style.boxShadow = "0 0 10px rgba(255,59,92,0.20)";
        }}
      >
        <span>Take Action</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
