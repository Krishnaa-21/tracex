import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Case, Entity, EntityLink, CaseSummary, RiskLevel, Officer
from app.api.routes.auth import get_current_officer

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    case_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    case_id: Optional[int] = None
    suggested_actions: List[str] = []
    timestamp: str


def _answer_case_scoped(case: Case, query: str, db: Session) -> Dict[str, Any]:
    """Generate high-fidelity, concise intelligence answer for a specific case."""
    q = query.lower().strip()
    case_id = case.id

    entities: List[Entity] = db.query(Entity).filter(Entity.case_id == case_id).all()
    links: List[EntityLink] = db.query(EntityLink).filter(EntityLink.case_id == case_id).all()
    summary: Optional[CaseSummary] = (
        db.query(CaseSummary)
        .filter(CaseSummary.case_id == case_id)
        .order_by(CaseSummary.generated_at.desc())
        .first()
    )

    scam_type_label = (
        case.scam_type.value if hasattr(case.scam_type, "value") else str(case.scam_type)
    ).replace("_", " ").title()

    # Categorize entities
    upis = [e.value for e in entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "upi_handle"]
    accounts = [e.value for e in entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) in ["account", "bank_account"]]
    phones = [e.value for e in entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "phone"]
    urls = [e.value for e in entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "url"]
    high_risks = [e for e in entities if e.risk_level == RiskLevel.high]
    cross_links = [l for l in links if l.extra and l.extra.get("cross_case")]

    suggested = [
        "What are the high-risk entities?",
        "Are there cross-case syndicate links?",
        "What legal directives are recommended?",
    ]

    # 1. Summary / Overview queries
    if any(k in q for k in ["summar", "overview", "what happened", "about this case", "explain", "detail"]):
        narrative = summary.narrative_text if summary and summary.narrative_text else (
            f"Case {case.case_number} involves victim {case.victim_name} in {case.district or 'jurisdiction'} targeted via {scam_type_label}. "
            f"Forensics identified {len(entities)} unique indicators and {len(links)} confirmed connections across multi-source evidence."
        )
        resp = f"**Investigation Brief — Case {case.case_number} ({scam_type_label})**\n\n{narrative}"
        return {"response": resp, "suggested": suggested}

    # 2. Risk / High-risk entities
    if any(k in q for k in ["high risk", "risk", "danger", "threat", "anomal"]):
        if high_risks:
            items = []
            for e in high_risks[:6]:
                t = (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)).replace("_", " ").title()
                reason = f" ({e.anomaly_reason})" if e.anomaly_reason else ""
                items.append(f"- **{t}**: `{e.value}`{reason}")
            resp = (
                f"**High-Risk Indicators for Case {case.case_number}** (Risk Score: {case.risk_score or 85}/100 — {case.risk_level.value.upper() if case.risk_level else 'HIGH'})\n\n"
                + "\n".join(items)
                + f"\n\n**Primary Detection Flag:** {case.why_flagged or 'Rapid multi-hop routing detected'}"
            )
        else:
            resp = f"Case {case.case_number} has an overall risk rating of **{case.risk_score or 'N/A'}/100**. No individual entities are flagged as critical anomalies."
        return {"response": resp, "suggested": suggested}

    # 3. Suspect / Mule / Beneficiary accounts
    if any(k in q for k in ["suspect", "mule", "beneficiary", "perpetrator", "who", "account", "upi", "phone"]):
        lines = []
        if upis:
            lines.append(f"**Target UPI Handles:** {', '.join([f'`{u}`' for u in upis[:3]])}")
        if accounts:
            lines.append(f"**Beneficiary Accounts:** {', '.join([f'`{a}`' for a in accounts[:3]])}")
        if phones:
            lines.append(f"**Suspect Calling Line(s):** {', '.join([f'`{p}`' for p in phones[:3]])}")
        if urls:
            lines.append(f"**Phishing / Command Infrastructure:** {', '.join([f'`{u}`' for u in urls[:2]])}")

        if lines:
            resp = f"**Suspect Identification for Case {case.case_number}**\n\n" + "\n".join(lines) + "\n\n*Recommended action: Issue immediate nodal debit-freeze notice.*"
        else:
            resp = f"No primary payment or caller suspects isolated yet in Case {case.case_number}. Upload additional bank or CDR evidence to correlate."
        return {"response": resp, "suggested": suggested}

    # 4. Cross-case / Syndicate matching
    if any(k in q for k in ["cross", "syndicate", "other case", "match", "network", "connect"]):
        if cross_links:
            matched_cases = list({l.extra.get("matched_case_number") for l in cross_links if l.extra.get("matched_case_number")})
            resp = (
                f"**Cross-Case Intelligence Match Found!**\n\n"
                f"Case {case.case_number} shares **{len(cross_links)} forensic links** with ongoing investigation(s): "
                f"**{', '.join(matched_cases)}**.\n\n"
                f"This strongly indicates operation by an organized cybercrime syndicate reusing identical payment infrastructure and device identifiers."
            )
        else:
            resp = f"No cross-case overlaps currently detected for Case {case.case_number}. All {len(entities)} indicators are isolated to this complaint."
        return {"response": resp, "suggested": suggested}

    # 5. Next steps / Legal freeze directives
    if any(k in q for k in ["freeze", "action", "next step", "notice", "crpc", "direction", "legal"]):
        targets = (upis[:1] + accounts[:1]) or (phones[:1])
        target_str = targets[0] if targets else "primary fraud node"
        resp = (
            f"**Recommended Investigative Protocol for Case {case.case_number}:**\n\n"
            f"1. **Debit Freeze Requisition:** Issue Section 91 CrPC notice to nodal bank/NPCI for `{target_str}` to safeguard stolen funds.\n"
            f"2. **Telecom Subscriber Requisition:** Request CAF / SDR and CDR for calling line `{phones[0] if phones else 'associated mobile'}`.\n"
            f"3. **Takedown Notice:** Transmit Section 69A IT Act blocking order for malicious domains."
        )
        return {"response": resp, "suggested": suggested}

    # Default case answer
    resp = (
        f"**Case {case.case_number} Intelligence Summary**\n"
        f"- **Victim:** {case.victim_name} ({case.district or 'N/A'})\n"
        f"- **Category:** {scam_type_label}\n"
        f"- **Risk Assessment:** {case.risk_score or 85}/100 ({case.risk_level.value.upper() if case.risk_level else 'HIGH'})\n"
        f"- **Forensic Assets:** {len(entities)} entities ({len(high_risks)} high-risk) across {len(links)} correlation links.\n\n"
        f"Ask me for specific details regarding high-risk entities, mule accounts, or legal directives."
    )
    return {"response": resp, "suggested": suggested}


