"""Data-fetching and context-building for the TraceX chat assistant.

Everything the assistant says is derived from the database through this module,
so answers stay grounded in real case data (no invented defaults).
"""
import re
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Case, CaseSummary, Entity, EntityLink, RiskLevel

_RISK_ORDER = {"high": 0, "medium": 1, "low": 2}
MAX_CASE_MENTIONS = 4


# --------------------------------------------------------------------------- #
# Small formatting helpers
# --------------------------------------------------------------------------- #
def enum_val(x: Any) -> str:
    if x is None:
        return ""
    return x.value if hasattr(x, "value") else str(x)


_ACRONYMS = {"Ip": "IP", "Upi": "UPI", "Imei": "IMEI", "Imsi": "IMSI", "Url": "URL", "Apk": "APK"}


def pretty(x: Any) -> str:
    words = enum_val(x).replace("_", " ").title().split()
    return " ".join(_ACRONYMS.get(w, w) for w in words)


def clean(text: Any, limit: int = 120) -> str:
    """Single-line, length-capped text. Evidence-derived strings are untrusted."""
    s = re.sub(r"\s+", " ", str(text or "")).strip()
    return s[: limit - 1] + "…" if len(s) > limit else s


def risk_text(case: Case, dash: bool = False) -> str:
    """Human readable risk, never inventing a score for unscored cases.

    "80/100 (HIGH)" by default, "80/100 — HIGH" with dash=True (for use inside parentheses).
    """
    level = enum_val(case.risk_level).upper()
    if case.risk_score is None and not level:
        return "Not yet scored"
    score = f"{case.risk_score:g}/100" if case.risk_score is not None else "score n/a"
    if not level:
        return score
    return f"{score} — {level}" if dash else f"{score} ({level})"


def entity_sort_key(e: Entity) -> Tuple[int, int]:
    # highest risk first; ties keep ingestion order so the "primary" indicator matches the narrative
    return (_RISK_ORDER.get(enum_val(e.risk_level), 3), e.id or 0)


# --------------------------------------------------------------------------- #
# Loaded case data
# --------------------------------------------------------------------------- #
@dataclass
class CaseData:
    case: Case
    entities: List[Entity]
    links: List[EntityLink]
    summary: Optional[CaseSummary]
    # Indicators of this case that also appear in other cases (direction-independent)
    cross: List[Dict[str, Any]] = field(default_factory=list)
    by_type: Dict[str, List[Entity]] = field(default_factory=dict)
    # every entity referenced by this case's links, including ones owned by other cases
    ent_index: Dict[int, Entity] = field(default_factory=dict)

    @property
    def high_risk(self) -> List[Entity]:
        return [e for e in self.entities if enum_val(e.risk_level) == "high"]

    @property
    def cross_case_numbers(self) -> List[str]:
        seen: List[str] = []
        for c in self.cross:
            for o in c["other_cases"]:
                if o["case_number"] not in seen:
                    seen.append(o["case_number"])
        return seen


def _cross_for_case(db: Session, case: Case, entities: List[Entity]) -> List[Dict[str, Any]]:
    """Find this case's indicators that also exist in *other* cases.

    The correlation engine only stores cross-case EntityLink rows on the case that
    was correlated *later*, so the older case would otherwise report "no overlaps".
    Matching on (type, value) is symmetric and does not depend on link direction.
    """
    if not entities:
        return []
    wanted = {(enum_val(e.entity_type), e.value): e for e in entities}
    values = list({v for _, v in wanted})
    others: List[Entity] = []
    for i in range(0, len(values), 400):  # stay under SQLite's bound-variable limit
        chunk = values[i : i + 400]
        others += (
            db.query(Entity).filter(Entity.case_id != case.id, Entity.value.in_(chunk)).all()
        )
    if not others:
        return []
    case_map = {
        c.id: c
        for c in db.query(Case).filter(Case.id.in_({o.case_id for o in others})).all()
    }
    grouped: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for o in others:
        key = (enum_val(o.entity_type), o.value)
        oc = case_map.get(o.case_id)
        if key in wanted and oc and all(x["case_id"] != oc.id for x in grouped[key]):
            grouped[key].append(
                {
                    "case_id": oc.id,
                    "case_number": oc.case_number,
                    "risk_level": enum_val(oc.risk_level) or "unscored",
                }
            )
    out = []
    for key, other_cases in grouped.items():
        e = wanted[key]
        out.append(
            {
                "entity_type": key[0],
                "value": key[1],
                "risk_level": enum_val(e.risk_level),
                "other_cases": other_cases,
            }
        )
    out.sort(key=lambda c: (_RISK_ORDER.get(c["risk_level"], 3), c["value"]))
    return out


