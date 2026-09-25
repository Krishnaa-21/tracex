import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAgents, formatWhen, formatDuration, ORCHESTRATOR_ID, STATUS_LABELS } from "../../hooks/useAgents";
import { Breadcrumb, PageHeader, Panel, Notice, StatusBadge, TableMessage } from "./StandardUI";

const STATUS_TONE = {
  completed: "low",
  attention: "medium",
  failed: "high",
  halted: "high",
  running: "info",
  skipped: "neutral",
  idle: "neutral",
};

function RunStatus({ status }) {
  return <StatusBadge tone={STATUS_TONE[status] || "neutral"}>{STATUS_LABELS[status] || status}</StatusBadge>;
}

/** Findings / recommendations / steps for one run, shown as formal registers. */
function RunDetails({ run }) {
  const result = run.result || {};
  return (
    <div style={{ marginTop: "0.7rem" }}>
      {result.steps?.length > 0 && (
        <div className="std-table-wrap" style={{ marginBottom: "0.7rem" }}>
          <table className="std-table">
            <caption className="std-visually-hidden">Steps performed</caption>
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">Result</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {result.steps.map((s, i) => (
                <tr key={i}>
                  <td className="nowrap">{s.name}</td>
                  <td>
                    <StatusBadge tone={s.status === "ok" ? "low" : s.status === "warn" ? "medium" : s.status === "fail" ? "high" : "neutral"}>
                      {s.status}
                    </StatusBadge>
                  </td>
                  <td>{s.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.findings?.length > 0 && (
        <div className="std-table-wrap" style={{ marginBottom: "0.7rem" }}>
          <table className="std-table">
            <caption className="std-visually-hidden">Findings</caption>
            <thead>
              <tr>
                <th scope="col">Severity</th>
                <th scope="col">Finding</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {result.findings.map((f, i) => (
                <tr key={i}>
                  <td><StatusBadge tone={f.severity === "info" ? "info" : f.severity}>{f.severity}</StatusBadge></td>
                  <td>{f.title}</td>
                  <td>{f.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.recommendations?.length > 0 && (
        <>
          <p className="std-label">Recommended actions</p>
          <ul className="std-list">
            {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function AgentRow({ agent, run, running, disabled, onRun, expanded, onToggle }) {
  return (
    <>
      <tr className={expanded ? "is-selected" : undefined}>
        <td>
          <strong>{agent.name}</strong>
          <br />
          <span className="std-faint" style={{ fontSize: "0.8125rem" }}>{agent.role}</span>
        </td>
        <td>{agent.access === "read_only" ? "Read-only" : "Updates case data"}</td>
        <td><RunStatus status={running ? "running" : run?.status || "idle"} /></td>
        <td>{run ? formatWhen(run.created_at) : "—"}</td>
        <td className="nowrap">
          <button type="button" className="std-btn std-btn--sm" disabled={disabled} onClick={onRun} style={{ marginRight: "0.4rem" }}>
            {running ? "Running…" : "Run"}
          </button>
          {run && (
            <button type="button" className="std-linkbtn" onClick={onToggle}>
              {expanded ? "Hide" : "Details"}
            </button>
          )}
        </td>
      </tr>
      {expanded && run && (
        <tr>
          <td colSpan={5} style={{ background: "var(--std-surface-alt)" }}>
            <p style={{ margin: "0 0 0.5rem" }}>{run.summary}</p>
            <RunDetails run={run} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function StandardAgentsPage() {
  const { agents, cases, runs, loading, error, caseId, selectedCase, selectCase, runAgent, runningId, latestByAgent } = useAgents();
  const [expandedId, setExpandedId] = useState(null);
  const orchestrator = agents.find((a) => a.id === ORCHESTRATOR_ID);
  const specialists = agents.filter((a) => a.id !== ORCHESTRATOR_ID);
  const orchRun = latestByAgent[ORCHESTRATOR_ID];
  const pipeline = orchRun?.result?.data?.children || [];
  const busy = !!runningId || !caseId;

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "AI Agents" }]} />
      <PageHeader
        title="AI Investigation Agents"
        subtitle="Automated specialist agents that inspect a case and recommend the next action. Every run is logged below for audit. Agents advise; the Investigating Officer decides."
        actions={
          cases.length > 0 && (
            <>
              <label htmlFor="std-agent-case" className="std-visually-hidden">Case</label>
              <select id="std-agent-case" className="std-select" value={caseId || ""} onChange={(e) => selectCase(e.target.value)}>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.case_number} ({c.victim_name})</option>
                ))}
              </select>
              {caseId && <Link className="std-btn std-btn--secondary std-btn--sm" to={`/cases/${caseId}/graph`}>Open Case</Link>}
            </>
          )
        }
      />

      {error && <Notice tone="danger" title="Unable to load agents">{error}</Notice>}

      {loading ? (
        <p className="std-muted">Loading agent catalogue…</p>
      ) : cases.length === 0 ? (
        <Notice tone="info" title="No cases registered">Register a case first — agents run against a selected case.</Notice>
      ) : (
        <>
          {orchestrator && (
            <Panel
              id="orchestrator"
              title={orchestrator.name}
              meta={<RunStatus status={runningId === ORCHESTRATOR_ID ? "running" : orchRun?.status || "idle"} />}
              footer={
                <button type="button" className="std-btn" disabled={busy} onClick={() => runAgent(ORCHESTRATOR_ID)}>
                  {runningId === ORCHESTRATOR_ID ? "Running full pipeline…" : "Run full pipeline"}
                </button>
              }
            >
              <p style={{ marginTop: 0 }}>{orchestrator.description}</p>
              {orchRun && (
                <p>
                  <strong>Last run:</strong> {orchRun.summary} ({formatWhen(orchRun.created_at)}, {formatDuration(orchRun.duration_ms)})
                </p>
              )}
              {pipeline.length > 0 && (
                <div className="std-table-wrap">
                  <table className="std-table">
                    <caption className="std-visually-hidden">Pipeline sequence</caption>
                    <thead>
                      <tr>
                        <th scope="col">Order</th>
                        <th scope="col">Stage</th>
                        <th scope="col">Result</th>
                        <th scope="col">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipeline.map((c, i) => (
                        <tr key={c.agent_id}>
                          <td>{i + 1}</td>
                          <td>{c.label}</td>
                          <td><RunStatus status={c.status} /></td>
                          <td>{c.summary || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )}

          <Panel id="specialist-agents" title="Specialist Agents" meta={`${specialists.length} agent(s)`} flush>
            <div className="std-table-wrap">
              <table className="std-table">
                <caption className="std-visually-hidden">Specialist agent register</caption>
                <thead>
                  <tr>
                    <th scope="col">Agent</th>
                    <th scope="col">Access</th>
                    <th scope="col">Last Result</th>
                    <th scope="col">Last Run</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {specialists.map((agent) => (
                    <AgentRow
                      key={agent.id}
                      agent={agent}
                      run={latestByAgent[agent.id]}
                      running={runningId === agent.id}
                      disabled={busy}
                      onRun={() => runAgent(agent.id)}
                      expanded={expandedId === agent.id}
                      onToggle={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel id="audit-trail" title={`Audit Trail — ${selectedCase?.case_number || ""}`} meta="Most recent agent runs for this case" flush>
            <div className="std-table-wrap std-table-wrap--scroll">
              <table className="std-table">
                <caption className="std-visually-hidden">Agent run audit trail</caption>
                <thead>
                  <tr>
                    <th scope="col">S.No.</th>
                    <th scope="col">When</th>
                    <th scope="col">Agent</th>
                    <th scope="col">Result</th>
                    <th scope="col">Summary</th>
                    <th scope="col" className="num">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <TableMessage colSpan={6}>No agent has run on this case yet.</TableMessage>
                  ) : (
                    runs.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td className="nowrap">{formatWhen(r.created_at)}</td>
                        <td>{r.parent_run_id ? <span className="std-faint">↳ </span> : null}{r.agent_name}</td>
                        <td><RunStatus status={r.status} /></td>
                        <td>{r.summary}</td>
                        <td className="num nowrap">{formatDuration(r.duration_ms)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
