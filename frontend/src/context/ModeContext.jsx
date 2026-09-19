import React, { createContext, useContext, useState, useEffect } from "react";

const ModeContext = createContext();

export function ModeProvider({ children }) {
  // Mode: "analysis" (default dark SOC theme) | "standard" (official government portal theme)
  const [mode, setModeState] = useState(() => {
    try {
      return localStorage.getItem("tracex_app_mode") || "analysis";
    } catch {
      return "analysis";
    }
  });

  // Accessibility font-size adjuster: "small" (90%) | "normal" (100%) | "large" (112%)
  const [fontSizeScale, setFontSizeScaleState] = useState(() => {
    try {
      return localStorage.getItem("tracex_font_scale") || "normal";
    } catch {
      return "normal";
    }
  });

  // High contrast accessibility mode
  const [isHighContrast, setIsHighContrastState] = useState(() => {
    try {
      return localStorage.getItem("tracex_high_contrast") === "true";
    } catch {
      return false;
    }
  });

  // Language selector: "en" | "hi"
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem("tracex_lang") || "en";
    } catch {
      return "en";
    }
  });

  const setMode = (newMode) => {
    const validMode = newMode === "standard" ? "standard" : "analysis";
    setModeState(validMode);
    try {
      localStorage.setItem("tracex_app_mode", validMode);
    } catch {
      // ignore
    }
  };

  const toggleMode = () => {
    setMode(mode === "analysis" ? "standard" : "analysis");
  };

  const setFontSizeScale = (scale) => {
    setFontSizeScaleState(scale);
    try {
      localStorage.setItem("tracex_font_scale", scale);
    } catch {
      // ignore
    }
  };

  const setIsHighContrast = (val) => {
    setIsHighContrastState(val);
    try {
      localStorage.setItem("tracex_high_contrast", val ? "true" : "false");
    } catch {
      // ignore
    }
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("tracex_lang", lang);
    } catch {
      // ignore
    }
  };

  // Synchronize data attributes on <html> element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mode", mode);

    // Font size scaling
    if (fontSizeScale === "small") {
      root.style.fontSize = "14.5px";
    } else if (fontSizeScale === "large") {
      root.style.fontSize = "17.5px";
    } else {
      root.style.fontSize = "16px";
    }

    // High contrast
    if (isHighContrast) {
      root.setAttribute("data-contrast", "high");
    } else {
      root.removeAttribute("data-contrast");
    }
  }, [mode, fontSizeScale, isHighContrast]);

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isAnalysisMode: mode === "analysis",
        isStandardMode: mode === "standard",
        fontSizeScale,
        setFontSizeScale,
        isHighContrast,
        setIsHighContrast,
        language,
        setLanguage,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
