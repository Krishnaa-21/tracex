import React from "react";
import { FileText, Clock, CheckCircle2, AlertCircle, Hash } from "lucide-react";
import { useMode } from "../context/ModeContext";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.25)",
    // Standard Mode
    govColor: "#D97706",
    govBg: "#FEF3C7",
    govBorder: "#FCD34D",
  },
  processing: {
    icon: Clock,
    label: "Processing",
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.20)",
    govColor: "#0369A1",
    govBg: "#E0F2FE",
    govBorder: "#7DD3FC",
  },
  completed: {
    icon: CheckCircle2,
    label: "Indexed",
    color: "#10B981",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.22)",
    govColor: "#047857",
    govBg: "#D1FAE5",
    govBorder: "#6EE7B7",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    color: "#FF3B5C",
    bg: "rgba(255,59,92,0.10)",
    border: "rgba(255,59,92,0.22)",
    govColor: "#B91C1C",
    govBg: "#FEE2E2",
    govBorder: "#FCA5A5",
  },
};

function GovEvidenceRow({ file, idx }) {
  const status = (file.status || "pending").toLowerCase();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <div className="gov-evidence-row">
      {/* File icon */}
      <div className="gov-evidence-file-icon">
        <FileText className="w-3.5 h-3.5 text-[#64748B]" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="gov-evidence-filename truncate">{file.filename || file.name || `evidence-${idx + 1}`}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Hash className="w-2.5 h-2.5 flex-shrink-0 text-[#94A3B8]" />
          <span className="gov-evidence-hash truncate">
            {file.sha256 || file.hash || "hash pending..."}
          </span>
        </div>
      </div>

      {/* File type badge */}
      {file.file_type && (
        <span className="gov-evidence-type-badge hidden sm:inline">
          {file.file_type.toUpperCase()}
        </span>
      )}

      {/* Status badge */}
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0"
        style={{
          background: cfg.govBg,
          border: `1px solid ${cfg.govBorder}`,
          color: cfg.govColor,
        }}
      >
        <Icon className="w-3 h-3" />
        <span>{cfg.label}</span>
      </div>
    </div>
  );
}

function AnalysisEvidenceRow({ file, idx }) {
  const status = (file.status || "pending").toLowerCase();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 transition-all"
      style={{
        borderBottom: "1px solid rgba(0,212,255,0.06)",
        animation: `fade-in-up 0.25s ease ${idx * 0.04}s both`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* File icon */}
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{
          background: "rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.12)",
        }}
      >
        <FileText className="w-3.5 h-3.5" style={{ color: "rgba(0,212,255,0.60)" }} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-mono font-medium text-text truncate">{file.filename || file.name || `evidence-${idx + 1}`}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <Hash className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "rgba(0,212,255,0.35)" }} />
          <span className="text-[10px] font-mono truncate" style={{ color: "rgba(0,212,255,0.45)" }}>
            {file.sha256 || file.hash || "hash pending..."}
          </span>
        </div>
      </div>

      {/* File type */}
      {file.file_type && (
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded hidden sm:inline"
          style={{
            background: "rgba(139,92,246,0.10)",
            border: "1px solid rgba(139,92,246,0.20)",
            color: "rgba(139,92,246,0.80)",
          }}
        >
          {file.file_type.toUpperCase()}
        </span>
      )}

      {/* Status badge */}
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex-shrink-0"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
        }}
      >
        <Icon className="w-3 h-3" />
        <span>{cfg.label}</span>
      </div>
    </div>
  );
}

export default function EvidenceTray({ files = [], isLoading = false }) {
  const { isStandardMode } = useMode();

  if (isStandardMode) {
    if (isLoading) {
      return (
        <div className="gov-evidence-loading">
          Scanning evidence ingestion pipeline…
        </div>
      );
    }

    if (!files.length) {
      return (
        <div className="gov-evidence-empty">
          No evidence files in processing queue
        </div>
      );
    }

    return (
      <div className="gov-evidence-container">
        {/* Formal header bar */}
        <div className="gov-evidence-header">
          <span className="gov-evidence-header-title">
            Evidence Ingestion Pipeline
          </span>
          <span className="text-[10.5px] font-mono text-[#64748B]">
            {files.length} {files.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Evidence rows */}
        <div className="max-h-52 overflow-y-auto">
          {files.map((file, idx) => (
            <GovEvidenceRow key={file.id || idx} file={file} idx={idx} />
          ))}
        </div>
      </div>
    );
  }

  // ── Analysis Mode (original) ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="py-8 text-center font-mono text-[12px] rounded-md"
        style={{
          background: "rgba(6,10,22,0.60)",
          border: "1px solid rgba(0,212,255,0.10)",
          color: "rgba(0,212,255,0.40)",
        }}
      >
        <span className="animate-data-blink">Scanning evidence ingestion pipeline...</span>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div
        className="py-8 text-center font-mono text-[12px] rounded-md"
        style={{
          background: "rgba(6,10,22,0.60)",
          border: "1px solid rgba(0,212,255,0.10)",
          color: "rgba(0,212,255,0.30)",
        }}
      >
        No evidence files in processing queue
      </div>
    );
  }

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: "rgba(4,8,18,0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(0,212,255,0.10)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.40), inset 0 1px 0 rgba(0,212,255,0.05)",
      }}
    >
      {/* Terminal header bar */}
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{
          background: "rgba(0,0,0,0.30)",
          borderBottom: "1px solid rgba(0,212,255,0.08)",
        }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: "#FF3B5C", boxShadow: "0 0 4px rgba(255,59,92,0.80)" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B", boxShadow: "0 0 4px rgba(245,158,11,0.80)" }} />
        <div className="w-2 h-2 rounded-full" style={{ background: "#10B981", boxShadow: "0 0 4px rgba(16,185,129,0.80)" }} />
        <span className="ml-2 text-[10px] font-mono" style={{ color: "rgba(0,212,255,0.40)" }}>
          evidence-pipeline.log — {files.length} entries
        </span>
      </div>

      {/* Evidence rows */}
      <div className="max-h-52 overflow-y-auto">
        {files.map((file, idx) => (
          <AnalysisEvidenceRow key={file.id || idx} file={file} idx={idx} />
        ))}
      </div>
    </div>
  );
}
