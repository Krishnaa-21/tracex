import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Workflow,
  FileSearch,
  Network,
  ShieldAlert,
  MapPin,
  FileText,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  ExternalLink,
  Eye,
  X,
  RotateCw,
  FileCheck2,
} from "lucide-react";
import { useAgents, formatWhen, formatDuration, ORCHESTRATOR_ID } from "../../hooks/useAgents";
import { Breadcrumb, PageHeader, StatusBadge, TableMessage, riskScoreOf } from "./StandardUI";
import { useMode } from "../../context/ModeContext";
import { t } from "../../config/standardPortal";

const AGENT_META = {
  case_orchestrator: {
    icon: Workflow,
    simpleNameEn: "Full Case Auto-Pilot",
    simpleNameHi: "सम्पूर्ण केस ऑटो-पायलट",
    taglineEn: "Runs all 5 investigation agents in 1 click",
    taglineHi: "एक क्लिक में सभी 5 जाँच एजेंटों को क्रमबद्ध चलाएं",
    descEn: "Scans suspect accounts, finds links to other cases, scores fraud risk, maps police jurisdiction, and writes a complete summary report.",
    descHi: "संदिग्ध खातों की जांच, क्रॉस-केस लिंक, जोखिम स्कोर, थाना क्षेत्राधिकार और पूर्ण सारांश रिपोर्ट तैयार करता है।",
    badge: "All-in-One",
  },
  digital_evidence: {
    icon: FileSearch,
    simpleNameEn: "Evidence Extractor",
    simpleNameHi: "डिजिटल साक्ष्य निष्कर्षण",
    taglineEn: "Finds phone numbers, bank accounts & UPIs",
    taglineHi: "फ़ोन नंबर, बैंक खाते एवं यूपीआई विवरण निकालें",
    descEn: "Pulls every phone number, UPI handle, bank account, and IP address from this case and checks their validity.",
    descHi: "इस प्रकरण से जुड़े सभी मोबाइल नंबर, यूपीआई, बैंक खाते और आईपी एड्रेस को निकालकर सत्यापित करता है।",
    badge: "Evidence",
  },
  correlation: {
    icon: Network,
    simpleNameEn: "Cross-Case Matcher",
    simpleNameHi: "क्रॉस-केस संबंध खोजकर्ता",
    taglineEn: "Discovers links to other criminal cases",
    taglineHi: "अन्य आपराधिक प्रकरणों से संबंध खोजें",
    descEn: "Checks if suspect bank accounts, phones, or devices were also used in other fraud cases across the network.",
    descHi: "जांच करता है कि क्या संदिग्ध बैंक खाते, फोन या डिवाइस राज्य नेटवर्क के अन्य धोखाधड़ी मामलों में भी जुड़े हैं।",
    badge: "Network",
  },
  threat_analysis: {
    icon: ShieldAlert,
    simpleNameEn: "Scam Risk Analyzer",
    simpleNameHi: "जोखिम एवं खतरा विश्लेषक",
    taglineEn: "Calculates risk score and flags danger",
    taglineHi: "जोखिम स्कोर एवं खतरे का सटीक आकलन",
    descEn: "Estimates how dangerous this scam is, calculates the risk score (0-100), and spots organized cyber fraud patterns.",
    descHi: "धोखाधड़ी के खतरे का सटीक आकलन करता है, 0-100 स्कोर निर्धारित करता है और संगठित गिरोहों की पहचान करता है।",
    badge: "Threat",
  },
  jurisdiction: {
    icon: MapPin,
    simpleNameEn: "Jurisdiction & Police Mapper",
    simpleNameHi: "क्षेत्राधिकार एवं थाना लोकेटर",
    taglineEn: "Identifies the responsible police station",
    taglineHi: "अधिकृत पुलिस थाना पहचानें",
    descEn: "Determines which police station or cyber nodal cell has legal authority to take formal action on this case.",
    descHi: "पहचान करता है कि किस स्थानीय पुलिस थाने अथवा साइबर नोडल सेल को इस प्रकरण पर कार्रवाई का कानूनी अधिकार है।",
    badge: "Jurisdiction",
  },
  investigation_report: {
    icon: FileText,
    simpleNameEn: "Case Report Builder",
    simpleNameHi: "प्रकरण रिपोर्ट निर्माता",
    taglineEn: "Generates your Section 65B case summary",
    taglineHi: "धारा 65बी प्रमाण पत्र एवं सारांश तैयार करें",
    descEn: "Compiles all findings, suspect details, and next recommended actions into an easy-to-read official summary.",
    descHi: "सभी निष्कर्षों, संदिग्ध विवरणों और अनुशंसित कार्रवाइयों को एक आधिकारिक कानूनी सारांश में संकलित करता है।",
    badge: "Report",
  },
};

