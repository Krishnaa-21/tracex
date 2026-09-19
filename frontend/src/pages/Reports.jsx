import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  ShieldAlert,
  ArrowLeft,
  Network,
  Download,
  AlertCircle,
  ChevronRight,
  Lock,
} from "lucide-react";
import apiClient from "../api/client";
import ReportPasswordModal from "../components/ReportPasswordModal";
import { useMode } from "../context/ModeContext";

export default function Reports() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { isStandardMode } = useMode();

  const [allCases, setAllCases] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [takedownMatches, setTakedownMatches] = useState({
    url_matches: 0,
    apk_matches: 0,
    total_matches: 0,
  });

  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingTakedown, setIsGeneratingTakedown] = useState(false);
  const [briefHash, setBriefHash] = useState(null);
  const [takedownHash, setTakedownHash] = useState(null);
  const [error, setError] = useState(null);

  // Password-protected report modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [activeReportType, setActiveReportType] = useState("brief");
  const [modalError, setModalError] = useState(null);

  const loadCaseAndMatchData = async () => {
    try {
      const [cRes, mRes, casesRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}`),
        apiClient.get(`cases/${caseId}/reports/takedown-matches`),
        apiClient.get("cases"),
      ]);

      if (cRes.status === "fulfilled" && cRes.value) {
        setCaseData(cRes.value);
      }
      if (mRes.status === "fulfilled" && mRes.value) {
        setTakedownMatches(mRes.value);
      }
      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) {
        setAllCases(casesRes.value);
      }
    } catch (err) {
      console.error("Error loading case report metadata:", err);
    }
  };

  useEffect(() => {
    loadCaseAndMatchData();
  }, [caseId]);

  const cleanCaseNumber = caseData?.case_number?.replace("#", "").trim() || caseId;

  const handleOpenBriefModal = () => {
    setActiveReportType("brief");
    setModalError(null);
    setPasswordModalOpen(true);
  };

  const handleOpenTakedownModal = () => {
    setActiveReportType("takedown");
    setModalError(null);
    setPasswordModalOpen(true);
  };

  const handleConfirmDownload = async (password) => {
    setModalError(null);
    if (activeReportType === "brief") {
      setIsGeneratingBrief(true);
      try {
        const res = await apiClient.post(`cases/${caseId}/reports/investigative-brief`, { password });

        const hash =
          res.headers.get("X-Document-SHA256") ||
          res.headers.get("x-document-sha256");
        if (hash) setBriefHash(hash);

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `investigative_brief_${cleanCaseNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setPasswordModalOpen(false);
      } catch (err) {
        setModalError(err.message || "Failed to generate brief. Please verify your officer credentials.");
      } finally {
        setIsGeneratingBrief(false);
      }
    } else {
      setIsGeneratingTakedown(true);
      try {
        const res = await apiClient.post(`cases/${caseId}/reports/takedown-request`, { password });

        const hash =
          res.headers.get("X-Document-SHA256") ||
          res.headers.get("x-document-sha256");
        const matchedCount =
          res.headers.get("X-Matched-Count") ||
          res.headers.get("x-matched-count");

        if (hash) setTakedownHash(hash);
        if (matchedCount !== null && matchedCount !== undefined) {
          setTakedownMatches((prev) => ({
            ...prev,
            total_matches: parseInt(matchedCount, 10) || 0,
          }));
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `takedown_request_${cleanCaseNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setPasswordModalOpen(false);
      } catch (err) {
        setModalError(err.message || "Failed to generate takedown request. Please verify your officer credentials.");
      } finally {
        setIsGeneratingTakedown(false);
      }
    }
  };

  const riskScore = caseData?.risk_score || 85;
  const isHighRisk = caseData?.risk_level === "HIGH" || riskScore >= 75;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* 1. Page Head with Quick Case Switcher */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
              <span>Case</span>
              <span className="font-mono text-accent">{caseData?.case_number || `#${caseId}`}</span>
              <span className="text-textDim font-normal text-sm hidden sm:inline">— Certified Forensic Reports</span>
            </h1>

            {/* Quick Case Switcher */}
            {allCases.length > 1 && (
              <select
                value={caseId}
                onChange={(e) => navigate(`/cases/${e.target.value}/reports`)}
                className="text-[12px] font-mono bg-bgSubtle border border-border rounded px-2 py-1 text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                {allCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    Switch: {c.case_number} ({c.victim_name})
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-[12.5px] text-textDim mt-1">
            Certified law enforcement exports formatted for courtroom admissibility under Section 65B of the Indian Evidence Act.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/cases/${caseId}/graph`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded-lg transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive graph</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations queue</span>
          </Link>
        </div>
      </section>

      {/* 2. Download Packages tab strip */}
      {isStandardMode ? (
        /* ── Standard Mode: formal navy tab header ── */
        <div className="gov-reports-tab-strip">
          <div className="gov-reports-tab-active">
            <Download className="w-3.5 h-3.5" />
            <span>Download Packages</span>
          </div>
        </div>
      ) : (
        /* ── Analysis Mode: original cyan tab ── */
        <div
          className="flex items-center gap-1.5 pb-1"
          style={{ borderBottom: "1px solid rgba(0,212,255,0.10)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-t"
            style={{
              color: "#00D4FF",
              background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.18)",
              borderBottom: "1px solid rgba(5,9,20,0.95)",
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Packages</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded-lg text-riskHigh text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Download Package Cards */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Investigative Brief */}
          {isStandardMode ? (
            <div className="gov-report-card">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded gov-report-icon-box-blue">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Investigative Brief Dossier</h3>
                    <span className="text-[11px] text-[#64748B]">Sec 65B Indian Evidence Act Certified</span>
                  </div>
                </div>

                <p className="text-[12px] text-[#475569] leading-relaxed">
                  A high-fidelity law enforcement dossier containing the executive narrative, category entity landscape, multi-hop correlation matrix, chronological case timeline, and Section 91 CrPC freeze directives.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-[#475569] pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                    <span>30-second executive summary &amp; risk progress score</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                    <span>Category breakdown matching network graph color language</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                    <span>Multi-hop correlation matrix with confidence scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                    <span>Section 91 CrPC bank debit-freeze &amp; telecom seizure directives</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
                <button
                  onClick={handleOpenBriefModal}
                  disabled={isGeneratingBrief}
                  className="gov-report-brief-btn disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isGeneratingBrief ? "Encrypting & Synthesizing..." : "Download Password-Protected Brief PDF"}</span>
                </button>
                {briefHash && (
                  <div className="gov-sha256-row">
                    <span className="truncate">SHA-256: {briefHash}</span>
                    <span className="verified-badge">Encrypted &amp; Verified</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between bg-bg border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text">Investigative Brief Dossier</h3>
                    <span className="text-[11px] text-textFaint">Sec 65B Indian Evidence Act Certified</span>
                  </div>
                </div>

                <p className="text-[12px] text-textDim leading-relaxed">
                  A high-fidelity law enforcement dossier containing the executive narrative, category entity landscape, multi-hop correlation matrix, chronological case timeline, and Section 91 CrPC freeze directives.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-textDim pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>30-second executive summary &amp; risk progress score</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Category breakdown matching network graph color language</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Multi-hop correlation matrix with confidence scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Section 91 CrPC bank debit-freeze &amp; telecom seizure directives</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  onClick={handleOpenBriefModal}
                  disabled={isGeneratingBrief}
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isGeneratingBrief ? "Encrypting & Synthesizing..." : "Download Password-Protected Brief PDF"}</span>
                </button>
                {briefHash && (
                  <div className="text-[10px] font-mono text-textFaint truncate bg-bgSubtle p-2 rounded border border-border flex items-center justify-between">
                    <span className="truncate">SHA-256: {briefHash}</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">Encrypted &amp; Verified</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 2: Takedown Request */}
          {isStandardMode ? (
            <div className="gov-report-card">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded gov-report-icon-box-red">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Statutory Takedown Notice</h3>
                    <span className="text-[11px] text-[#64748B]">Section 69A Information Technology Act</span>
                  </div>
                </div>

                <p className="text-[12px] text-[#475569] leading-relaxed">
                  Statutory emergency advisory notice served upon domain registrars, hosting providers, ISPs, and telecom intermediaries with mandatory 24-hour compliance terms.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-[#475569] pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
                    <span>Emergency 24-hour public resolution disabling &amp; DNS sinkhole mandate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
                    <span>Cyber attack infrastructure table with priority CRITICAL/HIGH badges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
                    <span>180-day server access log preservation order under Section 67C IT Act</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
                    <span>Threat intelligence &amp; forensic justification for blocking</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
                <button
                  onClick={handleOpenTakedownModal}
                  disabled={isGeneratingTakedown}
                  className="gov-report-takedown-btn disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isGeneratingTakedown ? "Encrypting & Synthesizing..." : "Download Password-Protected Takedown PDF"}</span>
                </button>
                {takedownHash && (
                  <div className="gov-sha256-row">
                    <span className="truncate">SHA-256: {takedownHash}</span>
                    <span className="verified-badge">Encrypted &amp; Verified</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between bg-bg border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text">Statutory Takedown Notice</h3>
                    <span className="text-[11px] text-textFaint">Section 69A Information Technology Act</span>
                  </div>
                </div>

                <p className="text-[12px] text-textDim leading-relaxed">
                  Statutory emergency advisory notice served upon domain registrars, hosting providers, ISPs, and telecom intermediaries with mandatory 24-hour compliance terms.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-textDim pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Emergency 24-hour public resolution disabling &amp; DNS sinkhole mandate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Cyber attack infrastructure table with priority CRITICAL/HIGH badges</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>180-day server access log preservation order under Section 67C IT Act</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Threat intelligence &amp; forensic justification for blocking</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  onClick={handleOpenTakedownModal}
                  disabled={isGeneratingTakedown}
                  className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isGeneratingTakedown ? "Encrypting & Synthesizing..." : "Download Password-Protected Takedown PDF"}</span>
                </button>
                {takedownHash && (
                  <div className="text-[10px] font-mono text-textFaint truncate bg-bgSubtle p-2 rounded border border-border flex items-center justify-between">
                    <span className="truncate">SHA-256: {takedownHash}</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">Encrypted &amp; Verified</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Protection Modal */}
      <ReportPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        reportType={activeReportType}
        caseNumber={caseData?.case_number || `#${caseId}`}
        onConfirm={handleConfirmDownload}
        isGenerating={isGeneratingBrief || isGeneratingTakedown}
        error={modalError}
      />
    </div>
  );
}
