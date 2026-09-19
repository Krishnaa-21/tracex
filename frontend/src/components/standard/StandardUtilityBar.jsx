import React from "react";
import { useMode } from "../../context/ModeContext";
import { PORTAL, pick, t } from "../../config/standardPortal";
import BetaTag from "../BetaTag";

/**
 * Top-most bar of the portal: "Government of [X]" identification on the left,
 * accessibility and display controls on the right. Used by the app header and
 * the login page. Uses the existing ModeContext — no new behaviour.
 */
export default function StandardUtilityBar() {
  const {
    mode,
    setMode,
    language,
    setLanguage,
    fontSizeScale,
    setFontSizeScale,
    isHighContrast,
    setIsHighContrast,
  } = useMode();
  const s = t(language);

  return (
    <div className="std-utility">
      <div className="std-container std-utility__inner">
        <div className="std-utility__gov">{pick(PORTAL.governmentName, language)}</div>

        <div className="std-utility__controls">
          <div className="std-ctl" role="group" aria-label={s.language}>
            <span className="std-ctl__label">{s.language}:</span>
            <div className="std-seg">
              <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
                English
              </button>
              <button type="button" lang="hi" aria-pressed={language === "hi"} onClick={() => setLanguage("hi")}>
                हिन्दी
              </button>
            </div>
          </div>

          <div className="std-ctl" role="group" aria-label={s.textSize}>
            <span className="std-ctl__label">{s.textSize}:</span>
            <div className="std-seg">
              <button type="button" aria-label="Decrease text size" aria-pressed={fontSizeScale === "small"} onClick={() => setFontSizeScale("small")}>
                A-
              </button>
              <button type="button" aria-label="Default text size" aria-pressed={fontSizeScale === "normal"} onClick={() => setFontSizeScale("normal")}>
                A
              </button>
              <button type="button" aria-label="Increase text size" aria-pressed={fontSizeScale === "large"} onClick={() => setFontSizeScale("large")}>
                A+
              </button>
            </div>
          </div>

          <div className="std-ctl">
            <div className="std-seg">
              <button type="button" aria-pressed={isHighContrast} onClick={() => setIsHighContrast(!isHighContrast)}>
                {s.contrast}
              </button>
            </div>
          </div>

          <div className="std-ctl" role="group" aria-label={s.displayMode}>
            <span className="std-ctl__label">{s.displayMode}:</span>
            <div className="std-seg">
              <button type="button" className="std-seg__mode" aria-pressed={mode === "standard"} onClick={() => setMode("standard")}>
                <span>{s.standard}</span>
                <BetaTag tone={mode === "standard" ? "onNavy" : "onLight"} size="0.625rem" />
              </button>
              <button type="button" aria-pressed={mode === "analysis"} onClick={() => setMode("analysis")}>
                {s.analysis}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
