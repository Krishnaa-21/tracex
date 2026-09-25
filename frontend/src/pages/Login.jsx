import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, ArrowRight, Loader2, Shield, Eye, HelpCircle, CheckCircle } from "lucide-react";
import { apiClient, setToken, setOfficer } from "../api/client";
import BetaTag from "../components/BetaTag";
import { useMode } from "../context/ModeContext";
import Logo from "../components/Logo";

/** Floating orb background element */
function GlowOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />;
}

/** Animated circuit-board line */
function CircuitLine({ style }) {
  return (
    <div
      className="absolute opacity-10 pointer-events-none"
      style={{
        width: "1px",
        background: "linear-gradient(180deg, transparent, #00D4FF, transparent)",
        ...style,
      }}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { mode, setMode } = useMode ? useMode() : { mode: "standard", setMode: () => {} };
  const isStandardMode = mode === "standard";

  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bootText, setBootText] = useState("");
  const [topAlert, setTopAlert] = useState(null);

  // Boot sequence text animation for Analysis Mode
  useEffect(() => {
    if (isStandardMode) return;
    const lines = [
      "TRACEX INTELLIGENCE CORE v2.4.1",
      "Initializing secure enclave...",
      "Cryptographic handshake: OK",
      "Awaiting officer credentials...",
    ];
    let i = 0;
    let charIdx = 0;
    let current = "";
    const interval = setInterval(() => {
      if (i >= lines.length) {
        clearInterval(interval);
        return;
      }
      if (charIdx < lines[i].length) {
        current += lines[i][charIdx];
        setBootText(current);
        charIdx++;
      } else {
        current += "\n";
        i++;
        charIdx = 0;
      }
    }, 28);
    return () => clearInterval(interval);
  }, [isStandardMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!badgeId.trim() || !password.trim()) {
      setError("Please enter your Officer ID and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.post("auth/login", {
        badge_id: badgeId.trim(),
        password: password.trim(),
      });

      if (data.access_token) {
        setToken(data.access_token);
        if (data.officer) setOfficer(data.officer);
        navigate("/", { replace: true });
      } else {
        throw new Error("Invalid response from authorization server");
      }
    } catch (err) {
      let msg = err.message || "Authentication failed. Check your badge ID and password.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err.name === "TypeError") {
        msg = "Unable to connect to TraceX backend. Please verify the server is running on localhost:8000.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     STANDARD MODE: Formal Government Portal / Law-Enforcement Aesthetic
  ────────────────────────────────────────────────────────────────────────── */
  if (isStandardMode) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-between text-[#0F172A] font-sans antialiased relative">
        {/* Top notification popup */}
        {topAlert && (
          <div
            role="alert"
            style={{
              position: "fixed",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              width: "min(92vw, 540px)",
              backgroundColor: "#FFFFFF",
              border: "2px solid #0B3B60",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(11, 42, 69, 0.25)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              animation: "fadeIn 0.2s ease-in-out",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#E6F0FA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#0B3B60",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              ℹ
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#0B3B60" }}>
                {topAlert.title}
              </h3>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: "1.5" }}>
                {topAlert.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTopAlert(null)}
              style={{
                background: "none",
                border: "none",
                color: "#64748B",
                fontSize: "18px",
                cursor: "pointer",
                padding: "4px",
                lineHeight: 1,
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Government Strip with Tricolor Accent */}
        <header className="w-full bg-white border-b border-[#CBD5E1] shadow-xs">
          {/* Indian Tricolor Bar */}
          <div className="h-1 w-full flex">
            <div className="h-full w-1/3 bg-[#FF9933]" />
            <div className="h-full w-1/3 bg-white" />
            <div className="h-full w-1/3 bg-[#128807]" />
          </div>

          {/* Ministry & Top Navigation Bar */}
          <div className="bg-[#0B3B60] text-white px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="font-bold">भारत सरकार | गृह मंत्रालय</span>
              <span className="text-white/40">|</span>
              <span className="text-white/90">Government of India — Ministry of Home Affairs</span>
            </div>

            {/* Mode Switcher Pill */}
            <div className="flex items-center bg-[#07263F] p-0.5 rounded-full border border-white/20 shadow-xs">
              <button
                type="button"
                onClick={() => setMode("standard")}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#0B3B60] shadow-xs cursor-pointer flex flex-col items-center leading-tight"
              >
                <span>🏛️ Standard Mode</span>
                <BetaTag tone="onLight" size="0.5rem" />
              </button>
              <button
                type="button"
                onClick={() => setMode("analysis")}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/80 hover:text-white cursor-pointer"
              >
                ⚡ Analysis Mode
              </button>
            </div>
          </div>

          {/* Department Seal & Portal Identity */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full border-2 border-[#0B3B60] bg-[#F8FAFC] flex items-center justify-center p-1 shadow-xs flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#0B3B60]" fill="currentColor">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path d="M50 12 L58 30 L78 30 L62 42 L68 62 L50 50 L32 62 L38 42 L22 30 L42 30 Z" fill="#B45309" />
                  <rect x="35" y="66" width="30" height="6" rx="2" fill="currentColor" />
                  <rect x="25" y="74" width="50" height="5" rx="1.5" fill="#0B3B60" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#B45309] font-serif tracking-wider uppercase">
                  National Cyber Crime Investigation &amp; Coordination Centre (I4C)
                </div>
                <div className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
                  TraceX Law Enforcement Operations Portal
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11.5px] text-[#475569] font-mono">
              <Shield className="w-4 h-4 text-[#0B3B60]" />
              <span>Section 65B Certified Forensic Gateway</span>
            </div>
          </div>
        </header>

        {/* Center Main Card Container */}
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-lg shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#0B3B60] text-white px-6 py-4 flex items-center justify-between border-b border-[#082C48]">
              <div>
                <div className="text-[11px] font-mono text-yellow-400 font-bold uppercase tracking-wider">
                  Secure Nodal Access
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Investigating Officer Authentication
                </h2>
              </div>
              <Lock className="w-5 h-5 text-white/70" />
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Statutory Notice */}
              <div className="bg-[#F8FAFC] border-l-4 border-[#0B3B60] p-3 text-[11.5px] text-[#334155] rounded-r leading-relaxed">
                <p className="font-semibold text-[#0B3B60] mb-0.5">RESTRICTED GOVERNMENT REPOSITORY</p>
                <p>
                  Unauthorized access or data exfiltration is strictly prohibited and punishable under Sections 43 &amp; 66 of the Information Technology Act 2000. All terminal sessions are cryptographically signed and logged.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="p-3 text-[12px] bg-red-50 border border-red-200 text-red-700 rounded flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-badge-id"
                    className="block text-[11.5px] font-bold text-[#334155] mb-1.5 uppercase tracking-wide"
                  >
                    Officer Identifier / Badge ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="login-badge-id"
                    type="text"
                    required
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="Enter Officer / Badge ID"
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#CBD5E1] rounded text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] outline-none transition-all font-mono"
                  />
                  <span className="text-[10px] text-[#64748B] mt-1 block">
                    Assigned nodal officer credential (e.g. Bhopal Cyber Cell)
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-[11.5px] font-bold text-[#334155] mb-1.5 uppercase tracking-wide"
                  >
                    Access Security Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#CBD5E1] rounded text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] outline-none transition-all"
                  />
                </div>

                {/* Submit button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-[#0B3B60] hover:bg-[#07263F] text-white text-[13px] font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Verify &amp; Enter Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Support & Admin Links */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11.5px] text-[#0B3B60]">
                <button
                  type="button"
                  onClick={() => setTopAlert({
                    title: "Password Reset Request",
                    message: "Please contact your System Administrator to reset your password. Provide your Officer Badge ID and nodal station credentials for verification.",
                  })}
                  className="hover:underline cursor-pointer"
                >
                  Forgot Credentials?
                </button>
                <span className="text-[#CBD5E1]">•</span>
                <button
                  type="button"
                  onClick={() => setTopAlert({
                    title: "Contact System Administrator",
                    message: "Emergency Helpline: 1930 | Operational Desk: nodal@cybercrime.gov.in | Station Extension: 401.",
                  })}
                  className="hover:underline cursor-pointer"
                >
                  Contact Nodal Officer
                </button>
              </div>
            </div>

            {/* Bottom Card Ribbon */}
            <div className="bg-[#F8FAFC] border-t border-[#CBD5E1] px-6 py-2.5 flex items-center justify-between text-[10.5px] text-[#64748B]">
              <span>Encryption: TLS 1.3 / AES-256</span>
              <span className="font-mono text-[#0B3B60] font-bold">STATE-DESK-4471</span>
            </div>
          </div>
        </main>

        {/* Minimal Government Footer */}
        <footer className="w-full bg-white border-t border-[#CBD5E1] py-3.5 px-4 sm:px-8 text-center text-[11px] text-[#64748B]">
          <p>
            © 2026 National Cybercrime Coordination Centre (I4C) | Ministry of Home Affairs, Government of India.
          </p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">
            Compliant with Bharatiya Nyaya Sanhita (BNS) 2023 &amp; IT (Intermediary Guidelines) Rules.
          </p>
        </footer>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────────────
     ANALYSIS MODE: Original Cyberpunk / Dark SOC Aesthetic (Preserved 100%)
  ────────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-8 overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #03050C 0%, #070B17 50%, #05070F 100%)" }}
    >
      {/* Top popup notification in Analysis Mode */}
      {topAlert && (
        <div
          role="alert"
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "min(92vw, 520px)",
            backgroundColor: "rgba(8, 14, 28, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 212, 255, 0.6)",
            borderRadius: "10px",
            boxShadow: "0 0 35px rgba(0, 212, 255, 0.25), 0 10px 40px rgba(0, 0, 0, 0.8)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 212, 255, 0.12)",
              border: "1px solid rgba(0, 212, 255, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#00D4FF",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            🛡️
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#00D4FF", fontFamily: "var(--font-mono, monospace)" }}>
              {topAlert.title}
            </h3>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#CBD5E1", lineHeight: "1.5" }}>
              {topAlert.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTopAlert(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(0, 212, 255, 0.6)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
              lineHeight: 1,
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {/* Top right Mode Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center bg-[#07263F]/80 p-0.5 rounded-full border border-cyan-500/30 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMode("standard")}
          className="px-3 py-1 rounded-full text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer flex flex-col items-center leading-tight"
        >
          <span>🏛️ Standard Mode</span>
          <BetaTag tone="onDark" size="0.5rem" />
        </button>
        <button
          type="button"
          onClick={() => setMode("analysis")}
          className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#00D4FF] text-[#05070D] shadow-sm cursor-pointer"
        >
          ⚡ Analysis Mode
        </button>
      </div>

      {/* Animated background glow orbs */}
      <GlowOrb className="w-[500px] h-[500px] bg-cyan-500 top-[-120px] left-[-80px]" />
      <GlowOrb className="w-[400px] h-[400px] bg-violet-600 bottom-[-100px] right-[-80px]" />
      <GlowOrb className="w-[300px] h-[300px] bg-blue-600 top-[40%] right-[10%]" style={{ opacity: 0.08 }} />

      {/* Circuit board line decorations */}
      <CircuitLine style={{ height: "60%", top: "20%", left: "15%" }} />
      <CircuitLine style={{ height: "40%", top: "10%", right: "20%" }} />
      <CircuitLine style={{ height: "50%", bottom: "5%", left: "40%" }} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Scanning line animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)",
            animation: "scan-line 4s linear infinite",
            top: "0",
          }}
        />
      </div>

      {/* Main login card */}
      <div
        className="relative max-w-[400px] w-full animate-fade-in-up"
        style={{
          background: "rgba(8,14,28,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,212,255,0.20)",
          borderRadius: "8px",
          boxShadow: "0 0 60px rgba(0,0,0,0.80), 0 0 30px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.12)",
          padding: "32px",
        }}
      >
        {/* Top corner accent lines */}
        <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-px bg-signal" />
          <div className="absolute top-0 left-0 w-px h-full bg-signal" />
        </div>
        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-px bg-signal" />
          <div className="absolute top-0 right-0 w-px h-full bg-signal" />
        </div>
        <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-full h-px" style={{ background: "rgba(139,92,246,0.6)" }} />
          <div className="absolute bottom-0 left-0 w-px h-full" style={{ background: "rgba(139,92,246,0.6)" }} />
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-full h-px" style={{ background: "rgba(139,92,246,0.6)" }} />
          <div className="absolute bottom-0 right-0 w-px h-full" style={{ background: "rgba(139,92,246,0.6)" }} />
        </div>

        {/* Logo — full wordmark logo image, no duplicate text */}
        <div className="flex flex-col items-center mb-6">
          <Logo variant="logo" size="lg" showSubtitle={true} />
        </div>

        {/* Boot terminal mini display */}
        <div
          className="mb-5 p-3 rounded text-[10px] font-mono leading-relaxed"
          style={{
            background: "rgba(0,0,0,0.50)",
            border: "1px solid rgba(0,212,255,0.10)",
            color: "rgba(0,212,255,0.65)",
            minHeight: "56px",
            whiteSpace: "pre-wrap",
          }}
        >
          {bootText}
          <span className="animate-data-blink">_</span>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 p-3 text-[12px] flex items-start gap-2.5 rounded animate-fade-in-up"
            style={{
              background: "rgba(255,59,92,0.10)",
              border: "1px solid rgba(255,59,92,0.30)",
              color: "#FF8BA0",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10.5px] font-mono font-medium mb-1.5 tracking-widest uppercase" style={{ color: "rgba(0,212,255,0.70)" }}>
              Officer Badge ID
            </label>
            <input
              id="login-badge-id"
              type="text"
              required
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              placeholder="Enter Officer Badge ID"
              className="w-full px-3.5 py-2.5 text-[13px] font-mono rounded transition-all"
              style={{
                background: "rgba(0,0,0,0.50)",
                border: "1px solid rgba(0,212,255,0.20)",
                color: "#E2E8F0",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(0,212,255,0.60)";
                e.target.style.boxShadow = "0 0 12px rgba(0,212,255,0.20)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(0,212,255,0.20)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-mono font-medium mb-1.5 tracking-widest uppercase" style={{ color: "rgba(0,212,255,0.70)" }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure credentials"
              className="w-full px-3.5 py-2.5 text-[13px] rounded transition-all"
              style={{
                background: "rgba(0,0,0,0.50)",
                border: "1px solid rgba(0,212,255,0.20)",
                color: "#E2E8F0",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(0,212,255,0.60)";
                e.target.style.boxShadow = "0 0 12px rgba(0,212,255,0.20)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(0,212,255,0.20)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Submit button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 text-[13px] font-semibold font-display rounded flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
            style={{
              background: isLoading
                ? "rgba(0,80,120,0.50)"
                : "linear-gradient(135deg, #0099CC 0%, #005FA0 100%)",
              border: "1px solid rgba(0,212,255,0.50)",
              color: "#fff",
              boxShadow: isLoading ? "none" : "0 0 20px rgba(0,212,255,0.25)",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.boxShadow = "0 0 30px rgba(0,212,255,0.50)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0,212,255,0.25)";
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Secure Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 pt-4 flex items-center justify-between text-[11px]" style={{ borderTop: "1px solid rgba(0,212,255,0.10)" }}>
          <button
            type="button"
            id="login-forgot-password-btn"
            onClick={() => setTopAlert({
              title: "Password Reset Request",
              message: "Please contact your System Administrator to reset your password. Provide your Officer Badge ID and nodal station credentials for verification.",
            })}
            className="transition-colors hover:underline cursor-pointer"
            style={{ color: "rgba(0,212,255,0.70)" }}
            onMouseEnter={(e) => (e.target.style.color = "#00D4FF")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(0,212,255,0.70)")}
          >
            Forgot password?
          </button>
          <span style={{ color: "rgba(0,212,255,0.20)" }}>•</span>
          <button
            type="button"
            onClick={() => setTopAlert({
              title: "Contact System Administrator",
              message: "For operations room assistance or password recovery, contact State Cyber Cell Desk (Ext 401) or email admin@cybercrime.gov.in.",
            })}
            className="transition-colors hover:underline cursor-pointer"
            style={{ color: "rgba(0,212,255,0.70)" }}
            onMouseEnter={(e) => (e.target.style.color = "#00D4FF")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(0,212,255,0.70)")}
          >
            Contact administrator
          </button>
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 flex items-center gap-2 text-[10.5px] font-mono" style={{ color: "rgba(0,212,255,0.35)" }}>
        <Lock className="w-3 h-3" />
        <span>End-to-end encrypted · Session integrity verified · SOC-2 compliant</span>
      </div>

      {/* Version tag */}
      <div className="absolute bottom-3 right-4 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.12)" }}>
        TRACEX v2.4.1 · RESTRICTED ACCESS
      </div>
    </div>
  );
}