import React from "react";

/**
 * Small, muted "Beta" pill shown under the "Standard Mode" label wherever the
 * mode is named (mode toggles). Pure presentation.
 *   tone: "onLight" (light/white surface) | "onDark" (dark surface) | "onNavy" (navy surface)
 */
const TONES = {
  onLight: { color: "#566274", background: "#F1F5F9", borderColor: "#B9C3CF" },
  onDark: { color: "rgba(148,163,184,0.95)", background: "transparent", borderColor: "rgba(148,163,184,0.40)" },
  onNavy: { color: "#DCE6F0", background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.45)" },
};

export default function BetaTag({ tone = "onLight", size = "0.5625rem", label = "Beta" }) {
  const t = TONES[tone] || TONES.onLight;
  return (
    <span
      title="Standard Mode is in beta and under active development"
      style={{
        display: "inline-block",
        marginTop: "1px",
        padding: "0 0.4em",
        fontSize: size,
        lineHeight: 1.5,
        fontWeight: 600,
        fontStyle: "normal",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        borderRadius: "999px",
        border: `1px solid ${t.borderColor}`,
        color: t.color,
        background: t.background,
      }}
    >
      {label}
    </span>
  );
}
