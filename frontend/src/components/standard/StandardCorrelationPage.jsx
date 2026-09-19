import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../../api/client";
import NetworkGraph from "../NetworkGraph";
import {
  Breadcrumb,
  PageHeader,
  Panel,
  Notice,
  RiskBadge,
  StatusBadge,
  TableMessage,
  scamLabel,
  entityTypeLabel,
  formatDate,
  CASE_STATUS_LABELS,
  riskScoreOf,
} from "./StandardUI";

const RISK_RANK = { high: 0, critical: 0, medium: 1, med: 1, low: 2 };

function CaseDetailsPanel({ caseData, caseId }) {
  const v = (x) => (x === null || x === undefined || x === "" ? "—" : x);
  return (
    <Panel id="case-details" title="Case Details" flush>
      <table className="std-kv">
        <caption className="std-visually-hidden">Case details</caption>
        <tbody>
          <tr>
            <th scope="row">Case Number</th>
            <td className="std-id">{v(caseData?.case_number || `#${caseId}`)}</td>
            <th scope="row">Status</th>
            <td>{caseData ? CASE_STATUS_LABELS[caseData.status] || v(caseData.status) : "—"}</td>
          </tr>
          <tr>
            <th scope="row">Complainant (Victim)</th>
            <td>{v(caseData?.victim_name)}</td>
            <th scope="row">Risk Level</th>
            <td>{caseData?.risk_level ? <RiskBadge level={caseData.risk_level} /> : "—"}</td>
          </tr>
          <tr>
            <th scope="row">Category</th>
            <td>{caseData ? scamLabel(caseData.scam_type) : "—"}</td>
            <th scope="row">Risk Score</th>
            <td>{caseData && caseData.risk_score !== null && caseData.risk_score !== undefined ? `${riskScoreOf(caseData)} / 100` : "—"}</td>
          </tr>
          <tr>
            <th scope="row">District</th>
            <td>{v(caseData?.district)}</td>
            <th scope="row">Registered On</th>
            <td>{formatDate(caseData?.registered_at)}</td>
          </tr>
          <tr>
            <th scope="row">Registered By</th>
            <td>{v(caseData?.registered_by_name)}</td>
            <th scope="row">Police Station</th>
            <td>{v(caseData?.station_name)}</td>
          </tr>
          <tr>
            <th scope="row">Grounds for Flagging</th>
            <td colSpan={3}>{v(caseData?.why_flagged)}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );
}

