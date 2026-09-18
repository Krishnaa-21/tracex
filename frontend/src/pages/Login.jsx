import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { apiClient, setToken, setOfficer } from "../api/client";
import Logo from "../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  const [badgeId, setBadgeId] = useState("MP-IO-4471");
  const [password, setPassword] = useState("demo1234");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        if (data.officer) {
          setOfficer(data.officer);
        }
        navigate("/", { replace: true });
      } else {
        throw new Error("Invalid response from authorization server");
      }
    } catch (err) {
      let msg = err.message || "Authentication failed. Check your badge ID and password.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err.name === "TypeError") {
        msg = "Unable to connect to TraceX backend server. Please verify the backend is running on http://localhost:8000.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgSubtle flex flex-col justify-center items-center px-4 py-8 select-none">
      {/* Centered Login Card */}
      <div className="max-w-[380px] w-full bg-bg border border-border rounded-sm p-7">
        {/* Header / Logo */}
        <Logo size="md" className="mb-5 pb-4 border-b border-border" />

        {/* Notice Banner if Error */}
        {error && (
          <div className="mb-4 p-2.5 bg-riskHighBg border border-riskHigh/30 rounded-sm text-riskHigh text-[12px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11.5px] font-medium text-textDim mb-1 uppercase tracking-wider">
              Officer ID / Badge ID
            </label>
            <input
              type="text"
              required
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              placeholder="e.g. MP-IO-4471"
              className="w-full px-3 py-2 text-[13px] font-mono bg-bg border border-border rounded-sm text-text placeholder-textFaint focus:outline-none focus:border-accent focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11.5px] font-medium text-textDim uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure credentials"
              className="w-full px-3 py-2 text-[13px] bg-bg border border-border rounded-sm text-text placeholder-textFaint focus:outline-none focus:border-accent focus:ring-0 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-accent hover:bg-accentHover disabled:opacity-60 text-white rounded-sm text-[13px] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Secure login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Action Links */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-textDim">
          <button
            type="button"
            onClick={() => alert("Please contact your departmental IT administrator to reset credentials.")}
            className="hover:text-text hover:underline transition-colors"
          >
            Forgot password?
          </button>
          <span className="text-borderStrong">•</span>
          <button
            type="button"
            onClick={() => alert("For operations room support, contact State Cyber Cell Desk (Ext 401).")}
            className="hover:text-text hover:underline transition-colors"
          >
            Contact administrator
          </button>
        </div>
      </div>

      {/* Security note below card */}
      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-textFaint">
        <Lock className="w-3 h-3 text-textFaint" />
        <span>Authenticity & session integrity verified</span>
      </div>
    </div>
  );
}
