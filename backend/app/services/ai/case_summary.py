from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging
from sqlalchemy.orm import Session

from app.db.models import Case, CaseSummary, Entity, EntityLink, RiskLevel
from app.services.correlation.graph_builder import build_case_graph
from app.services.ai.llm_client import chat_completion, llm_configured

logger = logging.getLogger("tracex.summary")


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
Write a single, cohesive, plain-language investigative narrative (one unified summary block of 3-5 smooth sentences). Avoid technical jargon, complex acronyms, or fragmented sub-headings.
Explain clearly:
1. Exactly what happened to the victim and the operational method used.
2. The key fraudulent entities identified (the main phone number used, beneficiary bank account/UPI handle, or fake website).
3. The core finding (whether linked to known criminal syndicates or other complaints) and the immediate next step the officer should take.
"""
    return prompt


def generate_fallback_summary(
    case: Case,
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
) -> str:
    """Deterministic, unified plain-language summary for investigating officers without requiring an LLM API key."""
    scam_type_str = case.scam_type.value if hasattr(case.scam_type, "value") else str(case.scam_type)
    scam_label = scam_type_str.replace("_", " ").title()
    district_str = case.district or "the jurisdiction"

    # Identify primary entities
    upi_entities = [n["label"] for n in nodes if n["entity_type"] == "upi_handle"]
    acc_entities = [n["label"] for n in nodes if n["entity_type"] == "account"]
    phone_entities = [n["label"] for n in nodes if n["entity_type"] == "phone"]
    imei_entities = [n["label"] for n in nodes if n["entity_type"] == "imei"]
    c2_entities = [n["label"] for n in nodes if "c2" in (n.get("anomaly_reason") or "").lower()]
    url_entities = [n["label"] for n in nodes if n["entity_type"] == "url"]
    cross_case_edges = [e for e in edges if e.get("extra", {}).get("cross_case")]

    # Core key suspect elements
    suspect_elements = []
    if phone_entities:
        suspect_elements.append(f"calling line {phone_entities[0]}")
    if upi_entities:
        suspect_elements.append(f"UPI handle {upi_entities[0]}")
    if acc_entities:
        suspect_elements.append(f"bank account {acc_entities[0]}")
    if url_entities:
        suspect_elements.append(f"phishing portal {url_entities[0]}")
    if c2_entities:
        suspect_elements.append(f"malicious server {c2_entities[0]}")

    suspect_summary = ", ".join(suspect_elements[:3]) if suspect_elements else "multiple linked communication and settlement endpoints"

    # Syndicate & Cross-case note
    syndicate_note = ""
    if cross_case_edges:
        matched_case = cross_case_edges[0].get("extra", {}).get("matched_case_number", "another active complaint")
        syndicate_note = f" Evidence correlation confirms direct operational overlap with ongoing investigation {matched_case}, indicating an active syndicated fraud ring."
    else:
        syndicate_note = " Technical analysis shows coordinated multi-hop fund routing designed to rapidly disperse proceeds across intermediary accounts."

    # Immediate priority directive
    action_note = ""
    if upi_entities and acc_entities:
        action_note = f" The Investigating Officer should immediately issue a Section 91 CrPC freeze directive on UPI handle {upi_entities[0]} and request an emergency debit-freeze on bank account {acc_entities[0]}."
    elif upi_entities:
        action_note = f" The Investigating Officer should immediately issue a Section 91 CrPC freeze directive on UPI handle {upi_entities[0]} to prevent further fund dissipation."
    elif acc_entities:
        action_note = f" The Investigating Officer should immediately request an emergency debit-freeze on beneficiary account {acc_entities[0]}."
    elif phone_entities:
        action_note = f" The Investigating Officer should requisition call records and subscriber details for primary number {phone_entities[0]}."
    else:
        action_note = " The Investigating Officer is advised to initiate immediate nodal freezing requisitions on the primary settlement nodes."

    unified_narrative = (
        f"Victim {case.victim_name} in {district_str} was targeted in an organized {scam_label} operation. "
        f"The perpetrators coordinated the fraud through {suspect_summary} across {len(nodes)} identified digital identifiers and {len(edges)} confirmed connections.{syndicate_note}\n\n"
        f"Immediate Action Recommendation:{action_note}"
    )

    return unified_narrative


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

    # Use the LLM (OpenAI by default) when configured; otherwise / on failure use the deterministic summary
    if llm_configured():
        prompt = build_summary_prompt(case, nodes, edges)
        result = chat_completion(
            [
                {
                    "role": "system",
                    "content": "You are a cyber fraud intelligence analyst assisting police investigating officers. Provide concise, clear, and factual case narratives in 2-3 paragraphs.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_output_tokens=700,
            timeout=20,
        )
        if result.text:
            narrative_text = result.text
        else:
            logger.warning("Case summary LLM unavailable (%s); using deterministic summary", result.error)

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