function SummaryTable({ nodes, edges }) {
  const cells = [
    { label: "Total Entities", value: nodes.length },
    { label: "Total Connections", value: edges.length },
    { label: "High-Risk Entities", value: nodes.filter((n) => (n.risk_level || "").toLowerCase() === "high").length, alert: true },
    { label: "Cross-Case Links", value: edges.filter((e) => e.extra?.cross_case).length },
  ];
  return (
    <table className="std-stats">
      <caption className="std-visually-hidden">Correlation summary</caption>
      <thead>
        <tr>{cells.map((c) => <th key={c.label} scope="col">{c.label}</th>)}</tr>
      </thead>
      <tbody>
        <tr>
          {cells.map((c) => (
            <td key={c.label}>
              <span className={`std-stats__value${c.alert && c.value > 0 ? " std-stats__value--alert" : ""}`}>{c.value}</span>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function EntityRegister({ nodes, edges, isLoading }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const rows = useMemo(() => {
    const counts = {};
    edges.forEach((e) => {
      counts[e.source] = (counts[e.source] || 0) + 1;
      counts[e.target] = (counts[e.target] || 0) + 1;
    });
    return nodes
      .map((n) => ({ ...n, connections: counts[n.id] || n.degree || 0 }))
      .sort((a, b) => {
        const ra = RISK_RANK[(a.risk_level || "low").toLowerCase()] ?? 3;
        const rb = RISK_RANK[(b.risk_level || "low").toLowerCase()] ?? 3;
        return ra - rb || b.connections - a.connections;
      });
  }, [nodes, edges]);

  const types = [...new Set(nodes.map((n) => n.entity_type))];
  const shown = rows.filter(
    (n) =>
      (typeFilter === "all" || n.entity_type === typeFilter) &&
      (riskFilter === "all" || (n.risk_level || "").toLowerCase() === riskFilter)
  );

  return (
    <Panel id="entity-register" title="Entity Register" meta={isLoading ? "Loading…" : `${shown.length} of ${rows.length} entities`} flush>
      <div className="std-toolbar">
        <label htmlFor="std-ent-type">Entity type:</label>
        <select id="std-ent-type" className="std-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{entityTypeLabel(t)}</option>)}
        </select>
        <label htmlFor="std-ent-risk">Risk level:</label>
        <select id="std-ent-risk" className="std-select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="all">All levels</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="std-table-wrap std-table-wrap--scroll">
        <table className="std-table">
          <caption className="std-visually-hidden">Entities identified in this case</caption>
          <thead>
            <tr>
              <th scope="col">S.No.</th>
              <th scope="col">Entity Type</th>
              <th scope="col">Identifier</th>
              <th scope="col">Risk Level</th>
              <th scope="col" className="num">Connections</th>
              <th scope="col">Source</th>
              <th scope="col">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={7}>Loading entity register…</TableMessage>
            ) : shown.length === 0 ? (
              <TableMessage colSpan={7}>No entities match the selected filters.</TableMessage>
            ) : (
              shown.map((n, i) => (
                <tr key={n.id}>
                  <td>{i + 1}</td>
                  <td className="nowrap">{entityTypeLabel(n.entity_type)}</td>
                  <td className="std-mono" style={{ wordBreak: "break-all" }}>{n.label}</td>
                  <td><RiskBadge level={n.risk_level} /></td>
                  <td className="num">{n.connections}</td>
                  <td className="nowrap">{n.is_cross_case ? <StatusBadge tone="medium">Other case</StatusBadge> : "This case"}</td>
                  <td>{n.anomaly_reason || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ConnectionRegister({ nodes, edges, isLoading }) {
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const rows = useMemo(() => [...edges].sort((a, b) => (b.confidence || 0) - (a.confidence || 0)), [edges]);
  const label = (id) => {
    const n = byId[id];
    return n ? (
      <>
        <span className="std-faint" style={{ fontSize: "0.75rem" }}>{entityTypeLabel(n.entity_type)}</span>
        <br />
        <span className="std-mono" style={{ wordBreak: "break-all" }}>{n.label}</span>
      </>
    ) : `Entity ${id}`;
  };

  return (
    <Panel id="connection-register" title="Connection Register" meta={isLoading ? "Loading…" : `${rows.length} linked pair(s), highest confidence first`} flush>
      <div className="std-table-wrap std-table-wrap--scroll">
        <table className="std-table">
          <caption className="std-visually-hidden">Connections between entities</caption>
          <thead>
            <tr>
              <th scope="col">S.No.</th>
              <th scope="col">Entity A</th>
              <th scope="col">Entity B</th>
              <th scope="col">Basis of Link</th>
              <th scope="col" className="num">Confidence</th>
              <th scope="col">Cross-Case</th>
              <th scope="col">Evidence Ref.</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={7}>Loading connection register…</TableMessage>
            ) : rows.length === 0 ? (
              <TableMessage colSpan={7}>No connections have been established for this case.</TableMessage>
            ) : (
              rows.map((e, i) => (
                <tr key={e.id ?? i}>
                  <td>{i + 1}</td>
                  <td>{label(e.source)}</td>
                  <td>{label(e.target)}</td>
                  <td>{e.basis || "—"}</td>
                  <td className="num">{e.confidence !== undefined ? `${Math.round(e.confidence * 100)}%` : "—"}</td>
                  <td>{e.extra?.cross_case ? "Yes" : "No"}</td>
                  <td className="std-mono">{e.source_evidence_ids?.length ? e.source_evidence_ids.join(", ") : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function StandardCorrelationPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [allCases, setAllCases] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [graphData, setGraphData] = useState(() => location.state?.preloadedGraph || { nodes: [], edges: [] });
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !(location.state?.preloadedGraph?.nodes?.length > 0));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDiagram, setShowDiagram] = useState(true);
  const [error, setError] = useState(null);

  // Same endpoints and handling as the Analysis Mode page.
  const load = async () => {
    if (!graphData.nodes || graphData.nodes.length === 0) setIsLoading(true);
    setError(null);
    try {
      const caseRes = await apiClient.get(`cases/${caseId}`);
      setCaseData(caseRes);
      setIsLoading(false);
      const [graphRes, summaryRes, allCasesRes] = await Promise.allSettled([
        apiClient.get(`cases/${caseId}/graph`),
        apiClient.get(`cases/${caseId}/summary`),
        apiClient.get("cases"),
      ]);
      if (graphRes.status === "fulfilled" && graphRes.value) {
        setGraphData({ nodes: graphRes.value.nodes || [], edges: graphRes.value.edges || [] });
      }
      if (summaryRes.status === "fulfilled" && summaryRes.value) setSummaryData(summaryRes.value);
      if (allCasesRes.status === "fulfilled" && Array.isArray(allCasesRes.value)) setAllCases(allCasesRes.value);
    } catch (err) {
      setError(err.message || "Failed to load graph data for this case.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [caseId]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      setSummaryData(await apiClient.post(`cases/${caseId}/summary/regenerate`));
    } catch (err) {
      console.error("Failed to regenerate AI summary:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const caseNo = caseData?.case_number || `#${caseId}`;
  const { nodes, edges } = graphData;

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Cases", to: "/" }, { label: caseNo }, { label: "Correlation & Graph" }]} />

      <PageHeader
        title={`Case ${caseNo} — Correlation & Network Analysis`}
        subtitle="Multi-hop correlation of entities identified across all ingested evidence."
        actions={
          <>
            {allCases.length > 1 && (
              <>
                <label htmlFor="std-case-switch" className="std-visually-hidden">Switch case</label>
                <select id="std-case-switch" className="std-select" value={caseId} onChange={(e) => navigate(`/cases/${e.target.value}/graph`)}>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id}>{c.case_number} ({c.victim_name})</option>
                  ))}
                </select>
              </>
            )}
            <Link className="std-btn std-btn--secondary" to="/">Back to Dashboard</Link>
            <Link className="std-btn" to={`/cases/${caseId}/reports`}>Generate Reports</Link>
          </>
        }
      />

      {error && <Notice tone="danger" title="Unable to load case data">{error}</Notice>}

      <CaseDetailsPanel caseData={caseData} caseId={caseId} />
      <SummaryTable nodes={nodes} edges={edges} />

      <Panel
        id="case-narrative"
        title="System-Generated Case Narrative"
        meta={
          <button type="button" className="std-btn std-btn--secondary std-btn--sm" onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating ? "Regenerating…" : "Regenerate Narrative"}
          </button>
        }
        footer="Advisory only: this narrative is machine-generated from ingested evidence and must be verified by the Investigating Officer before any action is taken."
      >
        {summaryData ? (
          <>
            <p className="std-prose" style={{ marginTop: 0 }}>{summaryData.narrative_text}</p>
            {summaryData.key_takeaways?.length > 0 && (
              <>
                <p className="std-label" style={{ marginTop: "0.9rem" }}>Key Directives</p>
                <ul className="std-list">
                  {summaryData.key_takeaways.map((k, i) => <li key={i}>{k}</li>)}
                </ul>
              </>
            )}
            <p className="std-hint" style={{ marginTop: "0.9rem" }}>
              Generated via {summaryData.model_version || "Deterministic Narrative"}
              {summaryData.generated_at ? ` at ${new Date(summaryData.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}.
            </p>
          </>
        ) : (
          <p style={{ margin: 0 }} className="std-muted">
            No correlation narrative has been generated yet. Upload multi-source evidence and run correlation to generate a brief.
          </p>
        )}
      </Panel>

      <EntityRegister nodes={nodes} edges={edges} isLoading={isLoading} />
      <ConnectionRegister nodes={nodes} edges={edges} isLoading={isLoading} />

      <Panel
        id="network-diagram"
        title="Figure 1: Network Diagram"
        meta={
          <button type="button" className="std-btn std-btn--secondary std-btn--sm" aria-expanded={showDiagram} aria-controls="std-diagram-body" onClick={() => setShowDiagram(!showDiagram)}>
            {showDiagram ? "Hide diagram" : "Show diagram"}
          </button>
        }
        flush
      >
        <div id="std-diagram-body" hidden={!showDiagram}>
          {isLoading ? (
            <p className="std-muted" style={{ padding: "0.9rem", margin: 0 }}>Loading diagram…</p>
          ) : nodes.length === 0 ? (
            <p className="std-muted" style={{ padding: "0.9rem", margin: 0 }}>No correlated entities are available to plot for this case.</p>
          ) : (
            <div className="std-graph-skin">
              <NetworkGraph nodes={nodes} edges={edges} caseNumber={caseNo} victimName={caseData?.victim_name} isLoading={isLoading} />
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
