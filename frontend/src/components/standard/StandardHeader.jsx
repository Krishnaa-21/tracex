import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useMode } from "../../context/ModeContext";
import { getOfficer, clearAuth, apiClient } from "../../api/client";
import { t } from "../../config/standardPortal";
import StandardUtilityBar from "./StandardUtilityBar";
import StandardBranding from "./StandardBranding";
import { scamLabel } from "./StandardUI";

/**
 * Government-portal header: utility bar → identity band (seal, department,
 * case search, officer) → primary navigation bar.
 * Behaviour (search, navigation, sign-out) is identical to the previous header.
 */
export default function StandardHeader({ onOpenNewInvestigation }) {
  const { language } = useMode();
  const s = t(language);
  const navigate = useNavigate();
  const location = useLocation();
  const { caseId } = useParams();
  const activeCaseId = caseId || "1";

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Cell",
  };

  /* ── Case search (fetches the case list lazily, filters locally) ───── */
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const cacheRef = useRef(null);
  const searchRef = useRef(null);

  const ensureCases = async () => {
    if (cacheRef.current) return cacheRef.current;
    try {
      const data = await apiClient.get("cases");
      cacheRef.current = data || [];
    } catch {
      cacheRef.current = null;
      return [];
    }
    return cacheRef.current;
  };

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      return undefined;
    }
    let cancelled = false;
    ensureCases().then((cases) => {
      if (cancelled) return;
      const matches = cases.filter(
        (c) =>
          c.case_number?.toLowerCase().includes(q) ||
          c.victim_name?.toLowerCase().includes(q) ||
          c.district?.toLowerCase().includes(q) ||
          c.scam_type?.toLowerCase().includes(q)
      );
      setResults(matches.slice(0, 5));
      setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onCaseCreated = () => {
      cacheRef.current = null;
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("tracex_case_created", onCaseCreated);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("tracex_case_created", onCaseCreated);
    };
  }, []);

  const openCase = (c) => {
    setOpen(false);
    setQuery("");
    navigate(`/cases/${c.id}/graph`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (results[0]) openCase(results[0]);
  };

  const handleSignOut = () => {
    clearAuth();
    navigate("/login");
  };

  const navLinks = [
    { label: s.dashboard, to: "/", active: location.pathname === "/" },
    { label: s.correlation, to: `/cases/${activeCaseId}/graph`, active: location.pathname.includes("/graph") },
    { label: s.reports, to: `/cases/${activeCaseId}/reports`, active: location.pathname.includes("/reports") },
  ];

  return (
    <header>
      <StandardUtilityBar />

      <div className="std-identity">
        <div className="std-container std-identity__inner">
          <StandardBranding to="/" />

          <div className="std-identity__tools">
            <div className="std-search" ref={searchRef}>
              <form role="search" onSubmit={handleSearchSubmit}>
                <label htmlFor="std-case-search" className="std-visually-hidden">
                  {s.searchLabel}
                </label>
                <div className="std-search__row">
                  <input
                    id="std-case-search"
                    type="search"
                    className="std-input"
                    autoComplete="off"
                    placeholder={s.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                      if (results.length > 0) setOpen(true);
                    }}
                  />
                  <button type="submit" className="std-btn">
                    {language === "hi" ? "खोजें" : "Search"}
                  </button>
                </div>
              </form>

              {open && (
                <div className="std-search__results">
                  <h3>
                    {s.matchingCases} ({results.length})
                  </h3>
                  {results.length === 0 ? (
                    <div className="std-search__empty">{s.noResults}</div>
                  ) : (
                    <ul>
                      {results.map((c) => (
                        <li key={c.id}>
                          <button type="button" className="std-search__item" onClick={() => openCase(c)}>
                            <span className="std-id">{c.case_number}</span> — {c.victim_name}
                            <br />
                            <span className="std-faint" style={{ fontSize: "0.8125rem" }}>
                              {c.district || "District pending"} · {scamLabel(c.scam_type)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="std-officer">
              <div className="std-officer__name">{officer.name || s.officer}</div>
              <div className="std-officer__meta">
                {s.badge}: <span className="std-mono">{officer.badge_id}</span>
                {officer.station_name ? <> · {officer.station_name}</> : null}
              </div>
            </div>

            <button type="button" className="std-btn std-btn--secondary std-btn--sm" onClick={handleSignOut}>
              {s.signOut}
            </button>
          </div>
        </div>
      </div>

      <nav className="std-nav" aria-label={s.mainNav}>
        <div className="std-container std-nav__inner">
          <ul className="std-nav__list">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="std-nav__link" aria-current={link.active ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="std-nav__action">
            <button type="button" className="std-btn std-btn--ondark std-btn--sm" onClick={onOpenNewInvestigation}>
              + {s.registerCase}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
