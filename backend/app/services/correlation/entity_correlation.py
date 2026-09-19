from typing import List, Dict, Tuple, Set, Optional, Any, Callable
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models import Entity, EntityLink, Case, CaseStatus, RiskLevel


def is_same_subnet_24(ip1: str, ip2: str) -> bool:
    """Return True if two IPv4 addresses are distinct but share the same /24 subnet."""
    try:
        parts1 = [int(x) for x in ip1.strip().split(".")]
        parts2 = [int(x) for x in ip2.strip().split(".")]
        if len(parts1) == 4 and len(parts2) == 4:
            return parts1[:3] == parts2[:3] and parts1[3] != parts2[3]
    except Exception:
        pass
    return False


def _share_a_record(entity_a: Entity, entity_b: Entity) -> bool:
    """Return True if two entities from the same evidence file actually appeared
    together on the same underlying record (e.g. the same CDR call row, or the
    same bank/UPI transaction row) rather than just somewhere in the same file.

    Kept for backward compatibility / any other callers. The hot paths below
    (_link_cooccurring_pairs) implement the same semantics via an inverted row
    index instead of calling this per-pair, so they no longer use it directly.
    """
    idx_a = (entity_a.extra or {}).get("row_indices")
    idx_b = (entity_b.extra or {}).get("row_indices")
    if not idx_a or not idx_b:
        return True
    return not set(idx_a).isdisjoint(idx_b)


def _bucket_by_row(ents: List[Entity]) -> Tuple[Dict[int, List[Entity]], List[Entity]]:
    """Split entities into:
    - a dict of row_index -> entities that appeared at that row (row-tracked)
    - a list of entities with no row_indices at all (untracked)

    An entity with multiple row_indices is placed under every row it appears in.
    """
    by_row: Dict[int, List[Entity]] = defaultdict(list)
    no_row: List[Entity] = []
    for e in ents:
        idx = (e.extra or {}).get("row_indices")
        if not idx:
            no_row.append(e)
        else:
            for i in idx:
                by_row[i].append(e)
    return by_row, no_row


def _link_cooccurring_pairs(
    group_a: List[Entity],
    group_b: List[Entity],
    link_fn: Callable[[Entity, Entity], None],
) -> None:
    """Link entities from two groups that co-occur on the same underlying record.

    Same semantics as calling `_share_a_record` on every (a, b) pair -- entities
    with row_indices only link when a row index is shared; entities with no
    row_indices at all fall back to linking against everything (unchanged
    behavior for older data / non-row-oriented sources) -- but computed via an
    inverted row index instead of an O(len(group_a) * len(group_b)) scan.
    `link_fn` is expected to be idempotent-safe (add_link already dedupes by
    entity pair + basis), so a pair being visited more than once here is fine.
    """
    by_row_a, no_row_a = _bucket_by_row(group_a)
    by_row_b, no_row_b = _bucket_by_row(group_b)

    # Row-tracked entities: only pair within the same row.
    for row_idx, row_a_ents in by_row_a.items():
        for b_ent in by_row_b.get(row_idx, []):
            for a_ent in row_a_ents:
                link_fn(a_ent, b_ent)

    # Untracked entities fall back to full co-occurrence, same as before.
    flat_row_tracked_a = [e for ents in by_row_a.values() for e in ents]
    for a_ent in no_row_a:
        for b_ent in group_b:
            link_fn(a_ent, b_ent)
    for b_ent in no_row_b:
        for a_ent in flat_row_tracked_a:
            link_fn(a_ent, b_ent)


def get_confidence_and_basis(
    entity_type_str: str,
    is_multi_source: bool = False,
    is_subnet: bool = False,
) -> Tuple[float, str]:
    """Return (confidence, basis) based on core investigative rules."""
    et = entity_type_str.lower()

    if is_subnet:
        return 0.4, "shared_ip_subnet"

    if et in ["upi_handle", "upi"]:
        return 0.95, "shared_upi_handle"
    elif et in ["account", "bank_account"]:
        return 0.95, "shared_account"
    elif et == "phone":
        return 0.9, "shared_phone"
    elif et == "ip_address":
        return 0.7, "shared_ip_address"
    elif et == "imei":
        return 0.6, "shared_imei"
    elif et == "imsi":
        return 0.6, "shared_imsi"
    elif et == "email":
        return 0.85, "shared_email"
    elif et == "url":
        return 0.75, "shared_url"
    else:
        return 0.5, f"shared_{et}"


