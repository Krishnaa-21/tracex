import React from "react";
import { Link } from "react-router-dom";
import { useMode } from "../../context/ModeContext";
import { PORTAL, pick } from "../../config/standardPortal";

/** Neutral seal placeholder — replace via PORTAL.emblemSrc with the official emblem. */
function EmblemPlaceholder() {
  return (
    <svg className="std-emblem" viewBox="0 0 64 64" role="img" aria-label="Emblem placeholder">
      <circle cx="32" cy="32" r="30" fill="#fff" stroke="#0B3B60" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#7B8794" strokeWidth="1.2" strokeDasharray="3 3" />
      <text x="32" y="31" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#0B3B60" fontFamily="Arial, sans-serif">
        EMBLEM
      </text>
      <text x="32" y="41" textAnchor="middle" fontSize="6" fill="#566274" fontFamily="Arial, sans-serif">
        PLACEHOLDER
      </text>
    </svg>
  );
}

/** Seal + department name + portal title block. */
export default function StandardBranding({ to = "/" }) {
  const { language } = useMode();
  return (
    <Link to={to} className="std-brand">
      {PORTAL.emblemSrc ? (
        <img className="std-emblem" src={PORTAL.emblemSrc} alt="Official emblem" />
      ) : (
        <EmblemPlaceholder />
      )}
      <div>
        <div className="std-brand__dept">{pick(PORTAL.departmentName, language)}</div>
        <div className="std-brand__sub">
          <strong>{PORTAL.portalName}</strong> — {pick(PORTAL.portalTitle, language)}
        </div>
      </div>
    </Link>
  );
}
