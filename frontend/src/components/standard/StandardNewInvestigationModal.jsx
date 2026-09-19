import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import { Notice, StatusBadge, EVIDENCE_CATEGORY_LABELS } from "./StandardUI";

const SCAM_OPTIONS = [
  { id: "digital_scam", title: "Digital Scam", desc: "UPI fraud, fraudulent loan apps, part-time job and investment tasks" },
  { id: "phishing_vishing", title: "Phishing / Vishing", desc: "SIM swap, fake KYC calls, caller ID spoofing and bank impersonation" },
  { id: "malicious_apk", title: "Malicious APK", desc: "Trojanized APKs, SMS forwarders, accessibility service abuse and C2 beacons" },
];

const UPLOAD_ZONES = [
  { category: "telecom", label: "Telecom Evidence", sub: "CDR, IPDR, cell tower records", accept: ".csv,.xlsx,.xls,.txt,.log" },
  { category: "bank_upi", label: "Bank & UPI Evidence", sub: "Statements, UPI handles", accept: ".csv,.xlsx,.xls,.txt,.log" },
  { category: "other", label: "Other Artifacts", sub: "APK report, intelligence, URLs", accept: ".csv,.xlsx,.xls,.txt,.log,.json" },
];

/**
 * Standard Mode "Register New Case" dialog.
 * Same API calls, sequence and navigation as the Analysis Mode modal
 * (create case → upload evidence → correlate → open graph) — presentation only.
 */