def correlate_case(case_id: int, db: Session) -> List[EntityLink]:
    """Execute entity correlation for a given case:
    1. Group entities by (entity_type, value) and identify multi-evidence appearances.
    2. Check cross-entity relationships (co-occurring IMEI/phone/IMSI, Account/UPI, IP subnets).
    3. Perform cross-case correlation against entities from other complaints.
    4. Persist and return new/existing EntityLink rows.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return []

    # Update case status to correlating if currently open
    if case.status == CaseStatus.open:
        case.status = CaseStatus.correlating
        db.commit()

    entities: List[Entity] = db.query(Entity).filter(Entity.case_id == case_id).all()
    if not entities:
        return []

    # Load existing links for this case to prevent duplicates
    existing_links: List[EntityLink] = db.query(EntityLink).filter(EntityLink.case_id == case_id).all()
    existing_pairs: Set[Tuple[int, int, str]] = set()
    for link in existing_links:
        u, v = min(link.entity_a_id, link.entity_b_id), max(link.entity_a_id, link.entity_b_id)
        existing_pairs.add((u, v, link.basis))

    new_links: List[EntityLink] = []

    def add_link(
        e_a: Entity,
        e_b: Entity,
        basis: str,
        confidence: float,
        evidence_ids: List[int],
        extra: Optional[Dict[str, Any]] = None,
    ):
        if e_a.id == e_b.id:
            return
        pair_key = (min(e_a.id, e_b.id), max(e_a.id, e_b.id), basis)
        if pair_key not in existing_pairs:
            existing_pairs.add(pair_key)
            clean_evidence_ids = sorted(list({int(x) for x in evidence_ids if x is not None}))
            link_record = EntityLink(
                case_id=case_id,
                entity_a_id=e_a.id,
                entity_b_id=e_b.id,
                basis=basis,
                confidence=confidence,
                source_evidence_ids=clean_evidence_ids,
                extra=extra or {},
            )
            new_links.append(link_record)

    # 1. Group entities by (entity_type, value)
    by_type_and_val: Dict[Tuple[str, str], List[Entity]] = defaultdict(list)
    for ent in entities:
        type_str = ent.entity_type.value if hasattr(ent.entity_type, "value") else str(ent.entity_type)
        by_type_and_val[(type_str, ent.value)].append(ent)

    # For any group with multiple entities from different EvidenceFiles:
    for (type_str, val), group in by_type_and_val.items():
        evidence_sources = set()
        for e in group:
            if e.source_evidence_ids:
                evidence_sources.update(e.source_evidence_ids)
            elif e.evidence_file_id:
                evidence_sources.add(e.evidence_file_id)

        if len(group) > 1 or len(evidence_sources) > 1:
            conf, basis = get_confidence_and_basis(type_str, is_multi_source=True)
            all_evidence_ids = list(evidence_sources)
            # Link pairwise in the group
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    add_link(group[i], group[j], basis, conf, all_evidence_ids)

    # 2. Intra-evidence co-occurrence and relational correlation:
    # Group entities by evidence_file_id
    by_file: Dict[Optional[int], List[Entity]] = defaultdict(list)
    for ent in entities:
        by_file[ent.evidence_file_id].append(ent)

    for file_id, file_entities in by_file.items():
        # Look for co-occurring IMEI and Phone / IMSI.
        # Bucketed by row index instead of a full imeis x phones cross-product --
        # bounded by the number of rows in the file, not len(imeis) * len(phones).
        imeis = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "imei"]
        phones = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) in ["phone", "imsi"]]

        def _link_imei_phone(imei_ent: Entity, phone_ent: Entity) -> None:
            ev_ids = list(set((imei_ent.source_evidence_ids or []) + (phone_ent.source_evidence_ids or [])))
            add_link(imei_ent, phone_ent, "shared_imei", 0.6, ev_ids)

        _link_cooccurring_pairs(imeis, phones, _link_imei_phone)

        # Look for co-occurring Account and UPI -- same row-bucketed approach.
        accounts = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "account"]
        upis = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "upi_handle"]

        def _link_acc_upi(acc_ent: Entity, upi_ent: Entity) -> None:
            ev_ids = list(set((acc_ent.source_evidence_ids or []) + (upi_ent.source_evidence_ids or [])))
            add_link(acc_ent, upi_ent, "shared_upi_handle", 0.95, ev_ids)

        _link_cooccurring_pairs(accounts, upis, _link_acc_upi)

    # Look for IP /24 subnet correlation among all IP entities in the case.
    # Bucketed by subnet prefix instead of a full O(n^2) scan over every IP pair --
    # bounded by the number of distinct /24s, not the total number of IPs squared.
    ip_entities = [
        e for e in entities
        if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "ip_address"
    ]
    subnet_buckets: Dict[str, List[Entity]] = defaultdict(list)
    for ent in ip_entities:
        parts = ent.value.strip().split(".")
        if len(parts) == 4 and all(p.isdigit() for p in parts):
            subnet_buckets[".".join(parts[:3])].append(ent)
        # malformed IP values are skipped, same as before (is_same_subnet_24 would
        # have caught the ValueError and returned False for every pair anyway)

    for subnet_key, bucket in subnet_buckets.items():
        for i in range(len(bucket)):
            for j in range(i + 1, len(bucket)):
                if bucket[i].value != bucket[j].value:
                    ev_ids = list(set((bucket[i].source_evidence_ids or []) + (bucket[j].source_evidence_ids or [])))
                    add_link(bucket[i], bucket[j], "shared_ip_subnet", 0.4, ev_ids)

    # 3. Cross-case correlation:
    # Only fetch other-case entities whose *value* actually appears somewhere in
    # this case, instead of loading every entity from every other case in the
    # database. Type + exact matching is still done in Python below, so results
    # are identical -- this just avoids shipping the whole table over the wire.
    all_case_values: Set[str] = {val for (_, val) in by_type_and_val.keys()}
    other_entities: List[Entity] = []
    if all_case_values:
        other_entities = (
            db.query(Entity)
            .filter(Entity.case_id != case_id)
            .filter(Entity.value.in_(list(all_case_values)))
            .all()
        )

    if other_entities:
        # Cache only matched other cases for quick lookup
        matched_case_ids = {oe.case_id for oe in other_entities}
        other_cases: Dict[int, Case] = {
            c.id: c
            for c in db.query(Case).filter(Case.id.in_(list(matched_case_ids))).all()
        }

        # Index other entities by (entity_type, value)
        other_by_type_val: Dict[Tuple[str, str], List[Entity]] = defaultdict(list)
        for oe in other_entities:
            oe_type = oe.entity_type.value if hasattr(oe.entity_type, "value") else str(oe.entity_type)
            other_by_type_val[(oe_type, oe.value)].append(oe)

        for ent in entities:
            ent_type = ent.entity_type.value if hasattr(ent.entity_type, "value") else str(ent.entity_type)
            matches = other_by_type_val.get((ent_type, ent.value), [])
            for match in matches:
                other_case = other_cases.get(match.case_id)
                other_case_num = other_case.case_number if other_case else f"#{match.case_id}"
                conf, basis = get_confidence_and_basis(ent_type, is_multi_source=True)
                ev_ids = list(set((ent.source_evidence_ids or []) + (match.source_evidence_ids or [])))
                extra_payload = {
                    "cross_case": True,
                    "matched_case_id": match.case_id,
                    "matched_case_number": other_case_num,
                }
                add_link(ent, match, basis, conf, ev_ids, extra=extra_payload)

    if new_links:
        db.add_all(new_links)
        db.commit()

    # Automatically score the case and update risk metrics & why_flagged
    from app.services.risk.scoring import score_case
    score_case(case_id, db)

    # Invalidate stale cached graph for this case
    from app.services.correlation.graph_builder import invalidate_graph_cache
    invalidate_graph_cache(case_id)

    all_case_links = db.query(EntityLink).filter(EntityLink.case_id == case_id).all()
    return all_case_links