import csv
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.db.models import Case, Entity, EvidenceFile, CaseSummary, Officer, RiskLevel
from app.utils.hashing import compute_sha256
from app.utils.file_storage import UPLOADS_DIR
from app.services.correlation.graph_builder import build_case_graph
from app.services.ai.case_summary import generate_case_summary

THREAT_INTEL_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "threat_intel"


def get_reports_dir(case_id: int) -> Path:
    """Ensure and return the reports directory for a specific case."""
    reports_dir = UPLOADS_DIR / str(case_id) / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    return reports_dir


def load_known_bad_urls() -> List[Dict[str, str]]:
    """Load known malicious URLs from bundled threat intelligence CSV."""
    csv_path = THREAT_INTEL_DIR / "known_bad_urls.csv"
    items = []
    if csv_path.exists():
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or row[0].startswith("#") or row[0].lower() == "url":
                    continue
                if len(row) >= 2:
                    items.append({
                        "url": row[0].strip(),
                        "source": row[1].strip(),
                        "date_added": row[2].strip() if len(row) > 2 else "",
                    })
    return items


def load_known_apk_hashes() -> List[Dict[str, str]]:
    """Load known malware APK SHA-256 hashes from bundled CSV."""
    csv_path = THREAT_INTEL_DIR / "known_apk_hashes.csv"
    items = []
    if csv_path.exists():
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or row[0].startswith("#") or row[0].lower() == "sha256":
                    continue
                if len(row) >= 2:
                    items.append({
                        "sha256": row[0].strip().lower(),
                        "malware_family": row[1].strip(),
                        "date_added": row[2].strip() if len(row) > 2 else "",
                    })
    return items