def _answer_cross_case(query: str, db: Session) -> Dict[str, Any]:
    """Generate high-level answers across all cases in the database."""
    q = query.lower().strip()

    total_cases = db.query(Case).count()
    high_risk_cases = db.query(Case).filter(Case.risk_level == RiskLevel.high).count()
    med_risk_cases = db.query(Case).filter(Case.risk_level == RiskLevel.medium).count()
    low_risk_cases = db.query(Case).filter(Case.risk_level == RiskLevel.low).count()
    total_entities = db.query(Entity).count()
    total_links = db.query(EntityLink).count()

    suggested = [
        "How many high-risk cases are open?",
        "What are the top scam categories?",
        "List all active investigations",
    ]

    # How many high-risk cases / count
    if any(k in q for k in ["how many", "count", "number of", "high risk", "cases are open", "statistics", "stats"]):
        resp = (
            f"**Current Operations Room Case Statistics:**\n\n"
            f"- **Total Active Investigations:** {total_cases}\n"
            f"- **High-Risk Priority Cases:** {high_risk_cases} (requires immediate nodal intervention)\n"
            f"- **Medium-Risk Cases:** {med_risk_cases}\n"
            f"- **Low-Risk / Monitoring:** {low_risk_cases}\n"
            f"- **Total Correlated Entities:** {total_entities} across {total_links} graph relationships."
        )
        return {"response": resp, "suggested": suggested}

    # List cases
    if any(k in q for k in ["list", "recent", "all cases", "active cases", "show cases"]):
        cases = db.query(Case).order_by(Case.id.desc()).limit(5).all()
        lines = []
        for c in cases:
            scam = (c.scam_type.value if hasattr(c.scam_type, "value") else str(c.scam_type)).replace("_", " ").title()
            risk = c.risk_level.value.upper() if c.risk_level else "HIGH"
            lines.append(f"- **{c.case_number}** — {c.victim_name} ({scam}) | Risk: `{risk}` ({c.risk_score or 85}/100)")
        resp = f"**Recent Investigation Files ({len(cases)} of {total_cases} total):**\n\n" + "\n".join(lines)
        return {"response": resp, "suggested": suggested}

    # Scam types / breakdown
    if any(k in q for k in ["scam", "categor", "type", "modus", "trend"]):
        resp = (
            f"**Cybercrime Modus Operandi Distribution:**\n\n"
            f"1. **Digital Arrest & Authority Impersonation:** Dominant high-loss vector targeting senior citizens; involves fake Supreme Court/CBI video calls.\n"
            f"2. **UPI Fraud & Instant Loan Phishing:** High-frequency transaction diversion via cloned QR codes and malicious VPAs.\n"
            f"3. **Malicious APK / Device Takeover:** Invasive SMS accessibility permissions harvesting OTPs."
        )
        return {"response": resp, "suggested": suggested}

    # Default cross-case response
    resp = (
        f"**TraceX Cyber Crime Intelligence Assistant**\n\n"
        f"Monitoring **{total_cases} investigations** across the state network ({high_risk_cases} high-priority).\n\n"
        f"You can ask me:\n"
        f"- Details about any specific case (e.g. *'Summarize case TRX-2024-001'* or open a case to ask directly)\n"
        f"- Global statistics (e.g. *'How many high-risk cases are open?'*)\n"
        f"- Suspect account tracing and Section 91 CrPC notice recommendations."
    )
    return {"response": resp, "suggested": suggested}


@router.post("", response_model=ChatResponse)
def handle_chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    """Process officer inquiry with context-aware cyber intelligence responses."""
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message cannot be empty")

    # Check if a specific case_id was provided or referenced in the message
    case = None
    if req.case_id:
        case = db.query(Case).filter(Case.id == req.case_id).first()

    if not case:
        # Try extracting case number pattern like TRX-2024-001 or #1
        match = re.search(r"(?:TRX-\d{4}-\d{3}|#(\d+)|case\s+(\d+))", msg, re.IGNORECASE)
        if match:
            if match.group(1):
                case = db.query(Case).filter(Case.id == int(match.group(1))).first()
            elif match.group(2):
                case = db.query(Case).filter(Case.id == int(match.group(2))).first()
            else:
                case = db.query(Case).filter(Case.case_number.ilike(f"%{match.group(0)}%")).first()

    now_iso = datetime.now(timezone.utc).isoformat()

    if case:
        res_data = _answer_case_scoped(case, msg, db)
        return ChatResponse(
            response=res_data["response"],
            case_id=case.id,
            suggested_actions=res_data.get("suggested", []),
            timestamp=now_iso,
        )
    else:
        res_data = _answer_cross_case(msg, db)
        return ChatResponse(
            response=res_data["response"],
            case_id=None,
            suggested_actions=res_data.get("suggested", []),
            timestamp=now_iso,
        )
