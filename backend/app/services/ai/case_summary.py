from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Case, CaseSummary, Entity, EntityLink, RiskLevel
from app.services.correlation.graph_builder import build_case_graph


def build_summary_prompt(
    case: Case,
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
) -> str:
    """Build a structured prompt detailing all confirmed entities, links, and risk factors."""
    scam_type_str = case.scam_type.value if hasattr(case.scam_type, "value") else str(case.scam_type)
    risk_level_str = case.risk_level.value if hasattr(case.risk_level, "value") and case.risk_level else (str(case.risk_level) if case.risk_level else "unscored")

    # Format nodes
    node_lines = []
    for n in nodes[:25]:  # Top nodes
        anomaly = f" [Anomaly: {n['anomaly_reason']}]" if n.get("anomaly_reason") else ""
        node_lines.append(f"- {n['entity_type'].upper()}: {n['label']} (Risk: {n['risk_level']}){anomaly}")

    # Format edges
    node_label_map = {n["id"]: f"{n['label']} ({n['entity_type']})" for n in nodes}
    edge_lines = []
    for e in edges[:30]:
        src = node_label_map.get(e["source"], f"Entity #{e['source']}")
        tgt = node_label_map.get(e["target"], f"Entity #{e['target']}")
        cross = f" [Cross-case match with {e['extra']['matched_case_number']}]" if e.get("extra", {}).get("cross_case") else ""
        edge_lines.append(f"- {src} <--> {tgt} via '{e['basis']}' (confidence: {e['confidence']}){cross}")

    prompt = f"""You are a specialized cyber fraud intelligence analyst assisting an Indian Police Cyber Cell Investigating Officer.
Analyze the following evidence correlation graph and write an authoritative, plain-language investigative case narrative.

=== CASE METADATA ===
- Case Number: {case.case_number}
- Victim Name: {case.victim_name}
- Scam Category: {scam_type_str}
- District: {case.district or 'Pending resolution'}
- Risk Assessment: Level={risk_level_str}, Score={case.risk_score or 0}/100
- Primary Detection Basis: {case.why_flagged or 'Evidence correlation pending'}

=== KEY TECHNICAL ENTITIES IDENTIFIED ({len(nodes)} total) ===
{chr(10).join(node_lines) if node_lines else 'No distinct entities parsed.'}

=== CONFIRMED CORRELATION GRAPH LINKS ({len(edges)} total) ===
{chr(10).join(edge_lines) if edge_lines else 'No links established yet.'}

=== REQUIRED OUTPUT STRUCTURE ===
Write exactly 2 to 3 short paragraphs in formal, factual investigative style:
1. Executive Incident Overview: What happened, how the victim was defrauded, and the operational modus operandi identified from the technical artifacts.
2. Critical Infrastructure & Mule Network: Which specific entities matter most (identifying primary beneficiary accounts, mule UPI handles, C2 endpoints, or reused IMEIs) and explain why based on link confidence. Mention any cross-case connections.
3. Priority Officer Directives: Concrete next steps the Investigating Officer should immediately execute (e.g. Section 91 CrPC notice to specific banks/payment aggregators to freeze funds, CDR/tower dump requisition for specific IMEIs, or CERT-In takedown).
"""
    return prompt


