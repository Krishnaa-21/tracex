import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Topbar from "../components/Topbar";
import StandardShell from "../components/standard/StandardShell";
import StandardLogin from "../components/standard/StandardLogin";
import StandardDashboardPage from "../components/standard/StandardDashboardPage";
import StandardCorrelationPage from "../components/standard/StandardCorrelationPage";
import StandardReportsPage from "../components/standard/StandardReportsPage";
import StandardAgentsPage from "../components/standard/StandardAgentsPage";
import ChatWidget from "../components/ChatWidget";
import NewInvestigationModal from "../components/NewInvestigationModal";
import Login from "../pages/Login";
import Home from "../pages/Home";
import ConnectionsGraph from "../pages/ConnectionsGraph";
import Reports from "../pages/Reports";
import Agents from "../pages/Agents";
import { getToken } from "../api/client";
import { useMode } from "../context/ModeContext";

/**
 * Shell layout wrapping authenticated routes with Topbar navigation (no sidebar)
 */
function ShellLayout() {
  const token = getToken();
  const location = useLocation();
  const [isNewInvestigationOpen, setIsNewInvestigationOpen] = useState(false);
  const { isStandardMode } = useMode();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Standard Mode (government portal skin) has its own layout; Analysis Mode below is unchanged.
  if (isStandardMode) {
    return (
      <StandardShell
        isNewInvestigationOpen={isNewInvestigationOpen}
        setNewInvestigationOpen={setIsNewInvestigationOpen}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-text" style={{ background: "var(--paper)" }}>
      <Topbar onOpenNewInvestigation={() => setIsNewInvestigationOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-6 md:px-10">
        <Outlet context={{ openNewInvestigation: () => setIsNewInvestigationOpen(true) }} />
      </main>

      {/* Floating AI Chatbot anchored at bottom-right */}
      <ChatWidget />

      {/* Global New Investigation Modal accessible from anywhere */}
      <NewInvestigationModal
        isOpen={isNewInvestigationOpen}
        onClose={() => setIsNewInvestigationOpen(false)}
        onCaseCreated={() => {
          // Trigger refresh if on home
          window.dispatchEvent(new CustomEvent("tracex_case_created"));
        }}
      />
    </div>
  );
}

/** Renders the Standard Mode page variant or the Analysis Mode page, per the active mode. */
function ModeSwitch({ analysis, standard }) {
  const { isStandardMode } = useMode();
  return isStandardMode ? standard : analysis;
}

/**
 * Standalone Login route handler
 */
function LoginRoute() {
  const token = getToken();
  const { isStandardMode } = useMode();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return isStandardMode ? <StandardLogin /> : <Login />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Standalone Login Route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Authenticated App Shell Routes */}
        <Route element={<ShellLayout />}>
          <Route path="/" element={<ModeSwitch analysis={<Home />} standard={<StandardDashboardPage />} />} />
          <Route path="/graph" element={<Navigate to="/cases/1/graph" replace />} />
          <Route path="/cases/:caseId/graph" element={<ModeSwitch analysis={<ConnectionsGraph />} standard={<StandardCorrelationPage />} />} />
          <Route path="/reports" element={<Navigate to="/cases/1/reports" replace />} />
          <Route path="/cases/:caseId/reports" element={<ModeSwitch analysis={<Reports />} standard={<StandardReportsPage />} />} />
          <Route path="/agents" element={<ModeSwitch analysis={<Agents />} standard={<StandardAgentsPage />} />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