export default function StandardNewInvestigationModal({ isOpen, onClose, onCaseCreated }) {
  const navigate = useNavigate();

  const [victimName, setVictimName] = useState("");
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scamType, setScamType] = useState("digital_scam");

  const [caseData, setCaseData] = useState(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 1: extract, 2: correlate, 3: render
  const [progressPercent, setProgressPercent] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const fileRefs = { telecom: useRef(null), bank_upi: useRef(null), other: useRef(null) };
  const nameRef = useRef(null);

  // Focus the first field when the dialog opens.
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Keyboard: Escape closes (unless the correlation pipeline is running).
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !isCorrelating) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isCorrelating, onClose]);

  if (!isOpen) return null;

  const ensureCaseCreated = async () => {
    if (caseData) return caseData;
    if (!victimName.trim()) {
      setError("Please enter the victim's name before uploading evidence.");
      return null;
    }
    setIsCreatingCase(true);
    setError(null);
    try {
      const created = await apiClient.post("cases", { victim_name: victimName.trim(), scam_type: scamType });
      setCaseData(created);
      if (onCaseCreated) onCaseCreated(created);
      return created;
    } catch (err) {
      setError(err.message || "Failed to initialize case.");
      return null;
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleFileUpload = async (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const activeCase = await ensureCaseCreated();
    if (!activeCase) {
      e.target.value = "";
      return;
    }

    setUploadingCategory(category);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("evidence_category", category);

    try {
      const res = await apiClient.post(`cases/${activeCase.id}/evidence`, formData);
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: res.id,
          filename: res.original_filename,
          category: res.evidence_category,
          rowCount: res.row_count,
          sha256: res.sha256_hash,
          status: res.upload_status || "queued",
        },
      ]);
    } catch (err) {
      setError(err.message || `Failed to upload ${file.name}`);
    } finally {
      setUploadingCategory(null);
      e.target.value = "";
    }
  };

  const handleCorrelateAndOpen = async () => {
    if (!caseData) {
      setError("Please create a case and upload evidence first.");
      return;
    }

    setIsCorrelating(true);
    setProgressStep(1);
    setProgressPercent(20);
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 180));
      setProgressStep(2);
      setProgressPercent(60);

      const res = await apiClient.post(`cases/${caseData.id}/correlate`);

      setProgressStep(3);
      setProgressPercent(100);
      await new Promise((r) => setTimeout(r, 220));

      onClose();
      navigate(`/cases/${caseData.id}/graph`, {
        state: { preloadedGraph: res?.graph, recordsByCategory: res?.records_by_category },
      });
    } catch (err) {
      setError(err.message || "Correlation failed. Please check evidence files.");
      setIsCorrelating(false);
      setProgressStep(0);
      setProgressPercent(0);
    }
  };

  const truncateHash = (hash) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.substring(0, 8)}…${hash.substring(hash.length - 6)}`;
  };

  const stepState = (n) => (progressStep > n ? "done" : progressStep === n ? "active" : "pending");

  return (
    <div className="std-overlay">
      <div className="std-modal" role="dialog" aria-modal="true" aria-labelledby="std-newcase-title">
        <div className="std-modal__head">
          <div>
            <h2 id="std-newcase-title">Register New Case</h2>
            <p>Register the incident and ingest multi-source evidence artifacts</p>
          </div>
          <button type="button" className="std-modal__close" onClick={onClose} disabled={isCorrelating}>
            Close
          </button>
        </div>

        <div className="std-modal__body">
          {error && (
            <Notice tone="danger" inline title="Unable to proceed">
              {error}
            </Notice>
          )}

          {caseData && (
            <Notice tone="success" inline title="Case registered">
              Case <strong className="std-mono">{caseData.case_number}</strong> — {caseData.victim_name}. Ready for evidence ingestion.
            </Notice>
          )}

          <div className="grid gap-x-4 sm:grid-cols-2">
            <div className="std-field">
              <label className="std-label" htmlFor="std-victim-name">
                Victim&apos;s Full Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="std-victim-name"
                ref={nameRef}
                type="text"
                required
                aria-required="true"
                className="std-input"
                disabled={!!caseData}
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div className="std-field">
              <label className="std-label" htmlFor="std-reg-date">Date of Case Registration</label>
              <input
                id="std-reg-date"
                type="date"
                className="std-input std-mono"
                disabled={!!caseData}
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="std-fieldset" disabled={!!caseData}>
            <legend>Scam Type Classification *</legend>
            {SCAM_OPTIONS.map((opt) => (
              <label key={opt.id} className="std-radio">
                <input
                  type="radio"
                  name="std-scam-type"
                  value={opt.id}
                  checked={scamType === opt.id}
                  onChange={() => setScamType(opt.id)}
                />
                <div>
                  <strong>{opt.title}</strong>
                  <span>{opt.desc}</span>
                </div>
              </label>
            ))}
          </fieldset>

          <fieldset className="std-fieldset">
            <legend>Ingest Evidence Files</legend>
            <p className="std-hint" style={{ marginTop: 0, marginBottom: "0.6rem" }}>
              Accepted formats: CSV, XLSX, IPDR, CDR, forensic logs. Enter the victim&apos;s name first; the case is created on the first upload.
            </p>
            <div className="std-upload">
              {UPLOAD_ZONES.map((zone) => {
                const busy = uploadingCategory === zone.category;
                return (
                  <div key={zone.category} className="std-upload__item">
                    <strong>{zone.label}</strong>
                    <span>{zone.sub}</span>
                    <input
                      type="file"
                      ref={fileRefs[zone.category]}
                      className="std-visually-hidden"
                      tabIndex={-1}
                      aria-hidden="true"
                      accept={zone.accept}
                      onChange={(e) => handleFileUpload(e, zone.category)}
                    />
                    <button
                      type="button"
                      className="std-btn std-btn--secondary std-btn--sm"
                      disabled={busy || isCreatingCase || isCorrelating}
                      onClick={() => fileRefs[zone.category].current?.click()}
                    >
                      {busy ? "Ingesting…" : "Choose file"}
                    </button>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {uploadedFiles.length > 0 && (
            <div className="std-field">
              <p className="std-label">Ingested Artifacts ({uploadedFiles.length})</p>
              <div className="std-table-wrap">
                <table className="std-table">
                  <caption className="std-visually-hidden">Ingested evidence artifacts</caption>
                  <thead>
                    <tr>
                      <th scope="col">File Name</th>
                      <th scope="col">Category</th>
                      <th scope="col" className="num">Rows</th>
                      <th scope="col">SHA-256</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((f, i) => (
                      <tr key={f.id ?? i}>
                        <td className="std-mono" style={{ wordBreak: "break-all" }}>{f.filename}</td>
                        <td>{EVIDENCE_CATEGORY_LABELS[f.category] || f.category}</td>
                        <td className="num">{f.rowCount ?? "—"}</td>
                        <td className="std-mono" title={f.sha256}>{truncateHash(f.sha256)}</td>
                        <td><StatusBadge tone="low">Indexed</StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isCorrelating && (
            <div role="status" aria-live="polite">
              <p className="std-label">
                Processing forensic correlation pipeline — {progressPercent}%
              </p>
              <div className="std-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <ol className="std-steps">
                <li data-state={stepState(1)}>1. Extracting entities</li>
                <li data-state={stepState(2)}>2. Building connections</li>
                <li data-state={stepState(3)}>3. Rendering graph</li>
              </ol>
            </div>
          )}
        </div>

        <div className="std-modal__foot">
          <button type="button" className="std-btn std-btn--secondary" onClick={onClose} disabled={isCorrelating}>
            Cancel
          </button>
          <button type="button" className="std-btn" disabled={!caseData || isCorrelating} onClick={handleCorrelateAndOpen}>
            {isCorrelating ? "Correlating entities…" : "Find connections & view graph"}
          </button>
        </div>
      </div>
    </div>
  );
}