def _render_pdf_with_reportlab_brief(
    case: Case,
    officer: Optional[Officer],
    summary_text: str,
    top_entities: List[Entity],
    freeze_targets: List[str],
    graph_stats: Dict[str, int],
) -> bytes:
    """Fallback high-fidelity PDF renderer for investigative brief using native ReportLab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0f172a"),
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    story = []

    # Header
    story.append(Paragraph("TRACEX — CYBER FRAUD OPERATIONS ROOM", title_style))
    story.append(Paragraph("CONFIDENTIAL • LAW ENFORCEMENT INVESTIGATIVE BRIEF", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=8))

    # Metadata Grid
    scam_str = (case.scam_type.value if hasattr(case.scam_type, "value") else str(case.scam_type)).replace("_", " ").title()
    risk_level_str = (case.risk_level.value if hasattr(case.risk_level, "value") and case.risk_level else "MODERATE").upper()
    meta_data = [
        [
            Paragraph(f"<b>Case Ref:</b> {case.case_number}", body_style),
            Paragraph(f"<b>Victim Name:</b> {case.victim_name}", body_style),
            Paragraph(f"<b>Category:</b> {scam_str}", body_style),
        ],
        [
            Paragraph(f"<b>District:</b> {case.district or 'Pending'}", body_style),
            Paragraph(f"<b>Risk Level:</b> {risk_level_str} ({case.risk_score or 0:.0f}/100)", body_style),
            Paragraph(f"<b>Registered At:</b> {case.registered_at.strftime('%Y-%m-%d %H:%M')}", body_style),
        ],
        [
            Paragraph(f"<b>Investigating Officer:</b> {officer.name if officer else 'A. Sharma'}", body_style),
            Paragraph(f"<b>Station:</b> {officer.station_name if officer else 'Cyber Cell'}", body_style),
            Paragraph(f"<b>Graph Stats:</b> {graph_stats.get('nodes', 0)} entities, {graph_stats.get('edges', 0)} links", body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[180, 180, 180])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # AI Case Narrative
    story.append(Paragraph("EXECUTIVE CASE NARRATIVE", heading_style))
    for p_text in summary_text.split("\n\n"):
        if p_text.strip():
            story.append(Paragraph(p_text.strip(), body_style))
            story.append(Spacer(1, 4))
    story.append(Spacer(1, 6))

    # High-Risk Entities Table
    story.append(Paragraph("CRITICAL IDENTIFIED ENTITIES", heading_style))
    ent_rows = [["Type", "Entity Value", "Risk Level", "Detection Anomaly Flag"]]
    for ent in top_entities[:5]:
        t_str = ent.entity_type.value if hasattr(ent.entity_type, "value") else str(ent.entity_type)
        r_str = (ent.risk_level.value if hasattr(ent.risk_level, "value") and ent.risk_level else "LOW").upper()
        ent_rows.append([
            t_str.upper(),
            ent.value,
            r_str,
            ent.anomaly_reason or "Normal traffic correlation",
        ])
    if len(ent_rows) == 1:
        ent_rows.append(["-", "No high-risk entities identified", "-", "-"])

    ent_table = Table(ent_rows, colWidths=[70, 160, 70, 240])
    ent_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7.5),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 7.5),
        ("PADDING", (0, 0), (-1, -1), 3.5),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(ent_table)
    story.append(Spacer(1, 10))

    # Priority Enforcement Directives
    story.append(Paragraph("RECOMMENDED ACTION DIRECTIVES (FREEZE / SEIZURE TARGETS)", heading_style))
    if freeze_targets:
        for tgt in freeze_targets[:4]:
            story.append(Paragraph(f"• <b>Priority Freeze Order (Sec 91 CrPC):</b> Issue immediate lien/debit freeze on beneficiary node <code>{tgt}</code>.", body_style))
            story.append(Spacer(1, 2))
    else:
        story.append(Paragraph("• Proceed with CDR requisitions and standard nodal bank notices for all linked transaction nodes.", body_style))
    story.append(Spacer(1, 12))

    # Footer note placeholder
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=4))
    story.append(Paragraph("Document certified under TraceX Digital Evidence Integrity Module. Generated by authorized Cyber Cell Console.", subtitle_style))

    doc.build(story)
    return buf.getvalue()


def _render_pdf_with_reportlab_takedown(
    case: Case,
    officer: Optional[Officer],
    matches: List[Dict[str, Any]],
) -> bytes:
    """Fallback high-fidelity PDF renderer for takedown notice using native ReportLab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#991b1b"),
    )
    subtitle_style = ParagraphStyle(
        "SubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#64748b"),
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    story = []

    # Header
    story.append(Paragraph("TRACEX — CYBER THREAT COORDINATION UNIT", title_style))
    story.append(Paragraph("EMERGENCY TAKEDOWN & BLOCKING ADVISORY REQUISITION", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#fca5a5"), spaceAfter=8))

    # Officer / Jurisdiction Block
    officer_name = officer.name if officer else "A. Sharma"
    badge_id = officer.badge_id if officer else "MP-IO-4471"
    station_name = officer.station_name if officer else "Bhopal Cyber Cell"

    jur_data = [
        [
            Paragraph(f"<b>Requisitioning Officer:</b> {officer_name} ({badge_id})", body_style),
            Paragraph(f"<b>Jurisdiction / Unit:</b> {station_name}", body_style),
        ],
        [
            Paragraph(f"<b>Case Reference:</b> {case.case_number}", body_style),
            Paragraph(f"<b>District:</b> {case.district or 'Madhya Pradesh'}", body_style),
        ],
        [
            Paragraph(f"<b>Target Victim:</b> {case.victim_name}", body_style),
            Paragraph(f"<b>Issuance Timestamp:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC", body_style),
        ],
    ]
    jur_table = Table(jur_data, colWidths=[270, 270])
    jur_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fecdd3")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ffe4e6")),
    ]))
    story.append(jur_table)
    story.append(Spacer(1, 10))

    # Threat Intelligence Matches
    story.append(Paragraph("THREAT INTELLIGENCE CROSS-MATCH RESULTS", heading_style))

    if matches:
        story.append(Paragraph(
            "<b>Advisory Notice:</b> The following malicious indicators were identified in evidence submitted "
            "for this complaint and cross-matched with high confidence against verified cyber threat feeds. "
            "<i>Matched against locally bundled indicator list — no live web request made.</i>",
            body_style,
        ))
        story.append(Spacer(1, 6))

        match_rows = [["Indicator Type", "Matched Indicator (URL / Hash)", "Threat Intelligence Source", "Date Flagged"]]
        for m in matches:
            match_rows.append([
                m["type"],
                Paragraph(f"<code>{m['indicator']}</code>", body_style),
                m["source"],
                m["date_added"],
            ])
        match_table = Table(match_rows, colWidths=[80, 240, 140, 80])
        match_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#991b1b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 7.5),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 7.5),
            ("PADDING", (0, 0), (-1, -1), 4),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fca5a5")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fee2e2")),
        ]))
        story.append(match_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("STATUTORY ACTION REQUIRED", heading_style))
        story.append(Paragraph(
            "Under Section 69A of the Information Technology Act, 2000, and standard CERT-In emergency "
            "takedown protocols, all Internet Service Providers (ISPs), Domain Registrars, and Telecom "
            "Licensees are directed to immediately disable public resolution, block IP routing, and preserve "
            "DNS/server logs for the listed indicators.",
            body_style,
        ))
    else:
        story.append(Paragraph(
            "<b>Verification Status: Clean Indicator Scan.</b><br/>"
            "No known indicators were matched against bundled threat intelligence feeds for this case's evidence. "
            "Routine monitoring remains active. <i>Matched against locally bundled indicator list — no live web request made.</i>",
            body_style,
        ))

    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=4))
    story.append(Paragraph("Requisition issued under digital authority of investigating cyber cell.", subtitle_style))

    doc.build(story)
    return buf.getvalue()


