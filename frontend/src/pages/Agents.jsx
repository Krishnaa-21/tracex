import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
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
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  X,
  Eye,
  RotateCw,
  FileCheck2,
} from "lucide-react";
import { useAgents, formatWhen, formatDuration, ORCHESTRATOR_ID } from "../hooks/useAgents";

const AGENT_CONFIG = {
  case_orchestrator: {
    icon: Workflow,
    color: "#00D4FF",
    bgSoft: "rgba(0, 212, 255, 0.12)",
    borderSoft: "rgba(0, 212, 255, 0.35)",
    simpleName: "Full Case Auto-Pilot",
    tagline: "Runs all 5 investigation agents in 1 click",
    description: "Extracts evidence, tracks criminal links across cases, calculates risk, maps the responsible police station, and writes your case report in one step.",
    actionText: "Run Full Auto-Pilot",
  },
  digital_evidence: {
    icon: FileSearch,
    color: "#00E5C8",
    bgSoft: "rgba(0, 229, 200, 0.12)",
    borderSoft: "rgba(0, 229, 200, 0.3)",
    simpleName: "Evidence Extractor",
    tagline: "Finds phone numbers, bank accounts & UPIs",
    description: "Pulls every suspect phone number, UPI handle, bank account, and IP address from this case and checks their validity.",
    actionText: "Scan Evidence",
  },
  correlation: {
    icon: Network,
    color: "#A78BFA",
    bgSoft: "rgba(167, 139, 250, 0.12)",
    borderSoft: "rgba(167, 139, 250, 0.3)",
    simpleName: "Cross-Case Matcher",
    tagline: "Discovers links to other criminal cases",
    description: "Checks if suspect bank accounts, phones, or devices were also used in other fraud cases across the network.",
    actionText: "Find Connections",
  },
  threat_analysis: {
    icon: ShieldAlert,
    color: "#F59E0B",
    bgSoft: "rgba(245, 158, 11, 0.12)",
    borderSoft: "rgba(245, 158, 11, 0.3)",
    simpleName: "Scam Risk Analyzer",
    tagline: "Calculates risk score and flags danger",
    description: "Estimates how dangerous this scam is, calculates the risk score (0-100), and spots organized scam patterns.",
    actionText: "Assess Risk",
  },
  jurisdiction: {
    icon: MapPin,
    color: "#10B981",
    bgSoft: "rgba(16, 185, 129, 0.12)",
    borderSoft: "rgba(16, 185, 129, 0.3)",
    simpleName: "Jurisdiction & Police Mapper",
    tagline: "Identifies the responsible police station",
    description: "Determines which police station or cyber nodal cell has legal authority to take formal action on this case.",
    actionText: "Check Jurisdiction",
  },
  investigation_report: {
    icon: FileText,
    color: "#38BDF8",
    bgSoft: "rgba(56, 189, 248, 0.12)",
    borderSoft: "rgba(56, 189, 248, 0.3)",
    simpleName: "Case Report Builder",
    tagline: "Generates your Section 65B case summary",
    description: "Compiles all findings, suspect details, and next recommended actions into an easy-to-read official summary.",
    actionText: "Generate Report",
  },
};

const STATUS_MAP = {
  completed: {
    label: "Completed",
    badgeCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    Icon: CheckCircle2,
  },
  attention: {
    label: "Needs Review",
    badgeCls: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Icon: AlertTriangle,
  },
  failed: {
    label: "Failed",
    badgeCls: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    Icon: XCircle,
  },
  halted: {
    label: "Stopped",
    badgeCls: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    Icon: XCircle,
  },
  running: {
    label: "Analyzing…",
    badgeCls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    Icon: Loader2,
  },
  idle: {
    label: "Ready to run",
    badgeCls: "text-slate-400 bg-slate-800/40 border-slate-700/50",
    Icon: Clock,
  },
};

