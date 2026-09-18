import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Shield,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  PhoneCall,
  Landmark,
  FileCode2,
} from "lucide-react";
import { apiClient } from "../api/client";

const SCAM_OPTIONS = [
  {
    id: "digital_scam",
    title: "Digital Scam",
    desc: "UPI fraud, fraudulent loan apps, part-time job & investment tasks",
    icon: Landmark,
  },
  {
    id: "phishing_vishing",
    title: "Phishing / Vishing",
    desc: "SIM swap, fake KYC calls, caller ID spoofing & bank impersonation",
    icon: PhoneCall,
  },
  {
    id: "malicious_apk",
    title: "Malicious APK",
    desc: "Trojanized APKs, SMS forwarders, accessibility service abuse & C2 beacons",
    icon: FileCode2,
  },
];

export default function NewInvestigationModal({ isOpen, onClose, onCaseCreated }) {
  const navigate = useNavigate();

  const [victimName, setVictimName] = useState("");
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scamType, setScamType] = useState("digital_scam");

  const [caseData, setCaseData] = useState(null);
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);
  const [isCorrelating, setIsCorrelating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const fileInputTelecomRef = useRef(null);
  const fileInputBankRef = useRef(null);
  const fileInputOtherRef = useRef(null);

  if (!isOpen) return null;

  // Helper to ensure case exists before uploading
  const ensureCaseCreated = async () => {
    if (caseData) return caseData;
    if (!victimName.trim()) {
      setError("Please enter the victim's name before uploading evidence.");
      return null;
    }

    setIsCreatingCase(true);
    setError(null);
    try {
      const created = await apiClient.post("cases", {
        victim_name: victimName.trim(),
        scam_type: scamType,
      });
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
    setError(null);

    try {
      // Trigger correlation engine
      await apiClient.post(`cases/${caseData.id}/correlate`);
      onClose();
      navigate(`/cases/${caseData.id}/graph`);
    } catch (err) {
      setError(err.message || "Correlation failed. Please check evidence files.");
      setIsCorrelating(false);
    }
  };

  const truncateHash = (hash) => {
    if (!hash || hash.length < 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-lg overflow-hidden my-6 animate-fade-in-up"
        style={{
          background: "rgba(5,9,20,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0,212,255,0.18)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.80), 0 0 40px rgba(0,212,255,0.08)",
        }}
      >
        {/* Modal Header */}
        <div
          className="h-14 px-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.12)", background: "rgba(0,212,255,0.04)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #007FA8, #5B16C0)",
                boxShadow: "0 0 12px rgba(0,212,255,0.30)",
              }}
            >
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-text leading-tight font-display">
                New Cyber Fraud Investigation
              </h2>
              <p className="text-[11px] font-mono leading-tight" style={{ color: "rgba(0,212,255,0.50)" }}>
                Register incident &amp; ingest multi-source evidence artifacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer"
            style={{ color: "rgba(0,212,255,0.50)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,255,0.08)"; e.currentTarget.style.color = "#00D4FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(0,212,255,0.50)"; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div
              className="p-3 text-[12px] flex items-start gap-2.5 rounded animate-fade-in-up"
              style={{ background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.28)", color: "#FF8BA0" }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#FF3B5C" }} />
              <span>{error}</span>
            </div>
          )}

          {caseData && (
            <div
              className="p-3 text-[12px] flex items-center justify-between rounded animate-fade-in-up"
              style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}
            >
              <span className="font-medium">
                Case active:{" "}
                <strong className="font-mono font-bold" style={{ textShadow: "0 0 8px rgba(0,212,255,0.40)" }}>{caseData.case_number}</strong> — {caseData.victim_name}
              </span>
              <span
                className="text-[10px] uppercase font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(0,0,0,0.30)", border: "1px solid rgba(0,212,255,0.25)" }}
              >
                Ready for ingestion
              </span>
            </div>
          )}

          {/* Victim Name & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10.5px] font-mono font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.60)" }}>
                Victim's Full Name *
              </label>
              <input
                type="text"
                required
                disabled={!!caseData}
                value={victimName}
                onChange={(e) => setVictimName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3.5 py-2.5 text-[13px] rounded transition-all"
                style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(0,212,255,0.18)", color: "#E2E8F0", outline: "none" }}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(0,212,255,0.55)"; e.target.style.boxShadow = "0 0 12px rgba(0,212,255,0.15)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(0,212,255,0.18)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-mono font-semibold mb-1.5 uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.60)" }}>
                Date of Case Registration
              </label>
              <input
                type="date"
                disabled={!!caseData}
                value={regDate}
                onChange={(e) => setRegDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13px] rounded font-mono transition-all"
                style={{ background: "rgba(0,0,0,0.40)", border: "1px solid rgba(0,212,255,0.18)", color: "#E2E8F0", outline: "none", colorScheme: "dark" }}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(0,212,255,0.55)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(0,212,255,0.18)"; }}
              />
            </div>
          </div>

          {/* Scam Type Selector */}
          <div>
            <label className="block text-[10.5px] font-mono font-semibold mb-2 uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.60)" }}>
              Scam Type Classification *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SCAM_OPTIONS.map((opt) => {
                const isSelected = scamType === opt.id;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => { if (!caseData) setScamType(opt.id); }}
                    className="p-3 rounded text-left cursor-pointer transition-all"
                    style={{
                      background: isSelected ? "rgba(0,212,255,0.10)" : "rgba(0,0,0,0.20)",
                      border: isSelected ? "1px solid rgba(0,212,255,0.45)" : "1px solid rgba(0,212,255,0.10)",
                      boxShadow: isSelected ? "0 0 14px rgba(0,212,255,0.18)" : "none",
                      opacity: caseData ? 0.7 : 1,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4" style={{ color: isSelected ? "#00D4FF" : "rgba(148,163,184,0.60)" }} />
                      <span className="text-[12.5px] font-semibold" style={{ color: isSelected ? "#00D4FF" : "#E2E8F0" }}>{opt.title}</span>
                    </div>
                    <p className="text-[11px] leading-snug line-clamp-2 text-textDim">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Three Upload Zones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10.5px] font-mono font-semibold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.60)" }}>
                Ingest Evidence Files
              </label>
              <span className="text-[11px] font-mono" style={{ color: "rgba(0,212,255,0.35)" }}>
                CSV, XLSX, IPDR, CDR, Forensic Logs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { ref: fileInputTelecomRef, category: "telecom", Icon: PhoneCall, label: "Telecom Evidence", sub: "CDR, IPDR, Cell Tower", accept: ".csv,.xlsx,.xls,.txt,.log" },
                { ref: fileInputBankRef, category: "bank_upi", Icon: Landmark, label: "Bank & UPI Evidence", sub: "Statements, UPI Handles", accept: ".csv,.xlsx,.xls,.txt,.log" },
                { ref: fileInputOtherRef, category: "other", Icon: FileSpreadsheet, label: "Other Artifacts", sub: "APK Report, Intel, URLs", accept: ".csv,.xlsx,.xls,.txt,.log,.json" },
              ].map(({ ref, category, Icon, label, sub, accept }) => (
                <div
                  key={category}
                  onClick={() => ref.current?.click()}
                  className="p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center rounded"
                  style={{
                    border: `1px dashed ${uploadingCategory === category ? "rgba(0,212,255,0.60)" : "rgba(0,212,255,0.18)"}`,
                    background: uploadingCategory === category ? "rgba(0,212,255,0.06)" : "rgba(0,0,0,0.20)",
                    minHeight: "95px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.45)"; e.currentTarget.style.background = "rgba(0,212,255,0.05)"; e.currentTarget.style.boxShadow = "0 0 14px rgba(0,212,255,0.10)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.18)"; e.currentTarget.style.background = "rgba(0,0,0,0.20)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <input type="file" ref={ref} className="hidden" accept={accept} onChange={(e) => handleFileUpload(e, category)} />
                  <Icon className="w-5 h-5 mb-2" style={{ color: uploadingCategory === category ? "#00D4FF" : "rgba(0,212,255,0.45)" }} />
                  <span className="text-[12px] font-semibold text-text">{label}</span>
                  <span className="text-[10px] mt-0.5 font-mono" style={{ color: "rgba(0,212,255,0.40)" }}>
                    {uploadingCategory === category ? "⟳ Ingesting..." : sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Table Live Status */}
          {uploadedFiles.length > 0 && (
            <div>
              <div className="text-[10.5px] font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(0,212,255,0.50)" }}>
                Ingested Artifacts ({uploadedFiles.length})
              </div>
              <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(0,212,255,0.12)" }}>
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead style={{ background: "rgba(0,212,255,0.04)", borderBottom: "1px solid rgba(0,212,255,0.10)" }}>
                    <tr>
                      {["Filename", "Category", "Rows", "SHA-256", "Status"].map((h) => (
                        <th key={h} className="py-2 px-3 text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.45)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="py-2 px-3 font-mono font-medium truncate max-w-[130px]" style={{ color: "#00D4FF" }}>{f.filename}</td>
                        <td className="py-2 px-3 text-textDim capitalize">{f.category}</td>
                        <td className="py-2 px-3 font-mono text-text">{f.rowCount ?? "—"}</td>
                        <td className="py-2 px-3 font-mono text-[11px]" style={{ color: "rgba(0,212,255,0.50)" }}>{truncateHash(f.sha256)}</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className="inline-flex items-center gap-1 text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: "#10B981", background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.22)", boxShadow: "0 0 6px rgba(16,185,129,0.25)" }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Indexed</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="h-14 px-5 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(0,212,255,0.10)", background: "rgba(0,0,0,0.20)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-[12.5px] font-medium rounded transition-all cursor-pointer"
            style={{ color: "rgba(0,212,255,0.50)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,255,0.06)"; e.currentTarget.style.color = "#00D4FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(0,212,255,0.50)"; }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!caseData || isCorrelating}
            onClick={handleCorrelateAndOpen}
            className="px-4 py-2 text-white rounded text-[12.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #007FA8 0%, #004F80 100%)",
              border: "1px solid rgba(0,212,255,0.40)",
              boxShadow: "0 0 16px rgba(0,212,255,0.18)",
            }}
            onMouseEnter={(e) => { if (!isCorrelating) e.currentTarget.style.boxShadow = "0 0 28px rgba(0,212,255,0.40)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 16px rgba(0,212,255,0.18)"; }}
          >
            {isCorrelating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Correlating entities...</span>
              </>
            ) : (
              <>
                <span>Find connections &amp; view graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