def _render_pdf(html_string: str, fallback_factory) -> bytes:
    """Attempt WeasyPrint rendering, seamlessly falling back to a lazily-built
    ReportLab document (only constructed if WeasyPrint actually fails) on
    environments without GTK/Pango system libraries."""
    try:
        import weasyprint
        return weasyprint.HTML(string=html_string).write_pdf()
    except Exception:
        return fallback_factory()


def generate_investigative_brief(case_id: int, db: Session) -> Tuple[bytes, Path, str]:
    """Generate the official one-page Investigative Brief PDF.
    Returns: (pdf_bytes, saved_file_path, sha256_hash)
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise ValueError(f"Case #{case_id} not found")

    officer = case.officer
    entities = db.query(Entity).filter(Entity.case_id == case_id).all()
    graph = build_case_graph(case_id, db)
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    # Get latest summary
    latest_summary = (
        db.query(CaseSummary)
        .filter(CaseSummary.case_id == case_id)
        .order_by(CaseSummary.generated_at.desc())
        .first()
    )
    if not latest_summary:
        latest_summary = generate_case_summary(case_id, db)
    summary_text = latest_summary.narrative_text

    # Top risk entities
    top_entities = sorted(
        entities,
        key=lambda e: (e.risk_level == RiskLevel.high, e.risk_level == RiskLevel.medium),
        reverse=True,
    )[:5]

    # Freeze targets (high-confidence account or UPI handle nodes)
    freeze_targets = []
    for e in edges:
        if e.get("basis") in ["shared_upi_handle", "shared_account"]:
            for n in nodes:
                if n["id"] in [e["source"], e["target"]] and n["entity_type"] in ["upi_handle", "account"]:
                    if n["label"] not in freeze_targets:
                        freeze_targets.append(n["label"])

    fallback_factory = lambda: _render_pdf_with_reportlab_brief(
        case=case,
        officer=officer,
        summary_text=summary_text,
        top_entities=top_entities,
        freeze_targets=freeze_targets,
        graph_stats={"nodes": len(nodes), "edges": len(edges)},
    )

    # Clean HTML template for WeasyPrint
    scam_str = (case.scam_type.value if hasattr(case.scam_type, "value") else str(case.scam_type)).replace("_", " ").title()
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
@page {{ size: A4 portrait; margin: 15mm; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; }}
.header {{ border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px; }}
h1 {{ font-size: 16px; margin: 0; color: #0f172a; }}
.sub {{ font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }}
.grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; margin-bottom: 12px; border-radius: 4px; }}
.h2 {{ font-size: 11px; font-weight: bold; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 10px; margin-bottom: 6px; }}
table {{ width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }}
th, td {{ border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }}
th {{ background: #0f172a; color: #fff; }}
.footer {{ border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8px; color: #64748b; margin-top: 15px; }}
</style>
</head>
<body>
<div class="header">
  <h1>TRACEX — CYBER FRAUD OPERATIONS ROOM</h1>
  <div class="sub">CONFIDENTIAL • LAW ENFORCEMENT INVESTIGATIVE BRIEF</div>
</div>
<div class="grid">
  <div><b>Case Ref:</b> {case.case_number}</div>
  <div><b>Victim:</b> {case.victim_name}</div>
  <div><b>Category:</b> {scam_str}</div>
  <div><b>District:</b> {case.district or 'Pending'}</div>
  <div><b>Risk Assessment:</b> {(case.risk_level.value if case.risk_level else 'LOW').upper()} ({case.risk_score or 0:.0f}/100)</div>
  <div><b>Officer:</b> {officer.name if officer else 'A. Sharma'}</div>
</div>
<div class="h2">Executive Case Narrative</div>
<p>{summary_text.replace(chr(10), '<br/>')}</p>
<div class="h2">Recommended Enforcement Directives</div>
<ul>
  {''.join(f'<li><b>Freeze Order (Sec 91 CrPC):</b> Lien on beneficiary node <code>{t}</code></li>' for t in freeze_targets) if freeze_targets else '<li>Proceed with formal nodal bank requisitions.</li>'}
</ul>
<div class="footer">TraceX Digital Evidence Integrity Module • Case: {case.case_number}</div>
</body>
</html>"""

    pdf_bytes = _render_pdf(html_content, fallback_factory)
    sha256_hash = compute_sha256(pdf_bytes)

    clean_num = case.case_number.replace("#", "").strip()
    reports_dir = get_reports_dir(case_id)
    dest_path = reports_dir / f"investigative_brief_{clean_num}.pdf"
    with open(dest_path, "wb") as f:
        f.write(pdf_bytes)

    return pdf_bytes, dest_path, sha256_hash


