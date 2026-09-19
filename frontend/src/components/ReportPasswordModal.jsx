import React, { useState, useEffect, useRef } from "react";
import { Lock, Shield, Eye, EyeOff, X, AlertCircle, FileText, Download, Loader2 } from "lucide-react";

export default function ReportPasswordModal({
  isOpen,
  onClose,
  reportType = "brief",
  caseNumber = "",
  onConfirm,
  isGenerating = false,
  error = null,
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setLocalError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError("Please enter your officer account password.");
      return;
    }
    setLocalError(null);
    onConfirm(password);
  };

  const reportTitle =
    reportType === "takedown"
      ? "Statutory Takedown Notice (Sec 69A IT Act)"
      : "Certified Investigative Brief Dossier";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden animate-fade-in-up"
        style={{
          background: "var(--panel-solid, #0B1224)",
          border: "1px solid var(--line-strong, rgba(0,212,255,0.25))",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,212,255,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            borderBottom: "1px solid var(--line, rgba(0,212,255,0.15))",
            background: "var(--signal-soft, rgba(0,212,255,0.05))",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #007FA8 0%, #004F80 100%)",
                boxShadow: "0 0 12px rgba(0,212,255,0.3)",
              }}
            >
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text leading-tight">
                Protected Document Export
              </h3>
              <p className="text-[11px] text-textDim leading-tight">
                File-Level Password Encryption
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-textDim hover:text-text transition-colors p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div
            className="p-3 rounded text-[12px] space-y-1"
            style={{
              background: "var(--panel-sunken, rgba(6,10,24,0.6))",
              border: "1px solid var(--line-subtle, rgba(255,255,255,0.06))",
            }}
          >
            <div className="flex items-center gap-2 text-text font-medium">
              <FileText className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>{reportTitle}</span>
            </div>
            <div className="text-textDim font-mono text-[11px] pl-5">
              Case Ref: <strong className="text-accent">{caseNumber}</strong>
            </div>
          </div>

          <p className="text-[12px] text-textDim leading-relaxed">
            In compliance with statutory evidentiary chain-of-custody protocols, this downloaded PDF will be <strong>password-protected at the file level</strong>. Enter your current officer login password to authorize encryption.
          </p>

          {(localError || error) && (
            <div
              className="p-3 rounded text-[12px] flex items-start gap-2 animate-fade-in-up"
              style={{
                background: "rgba(255,59,92,0.1)",
                border: "1px solid rgba(255,59,92,0.3)",
                color: "#FF8BA0",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#FF3B5C" }} />
              <span>{localError || error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="report-officer-password"
              className="text-[11.5px] font-medium text-textDim flex items-center justify-between"
            >
              <span>Officer Account Password</span>
              <span className="text-[10px] text-accent font-mono">Required to open PDF</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="report-officer-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isGenerating}
                placeholder="Enter your login password..."
                className="w-full pl-3 pr-10 py-2 text-[13px] font-mono rounded transition-all"
                style={{
                  background: "var(--paper, #05070D)",
                  border: "1px solid var(--line-strong, rgba(0,212,255,0.3))",
                  color: "var(--ink, #E2E8F0)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textDim hover:text-text cursor-pointer p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10.5px] text-textDim">
              The recipient will be prompted to enter this exact password when opening the file.
            </p>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3 py-1.5 text-[12.5px] rounded font-medium text-textDim hover:text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !password.trim()}
              className="px-4 py-2 text-white rounded text-[12.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #007FA8 0%, #004F80 100%)",
                border: "1px solid rgba(0,212,255,0.40)",
                boxShadow: "0 0 14px rgba(0,212,255,0.2)",
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Encrypting &amp; Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Encrypted PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