def load_case_data(db: Session, case: Case) -> CaseData:
    entities = sorted(
        db.query(Entity).filter(Entity.case_id == case.id).all(), key=entity_sort_key
    )
    links = db.query(EntityLink).filter(EntityLink.case_id == case.id).all()
    summary = (
        db.query(CaseSummary)
        .filter(CaseSummary.case_id == case.id)
        .order_by(CaseSummary.generated_at.desc())
        .first()
    )
    by_type: Dict[str, List[Entity]] = defaultdict(list)
    for e in entities:
        by_type[enum_val(e.entity_type)].append(e)
    ent_index = {e.id: e for e in entities}
    missing = {i for l in links for i in (l.entity_a_id, l.entity_b_id)} - set(ent_index)
    if missing:
        ent_index.update({e.id: e for e in db.query(Entity).filter(Entity.id.in_(missing)).all()})
    return CaseData(
        case=case,
        entities=entities,
        links=links,
        summary=summary,
        cross=_cross_for_case(db, case, entities),
        by_type=dict(by_type),
        ent_index=ent_index,
    )


# --------------------------------------------------------------------------- #
# Which case(s) is the officer talking about?
# --------------------------------------------------------------------------- #
_TRX_RE = re.compile(r"\bTRX-\d{4}-\d{3}\b", re.IGNORECASE)
_HASH_RE = re.compile(r"#\s?(\d+)")
_CASE_WORD_RE = re.compile(r"\bcase\s*(?:no\.?|number|id)?\s*#?\s*(\d+)\b", re.IGNORECASE)
_BARE_RE = re.compile(r"(?<![\w.#@+-])(\d{3,6})(?![\w@-])")


def _lookup_number(db: Session, n: str) -> Optional[Case]:
    """`#4471` is a case *number*; small numbers like `case 2` fall back to the row id."""
    case = db.query(Case).filter(Case.case_number == f"#{n}").first()
    if case:
        return case
    return db.query(Case).filter(Case.id == int(n)).first()


def find_mentioned_cases(db: Session, message: str) -> List[Case]:
    """Cases explicitly named in the message (by case number, `case N`, or TRX-style id)."""
    found: List[Case] = []

    def add(c: Optional[Case]):
        if c and all(c.id != f.id for f in found) and len(found) < MAX_CASE_MENTIONS:
            found.append(c)

    for m in _TRX_RE.finditer(message):
        add(db.query(Case).filter(func.lower(Case.case_number) == m.group(0).lower()).first())
    for m in _HASH_RE.finditer(message):
        add(_lookup_number(db, m.group(1)))
    for m in _CASE_WORD_RE.finditer(message):
        add(_lookup_number(db, m.group(1)))
    # bare "4471" only counts when it is exactly an existing case number
    # (so phone/account numbers are never mistaken for cases)
    for m in _BARE_RE.finditer(message):
        add(db.query(Case).filter(Case.case_number == f"#{m.group(1)}").first())
    return found


def find_unresolved_case_refs(db: Session, message: str) -> List[str]:
    """Explicit case references (`#9999`, `case 12`) that match no case, so the officer is told."""
    refs = []
    for rx in (_HASH_RE, _CASE_WORD_RE):
        for m in rx.finditer(message):
            n = m.group(1)
            if len(n) <= 9 and _lookup_number(db, n) is None and n not in refs:
                refs.append(n)
    return refs


# --------------------------------------------------------------------------- #
# Entity lookup ("where does 9876543210 appear?")
# --------------------------------------------------------------------------- #
def _candidate_tokens(message: str) -> List[str]:
    toks = set()
    for raw in re.split(r"\s+", message):
        t = raw.strip(" \t\r\n?,;:!()[]{}<>\"'`").rstrip(".")
        if len(t) >= 5:
            toks.add(t.lower())
    for m in re.finditer(r"\+?\d[\d \-]{8,}\d", message):  # phone-like, spaces allowed
        digits = re.sub(r"\D", "", m.group(0))
        toks.add(digits)
        if len(digits) > 10:
            toks.add(digits[-10:])
    return list(toks)


