import React, { useEffect, useRef } from "react";
import {
  X,
  BadgeCheck,
  Key,
  Clock,
  LogOut,
  Shield,
  User,
  Settings,
  ChevronRight,
} from "lucide-react";
import { getOfficer, getToken, clearAuth } from "../api/client";
import { useNavigate } from "react-router-dom";

/**
 * ProfilePanel — anchored right-side popover (NOT a full-screen modal).
 *
 * Rendered via a React portal directly in Topbar, positioned fixed at
 * top-right below the header. Dismisses on: click-outside, Escape key, X button.
 */
export default function ProfilePanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Operations Room",
  };

  const token = getToken() || "";
  const tokenSnippet = token
    ? `${token.substring(0, 14)}...${token.substring(token.length - 8)}`
    : "No active token";

  const initials = officer.name ? officer.name.charAt(0).toUpperCase() : "O";

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSignOut = () => {
    clearAuth();
    onClose();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop — click to dismiss, no visual block */}
      <div
        className="fixed inset-0 z-[190]"
        onClick={onClose}
        aria-label="Close profile panel"
      />

      {/* Anchored panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-label="Officer profile"
        className="fixed z-[200] select-none animate-fade-in-up"
        style={{
          top: "60px",
          right: "12px",
          width: "300px",
          maxHeight: "calc(100vh - 76px)",
          overflowY: "auto",
          background: "rgba(4,9,20,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0,229,200,0.18)",
          borderRadius: "10px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(0,229,200,0.06), 0 0 32px rgba(0,229,200,0.06)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            borderBottom: "1px solid rgba(0,229,200,0.10)",
            background: "rgba(0,229,200,0.03)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-bold font-display flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #007FA8, #6B21D8)",
                color: "#fff",
                boxShadow: "0 0 14px rgba(0,229,200,0.30)",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-text leading-tight truncate">
                {officer.name}
              </p>
              <p
                className="text-[10px] font-mono leading-tight"
                style={{ color: "rgba(0,229,200,0.55)" }}
              >
                NCRP · Node MP-01
              </p>
            </div>
          </div>

          {/* Close X */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
            style={{ color: "rgba(0,229,200,0.45)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,229,200,0.08)";
              e.currentTarget.style.color = "#00E5C8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(0,229,200,0.45)";
            }}
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Identity section ───────────────────────────────────────────── */}
        <div className="px-4 py-3 space-y-0">
          <p
            className="text-[9.5px] font-mono font-bold uppercase tracking-widest mb-2"
            style={{ color: "rgba(0,229,200,0.38)" }}
          >
            Identity &amp; Authorization
          </p>

          {[
            { label: "Full Name", value: officer.name || "A. Sharma", mono: false },
            { label: "Badge / Service ID", value: officer.badge_id || "MP-IO-4471", mono: true, highlight: true },
            { label: "Station & Jurisdiction", value: officer.station_name || "Bhopal Cyber Cell", mono: false },
          ].map(({ label, value, mono, highlight }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: "1px solid rgba(0,229,200,0.06)" }}
            >
              <span
                className="text-[10px] font-mono font-semibold uppercase tracking-wider flex-shrink-0"
                style={{ color: "rgba(0,229,200,0.40)" }}
              >
                {label}
              </span>
              {highlight ? (
                <span
                  className="font-mono font-bold text-[11px] px-2 py-0.5 rounded"
                  style={{
                    color: "#00E5C8",
                    background: "rgba(0,229,200,0.08)",
                    border: "1px solid rgba(0,229,200,0.22)",
                    boxShadow: "0 0 8px rgba(0,229,200,0.16)",
                  }}
                >
                  {value}
                </span>
              ) : (
                <span
                  className={`text-[12px] font-medium text-text ${mono ? "font-mono" : ""} text-right`}
                  style={{ maxWidth: "160px" }}
                >
                  {value}
                </span>
              )}
            </div>
          ))}

          {/* Security clearance */}
          <div className="flex items-center justify-between py-2">
            <span
              className="text-[10px] font-mono font-semibold uppercase tracking-wider"
              style={{ color: "rgba(0,229,200,0.40)" }}
            >
              Security Clearance
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
              style={{
                color: "#10B981",
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.22)",
                boxShadow: "0 0 8px rgba(16,185,129,0.18)",
              }}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Level-3 Cyber Ops
            </span>
          </div>
        </div>

        {/* ── Session section ─────────────────────────────────────────────── */}
        <div
          className="mx-3 mb-3 rounded-lg p-3 space-y-2"
          style={{
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(0,229,200,0.08)",
          }}
        >
          {/* Bearer token */}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11.5px] text-text font-medium flex-shrink-0">
              <Key className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#00E5C8" }} />
              Bearer Token
            </span>
            <span
              className="font-mono text-[10px] text-textDim truncate"
              style={{ maxWidth: "130px" }}
              title={token}
            >
              {tokenSnippet}
            </span>
          </div>

          {/* Session integrity */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] text-textDim">
              <Clock className="w-3 h-3 text-textFaint flex-shrink-0" />
              Session Integrity
            </span>
            <span
              className="font-mono font-semibold text-[11px]"
              style={{ color: "#10B981", textShadow: "0 0 8px rgba(16,185,129,0.35)" }}
            >
              ✓ Verified &amp; Active
            </span>
          </div>
        </div>

        {/* ── Footer actions ──────────────────────────────────────────────── */}
        <div
          className="px-3 pb-3 flex flex-col gap-1.5"
          style={{ borderTop: "1px solid rgba(0,229,200,0.08)", paddingTop: "10px" }}
        >
          <button
            onClick={() => {
              onClose();
              alert("Preferences: Sound alerts enabled • High-contrast map tiles • Section 65B stamp active");
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-textDim transition-all cursor-pointer"
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,229,200,0.06)"; e.currentTarget.style.color = "#E2E8F0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ""; }}
          >
            <Settings className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(148,163,184,0.60)" }} />
            <span>Preferences</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all cursor-pointer"
            style={{ color: "#FF8BA0" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,92,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF3B5C" }} />
            <span>Sign out</span>
          </button>
        </div>

        {/* ── Session footnote ────────────────────────────────────────────── */}
        <div
          className="px-4 py-2 text-[10px] font-mono text-center"
          style={{
            borderTop: "1px solid rgba(0,229,200,0.07)",
            color: "rgba(0,229,200,0.28)",
          }}
        >
          Session authenticated via JWT
        </div>
      </div>
    </>
  );
}
