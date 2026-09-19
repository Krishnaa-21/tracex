import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
} from "lucide-react";
import apiClient from "../api/client";
import NetworkGraph from "../components/NetworkGraph";
import { useMode } from "../context/ModeContext";

const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

export default function ConnectionsGraph() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isStandardMode } = useMode();

  const [allCases, setAllCases] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [graphData, setGraphData] = useState(() => location.state?.preloadedGraph || { nodes: [], edges: [] });
  const [recordsStats, setRecordsStats] = useState(() => location.state?.recordsByCategory || {
    telecom: 0,
    bank_upi: 0,
    other: 0,
    total: 0,
  });
  const [topRiskEntities, setTopRiskEntities] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const [isLoading, setIsLoading] = useState(() => !(location.state?.preloadedGraph?.nodes?.length > 0));
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [error, setError] = useState(null);

  const loadCaseAndGraph = async () => {
    if (!graphData.nodes || graphData.nodes.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const caseRes = await apiClient.get(`cases/${caseId}`);
      setCaseData(caseRes);
      setIsLoading(false);
      const [graphRes, topRiskRes, summaryRes, allCasesRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}/graph`),
        apiClient.get(`cases/${caseId}/entities/top-risk`),
        apiClient.get(`cases/${caseId}/summary`),
        apiClient.get("cases"),
      ]);
      if (graphRes.status === "fulfilled" && graphRes.value) {
        setGraphData({
          nodes: graphRes.value.nodes || [],
          edges: graphRes.value.edges || [],
        });
        if (graphRes.value.records_by_category) {
          setRecordsStats(graphRes.value.records_by_category);
        }
      }

      if (topRiskRes.status === "fulfilled" && Array.isArray(topRiskRes.value)) {
        setTopRiskEntities(topRiskRes.value);
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummaryData(summaryRes.value);
      }

      if (allCasesRes.status === "fulfilled" && Array.isArray(allCasesRes.value)) {
        setAllCases(allCasesRes.value);
      }
    } catch (err) {
      setError(err.message || "Failed to load graph data for this case.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaseAndGraph();
  }, [caseId]);

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true);
    try {
      const regenerated = await apiClient.post(`cases/${caseId}/summary/regenerate`);
      setSummaryData(regenerated);
    } catch (err) {
      console.error("Failed to regenerate AI summary:", err);
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const formattedDate = caseData?.registered_at
    ? new Date(caseData.registered_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently registered";

  const scamLabel = caseData
    ? SCAM_TYPE_LABELS[caseData.scam_type] || caseData.scam_type
    : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Page Head with Quick Case Switcher */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text tracking-tight">
              Case{" "}
              <span className="font-mono font-bold text-accent">
                {caseData?.case_number || `#${caseId}`}
              </span>{" "}
              — Multi-Hop Correlation Graph
            </h1>

            {/* Case Switcher Dropdown */}
            {allCases.length > 1 && (
              <select
                value={caseId}
                onChange={(e) => navigate(`/cases/${e.target.value}/graph`)}
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
            Victim:{" "}
            <span className="font-semibold text-text">
              {caseData?.victim_name || "Investigating"}
            </span>
            {" · "}
            <span>{scamLabel}</span>
            {" · "}
            <span>registered {formattedDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-textDim hover:text-text bg-bg border border-border hover:bg-bgSubtle rounded-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations queue</span>
          </button>
          <Link
            to={`/cases/${caseId}/reports`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-medium bg-accent hover:bg-accentHover text-white rounded-sm transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate reports</span>
          </Link>
        </div>
      </section>

      {/* Error Alert if any */}
      {error && (
        <div className="p-3 bg-riskHighBg border border-riskHigh/30 rounded-sm text-riskHigh text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full-Width Graph Visualization Workspace */}
      <section className="w-full">
        <NetworkGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          caseNumber={caseData?.case_number || caseId}
          victimName={caseData?.victim_name}
          isLoading={isLoading}
        />
      </section>

      {/* AI Case Narrative */}
      {isStandardMode ? (
        /* ── Standard Mode: formal government panel ────────────────────── */
        <section className="gov-ai-narrative-panel">
          <div className="gov-ai-narrative-header">
            <div>
              <div className="gov-ai-narrative-title flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0B3B60]" />
                AI Case Narrative
              </div>
              <p className="gov-ai-narrative-subtitle">A structured explanation of the relationship map</p>
            </div>
            <button
              onClick={handleRegenerateSummary}
              disabled={isRegeneratingSummary}
              className="gov-regen-btn"
            >
              <RefreshCw className={`w-3 h-3 ${isRegeneratingSummary ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="gov-ai-narrative-body">
            {summaryData ? (
              <div className="gov-narrative-inner-box">
                <p className="gov-ai-narrative-text">{summaryData.narrative_text}</p>

                {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                  <div className="pt-3 border-t border-[#E2E8F0] mt-3 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                      Key Directives:
                    </span>
                    {summaryData.key_takeaways.map((takeaway, i) => (
                      <span key={i} className="gov-directive-tag">
                        <span className="tag-dot" />
                        {takeaway}
                      </span>
                    ))}
                  </div>
                )}

                <div className="gov-narrative-meta mt-3">
                  <div className="flex items-center gap-2">
                    <span className="meta-dot" />
                    <span>
                      Synthesized via{" "}
                      <span className="font-semibold text-[#334155]">
                        {summaryData.model_version || "Deterministic Narrative"}
                      </span>
                    </span>
                  </div>
                  <span className="font-mono text-[#64748B]">
                    {summaryData.generated_at
                      ? `Generated at ${new Date(summaryData.generated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}`
                      : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-[#475569] py-4 text-center space-y-1">
                <p className="font-medium text-[#0F172A]">No correlation narrative generated yet.</p>
                <p className="text-[11px] text-[#64748B]">
                  Upload multi-source evidence and run correlation to synthesize an AI brief.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ── Analysis Mode: original dark panel ────────────────────────── */
        <section className="border border-border rounded-xl bg-bg shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <div>
                  <h3 className="text-[14px] tracking-wide font-bold text-text">
                    AI Case Narrative
                  </h3>
                  <p className="text-[11px] text-textFaint mt-0.5">
                    A simple explanation of what the relationship map means
                  </p>
                </div>
              </div>
              <button
                onClick={handleRegenerateSummary}
                disabled={isRegeneratingSummary}
                className="text-[11px] font-semibold text-accent hover:text-accentHover hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isRegeneratingSummary ? "animate-spin" : ""}`}
                />
                <span>Regenerate</span>
              </button>
            </div>

            {summaryData ? (
              <div className="bg-bg/70 border border-border/80 rounded-xl p-5 shadow-inner space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <p className="text-[13px] leading-relaxed text-text font-normal whitespace-pre-line selection:bg-accent/20">
                      {summaryData.narrative_text}
                    </p>

                    {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                      <div className="pt-2 border-t border-border/60 flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] font-semibold text-textFaint uppercase tracking-wider">
                          Key Directives:
                        </span>
                        {summaryData.key_takeaways.map((takeaway, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-accent text-[11px] font-medium border border-accent/20"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                            {takeaway}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-textFaint">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span>
                      Synthesized via{" "}
                      <span className="font-semibold text-textDim">
                        {summaryData.model_version || "Deterministic Narrative"}
                      </span>
                    </span>
                  </div>
                  <span className="font-mono text-textDim">
                    {summaryData.generated_at
                      ? `Generated at ${new Date(summaryData.generated_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}`
                      : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-textDim py-4 text-center space-y-1">
                <p className="font-medium text-text">
                  No correlation narrative generated yet.
                </p>
                <p className="text-[11px] text-textFaint">
                  Upload multi-source evidence and run correlation to synthesize an
                  AI brief.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