def find_entity_matches(db: Session, message: str) -> List[Entity]:
    toks = _candidate_tokens(message)
    if not toks:
        return []
    return (
        db.query(Entity).filter(func.lower(Entity.value).in_(toks)).order_by(Entity.case_id).all()
    )


def entity_neighbours(
    db: Session, entity_ids: List[int], limit: int = 6, exclude_value: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Entities directly connected to the given entity ids, strongest link first."""
    if not entity_ids:
        return []
    links = (
        db.query(EntityLink)
        .filter(
            (EntityLink.entity_a_id.in_(entity_ids)) | (EntityLink.entity_b_id.in_(entity_ids))
        )
        .order_by(EntityLink.confidence.desc())
        .all()
    )
    ids = set(entity_ids)
    other_ids = {l.entity_b_id if l.entity_a_id in ids else l.entity_a_id for l in links}
    ents = {e.id: e for e in db.query(Entity).filter(Entity.id.in_(other_ids)).all()} if other_ids else {}
    out, seen = [], set()
    for l in links:
        oid = l.entity_b_id if l.entity_a_id in ids else l.entity_a_id
        e = ents.get(oid)
        if not e or oid in seen or (exclude_value and e.value == exclude_value):
            continue
        seen.add(oid)
        out.append(
            {
                "type": enum_val(e.entity_type),
                "value": e.value,
                "basis": l.basis,
                "confidence": l.confidence,
            }
        )
        if len(out) >= limit:
            break
    return out


# --------------------------------------------------------------------------- #
# Portfolio-level (all cases) data
# --------------------------------------------------------------------------- #
def all_cases_ranked(db: Session) -> List[Case]:
    """Highest score first; unscored cases last."""
    return (
        db.query(Case)
        .order_by(Case.risk_score.desc().nullslast(), Case.registered_at.desc())
        .all()
    )


def shared_entities(db: Session, case_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """Indicators that appear in more than one case, with the cases they appear in."""
    dup_q = db.query(Entity.entity_type, Entity.value).group_by(Entity.entity_type, Entity.value)
    dup_q = dup_q.having(func.count(func.distinct(Entity.case_id)) > 1)
    dupes = {(enum_val(t), v) for t, v in dup_q.all()}
    if not dupes:
        return []
    rows = db.query(Entity).filter(Entity.value.in_({v for _, v in dupes})).all()
    case_map = {c.id: c for c in db.query(Case).all()}
    grouped: Dict[Tuple[str, str], Dict[int, Case]] = defaultdict(dict)
    risk: Dict[Tuple[str, str], str] = {}
    for e in rows:
        key = (enum_val(e.entity_type), e.value)
        if key not in dupes or e.case_id not in case_map:
            continue
        grouped[key][e.case_id] = case_map[e.case_id]
        r = enum_val(e.risk_level)
        if _RISK_ORDER.get(r, 3) < _RISK_ORDER.get(risk.get(key, ""), 3):
            risk[key] = r
    out = []
    for key, cases in grouped.items():
        if case_ids is not None and len({c for c in cases if c in case_ids}) < 2:
            continue
        if len(cases) < 2:
            continue
        out.append(
            {
                "entity_type": key[0],
                "value": key[1],
                "risk_level": risk.get(key, "low"),
                "cases": [c.case_number for c in sorted(cases.values(), key=lambda c: c.id)],
                "case_ids": sorted(cases.keys()),
            }
        )
    out.sort(key=lambda s: (_RISK_ORDER.get(s["risk_level"], 3), -len(s["cases"]), s["value"]))
    return out


def portfolio_counts(db: Session) -> Dict[str, Any]:
    cases = db.query(Case).all()
    by_level = {"high": 0, "medium": 0, "low": 0, "unscored": 0}
    by_type: Dict[str, int] = defaultdict(int)
    by_district: Dict[str, int] = defaultdict(int)
    by_status: Dict[str, int] = defaultdict(int)
    for c in cases:
        by_level[enum_val(c.risk_level) or "unscored"] += 1
        by_type[enum_val(c.scam_type)] += 1
        by_district[c.district or "Unresolved"] += 1
        by_status[enum_val(c.status)] += 1
    return {
        "total": len(cases),
        "by_level": by_level,
        "by_type": dict(by_type),
        "by_district": dict(by_district),
        "by_status": dict(by_status),
        "entities": db.query(func.count(Entity.id)).scalar() or 0,
        "links": db.query(func.count(EntityLink.id)).scalar() or 0,
    }


# --------------------------------------------------------------------------- #
# Text context handed to the LLM (bounded size; all values sanitised)
# --------------------------------------------------------------------------- #
def _case_block(cd: CaseData, max_entities: int = 30, max_links: int = 20) -> str:
    c = cd.case
    lines = [
        f"CASE {c.case_number} (internal id {c.id})",
        f"- Victim: {clean(c.victim_name)} | District: {clean(c.district) or 'unresolved'}",
        f"- Scam type: {pretty(c.scam_type)} | Status: {pretty(c.status)}",
        f"- Risk: {risk_text(c)}",
        f"- Why flagged: {clean(c.why_flagged, 200) or 'n/a'}",
        f"- Entities: {len(cd.entities)} total, {len(cd.high_risk)} high-risk | Links: {len(cd.links)}",
    ]
    if cd.summary and cd.summary.narrative_text:
        lines.append(f"- Narrative: {clean(cd.summary.narrative_text, 700)}")
    if cd.entities:
        lines.append("Entities (highest risk first):")
        for e in cd.entities[:max_entities]:
            reason = f" — {clean(e.anomaly_reason, 100)}" if e.anomaly_reason else ""
            lines.append(f"  * {pretty(e.entity_type)}: {clean(e.value)} [{enum_val(e.risk_level)}]{reason}")
        if len(cd.entities) > max_entities:
            lines.append(f"  * … {len(cd.entities) - max_entities} more")
    if cd.cross:
        lines.append("Indicators also present in OTHER cases:")
        for x in cd.cross[:15]:
            others = ", ".join(o["case_number"] for o in x["other_cases"])
            lines.append(f"  * {pretty(x['entity_type'])} {clean(x['value'])} → also in {others}")
    else:
        lines.append("Indicators also present in OTHER cases: none")
    if cd.links:
        lines.append("Top connections:")
        for l in sorted(cd.links, key=lambda l: -l.confidence)[:max_links]:
            a, b = cd.ent_index.get(l.entity_a_id), cd.ent_index.get(l.entity_b_id)
            if a and b:
                lines.append(
                    f"  * {clean(a.value, 60)} <-> {clean(b.value, 60)} via {clean(l.basis, 60)} ({l.confidence:.2f})"
                )
    return "\n".join(lines)


def build_llm_context(
    db: Session,
    scope_cases: List[Case],
    entity_hits: List[Entity],
    ui_case: Optional[Case],
) -> str:
    counts = portfolio_counts(db)
    lb = counts["by_level"]
    parts = [
        "PORTFOLIO OVERVIEW",
        f"- Total cases: {counts['total']} (high {lb['high']}, medium {lb['medium']}, low {lb['low']}, unscored {lb['unscored']})",
        f"- Total entities: {counts['entities']} | Total links: {counts['links']}",
        "- Scam types: " + ", ".join(f"{pretty(k)}={v}" for k, v in counts["by_type"].items()),
        "All cases (highest risk first):",
    ]
    for c in all_cases_ranked(db)[:30]:
        parts.append(
            f"  * {c.case_number} | {clean(c.victim_name, 40)} | {pretty(c.scam_type)} | "
            f"{clean(c.district, 30) or 'unresolved'} | {risk_text(c)} | {pretty(c.status)}"
        )
    shared = shared_entities(db)
    if shared:
        parts.append("Indicators shared across cases:")
        for s in shared[:15]:
            parts.append(f"  * {pretty(s['entity_type'])} {clean(s['value'])} in {', '.join(s['cases'])}")
    else:
        parts.append("Indicators shared across cases: none")

    if ui_case:
        parts.append(f"\nOFFICER CURRENTLY HAS OPEN: {ui_case.case_number}")
    for c in scope_cases[:MAX_CASE_MENTIONS]:
        parts.append("\n" + _case_block(load_case_data(db, c)))

    if entity_hits:
        case_map = {c.id: c for c in db.query(Case).filter(Case.id.in_({e.case_id for e in entity_hits})).all()}
        parts.append("\nINDICATOR LOOKUP RESULTS (values named in the question)")
        for e in entity_hits[:12]:
            oc = case_map.get(e.case_id)
            reason = f" — {clean(e.anomaly_reason, 100)}" if e.anomaly_reason else ""
            parts.append(
                f"  * {pretty(e.entity_type)} {clean(e.value)} in case {oc.case_number if oc else e.case_id} "
                f"[{enum_val(e.risk_level)}]{reason}"
            )
    return "\n".join(parts)
