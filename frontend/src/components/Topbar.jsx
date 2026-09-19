import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams, NavLink } from "react-router-dom";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Plus,
  Network,
  FileText,
  Layers,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { getOfficer, clearAuth, apiClient } from "../api/client";
import Logo from "./Logo";
import NotificationsPopover from "./NotificationsPopover";
import ProfileModal from "./ProfileModal";

export default function Topbar({ onOpenNewInvestigation }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allCasesCache, setAllCasesCache] = useState(null);

  const dropdownRef = useRef(null);
  const notifButtonRef = useRef(null);
  const searchRef = useRef(null);

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Cell",
  };

  const activeCaseId = caseId || "1";

  // Fetch the case list once (lazily) and reuse for every subsequent keystroke
  const ensureCasesCache = async () => {
    if (allCasesCache) return allCasesCache;
    try {
      const cases = await apiClient.get("cases");
      setAllCasesCache(cases || []);
      return cases || [];
    } catch (err) {
      console.error("Search: failed to load case list:", err);
      return [];
    }
  };

  // Handle Search Input — filters cached case list locally
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    let cancelled = false;
    ensureCasesCache().then((cases) => {
      if (cancelled) return;
      const matches = cases.filter(
        (c) =>
          c.case_number?.toLowerCase().includes(q) ||
          c.victim_name?.toLowerCase().includes(q) ||
          c.district?.toLowerCase().includes(q) ||
          c.scam_type?.toLowerCase().includes(q)
      );
      setSearchResults(matches.slice(0, 5));
      setShowSearchResults(true);
    });

    return () => { cancelled = true; };
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Invalidate cache when new case is created
  useEffect(() => {
    const handleCaseCreated = () => setAllCasesCache(null);
    window.addEventListener("tracex_case_created", handleCaseCreated);
    return () => window.removeEventListener("tracex_case_created", handleCaseCreated);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate("/login");
  };

  const navTabs = [
    {
      label: "Operations Queue",
      to: "/",
      icon: Layers,
      isActive: location.pathname === "/",
    },
    {
      label: "Connections & Graph",
      to: `/cases/${activeCaseId}/graph`,
      icon: Network,
      isActive: location.pathname.includes("/graph"),
    },
    {
      label: "Investigative Reports",
      to: `/cases/${activeCaseId}/reports`,
      icon: FileText,
      isActive: location.pathname.includes("/reports"),
    },
  ];

  const initials = officer.name ? officer.name.charAt(0).toUpperCase() : "O";

  return (
    <header
      className="sticky top-0 z-30 px-6"
      style={{
        background: "rgba(5,7,13,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,212,255,0.12)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.50), 0 1px 0 rgba(0,212,255,0.06) inset",
        overflow: "visible",
      }}
    >
      <div className="h-14 flex items-center justify-between gap-4">
        {/* Left: Branding + live indicator */}
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-shrink-0">
          <Logo size="sm" showSubtitle={true} />
          {/* LIVE status dot */}
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{
                boxShadow: "0 0 6px rgba(16,185,129,0.9)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "rgba(16,185,129,0.70)" }}>
              LIVE
            </span>
          </div>
        </NavLink>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Global Live Search */}
          <div className="relative" ref={searchRef}>
            <Search
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(0,212,255,0.45)" }}
            />
            <input
              id="topbar-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(0,212,255,0.50)";
                e.target.style.boxShadow = "0 0 12px rgba(0,212,255,0.15)";
                e.target.style.width = "220px";
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              placeholder="Search cases, victims..."
              className="w-48 pl-8 pr-3 py-1.5 text-[12px] font-mono rounded transition-all"
              style={{
                background: "rgba(0,0,0,0.40)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "#E2E8F0",
                outline: "none",
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(0,212,255,0.15)";
                e.target.style.boxShadow = "none";
                e.target.style.width = "";
              }}
            />

            {/* Search results dropdown */}
            {showSearchResults && (
              <div
                className="absolute right-0 mt-1.5 w-76 py-1 z-50 text-[12px] animate-fade-in-up"
                style={{
                  background: "rgba(5,10,22,0.95)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(0,212,255,0.20)",
                  borderRadius: "6px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.60), 0 0 20px rgba(0,212,255,0.08)",
                  width: "280px",
                }}
              >
                <div
                  className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-mono font-semibold"
                  style={{ color: "rgba(0,212,255,0.50)", borderBottom: "1px solid rgba(0,212,255,0.10)" }}
                >
                  Matching Cases ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-textDim text-[12px]">No matching cases found</div>
                ) : (
                  searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                        navigate(`/cases/${c.id}/graph`);
                      }}
                      className="px-3 py-2 cursor-pointer flex items-center justify-between transition-colors"
                      style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.06)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div>
                        <div className="font-mono font-bold text-[12px]" style={{ color: "#00D4FF" }}>{c.case_number}</div>
                        <div className="text-text font-medium text-[12px]">{c.victim_name}</div>
                        <div className="text-[10px]" style={{ color: "rgba(148,163,184,0.60)" }}>{c.district || "Pending district"}</div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-textFaint" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* New Investigation CTA */}
          <button
            id="topbar-new-investigation"
            onClick={onOpenNewInvestigation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded transition-all cursor-pointer flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #007FA8 0%, #005280 100%)",
              border: "1px solid rgba(0,212,255,0.40)",
              color: "#fff",
              boxShadow: "0 0 14px rgba(0,212,255,0.15)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 24px rgba(0,212,255,0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 14px rgba(0,212,255,0.15)")}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New investigation</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              ref={notifButtonRef}
              id="topbar-notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Operational Alerts"
              className="w-8 h-8 rounded flex items-center justify-center transition-all relative cursor-pointer"
              style={{
                background: "rgba(0,0,0,0.30)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "rgba(148,163,184,0.80)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(0,212,255,0.40)";
                e.currentTarget.style.color = "#00D4FF";
                e.currentTarget.style.boxShadow = "0 0 10px rgba(0,212,255,0.20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1px solid rgba(0,212,255,0.15)";
                e.currentTarget.style.color = "rgba(148,163,184,0.80)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Bell className="w-4 h-4" />
              {/* Alert pulse dot */}
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{
                  background: "#FF3B5C",
                  boxShadow: "0 0 6px rgba(255,59,92,0.80)",
                  animation: "pulse-red 1.5s ease-in-out infinite",
                }}
              />
            </button>

            <NotificationsPopover
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              anchorRef={notifButtonRef}
            />
          </div>

          {/* Officer profile */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="topbar-profile"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded transition-all cursor-pointer"
              style={{ background: dropdownOpen ? "rgba(0,212,255,0.06)" : "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,212,255,0.06)")}
              onMouseLeave={(e) => {
                if (!dropdownOpen) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Avatar with gradient ring */}
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold font-display"
                style={{
                  background: "linear-gradient(135deg, #0099CC, #6B21D8)",
                  color: "#fff",
                  boxShadow: "0 0 10px rgba(0,212,255,0.30)",
                }}
              >
                {initials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[12px] font-semibold text-text leading-tight">{officer.name || "Officer"}</span>
                <span className="text-[10px] font-mono leading-none" style={{ color: "rgba(0,212,255,0.60)" }}>
                  {officer.badge_id || "IO"}
                </span>
              </div>
              <ChevronDown
                className="w-3 h-3 hidden md:block transition-transform"
                style={{
                  color: "rgba(0,212,255,0.40)",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Profile Dropdown — fixed position to avoid clipping by header stacking context */}
            {dropdownOpen && (
              <div
                className="fixed w-56 py-1.5 z-[200] text-[12.5px] select-none animate-fade-in-up"
                style={{
                  top: "56px",
                  right: "16px",
                  background: "rgba(5,10,22,0.98)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(0,212,255,0.22)",
                  borderRadius: "8px",
                  boxShadow: "0 12px 48px rgba(0,0,0,0.80), 0 0 24px rgba(0,212,255,0.10)",
                }}
              >
                <div
                  className="px-3.5 py-2.5 mb-1"
                  style={{ borderBottom: "1px solid rgba(0,212,255,0.10)", background: "rgba(0,212,255,0.04)" }}
                >
                  <p className="font-semibold text-text">{officer.name}</p>
                  <p className="text-[11px] font-mono font-medium mt-0.5" style={{ color: "#00D4FF" }}>{officer.badge_id}</p>
                  <p className="text-[10.5px] mt-0.5 text-textDim">{officer.station_name}</p>
                </div>

                {[
                  {
                    icon: User,
                    label: "My profile & credentials",
                    onClick: () => { setDropdownOpen(false); setProfileModalOpen(true); },
                    color: "rgba(0,212,255,0.70)",
                  },
                  {
                    icon: Settings,
                    label: "Preferences",
                    onClick: () => { setDropdownOpen(false); alert("Preferences: Sound alerts enabled • High-contrast map tiles enabled • Section 65B verification stamp active"); },
                    color: "rgba(148,163,184,0.60)",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 transition-colors cursor-pointer text-textDim"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,212,255,0.06)";
                      e.currentTarget.style.color = "#E2E8F0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "";
                    }}
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                    <span>{item.label}</span>
                  </button>
                ))}

                <div style={{ borderTop: "1px solid rgba(0,212,255,0.08)", margin: "4px 0" }} />

                <button
                  onClick={handleSignOut}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 transition-colors cursor-pointer"
                  style={{ color: "#FF8BA0" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,59,92,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF3B5C" }} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tab strip */}
      <nav className="flex items-end gap-0.5 -mb-px">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium transition-all rounded-t`}
              style={{
                color: tab.isActive ? "#00D4FF" : "rgba(148,163,184,0.65)",
                background: tab.isActive ? "rgba(0,212,255,0.06)" : "transparent",
                borderTop: tab.isActive ? "1px solid rgba(0,212,255,0.20)" : "1px solid transparent",
                borderLeft: tab.isActive ? "1px solid rgba(0,212,255,0.20)" : "1px solid transparent",
                borderRight: tab.isActive ? "1px solid rgba(0,212,255,0.20)" : "1px solid transparent",
                borderBottom: tab.isActive ? "1px solid rgba(5,7,13,0.85)" : "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!tab.isActive) {
                  e.currentTarget.style.color = "rgba(0,212,255,0.80)";
                  e.currentTarget.style.background = "rgba(0,212,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!tab.isActive) {
                  e.currentTarget.style.color = "rgba(148,163,184,0.65)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: tab.isActive ? "#00D4FF" : "rgba(148,163,184,0.50)" }}
              />
              <span>{tab.label}</span>

              {/* Active tab bottom glow line */}
              {tab.isActive && (
                <div
                  className="absolute bottom-0 left-3 right-3 h-px"
                  style={{
                    background: "#00D4FF",
                    boxShadow: "0 0 8px rgba(0,212,255,0.80)",
                  }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Officer Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </header>
  );
}
