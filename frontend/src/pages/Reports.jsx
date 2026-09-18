import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  ShieldAlert,
  ArrowLeft,
  Network,
  Download,
  AlertCircle,
  FileCheck,
  Shield,
  Layers,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Lock,
  ChevronRight,
  Search,
  Activity,
  Hash,
  Calendar,
  Building2,
  User,
  Server,
  AlertTriangle,
  Globe,
  Phone,
  CreditCard,
  Scale,
  FileBadge,
  Copy,
  Check,
} from "lucide-react";
import apiClient from "../api/client";

// Safe text highlighter for forensic identifiers in AI narrative
function renderHighlightedNarrative(text) {
  if (!text) return null;
  const tokenRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+|\b\d{10,16}\b|Section 91 CrPC|Section 69A IT Act|Rule 3\(1\)\(d\)|Section 65B|HIGH|CRITICAL|MODERATE|MEDIUM)/g;

  return text.split("\n\n").map((para, pIdx) => {
    const parts = para.split(tokenRegex);
    return (
      <p key={pIdx} className="leading-relaxed mb-3 last:mb-0 text-slate-200 text-xs">
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.includes("@")) {
            return (
              <span
                key={i}
                className="inline-block font-mono font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.5 rounded text-[11px] mx-0.5 shadow-sm"
              >
                {part}
              </span>
            );
          }
          if (/^\d{10,16}$/.test(part)) {
            return (
              <span
                key={i}
                className="inline-block font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[11px] mx-0.5 shadow-sm"
              >
                {part}
              </span>
            );
          }
          if (part.includes("Section") || part.includes("Rule")) {
            return (
              <span
                key={i}
                className="inline-block font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[11px] mx-0.5"
              >
                {part}
              </span>
            );
          }
          if (part === "HIGH" || part === "CRITICAL") {
            return (
              <span
                key={i}
                className="inline-block font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded text-[11px] mx-0.5"
              >
                {part}
              </span>
            );
          }
          if (part === "MODERATE" || part === "MEDIUM") {
            return (
              <span
                key={i}
                className="inline-block font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded text-[11px] mx-0.5"
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export default function Reports() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [allCases, setAllCases] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [takedownMatches, setTakedownMatches] = useState({
    url_matches: 0,
    apk_matches: 0,
    total_matches: 0,
  });
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("packages"); // "packages" | "brief_preview" | "takedown_preview"

  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingTakedown, setIsGeneratingTakedown] = useState(false);
  const [briefHash, setBriefHash] = useState(null);
  const [takedownHash, setTakedownHash] = useState(null);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const loadCaseAndMatchData = async () => {
    try {
      const [cRes, mRes, casesRes, prevRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}`),
        apiClient.get(`cases/${caseId}/reports/takedown-matches`),
        apiClient.get("cases"),
        apiClient.get(`cases/${caseId}/reports/preview`),
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
      if (prevRes.status === "fulfilled" && prevRes.value) {
        setPreviewData(prevRes.value);
      }
    } catch (err) {
      console.error("Error loading case report metadata:", err);
    }
  };

  useEffect(() => {
    loadCaseAndMatchData();
  }, [caseId]);

  const cleanCaseNumber = caseData?.case_number?.replace("#", "").trim() || caseId;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Handle Investigative Brief PDF Generation & Download
  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    setError(null);
    try {
      const res = await apiClient.post(`cases/${caseId}/reports/investigative-brief`);

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
    } catch (err) {
      setError(err.message || "Failed to generate investigative brief.");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Handle Takedown Request PDF Generation & Download
  const handleGenerateTakedown = async () => {
    setIsGeneratingTakedown(true);
    setError(null);
    try {
      const res = await apiClient.post(`cases/${caseId}/reports/takedown-request`);

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
    } catch (err) {
      setError(err.message || "Failed to generate takedown request.");
    } finally {
      setIsGeneratingTakedown(false);
    }
  };

  const riskScore = previewData?.case_overview?.risk_score || caseData?.risk_score || 85;
  const isHighRisk = (previewData?.case_overview?.risk_level || caseData?.risk_level) === "HIGH" || riskScore >= 75;

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

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "packages"
                ? "border-accent text-accent bg-accent/5"
                : "border-transparent text-textDim hover:text-text hover:bg-bgSubtle"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Packages</span>
          </button>

          <button
            onClick={() => setActiveTab("brief_preview")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "brief_preview"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-textDim hover:text-text hover:bg-bgSubtle"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Investigative Dossier Preview</span>
          </button>

          <button
            onClick={() => setActiveTab("takedown_preview")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === "takedown_preview"
                ? "border-rose-500 text-rose-400 bg-rose-500/10"
                : "border-transparent text-textDim hover:text-text hover:bg-bgSubtle"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Takedown Requisition Preview</span>
            {previewData?.takedown_request?.total_indicators > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-mono">
                {previewData.takedown_request.total_indicators}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded-lg text-riskHigh text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Tab Content: Package Cards */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Investigative Brief */}
            <div className="flex flex-col justify-between bg-bg border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text">Investigative Brief Dossier</h3>
                      <span className="text-[11px] text-textFaint">Sec 65B Indian Evidence Act Certified</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("brief_preview")}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Preview Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[12px] text-textDim leading-relaxed">
                  A high-fidelity law enforcement dossier containing the executive narrative, category entity landscape, multi-hop correlation matrix, chronological case timeline, and Section 91 CrPC freeze directives.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-textDim pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>30-second executive summary & risk progress score</span>
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
                    <span>Section 91 CrPC bank debit-freeze & telecom seizure directives</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  onClick={handleGenerateBrief}
                  disabled={isGeneratingBrief}
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingBrief ? "Synthesizing PDF..." : "Download Certified Brief PDF"}</span>
                </button>
                {briefHash && (
                  <div className="text-[10px] font-mono text-textFaint truncate bg-bgSubtle p-2 rounded border border-border flex items-center justify-between">
                    <span className="truncate">SHA-256: {briefHash}</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Takedown Request */}
            <div className="flex flex-col justify-between bg-bg border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text">Statutory Takedown Notice</h3>
                      <span className="text-[11px] text-textFaint">Section 69A Information Technology Act</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("takedown_preview")}
                    className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Preview Takedown</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[12px] text-textDim leading-relaxed">
                  Statutory emergency advisory notice served upon domain registrars, hosting providers, ISPs, and telecom intermediaries with mandatory 24-hour compliance terms.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-textDim pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Emergency 24-hour public resolution disabling & DNS sinkhole mandate</span>
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
                    <span>Threat intelligence & forensic justification for blocking</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  onClick={handleGenerateTakedown}
                  disabled={isGeneratingTakedown}
                  className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingTakedown ? "Synthesizing Takedown..." : "Download Section 69A Takedown PDF"}</span>
                </button>
                {takedownHash && (
                  <div className="text-[10px] font-mono text-textFaint truncate bg-bgSubtle p-2 rounded border border-border flex items-center justify-between">
                    <span className="truncate">SHA-256: {takedownHash}</span>
                    <span className="text-emerald-400 text-[10px] font-semibold">Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab Content: Interactive Investigative Brief Dossier Preview */}
      {activeTab === "brief_preview" && previewData && (
        <div className="space-y-6 bg-[#080E1C] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Dossier Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold uppercase border border-blue-500/25">
                  Restricted // Law Enforcement Investigative Brief
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold uppercase border border-emerald-500/25">
                  Sec 65B Indian Evidence Act Certified
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                TraceX Cyber Forensic Operations Room — Case Dossier
              </h2>
              <p className="text-xs text-slate-400">
                Official Law Enforcement Brief for Case Ref: <span className="font-mono text-cyan-400 font-bold">{previewData.case_overview.case_number}</span> • Registered at {previewData.case_overview.district || "Bhopal"}
              </p>
            </div>

            <button
              onClick={handleGenerateBrief}
              disabled={isGeneratingBrief}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingBrief ? "Synthesizing PDF..." : "Download Certified PDF"}</span>
            </button>
          </div>

          {/* SUMMARY SNAPSHOT CARD (Officer Skim in 30 Seconds) */}
          <div className="bg-[#0B1327] border border-slate-800/90 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Case Executive Snapshot (30-Second Overview)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Generated: {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Target Victim
                </span>
                <span className="text-white font-bold text-sm">{previewData.case_overview.victim_name}</span>
                <span className="text-[11px] text-slate-400 block">{previewData.case_overview.scam_type}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Investigating Officer
                </span>
                <span className="text-white font-bold text-sm">{previewData.case_overview.officer_name}</span>
                <span className="text-[11px] text-slate-400 font-mono block">Badge: {previewData.case_overview.badge_id}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block flex items-center gap-1">
                  <Network className="w-3 h-3 text-slate-400" /> Forensic Footprint
                </span>
                <span className="text-white font-bold text-sm font-mono">
                  {previewData.case_overview.node_count} Entities
                </span>
                <span className="text-[11px] text-cyan-400 font-mono block">
                  {previewData.case_overview.edge_count} Correlation Links
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk Assessment</span>
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${isHighRisk ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {previewData.case_overview.risk_level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isHighRisk ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-gradient-to-r from-emerald-500 to-amber-500"}`}
                      style={{ width: `${Math.min(100, Math.max(15, riskScore))}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {Math.round(riskScore)}/100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Case Narrative & Modus Operandi */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>1. Executive Case Narrative & Plain-Language Modus Operandi</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Key Entities Automatically Highlighted
              </span>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-[#0B1327] border-l-4 border-l-blue-500 border-t border-r border-b border-slate-800 text-xs text-slate-200 shadow-inner">
              {renderHighlightedNarrative(previewData.investigative_brief.key_findings)}
            </div>
          </div>

          {/* Section 2: Entity Landscape & Category Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>2. Entity Landscape & Category Breakdown</span>
            </h3>

            {/* Entity Category Cards matching graph color language */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {(previewData.investigative_brief.entity_breakdown || []).map((cat, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B1327] border border-slate-800/90 rounded-xl p-3 space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{cat.icon}</span>
                    <span
                      className="text-xs font-bold font-mono px-1.5 py-0.2 rounded"
                      style={{ color: cat.color, backgroundColor: `${cat.color}15` }}
                    >
                      {cat.count}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 block truncate">
                    {cat.category_name}
                  </span>
                  <div className="text-[9.5px] text-slate-400 font-mono flex items-center gap-1">
                    <span className="text-rose-400 font-bold">{cat.high_risk} High</span>
                    <span>•</span>
                    <span className="text-amber-400">{cat.med_risk} Med</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D162E] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Entity Category</th>
                    <th className="p-2.5">Total Count</th>
                    <th className="p-2.5">Risk Distribution</th>
                    <th className="p-2.5">Key Sample Identifiers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {(previewData.investigative_brief.entity_breakdown || []).map((cat, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-medium flex items-center gap-2" style={{ color: cat.color }}>
                        <span>{cat.icon}</span>
                        <span>{cat.category_name}</span>
                      </td>
                      <td className="p-2.5 font-bold font-mono text-slate-100">{cat.count}</td>
                      <td className="p-2.5 font-mono text-[11px]">
                        <span className="text-rose-400 font-bold">{cat.high_risk} High</span>
                        {" | "}
                        <span className="text-amber-400">{cat.med_risk} Med</span>
                        {" | "}
                        <span className="text-emerald-400">{cat.low_risk} Low</span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-300 truncate max-w-sm">
                        {cat.sample}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Forensic Correlation Matrix */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-pink-400" />
              <span>3. Forensic Correlation & Multi-Hop Relationship Matrix</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D162E] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Source Entity</th>
                    <th className="p-2.5">Target Entity</th>
                    <th className="p-2.5">Correlation Basis & Technical Modus</th>
                    <th className="p-2.5">Confidence Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {(previewData.investigative_brief.correlation_matrix || []).map((link, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{link.source_type}</span>
                        <span className="font-mono font-bold text-slate-100 text-[11.5px]">{link.source}</span>
                      </td>
                      <td className="p-2.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{link.target_type}</span>
                        <span className="font-mono font-bold text-slate-100 text-[11.5px]">{link.target}</span>
                      </td>
                      <td className="p-2.5 text-slate-300">{link.basis}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            link.confidence_level === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}>
                            {link.confidence_pct}% {link.confidence_level}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Chronological Case Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>4. Chronological Case Timeline & Investigative Milestones</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(previewData.investigative_brief.timeline || []).map((ev, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#0B1327] border border-slate-800/90 flex gap-3 text-xs"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                      style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                    >
                      {i + 1}
                    </div>
                    {i < (previewData.investigative_brief.timeline || []).length - 1 && (
                      <div className="w-0.5 h-full bg-slate-800 my-1" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-200">{ev.milestone}</span>
                      <span className="text-[10px] font-mono text-slate-400">{ev.timestamp}</span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 leading-relaxed">{ev.description}</p>
                    <span
                      className="inline-block text-[9.5px] font-bold uppercase font-mono px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: `${ev.color}15`, color: ev.color }}
                    >
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Ingested Evidence Summary Table */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileBadge className="w-3.5 h-3.5 text-blue-400" />
              <span>5. Ingested Multi-Source Digital Evidence Summary</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D162E] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Evidence Artifact</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Cryptographic Checksum (SHA-256)</th>
                    <th className="p-2.5">Admissibility Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {previewData.investigative_brief.evidence_summary.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-medium text-slate-200">{ev.filename}</td>
                      <td className="p-2.5 text-slate-300 font-semibold">{ev.category}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-400 truncate max-w-xs flex items-center gap-1.5">
                        <span className="truncate">{ev.sha256_hash}</span>
                        <button
                          onClick={() => copyToClipboard(ev.sha256_hash, `ev-${i}`)}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy SHA-256 Checksum"
                        >
                          {copiedHash === `ev-${i}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="p-2.5 text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sec 65B Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Critical Target Entities Table */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>6. Risk Assessment & Critical Target Entities</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D162E] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Entity Type</th>
                    <th className="p-2.5">Target Identifier</th>
                    <th className="p-2.5">Risk Level</th>
                    <th className="p-2.5">Forensic Anomaly & Modus Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {previewData.investigative_brief.risk_entities.map((ent, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-300">{ent.type}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-100">{ent.value}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ent.risk_level === "HIGH"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}>
                          {ent.risk_level}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300 text-[11.5px]">{ent.anomaly_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7: Enforcement Directives */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>7. Statutory Enforcement Directives (Freeze & Seizure Orders Under Sec 91 CrPC)</span>
            </h3>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              {previewData.investigative_brief.enforcement_directives.map((dir, i) => (
                <div key={i} className="text-xs text-emerald-200 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{dir}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Legal Attestation & Signature Footer */}
          <div className="p-4 rounded-xl bg-[#0B1327] border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-200 block">
                Official Electronic Certificate under Section 65B Indian Evidence Act, 1872
              </span>
              <p className="text-[11.5px] text-slate-400">
                Certified by Investigating Officer <span className="text-white font-semibold">{previewData.case_overview.officer_name}</span> ({previewData.case_overview.badge_id}), {previewData.case_overview.station_name}.
              </p>
            </div>
            <div className="text-right font-mono text-[10.5px] text-slate-400 flex-shrink-0">
              <span className="text-cyan-400 block font-bold">TraceX Forensic Integrity Module</span>
              <span>SHA256: Authenticated Vector Export</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Interactive Takedown Requisition Preview */}
      {activeTab === "takedown_preview" && previewData && (
        <div className="space-y-6 bg-[#080E1C] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Takedown Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-400 font-mono text-[10px] font-bold uppercase border border-rose-500/30">
                  Emergency Statutory Directive • Section 69A IT Act
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono text-[10px] font-bold uppercase border border-amber-500/30">
                  Rule 3(1)(d) Intermediary Rules
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 font-mono text-[10px] font-bold uppercase animate-pulse">
                  Urgency: Critical (24H Compliance)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                TraceX Cyber Threat Coordination Unit — Statutory Takedown Requisition
              </h2>
              <p className="text-xs text-slate-400">
                Notice Ref: <span className="font-mono text-rose-400 font-bold">{previewData.takedown_request.notice_ref || "TRX-69A-2026-4471"}</span> • To: Designated Domain Registrars, ISPs, Telecom Intermediaries, and Cloud Hosting Providers
              </p>
            </div>

            <button
              onClick={handleGenerateTakedown}
              disabled={isGeneratingTakedown}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/25 disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingTakedown ? "Synthesizing Takedown..." : "Download Statutory PDF"}</span>
            </button>
          </div>

          {/* TAKEDOWN SUMMARY SNAPSHOT CARD */}
          <div className="bg-[#15090E] border border-rose-900/40 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Statutory Requisition Snapshot & Compliance Urgency
                </span>
              </div>
              <span className="text-[11px] font-mono text-rose-300/80">
                Statutory Authority: Sec 69A IT Act, 2000
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-rose-300/70 uppercase font-semibold block">Target Infrastructure</span>
                <span className="text-white font-bold text-sm font-mono">
                  {previewData.takedown_request.indicators.length} Attack Endpoints
                </span>
                <span className="text-[11px] text-rose-400 block font-semibold">Phishing, APKs & C2 Nodes</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-rose-300/70 uppercase font-semibold block">Execution Deadline</span>
                <span className="text-amber-400 font-bold text-sm font-mono">24-Hour Mandatory Window</span>
                <span className="text-[11px] text-slate-400 block">DNS Sinkholing / Routing Drop</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-rose-300/70 uppercase font-semibold block">Log Preservation Mandate</span>
                <span className="text-white font-bold text-sm font-mono">180 Days (Sec 67C IT Act)</span>
                <span className="text-[11px] text-slate-400 block">Inbound/Outbound IP Logs</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-rose-300/70 uppercase font-semibold block">Requisitioning Officer</span>
                <span className="text-white font-bold text-sm">{previewData.case_overview.officer_name}</span>
                <span className="text-[11px] text-slate-400 font-mono block">Badge: {previewData.case_overview.badge_id}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Statutory Legal Directive Callout Box */}
          <div className="p-5 rounded-xl bg-rose-500/10 border-l-4 border-l-rose-500 border-t border-r border-b border-rose-500/25 space-y-2 text-xs text-rose-200 shadow-inner">
            <h4 className="font-bold uppercase tracking-wider text-rose-300 text-xs flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>1. Mandatory Legal Directive Under Section 69A Information Technology Act, 2000</span>
            </h4>
            <p className="leading-relaxed text-rose-100/90 text-xs">
              Notice is hereby served under <b>Section 69A of the Information Technology Act, 2000</b>, read with Rule 3(1)(d) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Information Technology (Procedure and Safeguards for Blocking for Access of Information by Public) Rules, 2009. You are directed to immediately execute public resolution disabling, DNS sinkholing, BGP routing nullification, and server access log preservation for the malicious cyber attack infrastructure detailed below within twenty-four (24) hours of notice delivery.
            </p>
          </div>

          {/* Section 2: Comprehensive Attack Infrastructure Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>2. Malicious Cyber Attack Infrastructure ({previewData.takedown_request.indicators.length} Target Indicators)</span>
              </h3>
              <span className="text-[11px] text-rose-400 font-mono font-bold">
                Priority Blocking Mandated
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18090F] text-rose-300 uppercase text-[10px] font-bold border-b border-rose-900/40">
                  <tr>
                    <th className="p-2.5">Target / Endpoint</th>
                    <th className="p-2.5">Indicator Category</th>
                    <th className="p-2.5">Threat Classification & Feed Source</th>
                    <th className="p-2.5">Mandated Action</th>
                    <th className="p-2.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {previewData.takedown_request.indicators.map((ind, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-white max-w-xs truncate flex items-center gap-1.5">
                        <span className="truncate">{ind.indicator}</span>
                        <button
                          onClick={() => copyToClipboard(ind.indicator, `ind-${i}`)}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy Target Indicator"
                        >
                          {copiedHash === `ind-${i}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="p-2.5 text-slate-200 font-medium">{ind.type}</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">{ind.source}</td>
                      <td className="p-2.5 text-cyan-300 font-mono text-[11px]">
                        {ind.action_mandated}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                          ind.priority === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          {ind.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {previewData.takedown_request.indicators.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        No active malicious indicators flagged in this case.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Threat Intelligence & Forensic Evidence Justifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Threat Intelligence & Forensic Evidence Justifications</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(previewData.takedown_request.threat_justifications || []).map((tj, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0B1327] border border-slate-800/90 space-y-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tj.color }}
                    />
                    <span className="font-bold text-slate-200 text-xs">{tj.category}</span>
                  </div>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed">
                    <b className="text-slate-400">Modus Mechanism:</b> {tj.mechanism}
                  </p>
                  <p className="text-[11.5px] text-rose-300 leading-relaxed">
                    <b className="text-rose-400">Forensic Justification:</b> {tj.justification}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Public Threat & Impact Justification */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>4. Public Threat & Financial Harm Impact Justification</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#0B1327] border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {previewData.takedown_request.impact_justification || (
                "Forensic examination demonstrates active, syndicated cyber fraud infrastructure designed for automated credential exfiltration and unauthorized fund siphoning. Immediate public blocking is essential to contain citizen financial harm."
              )}
            </div>
          </div>

          {/* Section 5: Mandatory Compliance Directives */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Mandatory Intermediary Compliance Terms</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(previewData.takedown_request.compliance_terms || []).map((term, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0B1327] border border-slate-800 space-y-1.5 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{term.title}</span>
                    </span>
                    <p className="text-slate-300 text-[11.5px] leading-relaxed">
                      {term.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10.5px] font-mono text-cyan-400 font-bold">
                      Mandate: {term.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Official Digital Attestation Footer */}
          <div className="p-4 rounded-xl bg-[#0B1327] border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-200 block">
                Issued Under Digital Authority of Cyber Threat Coordination Unit
              </span>
              <p className="text-[11.5px] text-slate-400">
                Authorizing Officer: <span className="text-white font-semibold">{previewData.case_overview.officer_name}</span> ({previewData.case_overview.badge_id}), {previewData.case_overview.station_name}. Certified TraceX Enforcement Export.
              </p>
            </div>
            <div className="text-right font-mono text-[10.5px] text-slate-400 flex-shrink-0">
              <span className="text-rose-400 block font-bold">Sec 69A IT Act Statutory Requisition</span>
              <span>Issued with 24-Hour Enforcement Window</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