function StatusPill({ status }) {
  const conf = STATUS_MAP[status] || STATUS_MAP.idle;
  const Icon = conf.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium tracking-wide flex-shrink-0 ${conf.badgeCls}`}
    >
      <Icon className={`w-3.5 h-3.5 ${status === "running" ? "animate-spin" : ""}`} />
      <span>{conf.label}</span>
    </span>
  );
}

/**
 * High-Impact Inline Agent Inspector Panel
 * Opens directly below the cards and smoothly brings both into view,
 * eliminating all positioning, clipping, and off-screen scroll issues.
 */
function AgentInspectorPanel({ agent, run, onClose, onRun, busy }) {
  const info = AGENT_CONFIG[agent.id] || {
    icon: Bot,
    color: "#00D4FF",
    simpleName: agent.name,
    tagline: agent.role,
  };
  const Icon = info.icon;
  const result = run?.result || {};
  const findings = result.findings || [];
  const recommendations = result.recommendations || [];
  const steps = result.steps || [];

  return (
    <section
      id="agent-inspector-section"
      className="p-4 sm:p-5 rounded-xl relative overflow-hidden transition-all animate-fade-in-up"
      style={{
        background: "rgba(7, 13, 27, 0.95)",
        border: "1.5px solid rgba(0, 212, 255, 0.4)",
        boxShadow: "0 0 32px rgba(0, 212, 255, 0.12), 0 8px 28px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: info.bgSoft || "rgba(0, 212, 255, 0.12)",
              border: `1px solid ${info.borderSoft || "rgba(0, 212, 255, 0.3)"}`,
              color: info.color,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                INSPECTION REPORT
              </span>
              <h3 className="text-[15px] font-bold text-white tracking-tight">{info.simpleName}</h3>
              <StatusPill status={run?.status || "completed"} />
            </div>
            <p className="text-[11.5px] text-slate-400 mt-0.5">{info.tagline}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-slate-700/60 transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <span>Close Report</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── HIGHLIGHTED RESULT & REPORT (Strong Visual Hierarchy, Compact) ─ */}
      <div
        className="mt-3.5 p-3 sm:p-3.5 rounded-lg transition-all border-l-4 border-l-[#00D4FF]"
        style={{
          background: "linear-gradient(135deg, rgba(0, 212, 255, 0.14) 0%, rgba(10, 22, 48, 0.90) 100%)",
          borderTop: "1px solid rgba(0, 212, 255, 0.35)",
          borderRight: "1px solid rgba(0, 212, 255, 0.35)",
          borderBottom: "1px solid rgba(0, 212, 255, 0.35)",
          boxShadow: "0 4px 16px rgba(0, 212, 255, 0.10)",
        }}
      >
        <div className="flex items-center justify-between gap-2.5 flex-wrap mb-2">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Key Outcome &amp; Investigation Finding</span>
          </div>

          <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-slate-700/60">
            <span>Verified: <strong>{formatWhen(run?.created_at)}</strong></span>
            <span className="text-slate-500">•</span>
            <span>Duration: <strong>{formatDuration(run?.duration_ms)}</strong></span>
          </div>
        </div>

        <p className="text-[14px] sm:text-[15px] font-bold text-white leading-snug">
          {run?.summary || "Analysis completed successfully with zero blockers."}
        </p>
      </div>

      {/* ── Two-Column Findings & Recommendations (Compact, items-start) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mt-3.5 items-start">
        {/* Left Column: Key Discoveries */}
        <div
          className="p-3 rounded-lg"
          style={{ background: "rgba(10, 18, 36, 0.6)", border: "1px solid rgba(0, 212, 255, 0.12)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11.5px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Key Discoveries ({findings.length})</span>
            </h4>
            <span className="text-[10.5px] text-slate-400 font-mono">Flagged items</span>
          </div>

          {findings.length === 0 ? (
            <p className="text-slate-400 text-[12px] italic py-1">
              No critical anomalies or suspicious flags discovered in this run.
            </p>
          ) : (
            <div className="space-y-1.5">
              {findings.map((f, i) => {
                const isHigh = f.severity === "critical" || f.severity === "high";
                const isMed = f.severity === "medium";
                return (
                  <div
                    key={i}
                    className="p-2 px-2.5 rounded-lg flex items-start gap-2 transition-all"
                    style={{
                      background: isHigh
                        ? "rgba(244, 63, 94, 0.08)"
                        : isMed
                        ? "rgba(245, 158, 11, 0.08)"
                        : "rgba(15, 23, 42, 0.8)",
                      border: `1px solid ${
                        isHigh
                          ? "rgba(244, 63, 94, 0.3)"
                          : isMed
                          ? "rgba(245, 158, 11, 0.3)"
                          : "rgba(0, 212, 255, 0.15)"
                      }`,
                    }}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${
                        isHigh
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : isMed
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      }`}
                    >
                      {f.severity || "info"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 text-[12.5px] leading-snug">{f.title}</p>
                      {f.detail && <p className="text-slate-400 text-[11.5px] mt-0.5 leading-snug">{f.detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recommended Next Actions — Space Efficient */}
        <div
          className="p-3 rounded-lg"
          style={{ background: "rgba(10, 18, 36, 0.6)", border: "1px solid rgba(0, 212, 255, 0.12)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11.5px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Recommended Next Steps ({recommendations.length})</span>
            </h4>
            <span className="text-[10.5px] text-slate-400 font-mono">Action items</span>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-slate-400 text-[12px] italic py-1">
              No immediate action steps required for this verification.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recommendations.map((r, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1.5 rounded-md flex items-start gap-2 text-slate-200"
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.22)",
                  }}
                >
                  <span className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="text-[12px] leading-snug text-slate-200">{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification Steps Audit (Compact inline chips) */}
      {steps.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800">
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 font-medium">
            Verification Steps Executed
          </span>
          <div className="flex flex-wrap gap-1.5">
            {steps.map((st, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10.5px] font-mono flex items-center gap-1"
                style={{
                  background: "rgba(0, 212, 255, 0.05)",
                  border: "1px solid rgba(0, 212, 255, 0.15)",
                  color: "#94A3B8",
                }}
              >
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <span>{st.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3.5 pt-3 border-t border-cyan-500/15 flex items-center justify-between flex-wrap gap-2.5">
        <span className="text-[10.5px] font-mono text-slate-500">Audit Record #{run?.id || "N/A"}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[11.5px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRun(agent.id)}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #0099CC 0%, #005FA0 100%)",
              border: "1px solid rgba(0, 212, 255, 0.4)",
              boxShadow: "0 0 14px rgba(0, 212, 255, 0.2)",
            }}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Re-run This Agent</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Agents() {
  const {
    agents,
    cases,
    runs,
    loading,
    error,
    caseId,
    selectedCase,
    selectCase,
    runAgent,
    runningId,
    latestByAgent,
  } = useAgents();

  // Selected agent for inline inspection
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
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

  // Filter history
  const filteredRuns = useMemo(() => {
    if (historyFilter === "completed") return runs.filter((r) => r.status === "completed");
    if (historyFilter === "attention") return runs.filter((r) => r.status === "attention" || r.status === "failed");
    return runs;
  }, [runs, historyFilter]);

  const riskScore =
    selectedCase?.risk_score !== null && selectedCase?.risk_score !== undefined
      ? Math.round(selectedCase.risk_score)
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Page Header & Case Selector ─────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 mb-1.5">
            <Zap className="w-3 h-3" />
            <span>AI Operations Room</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-[#00D4FF]" />
            AI Investigation Agents
          </h1>
          <p className="text-[13px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Specialized AI assistants that analyze case evidence, uncover hidden fraud links, and guide your next best steps.
          </p>
        </div>

        {/* Case Selector Dropdown */}
        <div
          className="flex items-center gap-3 p-2 rounded-xl"
          style={{
            background: "rgba(10, 18, 36, 0.7)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <label htmlFor="agent-case-select" className="text-[11.5px] font-mono text-cyan-400 whitespace-nowrap pl-1">
            Active Case:
          </label>
          <select
            id="agent-case-select"
            value={caseId || ""}
            onChange={(e) => {
              selectCase(e.target.value);
              setSelectedAgentId(null);
            }}
            className="bg-black/60 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-[12.5px] font-mono text-white outline-none cursor-pointer focus:border-cyan-400"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} ({c.victim_name})
              </option>
            ))}
          </select>
          {caseId && (
            <Link
              to={`/cases/${caseId}/graph`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors whitespace-nowrap"
            >
              <span>Case Graph</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Active Case Info Bar ─────────────────────────────────────────── */}
      {selectedCase && (
        <section
          className="p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4"
          style={{
            background: "rgba(8, 14, 28, 0.8)",
            border: "1px solid rgba(0, 212, 255, 0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-cyan-400"
              style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.25)" }}
            >
              #{selectedCase.case_number?.replace(/[^0-9]/g, "").slice(-4) || "CASE"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-[14px]">{selectedCase.victim_name}</span>
                <span className="text-[11px] font-mono text-cyan-400">({selectedCase.case_number})</span>
              </div>
              <p className="text-[11.5px] text-slate-400 mt-0.5">
                {selectedCase.district || "District pending"} · IO:{" "}
                <span className="text-slate-300 font-medium">Bhopal Cyber Cell</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1 rounded-lg bg-black/40 border border-slate-700/60 text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400">Scam Type</span>
              <span className="text-[12px] font-semibold text-slate-200">
                {String(selectedCase.scam_type || "digital_scam").replace(/_/g, " ").toUpperCase()}
              </span>
            </div>

            <div className="px-3 py-1 rounded-lg bg-black/40 border border-slate-700/60 text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400">Threat Rating</span>
              <span
                className={`text-[12px] font-bold ${
                  riskScore >= 70 ? "text-rose-400" : riskScore >= 40 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {riskScore} / 100
              </span>
            </div>

            <div className="px-3 py-1 rounded-lg bg-black/40 border border-slate-700/60 text-center">
              <span className="block text-[10px] font-mono uppercase text-slate-400">Status</span>
              <span className="text-[12px] font-semibold text-cyan-400 uppercase tracking-wide">
                {selectedCase.status || "Open"}
              </span>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-[13px]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
          Loading investigation agents…
        </div>
      ) : cases.length === 0 ? (
        <div className="p-8 rounded-xl bg-black/40 border border-slate-800 text-center text-slate-400">
          <p className="text-base text-slate-300">No cases found.</p>
          <p className="text-[13px] mt-1">Please register a case first before running AI agents.</p>
        </div>
      ) : (
        <>
          {/* ── Hero Orchestrator Card (Full Auto-Pilot) ─────────────────── */}
          {orchestrator && (
            <section
              className={`p-5 sm:p-6 rounded-2xl relative overflow-hidden transition-all ${
                selectedAgentId === ORCHESTRATOR_ID ? "ring-2 ring-cyan-400" : ""
              }`}
              style={{
                background: "linear-gradient(135deg, rgba(8, 20, 42, 0.85) 0%, rgba(12, 10, 32, 0.85) 100%)",
                border: `1px solid ${
                  selectedAgentId === ORCHESTRATOR_ID ? "rgba(0, 212, 255, 0.8)" : "rgba(0, 212, 255, 0.35)"
                }`,
                boxShadow: selectedAgentId === ORCHESTRATOR_ID
                  ? "0 0 35px rgba(0, 212, 255, 0.35)"
                  : "0 0 25px rgba(0, 212, 255, 0.08)",
              }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #0099CC 0%, #005FA0 100%)",
                      boxShadow: "0 0 16px rgba(0, 212, 255, 0.4)",
                      color: "#FFFFFF",
                    }}
                  >
                    <Workflow className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        RECOMMENDED ACTION
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {AGENT_CONFIG.case_orchestrator.simpleName}
                      </h2>
                      <StatusPill status={runningId === ORCHESTRATOR_ID ? "running" : orchRun?.status || "idle"} />
                      {selectedAgentId === ORCHESTRATOR_ID && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-400 text-slate-950">
                          ● INSPECTING
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                      {AGENT_CONFIG.case_orchestrator.description}
                    </p>
                  </div>
                </div>

                {/* Primary Run Button */}
                <button
                  type="button"
                  id="btn-run-full-autopilot"
                  disabled={busy}
                  onClick={() => runAgent(ORCHESTRATOR_ID)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)",
                    border: "1px solid rgba(0, 212, 255, 0.6)",
                    boxShadow: busy ? "none" : "0 0 20px rgba(0, 212, 255, 0.35)",
                  }}
                  onMouseEnter={(e) => {
                    if (!busy) e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 212, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    if (!busy) e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 212, 255, 0.35)";
                  }}
                >
                  {runningId === ORCHESTRATOR_ID ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Running Auto-Pilot Pipeline…</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>{orchRun ? "Re-run Auto-Pilot" : "Run Full Auto-Pilot"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* 5-Step Pipeline Roadmap */}
              <div className="mt-5 pt-4 border-t border-cyan-500/15">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <span>5-Stage Investigation Pipeline</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500 font-sans normal-case">Runs each specialist automatically</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: "digital_evidence", step: 1, name: "Evidence Scanner" },
                    { id: "correlation", step: 2, name: "Cross-Case Links" },
                    { id: "threat_analysis", step: 3, name: "Risk Assessment" },
                    { id: "jurisdiction", step: 4, name: "Police Station" },
                    { id: "investigation_report", step: 5, name: "Case Summary" },
                  ].map((s) => {
                    const child = pipeline.find((p) => p.agent_id === s.id);
                    const stStatus = child ? child.status : orchRun ? "completed" : "idle";
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl flex flex-col justify-between"
                        style={{
                          background: "rgba(5, 10, 24, 0.6)",
                          border: "1px solid rgba(0, 212, 255, 0.12)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">STAGE {s.step}</span>
                          <StatusPill status={stStatus} />
                        </div>
                        <div className="text-[12px] font-semibold text-slate-200 mt-0.5 truncate">{s.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest Run Highlights */}
              {orchRun && (
                <div
                  className="mt-4 p-3.5 rounded-xl flex items-center justify-between gap-3 flex-wrap"
                  style={{
                    background: "rgba(5, 12, 26, 0.7)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold whitespace-nowrap">
                      Latest Result:
                    </span>
                    <span className="text-[12.5px] text-slate-200 truncate">{orchRun.summary}</span>
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      ({formatDuration(orchRun.duration_ms)})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAgentId((prev) => (prev === ORCHESTRATOR_ID ? null : ORCHESTRATOR_ID))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-cyan-300 hover:text-white bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>
                      {selectedAgentId === ORCHESTRATOR_ID ? "Hide Auto-Pilot Report" : "Inspect Auto-Pilot Report"}
                    </span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── Section: Specialist Agents Grid (Equal-height, balanced cards) ── */}
          <div>
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Individual Specialist Agents</h2>
                <p className="text-[12.5px] text-slate-400 mt-0.5">
                  Click any specialist to run it or inspect its findings directly below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {specialists.map((agent) => {
                const info = AGENT_CONFIG[agent.id] || {
                  icon: Bot,
                  color: "#00D4FF",
                  bgSoft: "rgba(0, 212, 255, 0.1)",
                  borderSoft: "rgba(0, 212, 255, 0.2)",
                  simpleName: agent.name,
                  tagline: agent.role,
                  description: agent.description,
                  actionText: "Run Agent",
                };

                const Icon = info.icon;
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
                    className={`p-5 rounded-2xl flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected ? "ring-2 ring-cyan-400" : "hover:border-cyan-500/40"
                    }`}
                    style={{
                      background: isSelected ? "rgba(10, 22, 46, 0.95)" : "rgba(8, 14, 28, 0.8)",
                      border: `1.5px solid ${
                        isSelected ? "#00D4FF" : "rgba(0, 212, 255, 0.18)"
                      }`,
                      boxShadow: isSelected
                        ? "0 0 28px rgba(0, 212, 255, 0.35), 0 4px 18px rgba(0, 0, 0, 0.4)"
                        : "0 4px 18px rgba(0, 0, 0, 0.35)",
                    }}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start gap-3 mb-2.5">
                        <div
                          className="p-2.5 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: info.bgSoft,
                            border: `1px solid ${info.borderSoft}`,
                            color: info.color,
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[14.5px] font-bold text-white tracking-tight leading-snug">
                                {info.simpleName}
                              </h3>
                              {isSelected && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-400 text-slate-950">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            <StatusPill status={currentStatus} />
                          </div>
                          <p className="text-[11.5px] font-mono mt-0.5" style={{ color: info.color }}>
                            {info.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Description (fixed height for balance across cards) */}
                      <p className="text-[12.5px] text-slate-300 leading-relaxed mb-3 min-h-[40px]">
                        {info.description}
                      </p>

                      {/* Latest Result Highlight Chip (Clean, Uncluttered, No text clipping) */}
                      <div
                        className="p-3 rounded-xl text-[12px] min-h-[56px] flex flex-col justify-center mb-3"
                        style={{
                          background: run ? "rgba(0, 212, 255, 0.05)" : "rgba(0, 0, 0, 0.35)",
                          border: `1px solid ${run ? "rgba(0, 212, 255, 0.15)" : "rgba(255, 255, 255, 0.05)"}`,
                        }}
                      >
                        {run ? (
                          <>
                            <div className="flex items-start gap-1.5 text-slate-200 font-medium leading-snug">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                              <span className="line-clamp-2">{run.summary}</span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-1.5 pl-3">
                              {formatWhen(run.created_at)} · {formatDuration(run.duration_ms)}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 text-[11.5px] flex items-center gap-1.5 italic">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Not run yet on this case. Click below to start.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Strip — Always pinned to bottom */}
                    <div
                      className="pt-3.5 mt-auto flex items-center justify-between gap-2 border-t"
                      style={{ borderColor: "rgba(0, 212, 255, 0.10)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        id={`btn-run-${agent.id}`}
                        disabled={busy}
                        onClick={() => runAgent(agent.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: isRunning ? "rgba(0, 212, 255, 0.3)" : "rgba(0, 212, 255, 0.15)",
                          border: "1px solid rgba(0, 212, 255, 0.4)",
                          boxShadow: isRunning ? "none" : "0 0 10px rgba(0, 212, 255, 0.12)",
                        }}
                      >
                        {isRunning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        ) : (
                          <Play className="w-3 h-3 fill-current text-cyan-400" />
                        )}
                        <span>{isRunning ? "Analyzing…" : run ? "Run Again" : info.actionText}</span>
                      </button>

                      {run && (
                        <button
                          type="button"
                          id={`btn-inspect-${agent.id}`}
                          onClick={() => setSelectedAgentId((prev) => (prev === agent.id ? null : agent.id))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,212,255,0.4)]"
                              : "text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30"
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {isSelected ? "Hide Report" : `View Report ${findingsCount > 0 ? `(${findingsCount})` : ""}`}
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ── ACTIVE AGENT INSPECTION & FINDINGS PANEL ─────────────────── */}
          <div ref={inspectorRef}>
            {activeAgentData && (
              <AgentInspectorPanel
                agent={activeAgentData.agent}
                run={activeAgentData.run}
                onClose={() => setSelectedAgentId(null)}
                onRun={runAgent}
                busy={busy}
              />
            )}
          </div>

          {/* ── Section: Activity Log & Audit Trail ──────────────────────── */}
          <section
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8, 14, 28, 0.8)",
              border: "1px solid rgba(0, 212, 255, 0.18)",
              boxShadow: "0 6px 24px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b"
              style={{ borderColor: "rgba(0, 212, 255, 0.12)" }}
            >
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Investigation History &amp; Audit Log</span>
                  <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25">
                    {runs.length} {runs.length === 1 ? "run" : "runs"}
                  </span>
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Click any past run to inspect its detailed findings and recommendations above.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setHistoryFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                    historyFilter === "all"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-black/40 text-slate-400 hover:text-white"
                  }`}
                >
                  All Runs
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("completed")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                    historyFilter === "completed"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-black/40 text-slate-400 hover:text-white"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("attention")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                    historyFilter === "attention"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-black/40 text-slate-400 hover:text-white"
                  }`}
                >
                  Needs Attention
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px] text-left">
                <thead>
                  <tr
                    className="text-slate-400 text-[10.5px] font-mono uppercase tracking-wider"
                    style={{ background: "rgba(0, 0, 0, 0.3)" }}
                  >
                    <th className="px-4 py-2.5">Date &amp; Time</th>
                    <th className="px-4 py-2.5">Agent</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">What was found</th>
                    <th className="px-4 py-2.5 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(0, 212, 255, 0.08)" }}>
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No agent run history found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.slice(0, 20).map((r) => {
                      const isSelected = selectedAgentId === r.agent_id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedAgentId(r.agent_id)}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? "bg-cyan-500/15 font-medium" : "hover:bg-cyan-500/10"
                          }`}
                          title="Click to inspect this agent's report"
                        >
                          <td className="px-4 py-2.5 text-slate-400 font-mono whitespace-nowrap">
                            {formatWhen(r.created_at)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-white font-medium">
                              {r.parent_run_id ? <span className="text-cyan-400">↳</span> : null}
                              <span>{r.agent_name}</span>
                              {isSelected ? (
                                <span className="text-[10px] font-mono text-cyan-400 font-bold ml-1">
                                  ● ACTIVE
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <StatusPill status={r.status} />
                          </td>
                          <td className="px-4 py-2.5 text-slate-300 leading-relaxed max-w-md">
                            {r.summary}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-400 whitespace-nowrap">
                            {formatDuration(r.duration_ms)}
                          </td>
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
    </div>
  );
}