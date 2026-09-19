import React, { useState, useEffect, useRef } from "react";
import { Notice } from "./StandardUI";

/**
 * Standard Mode password prompt for encrypted PDF export.
 * Same props and behaviour as ReportPasswordModal — presentation only.
 */
export default function StandardReportPasswordModal({
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

  // Reset and focus the field each time the dialog opens.
  useEffect(() => {
    if (!isOpen) return undefined;
    setPassword("");
    setLocalError(null);
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Keyboard: Escape closes (unless the document is being generated).
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !isGenerating) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isGenerating, onClose]);

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
    reportType === "takedown" ? "Statutory Takedown Notice (Sec 69A IT Act)" : "Certified Investigative Brief Dossier";

  return (
    <div className="std-overlay">
      <div className="std-modal std-modal--sm" role="dialog" aria-modal="true" aria-labelledby="std-pwd-title">
        <div className="std-modal__head">
          <div>
            <h2 id="std-pwd-title">Protected Document Export</h2>
            <p>File-level password encryption</p>
          </div>
          <button type="button" className="std-modal__close" onClick={onClose} disabled={isGenerating}>
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="std-modal__body">
            <table className="std-kv" style={{ marginBottom: "0.9rem" }}>
              <tbody>
                <tr>
                  <th scope="row" style={{ width: "32%" }}>Report</th>
                  <td style={{ width: "68%" }}>{reportTitle}</td>
                </tr>
                <tr>
                  <th scope="row">Case Reference</th>
                  <td className="std-mono">{caseNumber}</td>
                </tr>
              </tbody>
            </table>

            <p style={{ marginTop: 0, fontSize: "0.875rem" }}>
              In compliance with statutory evidentiary chain-of-custody protocols, the downloaded PDF will be{" "}
              <strong>password-protected at the file level</strong>. Enter your current officer login password to authorise encryption.
            </p>

            {(localError || error) && (
              <Notice tone="danger" inline title="Unable to generate the document">
                {localError || error}
              </Notice>
            )}

            <div className="std-field">
              <label className="std-label" htmlFor="report-officer-password">
                Officer Account Password
              </label>
              <input
                ref={inputRef}
                id="report-officer-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="std-input std-mono"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isGenerating}
              />
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", fontSize: "0.8125rem" }}>
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                Show password
              </label>
              <p className="std-hint">The recipient will be prompted for this exact password when opening the file.</p>
            </div>
          </div>

          <div className="std-modal__foot">
            <button type="button" className="std-btn std-btn--secondary" onClick={onClose} disabled={isGenerating}>
              Cancel
            </button>
            <button type="submit" className="std-btn" disabled={isGenerating || !password.trim()}>
              {isGenerating ? "Encrypting & downloading…" : "Download Encrypted PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
