import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Search,
  Plus,
  Network,
  FileText,
  Layers,
  ArrowRight,
  LogOut,
  User,
  Shield,
  Eye,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { useMode } from "../../context/ModeContext";
import { getOfficer, clearAuth, apiClient } from "../../api/client";

export default function StandardHeader({ onOpenNewInvestigation }) {
  const {
    mode,
    setMode,
    fontSizeScale,
    setFontSizeScale,
    isHighContrast,
    setIsHighContrast,
    language,
    setLanguage,
  } = useMode();

  const navigate = useNavigate();
  const location = useLocation();
  const { caseId } = useParams();
  const activeCaseId = caseId || "1";

  const officer = getOfficer() || {
    name: "A. Sharma",
    badge_id: "MP-IO-4471",
    station_name: "Bhopal Cyber Cell",
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [casesCache, setCasesCache] = useState(null);
  const searchRef = useRef(null);

  const fetchCases = async () => {
    if (casesCache) return casesCache;
    try {
      const data = await apiClient.get("cases");
      setCasesCache(data || []);
      return data || [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    fetchCases().then((cases) => {
      const matches = cases.filter(
        (c) =>
          c.case_number?.toLowerCase().includes(q) ||
          c.victim_name?.toLowerCase().includes(q) ||
          c.district?.toLowerCase().includes(q)
      );
      setSearchResults(matches.slice(0, 5));
      setShowSearchResults(true);
    });
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearAuth();
    navigate("/login");
  };

  const navLinks = [
    {
      label: language === "hi" ? "कार्यवाही कतार (डैशबोर्ड)" : "Operations Dashboard",
      to: "/",
      icon: Layers,
      isActive: location.pathname === "/",
    },
    {
      label: language === "hi" ? "संबद्धता नेटवर्क ग्राफ" : "Correlation Network",
      to: `/cases/${activeCaseId}/graph`,
      icon: Network,
      isActive: location.pathname.includes("/graph"),
    },
    {
      label: language === "hi" ? "जांच एवं जब्ती रिपोर्ट" : "Investigation Reports",
      to: `/cases/${activeCaseId}/reports`,
      icon: FileText,
      isActive: location.pathname.includes("/reports"),
    },
  ];

  return (
    <header className="w-full bg-white border-b border-[#CBD5E1] shadow-sm">
      {/* ── 1. Top Micro-Bar (Accessibility, Flag & Gov Identity) ── */}
      <div className="bg-[#0B3B60] text-white text-[11.5px] px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#082C48]">
        {/* Left: Official Government Statement */}
        <div className="flex items-center gap-2 font-medium">
          {/* Indian Tricolor subtle icon */}
          <div className="flex flex-col w-3.5 h-2.5 rounded-xs overflow-hidden border border-white/20 shadow-xs">
            <div className="h-1/3 bg-[#FF9933]" />
            <div className="h-1/3 bg-white" />
            <div className="h-1/3 bg-[#128807]" />
          </div>
          <span className="font-semibold">
            {language === "hi" ? "भारत सरकार | गृह मंत्रालय" : "Government of India — Ministry of Home Affairs"}
          </span>
          <span className="hidden md:inline text-white/50">|</span>
          <span className="hidden md:inline text-white/80">
            {language === "hi"
              ? "राष्ट्रीय साइबर अपराध जांच एवं समन्वय नेटवर्क (I4C)"
              : "National Cyber Crime Investigation & Coordination Centre (I4C)"}
          </span>
        </div>

        {/* Right: Language Selector, Accessibility Font Size, Contrast & Mode Switch */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Language Switch */}
          <div className="flex items-center bg-black/20 rounded px-1.5 py-0.5 border border-white/15 text-[10.5px]">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${language === "en" ? "bg-white text-[#0B3B60] font-bold" : "text-white/80 hover:text-white"}`}
            >
              English
            </button>
            <span className="text-white/40 px-0.5">/</span>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${language === "hi" ? "bg-white text-[#0B3B60] font-bold" : "text-white/80 hover:text-white"}`}
            >
              हिन्दी
            </button>
          </div>

          {/* Font Size Adjusters (USWDS & Gov Accessibility standard) */}
          <div className="flex items-center gap-1 bg-black/20 rounded px-1.5 py-0.5 border border-white/15 text-[10.5px]">
            <span className="text-white/60 mr-0.5">Text:</span>
            <button
              type="button"
              onClick={() => setFontSizeScale("small")}
              title="Small Text"
              className={`px-1 font-mono rounded cursor-pointer ${fontSizeScale === "small" ? "bg-white text-[#0B3B60] font-bold" : "text-white/80 hover:text-white"}`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizeScale("normal")}
              title="Normal Text"
              className={`px-1 font-mono rounded cursor-pointer ${fontSizeScale === "normal" ? "bg-white text-[#0B3B60] font-bold" : "text-white/80 hover:text-white"}`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSizeScale("large")}
              title="Large Text"
              className={`px-1 font-mono rounded cursor-pointer ${fontSizeScale === "large" ? "bg-white text-[#0B3B60] font-bold" : "text-white/80 hover:text-white"}`}
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => setIsHighContrast(!isHighContrast)}
            title="Toggle High Contrast"
            className={`px-2 py-0.5 rounded text-[10.5px] font-medium border flex items-center gap-1 cursor-pointer ${
              isHighContrast
                ? "bg-yellow-400 text-black border-yellow-500 font-bold"
                : "bg-black/20 border-white/15 text-white/80 hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Contrast</span>
          </button>

          {/* ── Mode Toggle Pill (Switches between Standard and Analysis) ── */}
          <div
            className="flex items-center bg-[#07263F] p-0.5 rounded-full border border-white/20 shadow-xs"
            title="Switch UI Mode"
          >
            <button
              type="button"
              onClick={() => setMode("standard")}
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all cursor-pointer ${
                mode === "standard"
                  ? "bg-white text-[#0B3B60] shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              🏛️ Standard Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("analysis")}
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-medium transition-all cursor-pointer ${
                mode === "analysis"
                  ? "bg-[#00D4FF] text-[#05070D] font-bold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              ⚡ Analysis Mode
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Formal Header (Seal + Bilingual Portal Name + Live Case Search) ── */}
      <div className="px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 bg-white">
        {/* Emblem & Portal Brand */}
        <NavLink to="/" className="flex items-center gap-3.5 hover:opacity-95 transition-opacity">
          {/* Government / Police Gold-Blue Emblem Badge */}
          <div className="w-12 h-12 rounded-full border-2 border-[#0B3B60] bg-[#F8FAFC] flex items-center justify-center p-1.5 shadow-xs flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#0B3B60]" fill="currentColor">
              {/* Ashoka Stambha / Police Emblem Style Vector */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
              <path d="M50 12 L58 30 L78 30 L62 42 L68 62 L50 50 L32 62 L38 42 L22 30 L42 30 Z" fill="#B45309" />
              <rect x="35" y="66" width="30" height="6" rx="2" fill="currentColor" />
              <rect x="25" y="74" width="50" height="5" rx="1.5" fill="#0B3B60" />
            </svg>
          </div>

          <div>
            <div className="text-[12px] font-bold text-[#B45309] leading-tight font-serif tracking-wider uppercase">
              {language === "hi"
                ? "राष्ट्रीय साइबर अपराध आसूचना पोर्टल"
                : "National Cyber Fraud Intelligence Portal"}
            </div>
            <h1 className="text-[17px] sm:text-[19px] font-bold text-[#0F172A] leading-tight tracking-tight font-sans">
              TRACEX FORENSIC OPERATIONS PORTAL
            </h1>
            <p className="text-[11px] text-[#64748B] leading-none mt-0.5">
              Multi-Source Evidence Ingestion &amp; Syndicate Correlation Console
            </p>
          </div>
        </NavLink>

        {/* Center/Right: Case Search Bar & Officer Information */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Search Box */}
          <div className="relative" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search case, victim, or suspect..."
              className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-[12px] bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60] focus:outline-none transition-all"
            />

            {showSearchResults && (
              <div className="absolute right-0 mt-1 w-72 bg-white border border-[#94A3B8] rounded shadow-lg z-50 text-[12px] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#F1F5F9] font-bold text-[#334155] text-[10.5px] uppercase border-b border-[#CBD5E1]">
                  Matching Cases ({searchResults.length})
                </div>
                {searchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                      navigate(`/cases/${c.id}/graph`);
                    }}
                    className="p-2.5 hover:bg-[#F8FAFC] cursor-pointer border-b border-[#E2E8F0] last:border-0"
                  >
                    <div className="font-bold text-[#0B3B60] font-mono">{c.case_number}</div>
                    <div className="text-[#0F172A]">{c.victim_name}</div>
                    <div className="text-[10px] text-[#64748B]">{c.district || "Pending district"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Officer Info Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#E2E8F0] text-left">
            <div className="w-8 h-8 rounded bg-[#0B3B60] text-white flex items-center justify-center font-bold text-xs">
              {officer.name ? officer.name.charAt(0).toUpperCase() : "O"}
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#0F172A] leading-tight">{officer.name || "Officer"}</div>
              <div className="text-[10.5px] text-[#64748B] leading-none font-mono">{officer.badge_id}</div>
            </div>
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 text-[#64748B] hover:text-[#B91C1C] hover:bg-red-50 rounded transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3. Primary Navigation Bar (USWDS / cybercrime.gov.in Style) ── */}
      <nav className="bg-[#0B3B60] text-white px-4 sm:px-8 flex items-center justify-between overflow-x-auto shadow-inner">
        <div className="flex items-center">
          {navLinks.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.label}
                to={tab.to}
                className={`flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium border-b-2 transition-all whitespace-nowrap ${
                  tab.isActive
                    ? "bg-[#07263F] border-yellow-400 text-white font-bold"
                    : "border-transparent text-white/85 hover:bg-[#082C48] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 text-white/70" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Primary CTA: Register New Cyber Incident */}
        <button
          type="button"
          onClick={onOpenNewInvestigation}
          className="my-1.5 ml-4 px-3.5 py-1.5 bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-[12px] rounded flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Register Cyber Incident</span>
        </button>
      </nav>
    </header>
  );
}
