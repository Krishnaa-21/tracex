import React from "react";

/**
 * TraceX brand component.
 *
 * variant="logo"  — Full TraceX logo (logo.png) with the "TraceX" wordmark already baked in.
 *                   Use for: login page hero, sidebar header, report covers.
 * variant="icon"  — Compact app icon (icon.png), X in a dark rounded square.
 *                   Use for: tight spaces, favicons, small badges.
 *
 * size:  "xs" | "sm" | "md" | "lg"
 */
export default function Logo({
  size = "md",
  variant = "logo",
  showSubtitle = false,
  className = "",
}) {
  // Image dimensions keyed by size
  const dims = {
    xs: { img: "w-6 h-6",  title: "text-[12px]", sub: "text-[9px]" },
    sm: { img: "w-8 h-8",  title: "text-[15px]", sub: "text-[9.5px]" },
    md: { img: "w-10 h-10", title: "text-[17px]", sub: "text-[10.5px]" },
    lg: { img: "w-16 h-16", title: "text-[22px]", sub: "text-[11px]" },
  };
  const d = dims[size] || dims.md;

  // Full logo already contains the "TraceX" wordmark text, so we only
  // add the subtitle — never a duplicate title next to logo variant.
  if (variant === "logo") {
    return (
      <div className={`flex flex-col items-center gap-1 select-none ${className}`}>
        <img
          src="/logo.png"
          alt="TraceX"
          className={`${d.img} object-contain flex-shrink-0`}
          style={{ filter: "drop-shadow(0 0 14px rgba(0,229,200,0.50))" }}
          draggable={false}
        />
        {showSubtitle && (
          <span
            className={`${d.sub} font-mono tracking-widest uppercase text-center`}
            style={{ color: "rgba(0,229,200,0.55)" }}
          >
            Cyber Intelligence
          </span>
        )}
      </div>
    );
  }

  // Icon variant — compact X icon + optional text label beside it
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/icon.png"
        alt="TraceX"
        className={`${d.img} object-contain flex-shrink-0 rounded-lg`}
        style={{ filter: "drop-shadow(0 0 10px rgba(0,229,200,0.45))" }}
        draggable={false}
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${d.title} font-display font-bold tracking-tight`}
          style={{
            background: "linear-gradient(90deg, #00E5C8 0%, #00D4FF 60%, #7C3AED 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          TraceX
        </span>
        {showSubtitle && (
          <span className={`${d.sub} font-mono tracking-widest uppercase mt-0.5`} style={{ color: "rgba(0,212,255,0.50)" }}>
            Cyber Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
