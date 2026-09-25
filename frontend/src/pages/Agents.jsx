import React, { useState } from "react";
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
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Pencil,
} from "lucide-react";
import { useAgents, formatWhen, formatDuration, ORCHESTRATOR_ID, STATUS_LABELS } from "../hooks/useAgents";

const ICONS = {
  case_orchestrator: Workflow,
  digital_evidence: FileSearch,
  correlation: Network,
  threat_analysis: ShieldAlert,
  jurisdiction: MapPin,
  investigation_report: FileText,
};

const STATUS_STYLE = {
  completed: { cls: "text-riskLow bg-riskLowBg border-riskLowBorder", Icon: CheckCircle2 },
  attention: { cls: "text-riskMed bg-riskMedBg border-riskMedBorder", Icon: AlertTriangle },
  failed: { cls: "text-riskHigh bg-riskHighBg border-riskHighBorder", Icon: XCircle },
  halted: { cls: "text-riskHigh bg-riskHighBg border-riskHighBorder", Icon: XCircle },
  running: { cls: "text-statusInfo bg-statusInfoBg border-border", Icon: Loader2 },
  skipped: { cls: "text-textFaint bg-bgSubtle border-border", Icon: MinusCircle },
  idle: { cls: "text-textFaint bg-bgSubtle border-border", Icon: MinusCircle },
};

const SEVERITY_CLS = {
  critical: "text-riskHigh bg-riskHighBg border-riskHighBorder",
  high: "text-riskHigh bg-riskHighBg border-riskHighBorder",
  medium: "text-riskMed bg-riskMedBg border-riskMedBorder",
  info: "text-statusInfo bg-statusInfoBg border-border",
};

const STEP_ICON = { ok: CheckCircle2, warn: AlertTriangle, fail: XCircle, skipped: MinusCircle };
const STEP_CLS = { ok: "text-riskLow", warn: "text-riskMed", fail: "text-riskHigh", skipped: "text-textFaint" };

