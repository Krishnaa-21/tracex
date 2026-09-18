/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "var(--bg)",
        bgSubtle: "var(--bg-subtle)",
        bgMuted: "var(--bg-muted)",
        border: "var(--border)",
        borderStrong: "var(--border-strong)",
        paperMid: "var(--paper-mid)",
        panelSolid: "var(--panel-solid)",

        // Text
        text: "var(--text)",
        textDim: "var(--text-dim)",
        textFaint: "var(--text-faint)",

        // Signal / accent (electric cyan)
        accent: "var(--accent)",
        accentHover: "var(--accent-hover)",
        accentSoft: "var(--accent-soft)",
        accentBorder: "var(--accent-border)",
        signal: "var(--signal)",
        signalHover: "var(--signal-hover)",
        signalMuted: "var(--signal-muted)",
        signalSoft: "var(--signal-soft)",
        signalBorder: "var(--signal-border)",

        // Violet / AI accent
        violet: "var(--violet)",
        violetHover: "var(--violet-hover)",
        violetSoft: "var(--violet-soft)",
        violetBorder: "var(--violet-border)",

        // Risk spectrum (semantic — risk meaning only)
        riskCritical: "var(--risk-critical)",
        riskCriticalBg: "var(--risk-critical-bg)",
        riskCriticalBorder: "var(--risk-critical-border)",
        riskHigh: "var(--risk-high)",
        riskHighBg: "var(--risk-high-bg)",
        riskHighBorder: "var(--risk-high-border)",
        riskMed: "var(--risk-med)",
        riskMedBg: "var(--risk-med-bg)",
        riskMedBorder: "var(--risk-med-border)",
        riskLow: "var(--risk-low)",
        riskLowBg: "var(--risk-low-bg)",
        riskLowBorder: "var(--risk-low-border)",

        // Status spectrum (semantic — system feedback only)
        statusInfo: "var(--status-info)",
        statusInfoBg: "var(--status-info-bg)",
        statusSuccess: "var(--status-success)",
        statusSuccessBg: "var(--status-success-bg)",
        statusWarning: "var(--status-warning)",
        statusWarningBg: "var(--status-warning-bg)",
        statusError: "var(--status-error)",
        statusErrorBg: "var(--status-error-bg)",

        // Glass
        glassBg: "var(--glass-bg)",
        glassBorder: "var(--glass-border)",

        urgentBg: "var(--urgent-bg)",
        urgentBorder: "var(--urgent-border)",
        urgentText: "var(--urgent-text)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
