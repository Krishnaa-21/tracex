import React from "react";
import { useMode } from "../../context/ModeContext";
import { PORTAL, pick } from "../../config/standardPortal";

const RELATED = [
  { label: "National Cyber Crime Reporting Portal", href: "https://cybercrime.gov.in" },
  { label: "Indian Cyber Crime Coordination Centre (I4C)", href: "https://i4c.mha.gov.in" },
  { label: "CERT-In — Indian Computer Emergency Response Team", href: "https://www.cert-in.org.in" },
];

const STATUTES = [
  "Information Technology Act, 2000 — Sections 66C, 66D and 69A",
  "Indian Evidence Act — Section 65B certification",
  "Section 91 CrPC — production of documents / debit-freeze directions",
];

/**
 * Official-style footer: department details, related portals, statutory
 * references, helplines, and a base bar with disclaimer / ownership text.
 */
export default function StandardFooter() {
  const { language } = useMode();
  const dept = pick(PORTAL.departmentName, language);

  return (
    <footer className="std-footer">
      <div className="std-container std-footer__top">
        <a
          href="#std-main"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo(0, 0);
          }}
        >
          Back to top
        </a>
      </div>

      <div className="std-container std-footer__grid">
        <div>
          <h2>{dept}</h2>
          <p>{pick(PORTAL.governmentName, language)}</p>
          <p>{PORTAL.officeAddress}</p>
          <p>Helpdesk: {PORTAL.helpdesk}</p>
        </div>

        <div>
          <h2>Related Portals</h2>
          <ul>
            {RELATED.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                  <span className="std-visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Statutory References</h2>
          <ul>
            {STATUTES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Helplines</h2>
          <p>
            <strong>National Cyber Crime Helpline: 1930</strong> (toll free)
          </p>
          <p>Citizen complaints: cybercrime.gov.in</p>
        </div>
      </div>

      <div className="std-footer__base">
        <div className="std-container">
          <p>
            <strong>Disclaimer:</strong> {PORTAL.portalName} is an investigative decision-support system for authorised officers. Risk
            ratings, correlation scores and AI-generated narratives are advisory and must be verified by the Investigating Officer before
            any legal action is initiated.
          </p>
          <p>
            Access to this system is restricted, logged and monitored. Unauthorised access or misuse is punishable under applicable law.
          </p>
          <p>
            Content owned, maintained and updated by {dept}. © {new Date().getFullYear()} {dept}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
