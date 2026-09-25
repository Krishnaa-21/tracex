import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient from "../api/client";

/** Backend timestamps are naive UTC — make sure the browser reads them as UTC. */
export const parseUtc = (value) => {
  if (!value) return null;
  const s = String(value);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
};

export const formatWhen = (value) => {
  const d = parseUtc(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
};

export const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
};

export const ORCHESTRATOR_ID = "case_orchestrator";

export const STATUS_LABELS = {
  completed: "Completed",
  attention: "Needs attention",
  failed: "Failed",
  halted: "Halted",
  running: "Running",
  skipped: "Skipped",
  idle: "Not run yet",
};

/**
 * Data + actions for the AI Agents pages (both display modes).
 * Talks only to the /agents endpoints and the existing /cases list.
 */
export function useAgents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState([]);
  const [cases, setCases] = useState([]);
  const [runs, setRuns] = useState([]);
  const [runningId, setRunningId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const caseParam = searchParams.get("case");
  const caseId = caseParam || (cases[0] ? String(cases[0].id) : null);
  const selectedCase = cases.find((c) => String(c.id) === String(caseId)) || null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [agentsRes, casesRes] = await Promise.allSettled([apiClient.get("agents"), apiClient.get("cases")]);
      if (cancelled) return;
      if (agentsRes.status === "fulfilled" && Array.isArray(agentsRes.value)) setAgents(agentsRes.value);
      else setError("Unable to load the agent catalogue.");
      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) setCases(casesRes.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadRuns = useCallback(async () => {
    if (!caseId) {
      setRuns([]);
      return;
    }
    try {
      setRuns(await apiClient.get(`cases/${caseId}/agents/runs?limit=40`));
    } catch (err) {
      setError(err.message || "Unable to load agent history.");
    }
  }, [caseId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const selectCase = (id) => setSearchParams({ case: String(id) }, { replace: true });

  const runAgent = async (agentId) => {
    if (!caseId || runningId) return;
    setRunningId(agentId);
    setError(null);
    try {
      await apiClient.post(`cases/${caseId}/agents/${agentId}/run`);
      await loadRuns();
      // Agents can change risk score / status / district — keep the case picker current.
      const fresh = await apiClient.get("cases");
      if (Array.isArray(fresh)) setCases(fresh);
      window.dispatchEvent(new CustomEvent("tracex_case_created"));
    } catch (err) {
      setError(err.message || "The agent run failed.");
    } finally {
      setRunningId(null);
    }
  };

  // Newest run per agent (child runs from the orchestrator count too).
  const latestByAgent = useMemo(() => {
    const map = {};
    runs.forEach((r) => {
      if (!map[r.agent_id]) map[r.agent_id] = r;
    });
    return map;
  }, [runs]);

  return { agents, cases, runs, loading, error, caseId, selectedCase, selectCase, runAgent, runningId, latestByAgent };
}
