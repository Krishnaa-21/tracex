import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StandardHeader from "./StandardHeader";
import StandardFooter from "./StandardFooter";
import StandardNewInvestigationModal from "./StandardNewInvestigationModal";
import ChatWidget from "../ChatWidget";
import { useMode } from "../../context/ModeContext";
import { t } from "../../config/standardPortal";

/** Authenticated page layout for Standard Mode (government portal). */
export default function StandardShell({ isNewInvestigationOpen, setNewInvestigationOpen }) {
  const location = useLocation();
  const { language } = useMode();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="std-shell">
      <a
        className="std-skip"
        href="#std-main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("std-main")?.focus();
        }}
      >
        {t(language).skip}
      </a>

      <StandardHeader onOpenNewInvestigation={() => setNewInvestigationOpen(true)} />

      <main id="std-main" tabIndex={-1} className="std-main">
        <div className="std-container">
          <Outlet context={{ openNewInvestigation: () => setNewInvestigationOpen(true) }} />
        </div>
      </main>

      <StandardFooter />
      <ChatWidget />

      <StandardNewInvestigationModal
        isOpen={isNewInvestigationOpen}
        onClose={() => setNewInvestigationOpen(false)}
        onCaseCreated={() => window.dispatchEvent(new CustomEvent("tracex_case_created"))}
      />
    </div>
  );
}
