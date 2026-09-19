import React from "react";
import { Link } from "react-router-dom";

/* ==========================================================================
   Shared presentational primitives for Standard Mode (government portal skin).
   Pure UI — no data fetching, no business logic.
   ========================================================================== */

export const SCAM_TYPE_LABELS = {
  digital_scam: "Digital Scam",
  phishing_vishing: "Phishing / Vishing",
  malicious_apk: "Malicious APK",
};

export const CASE_STATUS_LABELS = {
  open: "Open",
  correlating: "Correlating",
  under_review: "Under Review",
  closed: "Closed",
};

export const ENTITY_TYPE_LABELS = {
  upi_handle: "UPI Handle",
  account: "Bank Account",
  phone: "Phone",
  imei: "IMEI / Device",
  imsi: "SIM / IMSI",
  ip_address: "IP Address",
  apk_hash: "Malicious APK",
  email: "Email",
  url: "URL / Website",
};

export const EVIDENCE_CATEGORY_LABELS = {
  telecom: "Telecom",
  bank_upi: "Bank / UPI",
  other: "Other Artifacts",
};

export const scamLabel = (v) => SCAM_TYPE_LABELS[v] || v || "—";
export const entityTypeLabel = (v) => ENTITY_TYPE_LABELS[v] || (v ? String(v).replace(/_/g, " ") : "Entity");

/** Numeric score used for ranking — mirrors the Analysis Mode queue ordering. */
export function riskScoreOf(c) {
  if (c.risk_score !== null && c.risk_score !== undefined) return Math.round(c.risk_score);
  const level = (c.risk_level || "").toLowerCase();
  if (level === "critical") return 95;
  if (level === "high") return 80;
  if (level === "medium" || level === "med") return 50;
  if (level === "low") return 20;
  return 0;
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  });
}

/* ── Breadcrumb navigation ─────────────────────────────────────────────── */
export function Breadcrumb({ items = [], label = "Breadcrumb" }) {
  return (
    <nav className="std-breadcrumb" aria-label={label}>
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {last || !item.to ? (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Page heading with optional actions ────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="std-pagehead">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="std-pagehead__actions">{actions}</div> : null}
    </div>
  );
}

/* ── Titled panel ──────────────────────────────────────────────────────── */
export function Panel({ id, title, meta, children, flush = false, footer }) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section className="std-panel" id={id} aria-labelledby={headingId}>
      <div className="std-panel__head">
        <h2 className="std-panel__title" id={headingId}>{title}</h2>
        {meta ? <div className="std-panel__meta">{meta}</div> : null}
      </div>
      {flush ? children : <div className="std-panel__body">{children}</div>}
      {footer ? <div className="std-panel__foot">{footer}</div> : null}
    </section>
  );
}

/* ── Formal notice (alert / information) ───────────────────────────────── */
export function Notice({ tone = "info", title, children, action, inline = false, role }) {
  const resolvedRole = role || (tone === "danger" ? "alert" : "status");
  return (
    <div className={`std-notice std-notice--${tone}${inline ? " std-notice--inline" : ""}`} role={resolvedRole}>
      <div>
        {title ? <p className="std-notice__title">{title}</p> : null}
        {children ? <p>{children}</p> : null}
      </div>
      {action || null}
    </div>
  );
}

/* ── Risk level badge (text + symbol + colour; never colour alone) ─────── */
const RISK_CLASS = { critical: "critical", high: "high", medium: "medium", med: "medium", low: "low" };
const RISK_LABEL = { critical: "Critical", high: "High", medium: "Medium", med: "Medium", low: "Low" };

export function RiskBadge({ level }) {
  const key = (level || "").toLowerCase();
  if (!RISK_CLASS[key]) return <span className="std-badge std-badge--neutral">Unrated</span>;
  return <span className={`std-badge std-badge--${RISK_CLASS[key]}`}>{RISK_LABEL[key]}</span>;
}

/* ── Generic status badge ──────────────────────────────────────────────── */
export function StatusBadge({ tone = "neutral", children }) {
  return <span className={`std-badge std-badge--${tone}`}>{children}</span>;
}

/* ── Empty / loading row for tables ────────────────────────────────────── */
export function TableMessage({ colSpan, children }) {
  return (
    <tr>
      <td className="empty" colSpan={colSpan}>{children}</td>
    </tr>
  );
}
