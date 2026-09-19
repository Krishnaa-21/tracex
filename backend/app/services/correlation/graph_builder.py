from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from app.db.models import Entity, EntityLink


_GRAPH_CACHE: Dict[int, Dict[str, Any]] = {}


def invalidate_graph_cache(case_id: int = None) -> None:
    """Clear cached graph for a case or all cases."""
    if case_id is None:
        _GRAPH_CACHE.clear()
    else:
        _GRAPH_CACHE.pop(case_id, None)


def build_case_graph(case_id: int, db: Session, use_cache: bool = True) -> Dict[str, Any]:
    """Build a node-link graph for a case from its Entity and EntityLink records.
    Returns: { "nodes": [...], "edges": [...] }
    """
    if use_cache and case_id in _GRAPH_CACHE:
        return _GRAPH_CACHE[case_id]

    links: List[EntityLink] = (
        db.query(EntityLink)
        .filter(EntityLink.case_id == case_id)
        .all()
    )

    case_entities: List[Entity] = (
        db.query(Entity)
        .filter(Entity.case_id == case_id)
        .all()
    )
    entity_map = {e.id: e for e in case_entities}

    # If any link references an external entity (from cross-case correlation), load it too
    external_ids = set()
    for l in links:
        if l.entity_a_id not in entity_map:
            external_ids.add(l.entity_a_id)
        if l.entity_b_id not in entity_map:
            external_ids.add(l.entity_b_id)

    if external_ids:
        external_entities = (
            db.query(Entity)
            .filter(Entity.id.in_(list(external_ids)))
            .all()
        )
        for ext_e in external_entities:
            entity_map[ext_e.id] = ext_e

    # Node degree (badge count) = number of edges touching that entity.
    # Derived entirely from the `links` we already loaded above -- no extra query.
    degree: Dict[int, int] = defaultdict(int)
    for link in links:
        degree[link.entity_a_id] += 1
        degree[link.entity_b_id] += 1

    nodes = []
    for ent_id, ent in entity_map.items():
        type_str = ent.entity_type.value if hasattr(ent.entity_type, "value") else str(ent.entity_type)
        risk_str = ent.risk_level.value if hasattr(ent.risk_level, "value") else str(ent.risk_level)
        nodes.append({
            "id": ent.id,
            "label": ent.value,
            "entity_type": type_str,
            "risk_level": risk_str,
            "anomaly_reason": ent.anomaly_reason,
            "case_id": ent.case_id,
            "is_cross_case": ent.case_id != case_id,
            "degree": degree.get(ent.id, 0),
        })

    edges = []
    for link in links:
        edges.append({
            "id": link.id,
            "source": link.entity_a_id,
            "target": link.entity_b_id,
            "basis": link.basis,
            "confidence": round(float(link.confidence), 2),
            "source_evidence_ids": link.source_evidence_ids or [],
            "extra": link.extra or {},
        })

    result = {
        "nodes": nodes,
        "edges": edges,
    }
    _GRAPH_CACHE[case_id] = result
    return result