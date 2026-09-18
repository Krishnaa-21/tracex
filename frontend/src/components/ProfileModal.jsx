import React from "react";
import {
  X,
  BadgeCheck,
  Key,
  Clock,
  LogOut,
  Shield,
} from "lucide-react";
import { getOfficer, getToken, clearAuth } from "../api/client";
import { useNavigate } from "react-router-dom";

/** Glassmorphic field row */
function FieldRow({ label, children }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: "1px solid rgba(0,212,255,0.07)" }}
    >
      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.45)" }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

export default function ProfileModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Operations Room",
  };

  const token = getToken() || "";
  const tokenSnippet = token
    ? `${token.substring(0, 12)}...${token.substring(token.length - 8)}`
    : "None";

  const initials = officer.name ? officer.name.charAt(0).toUpperCase() : "O";

  const handleSignOut = () => {
    clearAuth();
    onClose();
    navigate("/login");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden select-none animate-fade-in-up"
        style={{
          background: "rgba(5,9,20,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0,212,255,0.20)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.80), 0 0 40px rgba(0,212,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            borderBottom: "1px solid rgba(0,212,255,0.12)",
            background: "rgba(0,212,255,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Large avatar with gradient ring */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[16px] font-bold font-display flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #007FA8, #6B21D8)",
                color: "#fff",
                boxShadow: "0 0 16px rgba(0,212,255,0.35)",
              }}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-text leading-tight font-display">
                Officer Security Profile
              </h2>
              <p className="text-[11px] text-textDim leading-tight font-mono">
                NCRP · Node MP-01
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer"
            style={{ color: "rgba(0,212,255,0.50)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,212,255,0.08)";
              e.currentTarget.style.color = "#00D4FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(0,212,255,0.50)";
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-[12.5px]">
          {/* Identity block */}
          <div
            className="rounded-md p-4"
            style={{
              background: "rgba(0,212,255,0.04)",
              border: "1px solid rgba(0,212,255,0.10)",
            }}
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(0,212,255,0.40)" }}>
              Identity & Authorization
            </div>

            <FieldRow label="Full Name">
              <span className="font-semibold text-text text-[12.5px]">{officer.name || "A. Sharma"}</span>
            </FieldRow>

            <FieldRow label="Badge / Service ID">
              <span
                className="font-mono font-bold text-[12px] px-2 py-0.5 rounded"
                style={{
                  color: "#00D4FF",
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.25)",
                  boxShadow: "0 0 8px rgba(0,212,255,0.20)",
                }}
              >
                {officer.badge_id || "MP-IO-4471"}
              </span>
            </FieldRow>

            <FieldRow label="Station & Jurisdiction">
              <span className="font-medium text-text text-[12.5px]">{officer.station_name || "Bhopal Cyber Cell"}</span>
            </FieldRow>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.45)" }}>
                Security Clearance
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
                style={{
                  color: "#10B981",
                  background: "rgba(16,185,129,0.10)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  boxShadow: "0 0 8px rgba(16,185,129,0.25)",
                }}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Level-3 Cyber Ops</span>
              </span>
            </div>
          </div>

          {/* Session integrity */}
          <div
            className="rounded-md p-3.5 space-y-2"
            style={{
              border: "1px solid rgba(0,212,255,0.10)",
              background: "rgba(0,0,0,0.20)",
            }}
          >
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="flex items-center gap-1.5 text-text font-medium">
                <Key className="w-3.5 h-3.5" style={{ color: "#00D4FF" }} />
                Active Bearer Token
              </span>
              <span className="font-mono text-[10.5px] text-textDim">{tokenSnippet}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-textDim">
                <Clock className="w-3 h-3 text-textFaint" />
                Session Integrity
              </span>
              <span className="font-mono font-medium" style={{ color: "#10B981", textShadow: "0 0 8px rgba(16,185,129,0.40)" }}>
                ✓ Verified &amp; Active
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderTop: "1px solid rgba(0,212,255,0.10)",
            background: "rgba(0,0,0,0.20)",
          }}
        >
          <span className="text-[11px] font-mono" style={{ color: "rgba(0,212,255,0.30)" }}>
            Session authenticated via JWT
          </span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-[12px] font-medium rounded flex items-center gap-1.5 transition-all cursor-pointer"
            style={{
              background: "rgba(255,59,92,0.08)",
              border: "1px solid rgba(255,59,92,0.25)",
              color: "#FF8BA0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,59,92,0.15)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(255,59,92,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,59,92,0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: "#FF3B5C" }} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