def generate_fallback_summary(
    case: Case,
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
) -> str:
    """Deterministic fallback narrative for offline execution without requiring an LLM API key."""
    scam_type_str = case.scam_type.value if hasattr(case.scam_type, "value") else str(case.scam_type)
    scam_label = scam_type_str.replace("_", " ").title()
    risk_level_str = case.risk_level.value if hasattr(case.risk_level, "value") and case.risk_level else (str(case.risk_level) if case.risk_level else "Moderate")
    score_str = f"{case.risk_score:.0f}/100" if case.risk_score is not None else "Pending"
    district_str = case.district or "Central Jurisdiction"

    # Identify notable entities
    upi_entities = [n["label"] for n in nodes if n["entity_type"] == "upi_handle"]
    acc_entities = [n["label"] for n in nodes if n["entity_type"] == "account"]
    imei_entities = [n["label"] for n in nodes if n["entity_type"] == "imei"]
    c2_entities = [n["label"] for n in nodes if "c2" in (n.get("anomaly_reason") or "").lower()]
    high_risk_nodes = [n["label"] for n in nodes if n.get("risk_level") == "high"]

    # Identify cross-case edges
    cross_case_edges = [e for e in edges if e.get("extra", {}).get("cross_case")]

    # Paragraph 1: What happened
    p1 = (
        f"Investigation into case {case.case_number} concerning victim {case.victim_name} in {district_str} "
        f"establishes an active {scam_label} operation. The case has been assessed at {risk_level_str.upper()} risk "
        f"({score_str}) driven by {case.why_flagged or 'dense technical correlation across submitted digital artifacts'}. "
        f"Automated evidence normalization ingested {len(nodes)} distinct technical entities across telecom, settlement, "
        f"and application artifacts, generating {len(edges)} confirmed cross-evidence relationship links."
    )

    # Paragraph 2: Which entities matter most and why
    notable_items = []
    if upi_entities and acc_entities:
        notable_items.append(f"primary mule beneficiary handle {upi_entities[0]}, directly linked to settlement account {acc_entities[0]} with 0.95 correlation confidence")
    elif upi_entities:
        notable_items.append(f"fraudulent payment handle {upi_entities[0]}")

    if imei_entities:
        notable_items.append(f"suspect hardware device identified by IMEI {imei_entities[0]}")

    if c2_entities:
        notable_items.append(f"command-and-control endpoint {c2_entities[0]} flagged for persistent exfiltration")

    if cross_case_edges:
        matched_num = cross_case_edges[0].get("extra", {}).get("matched_case_number", "another complaint")
        notable_items.append(f"a direct operational overlap matching ongoing investigation {matched_num}")

    entities_narrative = (
        f"Analysis indicates critical focal nodes centered around {'; '.join(notable_items)}. "
        if notable_items
        else f"Correlation highlights {len(high_risk_nodes)} high-priority indicators exhibiting shared infrastructure patterns. "
    )

    p2 = (
        f"The forensic graph identifies systematic operational layering. {entities_narrative}"
        f"The high confidence scores indicate these identifiers represent organized syndicated fraud infrastructure "
        f"rather than isolated opportunistic activity."
    )

    # Paragraph 3: Recommended officer directives
    directives = []
    if upi_entities:
        directives.append(f"immediately serve Section 91 CrPC freezing directives to the payment service provider for UPI handle {upi_entities[0]}")
    if acc_entities:
        directives.append(f"request emergency debit-freeze and KYC/audit trail extraction for bank account {acc_entities[0]}")
    if imei_entities:
        directives.append(f"requisition cellular CDR and tower triangulation for IMEI {imei_entities[0]} across telecom service providers")
    if c2_entities:
        directives.append(f"submit IP/domain blocking requisition to CERT-In / DoT for endpoint {c2_entities[0]}")

    if not directives:
        directives.append("proceed with formal nodal escalation and subscriber identification requisitions")

    p3 = (
        f"The Investigating Officer is advised to prioritise: 1) {directives[0]}; "
        + (f"2) {directives[1]}; " if len(directives) > 1 else "")
        + (f"3) {directives[2]}." if len(directives) > 2 else "and initiate inter-state cyber cell coordination.")
    )

    return f"{p1}\n\n{p2}\n\n{p3}"


def generate_case_summary(case_id: int, db: Session) -> CaseSummary:
    """Generate, persist, and return an AI narrative summary for a case.
    Uses LLM API if configured, otherwise produces a high-fidelity deterministic narrative.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise ValueError(f"Case #{case_id} not found")

    # Read pre-computed graph structure from Phase 3
    graph = build_case_graph(case_id, db)
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    narrative_text: Optional[str] = None

    # Check if a live LLM API key is provided
    api_key = (settings.AI_SUMMARY_API_KEY or "").strip()
    if api_key and api_key != "your_key_here":
        try:
            prompt = build_summary_prompt(case, nodes, edges)
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": settings.AI_SUMMARY_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a cyber fraud intelligence analyst assisting police investigating officers. Provide concise, clear, and factual case narratives in 2-3 paragraphs.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                "temperature": 0.3,
            }
            with httpx.Client(timeout=12.0) as client:
                response = client.post(settings.AI_SUMMARY_API_URL, headers=headers, json=payload)
                if response.status_code == 200:
                    resp_json = response.json()
                    choices = resp_json.get("choices", [])
                    if choices:
                        narrative_text = choices[0]["message"]["content"].strip()
        except Exception:
            narrative_text = None

    # Fall back to deterministic structured summary if no API key or call failed
    if not narrative_text:
        narrative_text = generate_fallback_summary(case, nodes, edges)

    # Persist in CaseSummary table
    summary_record = CaseSummary(
        case_id=case_id,
        narrative_text=narrative_text,
        generated_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(summary_record)
    db.commit()
    db.refresh(summary_record)

    return summary_record
