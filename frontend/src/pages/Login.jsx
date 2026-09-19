import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, ArrowRight, Loader2, Shield, Cpu, Activity } from "lucide-react";
import { apiClient, setToken, setOfficer } from "../api/client";
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
  const [badgeId, setBadgeId] = useState("MP-IO-4471");
  const [password, setPassword] = useState("demo1234");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bootText, setBootText] = useState("");

  // Boot sequence text animation
  useEffect(() => {
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
  }, []);

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

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 py-8 overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #03050C 0%, #070B17 50%, #05070F 100%)" }}
    >
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

        {/* Logo & heading — Logo already includes brand name, no duplicate needed */}
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" showSubtitle={true} />
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
              placeholder="e.g. MP-IO-4471"
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
            onClick={() => alert("Please contact your departmental IT administrator to reset credentials.")}
            className="transition-colors hover:underline"
            style={{ color: "rgba(0,212,255,0.50)" }}
            onMouseEnter={(e) => (e.target.style.color = "rgba(0,212,255,0.90)")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(0,212,255,0.50)")}
          >
            Forgot password?
          </button>
          <span style={{ color: "rgba(0,212,255,0.20)" }}>•</span>
          <button
            type="button"
            onClick={() => alert("For operations room support, contact State Cyber Cell Desk (Ext 401).")}
            className="transition-colors hover:underline"
            style={{ color: "rgba(0,212,255,0.50)" }}
            onMouseEnter={(e) => (e.target.style.color = "rgba(0,212,255,0.90)")}
            onMouseLeave={(e) => (e.target.style.color = "rgba(0,212,255,0.50)")}
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
