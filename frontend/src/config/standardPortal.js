/**
 * Standard Mode (government portal skin) — configurable identity and copy.
 *
 * Every value in the "identity" block is an intentional PLACEHOLDER. Replace the
 * bracketed text (and set `emblemSrc`) with the details of the deploying
 * department. Nothing here affects data, APIs or business logic.
 */

export const PORTAL = {
  // ── Identity (placeholders — replace before deployment) ────────────────
  governmentName: { en: "Government of [State / Union Territory]", hi: "[राज्य / संघ राज्य क्षेत्र] सरकार" },
  departmentName: { en: "[Name of Department]", hi: "[विभाग का नाम]" },
  officeAddress: "[Office address, City, State – PIN Code]",
  helpdesk: "[Helpdesk telephone / official e-mail]",

  // Path or URL of the official emblem / seal image (e.g. "/emblem.png").
  // When null, a neutral seal placeholder is drawn instead.
  emblemSrc: null,

  // ── Portal naming ──────────────────────────────────────────────────────
  portalName: "TraceX",
  portalTitle: { en: "Cyber Fraud Case Management & Correlation System", hi: "साइबर धोखाधड़ी प्रकरण प्रबंधन एवं सहसंबंध प्रणाली" },
};

/** Shell strings that support the English / Hindi language switch. */
export const STRINGS = {
  en: {
    skip: "Skip to main content",
    textSize: "Text size",
    contrast: "High contrast",
    displayMode: "Display mode",
    standard: "Standard",
    analysis: "Analysis",
    language: "Language",
    dashboard: "Dashboard",
    correlation: "Correlation & Graph",
    reports: "Reports",
    registerCase: "Register New Case",
    searchLabel: "Search cases",
    searchPlaceholder: "Case no., victim or district",
    noResults: "No matching cases found",
    matchingCases: "Matching cases",
    signOut: "Sign out",
    badge: "Badge ID",
    officer: "Officer",
    home: "Home",
    mainNav: "Main navigation",
  },
  hi: {
    skip: "मुख्य सामग्री पर जाएँ",
    textSize: "अक्षर आकार",
    contrast: "उच्च कंट्रास्ट",
    displayMode: "प्रदर्शन मोड",
    standard: "मानक",
    analysis: "विश्लेषण",
    language: "भाषा",
    dashboard: "डैशबोर्ड",
    correlation: "सहसंबंध एवं ग्राफ़",
    reports: "रिपोर्ट",
    registerCase: "नया प्रकरण पंजीकृत करें",
    searchLabel: "प्रकरण खोजें",
    searchPlaceholder: "प्रकरण क्रमांक, पीड़ित या ज़िला",
    noResults: "कोई मिलान प्रकरण नहीं मिला",
    matchingCases: "मिलान प्रकरण",
    signOut: "साइन आउट",
    badge: "बैज आईडी",
    officer: "अधिकारी",
    home: "मुख्य पृष्ठ",
    mainNav: "मुख्य नेविगेशन",
  },
};

export const t = (language) => STRINGS[language === "hi" ? "hi" : "en"];
export const pick = (obj, language) => (obj && (obj[language === "hi" ? "hi" : "en"] || obj.en)) || "";