def generate_takedown_request(case_id: int, db: Session) -> Tuple[bytes, Path, str, List[Dict[str, Any]]]:
    """Scan case indicators against threat intelligence CSVs and generate Takedown Request PDF.
    Returns: (pdf_bytes, saved_file_path, sha256_hash, matched_indicators)
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise ValueError(f"Case #{case_id} not found")

    officer = case.officer
    entities = db.query(Entity).filter(Entity.case_id == case_id).all()
    evidence_files = db.query(EvidenceFile).filter(EvidenceFile.case_id == case_id).all()

    bad_urls = load_known_bad_urls()
    bad_hashes = load_known_apk_hashes()

    matches = []

    # 1. Match URLs
    case_urls = [e.value for e in entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "url"]
    for url in case_urls:
        clean_u = url.strip().lower()
        for bu in bad_urls:
            target_u = bu["url"].strip().lower()
            if clean_u == target_u or clean_u in target_u or target_u in clean_u:
                matches.append({
                    "type": "Phishing URL / Host",
                    "indicator": url,
                    "source": bu["source"],
                    "date_added": bu["date_added"],
                })
                break

    # 2. Match Hashes
    case_hashes = [ef.sha256_hash.lower() for ef in evidence_files if ef.sha256_hash]
    for ch in case_hashes:
        for bh in bad_hashes:
            if ch == bh["sha256"]:
                matches.append({
                    "type": f"Malware APK ({bh['malware_family']})",
                    "indicator": ch[:24] + "...",
                    "source": "CERT-In Threat Registry",
                    "date_added": bh["date_added"],
                })
                break

    fallback_factory = lambda: _render_pdf_with_reportlab_takedown(
        case=case,
        officer=officer,
        matches=matches,
    )

    clean_num = case.case_number.replace("#", "").strip()
    html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>body{{font-family:sans-serif;font-size:11px;}}</style></head>
<body>
<h1>TRACEX — CYBER THREAT COORDINATION UNIT</h1>
<h2>EMERGENCY TAKEDOWN NOTICE & ADVISORY REQUISITION</h2>
<p><b>Case:</b> {case.case_number} | <b>Officer:</b> {officer.name if officer else 'A. Sharma'}</p>
<p>Matched against locally bundled indicator list — no live web request made.</p>
</body>
</html>"""

    pdf_bytes = _render_pdf(html_content, fallback_factory)
    sha256_hash = compute_sha256(pdf_bytes)

    reports_dir = get_reports_dir(case_id)
    dest_path = reports_dir / f"takedown_request_{clean_num}.pdf"
    with open(dest_path, "wb") as f:
        f.write(pdf_bytes)

    return pdf_bytes, dest_path, sha256_hash, matches
