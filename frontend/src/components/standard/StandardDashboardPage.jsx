import React, { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import apiClient, { getOfficer, setOfficer } from "../../api/client";
import {
  Breadcrumb,
  PageHeader,
  Panel,
  Notice,
  RiskBadge,
  StatusBadge,
  TableMessage,
  riskScoreOf,
  scamLabel,
  formatDate,
  EVIDENCE_CATEGORY_LABELS,
} from "./StandardUI";

/* ── Evidence processing status → formal label / tone ─────────────────── */
const EVIDENCE_STATUS = {
  queued: { label: "Queued", tone: "neutral" },
  pending: { label: "Pending", tone: "medium" },
  processing: { label: "Processing", tone: "info" },
  completed: { label: "Indexed", tone: "low" },
  indexed: { label: "Indexed", tone: "low" },
  error: { label: "Error", tone: "high" },
  failed: { label: "Error", tone: "high" },
};

/* ── 1. Headline statistics ───────────────────────────────────────────── */
function StatsTable({ stats }) {
  const high = stats.high_risk_cases ?? 0;
  const active = stats.active_cases ?? 0;
  const awaiting = stats.awaiting_correlation ?? 0;
  const closed = stats.closed_this_month ?? 0;

  const cells = [
    { label: "High-Risk Cases", value: high, alert: high > 0, note: "Cases rated High risk" },
    { label: "Active Case Load", value: active, note: "Cases not yet closed" },
    { label: "Awaiting Correlation", value: awaiting, alert: awaiting > 0, note: "Evidence uploaded, correlation pending" },
    { label: "Closed This Month", value: closed, note: "Cases closed in the current month" },
  ];

  return (
    <table className="std-stats">
      <caption className="std-visually-hidden">Case summary statistics</caption>
      <thead>
        <tr>
          {cells.map((c) => (
            <th key={c.label} scope="col">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {cells.map((c) => (
            <td key={c.label}>
              <span className={`std-stats__value${c.alert ? " std-stats__value--alert" : ""}`}>{c.value}</span>
              <span className="std-stats__note">
                {c.alert ? <strong>▲ Requires attention — </strong> : null}
                {c.note}
              </span>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/* ── 2. Priority case register ────────────────────────────────────────── */
function CaseRegister({ cases, isLoading, selectedDistrict, onClearDistrict }) {
  const [showAll, setShowAll] = useState(false);

  const filtered = selectedDistrict
    ? cases.filter((c) => (c.district || "").toLowerCase() === selectedDistrict.toLowerCase())
    : cases;
  const ranked = [...filtered].sort((a, b) => riskScoreOf(b) - riskScoreOf(a));
  const displayed = showAll ? ranked : ranked.slice(0, 5);

  const emptyText = !cases.length
    ? "No cases have been registered yet. Use “Register New Case” to begin."
    : "No cases are recorded for the selected district.";

  return (
    <Panel
      id="case-register"
      title={selectedDistrict ? `Priority Case Register — District: ${selectedDistrict}` : "Priority Case Register"}
      meta={isLoading ? "Loading…" : `Showing ${displayed.length} of ${filtered.length} case(s), ranked by risk score`}
      flush
    >
      {(selectedDistrict || ranked.length > 5) && (
        <div className="std-toolbar">
          {selectedDistrict && (
            <>
              <span>
                Filter applied: <strong>{selectedDistrict}</strong>
              </span>
              <button type="button" className="std-btn std-btn--secondary std-btn--sm" onClick={onClearDistrict}>
                Clear filter
              </button>
            </>
          )}
          <span className="std-toolbar__spacer" />
          {ranked.length > 5 && (
            <button type="button" className="std-btn std-btn--secondary std-btn--sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show top 5 only" : `View all ${ranked.length} cases`}
            </button>
          )}
        </div>
      )}

      <div className="std-table-wrap">
        <table className="std-table">
          <caption className="std-visually-hidden">Priority case register</caption>
          <thead>
            <tr>
              <th scope="col">S.No.</th>
              <th scope="col">Case No.</th>
              <th scope="col">Complainant (Victim)</th>
              <th scope="col">Category</th>
              <th scope="col">District</th>
              <th scope="col">Risk Level</th>
              <th scope="col" className="num">Risk Score</th>
              <th scope="col">Grounds for Flagging</th>
              <th scope="col"><span className="std-visually-hidden">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={9}>Loading case register…</TableMessage>
            ) : displayed.length === 0 ? (
              <TableMessage colSpan={9}>{emptyText}</TableMessage>
            ) : (
              displayed.map((c, idx) => (
                <tr key={c.id}>
                  <td>{idx + 1}</td>
                  <td className="nowrap">
                    <Link className="std-link std-id" to={`/cases/${c.id}/graph`}>{c.case_number}</Link>
                  </td>
                  <td>{c.victim_name}</td>
                  <td>{scamLabel(c.scam_type)}</td>
                  <td>{c.district || "Pending"}</td>
                  <td><RiskBadge level={c.risk_level} /></td>
                  <td className="num">
                    {c.risk_score !== null && c.risk_score !== undefined ? `${riskScoreOf(c)} / 100` : "—"}
                  </td>
                  <td>{c.why_flagged || "—"}</td>
                  <td className="nowrap">
                    <Link className="std-btn std-btn--secondary std-btn--sm" to={`/cases/${c.id}/graph`}>
                      View Case
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ── 3. Evidence processing register ──────────────────────────────────── */
function EvidenceRegister({ files, isLoading }) {
  return (
    <Panel
      id="evidence-register"
      title="Evidence Processing Register"
      meta={isLoading ? "Loading…" : `${files.length} file(s) in queue`}
      flush
      footer="Every uploaded file is automatically hashed (SHA-256), parsed and indexed on ingestion to preserve the chain of custody."
    >
      <div className="std-table-wrap std-table-wrap--scroll">
        <table className="std-table">
          <caption className="std-visually-hidden">Evidence files awaiting processing</caption>
          <thead>
            <tr>
              <th scope="col">S.No.</th>
              <th scope="col">File Name</th>
              <th scope="col">Case No.</th>
              <th scope="col">Category</th>
              <th scope="col" className="num">Rows</th>
              <th scope="col">SHA-256 Hash</th>
              <th scope="col">Status</th>
              <th scope="col">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={8}>Loading evidence register…</TableMessage>
            ) : files.length === 0 ? (
              <TableMessage colSpan={8}>No evidence files are awaiting processing.</TableMessage>
            ) : (
              files.map((f, idx) => {
                const statusKey = String(f.upload_status || f.status || "pending").toLowerCase();
                const status = EVIDENCE_STATUS[statusKey] || EVIDENCE_STATUS.pending;
                const category = f.evidence_category || f.file_type;
                return (
                  <tr key={f.id || idx}>
                    <td>{idx + 1}</td>
                    <td className="std-mono" style={{ wordBreak: "break-all" }}>
                      {f.original_filename || f.filename || f.name || `evidence-${idx + 1}`}
                    </td>
                    <td className="nowrap std-id">{f.case_number || "—"}</td>
                    <td>{EVIDENCE_CATEGORY_LABELS[category] || (category ? String(category).toUpperCase() : "—")}</td>
                    <td className="num">{f.row_count ?? "—"}</td>
                    <td className="std-hash">{f.sha256_hash || f.sha256 || f.hash || "Hash pending"}</td>
                    <td><StatusBadge tone={status.tone}>{status.label}</StatusBadge></td>
                    <td className="nowrap">{formatDate(f.uploaded_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ── 4. District-wise case distribution ───────────────────────────────── */
function DistrictDistribution({ heatmap, isLoading, selectedDistrict, onSelectDistrict }) {
  const [filterLevel, setFilterLevel] = useState("all");

  const rows = (heatmap || [])
    .filter((item) => filterLevel === "all" || (item.level || "").toLowerCase() === filterLevel)
    .sort((a, b) => b.case_count - a.case_count);
  const top = [...(heatmap || [])].sort((a, b) => b.case_count - a.case_count)[0];

  return (
    <Panel
      id="district-distribution"
      title="District-wise Case Distribution"
      meta="Jurisdictional fraud density"
      flush
      footer="Density levels — Low: 1–2 cases · Medium: 3–5 cases · High: 6 or more cases. District resolution uses locally bundled IFSC and postal PIN lookups (no external services)."
    >
      <div className="std-toolbar">
        <span>
          {isLoading ? (
            "Loading district telemetry…"
          ) : top ? (
            <>
              Primary concentration in <strong>{top.district}</strong> ({top.case_count} case{top.case_count === 1 ? "" : "s"}) across{" "}
              {heatmap.length} jurisdiction{heatmap.length === 1 ? "" : "s"}.
            </>
          ) : (
            "District data is resolved from static IFSC and postal PIN databases."
          )}
        </span>
        <span className="std-toolbar__spacer" />
        <label htmlFor="std-density-filter">Density level:</label>
        <select id="std-density-filter" className="std-select" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
          <option value="all">All levels</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="std-table-wrap">
        <table className="std-table">
          <caption className="std-visually-hidden">Cases by district</caption>
          <thead>
            <tr>
              <th scope="col">S.No.</th>
              <th scope="col">District</th>
              <th scope="col" className="num">Cases</th>
              <th scope="col">Density Level</th>
              <th scope="col" style={{ width: "22%" }}>Relative Share</th>
              <th scope="col">Filter</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={6}>Loading district distribution…</TableMessage>
            ) : rows.length === 0 ? (
              <TableMessage colSpan={6}>No district data available for the selected density level.</TableMessage>
            ) : (
              rows.map((item, idx) => {
                const isSelected = selectedDistrict?.toLowerCase() === item.district.toLowerCase();
                const percent = Math.min(100, Math.round((item.case_count / Math.max(1, top?.case_count || 1)) * 100));
                return (
                  <tr key={item.district} className={isSelected ? "is-selected" : undefined}>
                    <td>{idx + 1}</td>
                    <td><strong>{item.district}</strong></td>
                    <td className="num">{item.case_count}</td>
                    <td><RiskBadge level={item.level || "low"} /></td>
                    <td>
                      <span className="std-bar" role="img" aria-label={`${percent}% of the highest district count`}>
                        <span style={{ width: `${percent}%` }} />
                      </span>
                    </td>
                    <td className="nowrap">
                      <button
                        type="button"
                        className="std-linkbtn"
                        aria-pressed={isSelected}
                        onClick={() => onSelectDistrict(isSelected ? null : item.district)}
                      >
                        {isSelected ? "Clear filter" : "Filter cases"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function StandardDashboardPage() {
  const outletContext = useOutletContext();
  const openNewInvestigation = outletContext?.openNewInvestigation;

  const [officer, setOfficerState] = useState(() => getOfficer() || { name: "Officer", station_name: "MP Cyber Cell" });
  const [stats, setStats] = useState({ high_risk_cases: 0, active_cases: 0, awaiting_correlation: 0, closed_this_month: 0 });
  const [cases, setCases] = useState([]);
  const [unprocessedEvidence, setUnprocessedEvidence] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Same endpoints and handling as the Analysis Mode dashboard.
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [meRes, statsRes, casesRes, evidenceRes, heatmapRes] = await Promise.allSettled([
        apiClient.get("auth/me"),
        apiClient.get("cases/summary-stats"),
        apiClient.get("cases"),
        apiClient.get("evidence/unprocessed"),
        apiClient.get("geo/heatmap"),
      ]);

      if (meRes.status === "fulfilled" && meRes.value) {
        setOfficerState(meRes.value);
        setOfficer(meRes.value);
      }
      if (statsRes.status === "fulfilled" && statsRes.value) setStats(statsRes.value);
      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) setCases(casesRes.value);
      if (evidenceRes.status === "fulfilled" && Array.isArray(evidenceRes.value)) setUnprocessedEvidence(evidenceRes.value);
      if (heatmapRes.status === "fulfilled" && Array.isArray(heatmapRes.value)) setHeatmap(heatmapRes.value);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleCaseCreated = () => fetchDashboardData();
    window.addEventListener("tracex_case_created", handleCaseCreated);
    return () => window.removeEventListener("tracex_case_created", handleCaseCreated);
  }, []);

  const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const urgentCase = cases.find((c) => (c.risk_level || "").toLowerCase() === "critical" && c.freeze_recommended);

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Dashboard" }]} />

      <PageHeader
        title="Case Management Dashboard"
        subtitle={
          <>
            {officer.station_name || "Cyber Operations Room"} · Logged in as <strong>{officer.name || "Investigator"}</strong> (Badge ID:{" "}
            <span className="std-mono">{officer.badge_id || "IO"}</span>) · {todayStr}
          </>
        }
        actions={
          <>
            <button type="button" className="std-btn std-btn--secondary" onClick={fetchDashboardData} disabled={isLoading}>
              {isLoading ? "Refreshing…" : "Refresh Data"}
            </button>
            <button type="button" className="std-btn" onClick={openNewInvestigation}>
              + Register New Case
            </button>
          </>
        }
      />

      {urgentCase && (
        <Notice
          tone="danger"
          title={`URGENT ACTION REQUIRED — Case ${urgentCase.case_number} (${urgentCase.victim_name})`}
          action={
            <Link className="std-btn std-btn--sm" to={`/cases/${urgentCase.id}/graph`}>
              Take Action
            </Link>
          }
        >
          Freeze action is recommended.{urgentCase.why_flagged ? ` ${urgentCase.why_flagged}` : ""}
        </Notice>
      )}

      <StatsTable stats={stats} />

      <CaseRegister
        cases={cases}
        isLoading={isLoading}
        selectedDistrict={selectedDistrict}
        onClearDistrict={() => setSelectedDistrict(null)}
      />

      <EvidenceRegister files={unprocessedEvidence} isLoading={isLoading} />

      <DistrictDistribution
        heatmap={heatmap}
        isLoading={isLoading}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
      />
    </>
  );
}
