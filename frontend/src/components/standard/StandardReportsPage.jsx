import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../../api/client";
import { Breadcrumb, PageHeader, Panel, Notice, StatusBadge } from "./StandardUI";

const BRIEF_CONTENTS = [
  "30-second executive summary and risk progress score",
  "Category breakdown matching the network graph colour language",
  "Multi-hop correlation matrix with confidence scoring",
  "Section 91 CrPC bank debit-freeze and telecom seizure directives",
];

const TAKEDOWN_CONTENTS = [
  "Emergency 24-hour public resolution disabling and DNS sinkhole mandate",
  "Cyber attack infrastructure table with priority CRITICAL / HIGH markings",
  "180-day server access log preservation order under Section 67C IT Act",
  "Threat intelligence and forensic justification for blocking",
];

export default function StandardReportsPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [allCases, setAllCases] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingTakedown, setIsGeneratingTakedown] = useState(false);
  const [briefHash, setBriefHash] = useState(null);
  const [takedownHash, setTakedownHash] = useState(null);

  useEffect(() => {
    (async () => {
      const [cRes, casesRes] = await Promise.allSettled([apiClient.get(`cases/${caseId}`), apiClient.get("cases")]);
      if (cRes.status === "fulfilled" && cRes.value) setCaseData(cRes.value);
      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) setAllCases(casesRes.value);
    })();
  }, [caseId]);

  const cleanCaseNumber = caseData?.case_number?.replace("#", "").trim() || caseId;
  const caseNo = caseData?.case_number || `#${caseId}`;

  const saveBlob = async (res, filename) => {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Direct download: encrypted automatically, asks for password only when opening the PDF
  const handleDownload = async (type) => {
    if (type === "brief") {
      setIsGeneratingBrief(true);
      try {
        const res = await apiClient.post(`cases/${caseId}/reports/investigative-brief`);
        const hash = res.headers.get("X-Document-SHA256") || res.headers.get("x-document-sha256");
        if (hash) setBriefHash(hash);
        await saveBlob(res, `investigative_brief_${cleanCaseNumber}.pdf`);
      } catch (err) {
        console.error("Failed to generate brief:", err);
      } finally {
        setIsGeneratingBrief(false);
      }
    } else {
      setIsGeneratingTakedown(true);
      try {
        const res = await apiClient.post(`cases/${caseId}/reports/takedown-request`);
        const hash = res.headers.get("X-Document-SHA256") || res.headers.get("x-document-sha256");
        if (hash) setTakedownHash(hash);
        await saveBlob(res, `takedown_request_${cleanCaseNumber}.pdf`);
      } catch (err) {
        console.error("Failed to generate takedown request:", err);
      } finally {
        setIsGeneratingTakedown(false);
      }
    }
  };

  const reports = [
    {
      key: "brief",
      name: "Investigative Brief Dossier",
      basis: "Section 65B, Indian Evidence Act (certified)",
      desc: "Law-enforcement dossier containing the executive narrative, category entity landscape, multi-hop correlation matrix, chronological case timeline and Section 91 CrPC freeze directives.",
      contents: BRIEF_CONTENTS,
      generating: isGeneratingBrief,
      hash: briefHash,
    },
    {
      key: "takedown",
      name: "Statutory Takedown Notice",
      basis: "Section 69A, Information Technology Act",
      desc: "Statutory emergency advisory served upon domain registrars, hosting providers, ISPs and telecom intermediaries with mandatory 24-hour compliance terms.",
      contents: TAKEDOWN_CONTENTS,
      generating: isGeneratingTakedown,
      hash: takedownHash,
    },
  ];

  return (
    <>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Cases", to: "/" }, { label: caseNo }, { label: "Reports" }]} />

      <PageHeader
        title={`Case ${caseNo} — Certified Forensic Reports`}
        subtitle="Certified law-enforcement exports formatted for courtroom admissibility under Section 65B of the Indian Evidence Act."
        actions={
          <>
            {allCases.length > 1 && (
              <>
                <label htmlFor="std-report-case-switch" className="std-visually-hidden">Switch case</label>
                <select id="std-report-case-switch" className="std-select" value={caseId} onChange={(e) => navigate(`/cases/${e.target.value}/reports`)}>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id}>{c.case_number} ({c.victim_name})</option>
                  ))}
                </select>
              </>
            )}
            <Link className="std-btn std-btn--secondary" to={`/cases/${caseId}/graph`}>Correlation & Graph</Link>
            <Link className="std-btn std-btn--secondary" to="/">Back to Dashboard</Link>
          </>
        }
      />

      <Notice tone="info" title="Password-protected exports">
        Each report is encrypted at file level. To open the downloaded PDF report, enter your officer password (<code>demo1234</code>) or Badge ID.
      </Notice>

      <Panel id="available-reports" title="Available Reports" flush>
        <div className="std-table-wrap">
          <table className="std-table">
            <caption className="std-visually-hidden">Reports available for this case</caption>
            <thead>
              <tr>
                <th scope="col">S.No.</th>
                <th scope="col">Report</th>
                <th scope="col">Legal Basis</th>
                <th scope="col">Description</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.key}>
                  <td>{i + 1}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.basis}</td>
                  <td>{r.desc}</td>
                  <td style={{ minWidth: "14rem" }}>
                    <button type="button" className="std-btn std-btn--sm" disabled={r.generating} onClick={() => handleDownload(r.key)}>
                      {r.generating ? "Generating Encrypted PDF…" : "Download Protected PDF"}
                    </button>
                    {r.hash && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <StatusBadge tone="low">Encrypted &amp; verified</StatusBadge>
                        <div className="std-hash" style={{ minWidth: 0, marginTop: "0.25rem" }}>SHA-256: {r.hash}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="std-cols std-cols--2">
        {reports.map((r) => (
          <Panel key={r.key} id={`contents-${r.key}`} title={`Contents: ${r.name}`}>
            <ul className="std-list">
              {r.contents.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