function StatusPill({ status }) {
  const meta = STATUS_STYLE[status] || STATUS_STYLE.idle;
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10.5px] font-semibold uppercase tracking-wide ${meta.cls}`}>
      <Icon className={`w-3 h-3 ${status === "running" ? "animate-spin" : ""}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function RunDetails({ run }) {
  const result = run.result || {};
  const metrics = Object.entries(result.metrics || {}).filter(([, v]) => v !== null && typeof v !== "object");
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3 text-[12px]">
      {result.steps?.length > 0 && (
        <div>
          <p className="text-[10.5px] uppercase tracking-widest text-textFaint mb-1.5">Steps</p>
          <ul className="space-y-1">
            {result.steps.map((s, i) => {
              const Icon = STEP_ICON[s.status] || CheckCircle2;
              return (
                <li key={i} className="flex items-start gap-2">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${STEP_CLS[s.status] || ""}`} />
                  <span className="text-text">
                    <span className="font-medium">{s.name}</span>
                    {s.detail ? <span className="text-textDim"> — {s.detail}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {result.findings?.length > 0 && (
        <div>
          <p className="text-[10.5px] uppercase tracking-widest text-textFaint mb-1.5">Findings</p>
          <ul className="space-y-1.5">
            {result.findings.slice(0, 12).map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`px-1.5 py-px rounded border text-[9.5px] font-bold uppercase flex-shrink-0 mt-0.5 ${SEVERITY_CLS[f.severity] || SEVERITY_CLS.info}`}>{f.severity}</span>
                <span className="text-text">
                  {f.title}
                  {f.detail ? <span className="text-textDim"> — {f.detail}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.recommendations?.length > 0 && (
        <div>
          <p className="text-[10.5px] uppercase tracking-widest text-textFaint mb-1.5">Recommended actions</p>
          <ul className="list-disc pl-4 space-y-1 text-text">
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {metrics.slice(0, 10).map(([k, v]) => (
            <span key={k} className="px-2 py-0.5 rounded bg-bgSubtle border border-border text-[10.5px] text-textDim">
              {k.replace(/[._]/g, " ")}: <span className="text-text font-semibold">{String(v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent, run, running, disabled, onRun }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[agent.id] || Bot;
  const status = running ? "running" : run?.status || "idle";
  const AccessIcon = agent.access === "read_only" ? Lock : Pencil;
  return (
    <div className="p-4 rounded-xl bg-bg border border-border flex flex-col">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accentSoft text-accent border border-accentBorder flex-shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13.5px] font-semibold text-text">{agent.name}</h3>
            <StatusPill status={status} />
          </div>
          <p className="text-[11.5px] text-textDim mt-0.5">{agent.role}</p>
        </div>
      </div>

      <p className="text-[12px] text-textDim leading-relaxed mt-3">{agent.description}</p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bgSubtle border border-border text-[10px] text-textFaint uppercase tracking-wide">
          <AccessIcon className="w-2.5 h-2.5" />
          {agent.access === "read_only" ? "Read-only" : "Updates case data"}
        </span>
        {agent.outputs.map((o) => (
          <span key={o} className="px-2 py-0.5 rounded bg-bgSubtle border border-border text-[10px] text-textFaint">{o}</span>
        ))}
      </div>

      {run && (
        <div className="mt-3 p-2.5 rounded-lg bg-bgSubtle border border-border">
          <p className="text-[12px] text-text">{run.summary}</p>
          <p className="text-[10.5px] text-textFaint mt-1">
            {formatWhen(run.created_at)} · {formatDuration(run.duration_ms)}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto pt-3">
        <button
          type="button"
          onClick={onRun}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-accent text-bg hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {running ? "Running…" : run ? "Run again" : "Run agent"}
        </button>
        {run && (
          <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-[11.5px] text-textDim hover:text-text cursor-pointer">
            {open ? "Hide details" : "View details"}
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      {run && open && <RunDetails run={run} />}
    </div>
  );
}

export default function Agents() {
  const { agents, cases, runs, loading, error, caseId, selectedCase, selectCase, runAgent, runningId, latestByAgent } = useAgents();
  const orchestrator = agents.find((a) => a.id === ORCHESTRATOR_ID);
  const specialists = agents.filter((a) => a.id !== ORCHESTRATOR_ID);
  const orchRun = latestByAgent[ORCHESTRATOR_ID];
  const pipeline = orchRun?.result?.data?.children || [];
  const busy = !!runningId || !caseId;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Bot className="w-5 h-5 text-accent" />
            AI Agents
          </h1>
          <p className="text-[12.5px] text-textDim mt-1 max-w-2xl">
            Specialist agents that inspect a case, explain what they did step by step, and recommend the next action. Every run is
            recorded in the audit trail below. Agents advise — the Investigating Officer decides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="agent-case" className="text-[11.5px] text-textFaint">Case</label>
          <select
            id="agent-case"
            value={caseId || ""}
            onChange={(e) => selectCase(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-[12.5px] text-text"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} ({c.victim_name})
              </option>
            ))}
          </select>
          {caseId && (
            <Link to={`/cases/${caseId}/graph`} className="text-[12px] text-accent hover:underline">
              Open case
            </Link>
          )}
        </div>
      </section>

      {error && (
        <div className="p-3 rounded-lg bg-riskHighBg border border-riskHighBorder text-riskHigh text-[12.5px]">{error}</div>
      )}

      {loading ? (
        <p className="text-textDim text-[13px]">Loading agents…</p>
      ) : cases.length === 0 ? (
        <p className="text-textDim text-[13px]">Register a case first — agents work on a selected case.</p>
      ) : (
        <>
          {orchestrator && (
            <section className="p-5 rounded-xl border border-accentBorder bg-accentSoft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-bg text-accent border border-accentBorder">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[15px] font-semibold text-text">{orchestrator.name}</h2>
                      <StatusPill status={runningId === ORCHESTRATOR_ID ? "running" : orchRun?.status || "idle"} />
                    </div>
                    <p className="text-[12.5px] text-textDim mt-1 max-w-2xl">{orchestrator.description}</p>
                    {orchRun && (
                      <p className="text-[12px] text-text mt-2">
                        {orchRun.summary} <span className="text-textFaint">· {formatWhen(orchRun.created_at)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => runAgent(ORCHESTRATOR_ID)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-accent text-bg hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {runningId === ORCHESTRATOR_ID ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {runningId === ORCHESTRATOR_ID ? "Running pipeline…" : "Run full pipeline"}
                </button>
              </div>

              {pipeline.length > 0 && (
                <ol className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-4">
                  {pipeline.map((c, i) => (
                    <li key={c.agent_id} className="p-2.5 rounded-lg bg-bg border border-border">
                      <p className="text-[10.5px] text-textFaint">Step {i + 1}</p>
                      <p className="text-[12px] font-medium text-text">{c.label}</p>
                      <div className="mt-1.5"><StatusPill status={c.status} /></div>
                    </li>
                  ))}
                </ol>
              )}
              {orchRun && <RunDetails run={orchRun} />}
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {specialists.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                run={latestByAgent[agent.id]}
                running={runningId === agent.id}
                disabled={busy}
                onRun={() => runAgent(agent.id)}
              />
            ))}
          </section>

          <section className="rounded-xl bg-bg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-[13px] font-semibold text-text">Audit trail — {selectedCase?.case_number}</h2>
              <p className="text-[11.5px] text-textFaint">Most recent agent runs for this case.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-textFaint text-[10.5px] uppercase tracking-wide">
                    <th className="px-4 py-2 font-medium">When</th>
                    <th className="px-4 py-2 font-medium">Agent</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Outcome</th>
                    <th className="px-4 py-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-textDim">No agent has run on this case yet.</td>
                    </tr>
                  ) : (
                    runs.slice(0, 15).map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-4 py-2 text-textDim whitespace-nowrap">{formatWhen(r.created_at)}</td>
                        <td className="px-4 py-2 text-text whitespace-nowrap">
                          {r.parent_run_id ? <span className="text-textFaint">↳ </span> : null}
                          {r.agent_name}
                        </td>
                        <td className="px-4 py-2"><StatusPill status={r.status} /></td>
                        <td className="px-4 py-2 text-textDim">{r.summary}</td>
                        <td className="px-4 py-2 text-textDim text-right whitespace-nowrap">{formatDuration(r.duration_ms)}</td>
                      </tr>
                    ))
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
