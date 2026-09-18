import React from "react";

/**
 * TraceX brand mark — uses the official logo asset.
 * size: "sm" | "md" | "lg"
 */
export default function Logo({ size = "md", showSubtitle = true, className = "" }) {
  const logoSize = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const titleSize = size === "sm" ? "text-[14px]" : size === "lg" ? "text-[22px]" : "text-[17px]";
  const subSize = size === "sm" ? "text-[9px]" : "text-[10.5px]";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official TraceX logo image */}
      <img
        src="/logo.png"
        alt="TraceX Logo"
        className={`${logoSize} object-contain flex-shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.50)]`}
        draggable={false}
      />

      {/* Brand text */}
      <div className="flex flex-col leading-none">
        <span
          className={`${titleSize} font-display font-bold tracking-tight`}
          style={{
            background: "linear-gradient(90deg, #00D4FF 0%, #8B5CF6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          TraceX
        </span>
        {showSubtitle && (
          <span className={`${subSize} text-textDim leading-tight tracking-widest uppercase font-mono mt-0.5`}>
            Cyber Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