const STATUS_CONFIG = {
  completed: { tone: "low", labelEn: "Completed", labelHi: "पूर्ण", Icon: CheckCircle2 },
  attention: { tone: "medium", labelEn: "Needs Review", labelHi: "समीक्षा आवश्यक", Icon: AlertTriangle },
  failed: { tone: "high", labelEn: "Failed", labelHi: "विफल", Icon: XCircle },
  halted: { tone: "high", labelEn: "Stopped", labelHi: "रुक गया", Icon: XCircle },
  running: { tone: "info", labelEn: "Analyzing…", labelHi: "विश्लेषण जारी…", Icon: Loader2 },
  idle: { tone: "neutral", labelEn: "Ready to run", labelHi: "तैयार", Icon: Clock },
};

function StatusChip({ status, lang = "en" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const label = lang === "hi" ? cfg.labelHi : cfg.labelEn;
  return (
    <StatusBadge tone={cfg.tone}>
      {status === "running" ? "⏳ " : ""}
      {label}
    </StatusBadge>
  );
}

/**
 * Standard Mode Inline Agent Inspection & Report Panel
 * Opens smoothly near the selected agent card, well within the viewport.
 */
function StandardAgentInspectorPanel({ agent, run, onClose, onRun, busy, lang = "en" }) {
  const s = t(lang);
  const meta = AGENT_META[agent.id] || {
    icon: Shield,
    simpleNameEn: agent.name,
    simpleNameHi: agent.name,
    taglineEn: agent.role,
    taglineHi: agent.role,
  };
  const Icon = meta.icon;
  const result = run?.result || {};
  const findings = result.findings || [];
  const recommendations = result.recommendations || [];
  const steps = result.steps || [];

  return (
    <section
      id="std-agent-inspector"
      style={{
        backgroundColor: "#FFFFFF",
        border: "2px solid var(--std-navy, #0B3B60)",
        borderRadius: "8px",
        boxShadow: "0 6px 24px rgba(11, 42, 69, 0.12)",
        marginTop: "1.5rem",
        marginBottom: "1.5rem",
        overflow: "hidden",
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: "12px 18px",
          backgroundColor: "var(--std-navy, #0B3B60)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <Icon size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
                {lang === "hi" ? meta.simpleNameHi : meta.simpleNameEn}
              </h3>
              <StatusChip status={run?.status || "completed"} lang={lang} />
            </div>
            <span style={{ fontSize: "12px", color: "#D6E2EE" }}>
              {lang === "hi" ? meta.taglineHi : meta.taglineEn}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            color: "#FFFFFF",
            borderRadius: "4px",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: "12.5px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Close Report"
        >
          <span>{lang === "hi" ? "आख्या बंद करें" : "Close Report"}</span>
          <X size={14} />
        </button>
      </div>

      {/* ── HIGHLIGHTED REPORT & OUTCOME (Strong Visual Hierarchy) ─────── */}
      <div style={{ padding: "12px 16px" }}>
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#F0F6FC",
            border: "1.5px solid #0B3B60",
            borderLeft: "5px solid #0B3B60",
            borderRadius: "6px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0B3B60" }}>
              {lang === "hi" ? "🎯 प्रकरण जाँच परिणाम एवं निष्कर्ष आख्या" : "🎯 Key Investigation Outcome & Finding"}
            </span>

            <div style={{ fontSize: "11px", color: "#566274" }}>
              <span>{lang === "hi" ? "जाँच समय:" : "Verified:"} <strong>{formatWhen(run?.created_at)}</strong></span>
              <span style={{ margin: "0 5px" }}>•</span>
              <span>{lang === "hi" ? "अवधि:" : "Duration:"} <strong>{formatDuration(run?.duration_ms)}</strong></span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: "#0B2A45", lineHeight: "1.35" }}>
            {run?.summary || "No summary recorded."}
          </p>
        </div>

        {/* ── Two-Column Findings & Recommendations (Compact, no empty voids) ─ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "start", gap: "12px", marginBottom: "12px" }}>
          {/* Key Discoveries */}
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D5DCE5",
              borderRadius: "6px",
            }}
          >
            <h4 style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: "700", color: "#0B3B60", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {s.agentsKeyFindings} ({findings.length})
            </h4>

            {findings.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#566274", fontStyle: "italic", padding: "4px 0" }}>
                {lang === "hi" ? "इस जाँच में कोई विसंगति नहीं मिली।" : "No anomalies flagged in this run."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {findings.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 8px",
                      backgroundColor: f.severity === "high" || f.severity === "critical" ? "#FDECEC" : f.severity === "medium" ? "#FFF3D1" : "#F6F8FB",
                      border: `1px solid ${f.severity === "high" || f.severity === "critical" ? "#D99A9A" : f.severity === "medium" ? "#DDB962" : "#D5DCE5"}`,
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <StatusBadge tone={f.severity === "high" || f.severity === "critical" ? "high" : f.severity === "medium" ? "medium" : "info"}>
                        {f.severity || "info"}
                      </StatusBadge>
                      <strong style={{ fontSize: "12px", color: "#1B1B1B" }}>{f.title}</strong>
                    </div>
                    {f.detail && <p style={{ margin: 0, fontSize: "11px", color: "#3D4756", lineHeight: "1.3" }}>{f.detail}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Next Actions — Compact & Space-Efficient */}
          <div
            style={{
              padding: "10px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #D5DCE5",
              borderRadius: "6px",
            }}
          >
            <h4 style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: "700", color: "#0B3B60", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {s.agentsNextSteps} ({recommendations.length})
            </h4>

            {recommendations.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#566274", fontStyle: "italic", padding: "4px 0" }}>
                {lang === "hi" ? "कोई विशेष अग्रिम कार्रवाई अनुशंसित नहीं।" : "No specific next steps recommended."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recommendations.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "7px",
                      padding: "6px 8px",
                      backgroundColor: "#F3F6F9",
                      border: "1px solid #D5DCE5",
                      borderRadius: "4px",
                      fontSize: "12px",
                      lineHeight: "1.35",
                      color: "#102A43",
                    }}
                  >
                    <span style={{ color: "#0B3B60", fontWeight: "700", fontSize: "11px", flexShrink: 0, marginTop: "1px" }}>
                      {i + 1}.
                    </span>
                    <span style={{ flex: 1 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verification Steps Audit (Compact inline chips) */}
        {steps.length > 0 && (
          <div style={{ paddingTop: "8px", borderTop: "1px solid #E2E8F0", marginBottom: "10px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", color: "#566274", display: "block", marginBottom: "4px" }}>
              {s.agentsStepsTaken}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {steps.map((st, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10.5px",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    backgroundColor: "#EEF1F5",
                    border: "1px solid #CBD5E1",
                    color: "#1B1B1B",
                  }}
                >
                  ✓ {st.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Panel Foot */}
        <div
          style={{
            paddingTop: "8px",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "10.5px", color: "#566274", fontFamily: "var(--std-font-mono, monospace)" }}>
            Audit Entry #{run?.id || "N/A"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" className="std-btn std-btn--secondary std-btn--sm" onClick={onClose}>
              {lang === "hi" ? "बंद करें" : "Dismiss"}
            </button>
            <button
              type="button"
              className="std-btn std-btn--sm"
              disabled={busy}
              onClick={() => onRun(agent.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <RotateCw size={13} />
              <span>{s.agentsRunAgainBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StandardAgentsPage() {
  const { language } = useMode();
  const s = t(language);
  const { agents, cases, runs, loading, error, caseId, selectedCase, selectCase, runAgent, runningId, latestByAgent } = useAgents();

  // Selected agent for inline inspection
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const inspectorRef = useRef(null);

  const orchestrator = agents.find((a) => a.id === ORCHESTRATOR_ID);
  const specialists = agents.filter((a) => a.id !== ORCHESTRATOR_ID);
  const orchRun = latestByAgent[ORCHESTRATOR_ID];
  const pipeline = orchRun?.result?.data?.children || [];
  const busy = !!runningId || !caseId;

  // Active run data for the inspector panel
  const activeAgentData = useMemo(() => {
    if (!selectedAgentId) return null;
    const ag = agents.find((a) => a.id === selectedAgentId);
    if (!ag) return null;
    const r = latestByAgent[selectedAgentId];
    return { agent: ag, run: r };
  }, [selectedAgentId, agents, latestByAgent]);

  // Smoothly scroll inspector into view whenever an agent is selected
  useEffect(() => {
    if (selectedAgentId && inspectorRef.current) {
      inspectorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedAgentId]);

  return (
    <>
      <Breadcrumb items={[{ label: s.home, to: "/" }, { label: s.agents }]} />

      <PageHeader
        title={s.agentsTitle}
        subtitle={s.agentsSub}
        actions={
          cases.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label htmlFor="std-agent-case-select" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--std-navy)" }}>
                {s.agentsCaseLabel}:
              </label>
              <select
                id="std-agent-case-select"
                className="std-select"
                value={caseId || ""}
                onChange={(e) => {
                  selectCase(e.target.value);
                  setSelectedAgentId(null);
                }}
                style={{ minWidth: "220px", fontWeight: 500 }}
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} — {c.victim_name}
                  </option>
                ))}
              </select>
              {caseId && (
                <Link
                  className="std-btn std-btn--secondary std-btn--sm"
                  to={`/cases/${caseId}/graph`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                >
                  <span>{language === "hi" ? "केस ग्राफ़" : "Open Graph"}</span>
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>
          )
        }
      />

      {error && (
        <div style={{ marginBottom: "1rem" }}>
          <StatusBadge tone="high">{error}</StatusBadge>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--std-text-muted)" }}>
          <p>Loading investigation agents…</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="std-panel" style={{ padding: "2rem", textAlign: "center" }}>
          <h3>No cases found</h3>
          <p style={{ color: "var(--std-text-muted)" }}>
            Please register an investigation case first to run AI analysis.
          </p>
        </div>
      ) : (
        <>
          {/* Active Case Summary Strip */}
          {selectedCase && (
            <div className="std-agent-case-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--std-text-faint)", fontWeight: 700 }}>
                    Active Case File
                  </span>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--std-navy)" }}>
                    {selectedCase.case_number} — {selectedCase.victim_name}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--std-text-faint)", display: "block" }}>Scam Type</span>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {String(selectedCase.scam_type || "digital_scam").replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--std-text-faint)", display: "block" }}>District</span>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{selectedCase.district || "Pending"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--std-text-faint)", display: "block" }}>Risk Score</span>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: riskScoreOf(selectedCase) >= 70 ? "#9B1C1C" : "#1B5E2B" }}>
                    {riskScoreOf(selectedCase)} / 100
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Hero Feature Card: Full Case Auto-Pilot */}
          {orchestrator && (
            <section
              className="std-agent-hero-card"
              aria-labelledby="hero-autopilot-heading"
              style={{
                border: selectedAgentId === ORCHESTRATOR_ID ? "2.5px solid var(--std-navy, #0B3B60)" : undefined,
                boxShadow: selectedAgentId === ORCHESTRATOR_ID ? "0 4px 18px rgba(11, 42, 69, 0.18)" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ maxWidth: "680px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <span style={{ padding: "2px 8px", backgroundColor: "#E6F0FA", color: "#0B3B60", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                      RECOMMENDED FIRST STEP
                    </span>
                    <StatusChip status={runningId === ORCHESTRATOR_ID ? "running" : orchRun?.status || "idle"} lang={language} />
                    {selectedAgentId === ORCHESTRATOR_ID && (
                      <span style={{ padding: "2px 8px", backgroundColor: "#0B3B60", color: "#FFFFFF", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {language === "hi" ? "सक्रिय रिपोर्ट" : "ACTIVE INSPECTION"}
                      </span>
                    )}
                  </div>
                  <h2 id="hero-autopilot-heading" style={{ margin: "0 0 0.35rem", fontSize: "1.25rem", color: "var(--std-navy)", fontWeight: 700 }}>
                    {language === "hi" ? AGENT_META.case_orchestrator.simpleNameHi : AGENT_META.case_orchestrator.simpleNameEn}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--std-text-muted)", lineHeight: 1.5 }}>
                    {language === "hi" ? AGENT_META.case_orchestrator.descHi : AGENT_META.case_orchestrator.descEn}
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-run-full-autopilot"
                  className="std-btn"
                  disabled={busy}
                  onClick={() => runAgent(ORCHESTRATOR_ID)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {runningId === ORCHESTRATOR_ID ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{s.agentsRunningAll}</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" />
                      <span>{s.agentsRunAllBtn}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step roadmap */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--std-border-soft)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--std-text-faint)", textTransform: "uppercase" }}>
                  Automated Investigation Pipeline (5 Stages)
                </span>

                <div className="std-agent-pipeline-grid">
                  {[
                    { id: "digital_evidence", name: "1. Evidence Scanner", desc: "Phone, UPI & accounts" },
                    { id: "correlation", name: "2. Cross-Case Links", desc: "Shared scam networks" },
                    { id: "threat_analysis", name: "3. Risk Score", desc: "Threat rating 0-100" },
                    { id: "jurisdiction", name: "4. Police Station", desc: "Jurisdictional authority" },
                    { id: "investigation_report", name: "5. Case Summary", desc: "Legal Section 65B summary" },
                  ].map((st) => {
                    const child = pipeline.find((p) => p.agent_id === st.id);
                    const stStatus = child ? child.status : orchRun ? "completed" : "idle";
                    return (
                      <div key={st.id} className="std-agent-pipeline-step">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--std-navy)" }}>{st.name}</span>
                          <StatusChip status={stStatus} lang={language} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--std-text-muted)" }}>{st.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest Result Banner */}
              {orchRun && (
                <div
                  style={{
                    marginTop: "1rem",
                    backgroundColor: "#FFFFFF",
                    padding: "0.85rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid var(--std-border-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "0.875rem", color: "var(--std-navy)", whiteSpace: "nowrap" }}>
                      Latest Result:
                    </strong>
                    <span style={{ fontSize: "0.875rem", color: "var(--std-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {orchRun.summary}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--std-text-faint)", whiteSpace: "nowrap" }}>
                      ({formatDuration(orchRun.duration_ms)})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAgentId((prev) => (prev === ORCHESTRATOR_ID ? null : ORCHESTRATOR_ID))}
                    className="std-btn std-btn--secondary std-btn--sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    <Eye size={13} />
                    <span>
                      {selectedAgentId === ORCHESTRATOR_ID
                        ? (language === "hi" ? "आख्या छिपाएं" : "Hide Auto-Pilot Report")
                        : (language === "hi" ? "पूर्ण रिपोर्ट देखें" : "Inspect Auto-Pilot Report")}
                    </span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Section: Individual Specialist Agents */}
          <div style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--std-navy)", margin: "0 0 0.25rem" }}>
              {s.agentsSpecialistsTitle}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--std-text-muted)", margin: 0 }}>
              {s.agentsSpecialistsSub}
            </p>
          </div>

          <div className="std-agent-grid">
            {specialists.map((agent) => {
              const meta = AGENT_META[agent.id] || {
                icon: Shield,
                simpleNameEn: agent.name,
                simpleNameHi: agent.name,
                taglineEn: agent.role,
                taglineHi: agent.role,
                descEn: agent.description,
                descHi: agent.description,
              };
              const Icon = meta.icon;
              const run = latestByAgent[agent.id];
              const isRunning = runningId === agent.id;
              const isSelected = selectedAgentId === agent.id;
              const currentStatus = isRunning ? "running" : run?.status || "idle";
              const findingsCount = run?.result?.findings?.length || 0;

              return (
                <article
                  key={agent.id}
                  onClick={() => {
                    if (run) setSelectedAgentId((prev) => (prev === agent.id ? null : agent.id));
                  }}
                  className="std-agent-card"
                  aria-label={meta.simpleNameEn}
                  style={{
                    cursor: run ? "pointer" : "default",
                    borderColor: isSelected ? "var(--std-navy, #0B3B60)" : undefined,
                    backgroundColor: isSelected ? "#F0F6FC" : "#FFFFFF",
                    boxShadow: isSelected ? "0 4px 16px rgba(11, 42, 69, 0.16)" : undefined,
                  }}
                >
                  <div className="std-agent-card-header">
                    <div className="std-agent-card-icon">
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--std-navy)" }}>
                            {language === "hi" ? meta.simpleNameHi : meta.simpleNameEn}
                          </h3>
                          {isSelected && (
                            <span style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "1px 6px", borderRadius: "3px", backgroundColor: "var(--std-navy, #0B3B60)", color: "#FFFFFF", letterSpacing: "0.04em" }}>
                              {language === "hi" ? "सक्रिय" : "SELECTED"}
                            </span>
                          )}
                        </div>
                        <StatusChip status={currentStatus} lang={language} />
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--std-text-faint)", display: "block", marginTop: "2px" }}>
                        {language === "hi" ? meta.taglineHi : meta.taglineEn}
                      </span>
                    </div>
                  </div>

                  <div className="std-agent-card-body">
                    <p style={{ margin: "0 0 0.65rem", minHeight: "38px" }}>
                      {language === "hi" ? meta.descHi : meta.descEn}
                    </p>

                    {/* Compact Highlight Box with Safe Padding & Line Clamping (No Text Clipping) */}
                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: isSelected ? "#FFFFFF" : run ? "#F6F8FB" : "#F8FAFC",
                        borderRadius: "4px",
                        border: `1px solid ${isSelected ? "#B9C3CF" : run ? "#D5DCE5" : "#E2E8F0"}`,
                        minHeight: "54px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      {run ? (
                        <>
                          <div
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: "var(--std-text)",
                              lineHeight: "1.35",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {run.summary}
                          </div>
                          <span style={{ fontSize: "0.7rem", color: "var(--std-text-faint)", marginTop: "4px", display: "block" }}>
                            {formatWhen(run.created_at)} · {formatDuration(run.duration_ms)}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--std-text-faint)", fontStyle: "italic" }}>
                          {language === "hi" ? "इस केस पर अभी नहीं चलाया गया।" : "Not run yet on this case."}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="std-agent-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      id={`btn-run-${agent.id}`}
                      className="std-btn std-btn--sm"
                      disabled={busy}
                      onClick={() => runAgent(agent.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    >
                      {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                      <span>{isRunning ? s.agentsRunning : run ? s.agentsRunAgainBtn : s.agentsRunBtn}</span>
                    </button>

                    {run && (
                      <button
                        type="button"
                        id={`btn-inspect-${agent.id}`}
                        onClick={() => setSelectedAgentId((prev) => (prev === agent.id ? null : agent.id))}
                        className={`std-btn std-btn--sm ${isSelected ? "" : "std-btn--secondary"}`}
                        style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                      >
                        <Eye size={13} />
                        <span>
                          {isSelected ? (language === "hi" ? "आख्या छिपाएं" : "Hide Report") : (language === "hi" ? "आख्या देखें" : "View Report")}
                          {!isSelected && findingsCount > 0 ? ` (${findingsCount})` : ""}
                        </span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── ACTIVE AGENT INSPECTION & FINDINGS PANEL ─────────────────── */}
          <div ref={inspectorRef}>
            {activeAgentData && (
              <StandardAgentInspectorPanel
                agent={activeAgentData.agent}
                run={activeAgentData.run}
                onClose={() => setSelectedAgentId(null)}
                onRun={runAgent}
                busy={busy}
                lang={language}
              />
            )}
          </div>

          {/* Activity Log / Audit Trail */}
          <section className="std-panel" aria-labelledby="history-table-title" style={{ marginTop: "2rem" }}>
            <div className="std-panel__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 id="history-table-title" className="std-panel__title">
                  {s.agentsHistoryTitle}
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--std-text-muted)" }}>
                  {s.agentsHistorySub}
                </p>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "var(--std-text-faint)", fontWeight: 500 }}>
                {runs.length} {runs.length === 1 ? "run" : "runs"} recorded
              </span>
            </div>

            <div className="std-table-wrap std-table-wrap--scroll">
              <table className="std-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "60px" }}>#</th>
                    <th scope="col" style={{ width: "160px" }}>Date &amp; Time</th>
                    <th scope="col" style={{ width: "200px" }}>Agent</th>
                    <th scope="col" style={{ width: "130px" }}>Status</th>
                    <th scope="col">What was found</th>
                    <th scope="col" className="num" style={{ width: "100px" }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <TableMessage colSpan={6}>{s.agentsNoRunsYet}</TableMessage>
                  ) : (
                    runs.map((r, i) => {
                      const isSelected = selectedAgentId === r.agent_id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedAgentId(r.agent_id)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#F0F6FC" : undefined,
                            fontWeight: isSelected ? 600 : undefined,
                          }}
                          title="Click to view detailed report above"
                        >
                          <td>{i + 1}</td>
                          <td className="nowrap" style={{ fontSize: "0.8125rem" }}>{formatWhen(r.created_at)}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              {r.parent_run_id ? <span style={{ color: "var(--std-text-faint)" }}>↳</span> : null}
                              <strong>{r.agent_name}</strong>
                              {isSelected ? (
                                <span style={{ fontSize: "0.6875rem", backgroundColor: "#0B3B60", color: "#FFFFFF", padding: "1px 5px", borderRadius: "3px", marginLeft: "4px" }}>
                                  ACTIVE
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td><StatusChip status={r.status} lang={language} /></td>
                          <td style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}>{r.summary}</td>
                          <td className="num nowrap" style={{ fontSize: "0.8125rem" }}>{formatDuration(r.duration_ms)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}