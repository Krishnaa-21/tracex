import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Topbar from "../components/Topbar";
import NewInvestigationModal from "../components/NewInvestigationModal";
import Login from "../pages/Login";
import Home from "../pages/Home";
import ConnectionsGraph from "../pages/ConnectionsGraph";
import Reports from "../pages/Reports";
import { getToken } from "../api/client";

/**
 * Shell layout wrapping authenticated routes with Topbar navigation (no sidebar)
 */
function ShellLayout() {
  const token = getToken();
  const location = useLocation();
  const [isNewInvestigationOpen, setIsNewInvestigationOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col text-text" style={{ background: "var(--paper)" }}>
      {/* Glassmorphic Top Navigation Bar with Tabs */}
      <Topbar onOpenNewInvestigation={() => setIsNewInvestigationOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto px-6 py-7 md:px-10">
        <Outlet context={{ openNewInvestigation: () => setIsNewInvestigationOpen(true) }} />
      </main>

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

/**
 * Standalone Login route handler
 */
function LoginRoute() {
  const token = getToken();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Standalone Login Route */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Authenticated App Shell Routes */}
        <Route element={<ShellLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/graph" element={<Navigate to="/cases/1/graph" replace />} />
          <Route path="/cases/:caseId/graph" element={<ConnectionsGraph />} />
          <Route path="/reports" element={<Navigate to="/cases/1/reports" replace />} />
          <Route path="/cases/:caseId/reports" element={<Reports />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
