import React from "react";
import { CheckCircle2, Download, FileText, Loader2, ShieldCheck } from "lucide-react";

export default function ReportCard({
  icon: Icon = FileText,
  title,
  description,
  bullets = [],
  buttonLabel,
  onGenerate,
  isGenerating = false,
  sha256 = null,
  footerNote = null,
}) {
  return (
    <div
      className="flex flex-col justify-between rounded-md overflow-hidden transition-all duration-300 relative group"
      style={{
        background: "rgba(7,12,24,0.80)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(0,212,255,0.14)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(0,212,255,0.07)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.60), 0 0 20px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.12)";
        e.currentTarget.style.borderColor = "rgba(0,212,255,0.28)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(0,212,255,0.07)";
        e.currentTarget.style.borderColor = "rgba(0,212,255,0.14)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Subtle top gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.30), transparent)" }}
      />

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.22)",
              boxShadow: "0 0 14px rgba(0,212,255,0.12)",
            }}
          >
            <Icon className="w-5 h-5" style={{ color: "#00D4FF" }} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-text leading-tight font-display">{title}</h2>
            <p className="text-[12px] text-textDim mt-1 leading-normal">{description}</p>
          </div>
        </div>

        {/* Bullet list */}
        <div
          className="pt-4"
          style={{ borderTop: "1px solid rgba(0,212,255,0.08)" }}
        >
          <div
            className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-3"
            style={{ color: "rgba(0,212,255,0.45)" }}
          >
            Included Sections &amp; Intelligence
          </div>
          <ul className="space-y-2 text-[12.5px] text-text">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: "#10B981", filter: "drop-shadow(0 0 4px rgba(16,185,129,0.50))" }}
                />
                <span className="leading-snug text-textDim">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="p-6 space-y-3"
        style={{ borderTop: "1px solid rgba(0,212,255,0.08)" }}
      >
        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 px-4 text-[13px] font-semibold rounded flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          style={{
            background: isGenerating
              ? "rgba(0,80,120,0.40)"
              : "linear-gradient(135deg, #007FA8 0%, #004F80 100%)",
            border: "1px solid rgba(0,212,255,0.40)",
            color: "#fff",
            boxShadow: isGenerating ? "none" : "0 0 16px rgba(0,212,255,0.18)",
          }}
          onMouseEnter={(e) => {
            if (!isGenerating) e.currentTarget.style.boxShadow = "0 0 28px rgba(0,212,255,0.40)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 16px rgba(0,212,255,0.18)";
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling PDF document...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>

        {footerNote && (
          <p className="text-[11px] italic text-center" style={{ color: "rgba(148,163,184,0.50)" }}>
            {footerNote}
          </p>
        )}

        {/* SHA-256 hash */}
        {sha256 && (
          <div
            className="p-3 rounded text-[11px] space-y-1.5"
            style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.18)",
            }}
          >
            <div
              className="flex items-center gap-1.5 font-mono font-bold uppercase tracking-widest text-[10px]"
              style={{ color: "#10B981" }}
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.60))" }} />
              <span>Cryptographic Evidentiary Stamp (SHA-256)</span>
            </div>
            <div className="font-mono text-[10.5px] text-text break-all select-all" style={{ color: "rgba(0,212,255,0.80)" }}>
              {sha256}
            </div>
            <span className="text-[9.5px]" style={{ color: "rgba(148,163,184,0.45)" }}>
              Certified for Section 65B Indian Evidence Act submission
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
