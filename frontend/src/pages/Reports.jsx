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
} from "lucide-react";
import apiClient from "../api/client";
import ReportCard from "../components/ReportCard";

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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Page Head with Case Switcher */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
              <span>Case</span>
              <span className="font-mono text-accent">{caseData?.case_number || `#${caseId}`}</span>
              <span className="text-textDim font-normal text-sm hidden sm:inline">— Certified Investigative Dossiers</span>
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
            Exports are cryptographically hash-stamped at generation time for Indian Evidence Act (Sec 65B) admissibility.
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

      {/* 2. Interactive Navigation Tabs (Packages vs Live In-App Previews) */}
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
                ? "border-accent text-accent bg-accent/5"
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
                ? "border-accent text-accent bg-accent/5"
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
                  A structured law enforcement dossier containing the AI executive narrative, multi-hop evidence breakdown, high-risk entity hierarchy, and immediate Section 91 CrPC freeze directives.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-textDim pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Executive case narrative & plain-language modus operandi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Ingested evidence files with SHA-256 cryptographic hashes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Recommended freeze-seizure targets (Sec 91 CrPC requisitions)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  onClick={handleGenerateBrief}
                  disabled={isGeneratingBrief}
                  className="w-full py-2 px-3 rounded-lg bg-accent hover:bg-accentHover text-bg font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingBrief ? "Synthesizing PDF..." : "Download Certified Brief PDF"}</span>
                </button>
              </div>
              {briefHash && (
                <div className="text-[10px] font-mono text-textFaint truncate bg-bgSubtle p-2 rounded border border-border">
                  SHA-256: {briefHash}
                </div>
              )}
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
                  Statutory advisory package for domain registrars, hosting providers, and telecom intermediaries under Section 69A IT Act with mandatory 24-hour compliance terms.
                </p>

                <ul className="space-y-1.5 text-[11.5px] text-textDim pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Active forensic indicators bound (phishing URLs, C2 IPs, APK hashes)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>DNS sinkhole, BGP routing drop, and app-store purge directives</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>180-day server access log preservation order under Sec 67C IT Act</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  onClick={handleGenerateTakedown}
                  disabled={isGeneratingTakedown}
                  className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingTakedown ? "Synthesizing Takedown..." : "Download Section 69A Takedown PDF"}</span>
                </button>
              </div>
              {takedownHash && (
                <div className="text-[10px] font-mono text-textFaint truncate bg-bgSubtle p-2 rounded border border-border">
                  SHA-256: {takedownHash}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab Content: Interactive Investigative Brief Dossier Preview */}
      {activeTab === "brief_preview" && previewData && (
        <div className="space-y-5 bg-[#080E1C] border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {/* Dossier Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold uppercase border border-blue-500/20">
                  Confidential • Official Dossier
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Sec 65B Indian Evidence Act
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Law Enforcement Investigative Dossier
              </h2>
              <p className="text-xs text-slate-400">
                Case Ref: <span className="font-mono text-slate-200">{previewData.case_overview.case_number}</span> | Investigating Officer: <span className="text-slate-200">{previewData.case_overview.officer_name}</span> ({previewData.case_overview.badge_id})
              </p>
            </div>

            <button
              onClick={handleGenerateBrief}
              disabled={isGeneratingBrief}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingBrief ? "Synthesizing..." : "Download Signed PDF"}</span>
            </button>
          </div>

          {/* Case Overview Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B1327] border border-slate-800/80 rounded-xl p-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Victim</span>
              <span className="text-white font-semibold">{previewData.case_overview.victim_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scam Classification</span>
              <span className="text-cyan-400 font-semibold">{previewData.case_overview.scam_type}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk Level & Score</span>
              <span className={`font-bold font-mono ${previewData.case_overview.risk_level === "HIGH" ? "text-rose-400" : "text-amber-400"}`}>
                {previewData.case_overview.risk_level} ({Math.round(previewData.case_overview.risk_score)}/100)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Graph Footprint</span>
              <span className="text-slate-200 font-mono">
                {previewData.case_overview.node_count} nodes • {previewData.case_overview.edge_count} links
              </span>
            </div>
          </div>

          {/* Section 1: Executive Case Narrative */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>1. Executive Case Narrative & Modus Operandi</span>
            </h3>
            <div className="p-4 rounded-xl bg-[#0B1327] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {previewData.investigative_brief.key_findings}
            </div>
          </div>

          {/* Section 2: Ingested Evidence Summary Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>2. Ingested Multi-Source Evidence Summary</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D162E] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Evidence Artifact</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Cryptographic Checksum (SHA-256)</th>
                    <th className="p-2.5">Ingested At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {previewData.investigative_brief.evidence_summary.map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-medium text-slate-200">{ev.filename}</td>
                      <td className="p-2.5 text-slate-300">{ev.category}</td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-400 truncate max-w-xs">{ev.sha256_hash}</td>
                      <td className="p-2.5 text-slate-400">{ev.uploaded_at || "Verified"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Critical Target Entities Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>3. Risk Assessment & High-Risk Targets</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D162E] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Entity Type</th>
                    <th className="p-2.5">Target Identifier</th>
                    <th className="p-2.5">Risk Level</th>
                    <th className="p-2.5">Anomaly Justification</th>
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
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {ent.risk_level}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300 text-[11px]">{ent.anomaly_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Enforcement Directives */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Recommended Enforcement Directives (Section 91 CrPC)</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
              {previewData.investigative_brief.enforcement_directives.map((dir, i) => (
                <div key={i} className="text-xs text-emerald-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span>{dir}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Interactive Takedown Requisition Preview */}
      {activeTab === "takedown_preview" && previewData && (
        <div className="space-y-5 bg-[#080E1C] border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {/* Takedown Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono text-[10px] font-bold uppercase border border-rose-500/20">
                  Statutory Directive • Section 69A IT Act
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Rule 3(1)(d) Intermediary Rules
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Emergency Takedown & Blocking Requisition
              </h2>
              <p className="text-xs text-slate-400">
                To: Designated Domain Registrars, ISPs, Telecom Intermediaries, and Hosting Entities
              </p>
            </div>

            <button
              onClick={handleGenerateTakedown}
              disabled={isGeneratingTakedown}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-50 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingTakedown ? "Synthesizing..." : "Download Statutory Takedown PDF"}</span>
            </button>
          </div>

          {/* Statutory Directive Callout */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1.5 text-xs text-rose-200">
            <h4 className="font-bold uppercase tracking-wider text-rose-300 text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Mandatory Legal Directive Under Section 69A Information Technology Act, 2000</span>
            </h4>
            <p className="leading-relaxed text-rose-100/90 text-[11.5px]">
              Notice is hereby served under Section 69A of the Information Technology Act, 2000, read with the Information Technology (Procedure and Safeguards for Blocking for Access of Information by Public) Rules, 2009. You are directed to immediately execute public resolution disabling, DNS sinkholing, and server access log preservation for the malicious infrastructure detailed below within twenty-four (24) hours of notice delivery.
            </p>
          </div>

          {/* Indicators Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Malicious Cyber Attack Infrastructure ({previewData.takedown_request.indicators.length} Target Indicators)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Mandatory 24-Hour Execution Window
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18090F] text-rose-300 uppercase text-[10px] font-bold border-b border-rose-900/40">
                  <tr>
                    <th className="p-2.5">Target / Endpoint</th>
                    <th className="p-2.5">Indicator Category</th>
                    <th className="p-2.5">Threat Classification & Feed</th>
                    <th className="p-2.5">Mandated Action</th>
                    <th className="p-2.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080E1C]">
                  {previewData.takedown_request.indicators.map((ind, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-white max-w-xs truncate">
                        {ind.indicator}
                      </td>
                      <td className="p-2.5 text-slate-300 font-medium">{ind.type}</td>
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

          {/* Mandatory Compliance Directives Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#0B1327] border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>24-Hour Execution Window</span>
              </span>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                Intermediaries must implement domain suspension, DNS sinkholing, or BGP null-routing within 24 hours of notification receipt.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1327] border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                <span>180-Day Server Log Preservation</span>
              </span>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                Pursuant to Section 67C of the IT Act, all originating IP logs, access timestamps, and subscriber registrations must be securely preserved for 180 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
