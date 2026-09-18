import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, RefreshCw, Shield, Layers } from "lucide-react";
import apiClient, { getOfficer, setOfficer } from "../api/client";
import UrgentBanner from "../components/UrgentBanner";
import StatRow from "../components/StatRow";
import PriorityTable from "../components/PriorityTable";
import EvidenceTray from "../components/EvidenceTray";
import HeatmapGrid from "../components/HeatmapGrid";

export default function Home() {
  // Use global openNewInvestigation handler from AppRouter
  const outletContext = useOutletContext();
  const openNewInvestigation = outletContext?.openNewInvestigation;

  const [officer, setOfficerState] = useState(() => getOfficer() || { name: "Officer", station_name: "MP Cyber Cell" });
  const [stats, setStats] = useState({
    high_risk_cases: 0,
    active_cases: 0,
    awaiting_correlation: 0,
    closed_this_month: 0,
  });
  const [cases, setCases] = useState([]);
  const [unprocessedEvidence, setUnprocessedEvidence] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

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

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value);
      }

      if (casesRes.status === "fulfilled" && Array.isArray(casesRes.value)) {
        setCases(casesRes.value);
      }

      if (evidenceRes.status === "fulfilled" && Array.isArray(evidenceRes.value)) {
        setUnprocessedEvidence(evidenceRes.value);
      }

      if (heatmapRes.status === "fulfilled" && Array.isArray(heatmapRes.value)) {
        setHeatmap(heatmapRes.value);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for case creation events from modal
    const handleCaseCreated = () => fetchDashboardData();
    window.addEventListener("tracex_case_created", handleCaseCreated);
    return () => window.removeEventListener("tracex_case_created", handleCaseCreated);
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">
      {/* 1. Header — operations room status line */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5" style={{ borderBottom: "1px solid rgba(0,212,255,0.10)" }}>
        <div>
          {/* Date + system status */}
          <div className="flex items-center gap-3 mb-2">
            <div className="text-[10.5px] font-mono uppercase tracking-widest" style={{ color: "rgba(0,212,255,0.45)" }}>
              {todayStr}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#10B981", boxShadow: "0 0 6px rgba(16,185,129,0.90)", animation: "pulse-glow 2s ease-in-out infinite" }}
              />
              <span className="text-[9.5px] font-mono tracking-widest uppercase" style={{ color: "rgba(16,185,129,0.70)" }}>SYSTEM ONLINE</span>
            </div>
          </div>

          <h1
            className="text-[28px] font-display font-bold tracking-tight leading-none"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {officer.station_name || "Bhopal Cyber Operations Room"}
          </h1>
          <p className="text-[13px] text-textDim mt-2">
            Logged in as{" "}
            <span className="font-semibold text-text">{officer.name || "Investigator"}</span>
            <span className="font-mono text-[11px] ml-2 px-1.5 py-0.5 rounded" style={{ color: "rgba(0,212,255,0.60)", background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.15)" }}>
              {officer.badge_id || "IO"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh operational telemetry"
            className="p-2 rounded transition-all cursor-pointer"
            style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.18)", color: "rgba(0,212,255,0.60)" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 12px rgba(0,212,255,0.20)"; e.currentTarget.style.color = "#00D4FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.color = "rgba(0,212,255,0.60)"; }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} style={{ color: isLoading ? "#00D4FF" : undefined }} />
          </button>
          <button
            onClick={openNewInvestigation}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded transition-all cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #007FA8 0%, #004F80 100%)",
              border: "1px solid rgba(0,212,255,0.40)",
              color: "#fff",
              boxShadow: "0 0 16px rgba(0,212,255,0.18)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 28px rgba(0,212,255,0.40)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 16px rgba(0,212,255,0.18)")}
          >
            <Plus className="w-4 h-4" />
            <span>New investigation</span>
          </button>
        </div>
      </section>

      {/* 2. Urgent Action Banner (renders only if freeze-relevant high-risk case exists) */}
      <UrgentBanner cases={cases} />

      {/* 3. Stat Row (Key incident load metrics) */}
      <section className="border-b border-border pb-4">
        <StatRow stats={stats} />
      </section>

      {/* 4. Top 5 High-Priority Cases Queue */}
      <section className="space-y-3">
        <PriorityTable
          cases={cases}
          isLoading={isLoading}
          selectedDistrict={selectedDistrict}
        />
      </section>

      {/* 5. Ingested Evidence Processing Tray */}
      <section className="space-y-3 pt-2">
        <div className="pb-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-mono uppercase font-semibold tracking-widest" style={{ color: "rgba(0,212,255,0.60)" }}>
              Evidence Ingestion &amp; Indexing Pipeline
            </h2>
            <span
              className="text-[10.5px] font-mono px-2 py-0.5 rounded"
              style={{ color: "rgba(0,212,255,0.50)", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.14)" }}
            >
              {unprocessedEvidence.length} in queue
            </span>
          </div>
          <span className="text-[11px] font-mono" style={{ color: "rgba(0,212,255,0.30)" }}>
            Automatic hashing, parsing &amp; multi-hop extraction
          </span>
        </div>
        <EvidenceTray files={unprocessedEvidence} isLoading={isLoading} />
      </section>

      {/* 6. Jurisdictional Fraud Density Heatmap */}
      <section className="space-y-3 pt-2">
        <div className="pb-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,212,255,0.08)" }}>
          <h2 className="text-[11px] font-mono uppercase font-semibold tracking-widest" style={{ color: "rgba(0,212,255,0.60)" }}>
            Jurisdictional Fraud Density Heatmap
          </h2>
          <span className="text-[11px] font-mono" style={{ color: "rgba(0,212,255,0.30)" }}>
            Click any district to filter priority incidents
          </span>
        </div>
        <HeatmapGrid
          heatmap={heatmap}
          isLoading={isLoading}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(dist) => setSelectedDistrict(dist)}
        />
      </section>
    </div>
  );
}
