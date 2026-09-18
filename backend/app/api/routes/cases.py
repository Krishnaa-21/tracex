from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.database import get_db
from app.db.models import Case, Officer, EntityLink, EvidenceFile, Entity, CaseStatus, RiskLevel
from app.schemas.case import CaseCreate, CaseRead, CaseListItem, CaseDetail, CaseSummaryStats
from app.api.routes.auth import get_current_officer

router = APIRouter(prefix="/cases", tags=["cases"])


def get_next_case_number(db: Session) -> str:
    """Generate sequential case number starting at #4471."""
    case_numbers = db.query(Case.case_number).all()
    nums = []
    for (num_str,) in case_numbers:
        if num_str and num_str.startswith("#"):
            try:
                nums.append(int(num_str[1:]))
            except ValueError:
                pass
    if not nums:
        return "#4471"
    next_num = max(max(nums) + 1, 4471)
    return f"#{next_num:04d}"


def get_why_flagged(db: Session, case_id: int) -> Optional[str]:
    """Retrieve why_flagged rationale for a case, prioritizing risk scoring output."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if case and case.why_flagged:
        return case.why_flagged

    top_link = (
        db.query(EntityLink)
        .filter(EntityLink.case_id == case_id)
        .order_by(desc(EntityLink.confidence))
        .first()
    )
    if top_link:
        return f"{top_link.basis} (confidence: {top_link.confidence:.2f})"
    return None


@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    case_num = get_next_case_number(db)
    new_case = Case(
        case_number=case_num,
        victim_name=case_in.victim_name,
        scam_type=case_in.scam_type,
        district=case_in.district,
        registered_by=current_officer.id,
        status=CaseStatus.open,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case


@router.get("/summary-stats", response_model=CaseSummaryStats)
def get_summary_stats(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1)

    # High-risk cases: risk_level == "high" (the model has no separate "critical" tier)
    high_risk_count = (
        db.query(func.count(Case.id))
        .filter(Case.risk_level == RiskLevel.high)
        .scalar()
        or 0
    )

    # Active cases: status != "closed"
    active_count = (
        db.query(func.count(Case.id))
        .filter(Case.status != CaseStatus.closed)
        .scalar()
        or 0
    )

    # Closed this month: status == "closed" and registered_at >= start_of_month
    closed_month_count = (
        db.query(func.count(Case.id))
        .filter(Case.status == CaseStatus.closed, Case.registered_at >= start_of_month)
        .scalar()
        or 0
    )

    # Awaiting correlation: cases with at least 1 evidence file but 0 entity links
    cases_with_evidence = (
        db.query(EvidenceFile.case_id)
        .distinct()
    )
    cases_with_links = (
        db.query(EntityLink.case_id)
        .distinct()
    )
    awaiting_count = (
        db.query(func.count(Case.id))
        .filter(
            Case.id.in_(cases_with_evidence),
            ~Case.id.in_(cases_with_links),
        )
        .scalar()
        or 0
    )

    return CaseSummaryStats(
        high_risk_cases=high_risk_count,
        critical_cases=high_risk_count,
        active_cases=active_count,
        awaiting_correlation=awaiting_count,
        closed_this_month=closed_month_count,
    )


@router.get("", response_model=List[CaseListItem])
def list_cases(
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    # Sort by risk_score descending (nulls last)
    cases = db.query(Case).order_by(Case.risk_score.desc().nullslast(), Case.registered_at.desc()).all()
    if not cases:
        return []

    case_ids = [c.id for c in cases]

    # Batch evidence/entity counts for every case in two grouped queries instead
    # of two queries per case (this used to be an N+1 pattern that scaled linearly
    # with the number of cases).
    evidence_counts = dict(
        db.query(EvidenceFile.case_id, func.count(EvidenceFile.id))
        .filter(EvidenceFile.case_id.in_(case_ids))
        .group_by(EvidenceFile.case_id)
        .all()
    )
    entity_counts = dict(
        db.query(Entity.case_id, func.count(Entity.id))
        .filter(Entity.case_id.in_(case_ids))
        .group_by(Entity.case_id)
        .all()
    )

    # For cases without a stored why_flagged, fetch each case's single
    # highest-confidence link in one query instead of one query per case.
    needs_flag_lookup = [c.id for c in cases if not c.why_flagged]
    top_link_by_case = {}
    if needs_flag_lookup:
        links = (
            db.query(EntityLink)
            .filter(EntityLink.case_id.in_(needs_flag_lookup))
            .order_by(EntityLink.case_id, desc(EntityLink.confidence))
            .all()
        )
        for link in links:
            # Rows are ordered by confidence desc within each case_id, so the
            # first one seen per case_id is the highest-confidence link.
            if link.case_id not in top_link_by_case:
                top_link_by_case[link.case_id] = link

    result = []
    for c in cases:
        if c.why_flagged:
            flagged = c.why_flagged
        else:
            top_link = top_link_by_case.get(c.id)
            flagged = (
                f"{top_link.basis} (confidence: {top_link.confidence:.2f})"
                if top_link
                else None
            )

        item = CaseListItem(
            id=c.id,
            case_number=c.case_number,
            victim_name=c.victim_name,
            scam_type=c.scam_type,
            status=c.status,
            risk_level=c.risk_level,
            risk_score=c.risk_score,
            registered_by=c.registered_by,
            registered_at=c.registered_at,
            district=c.district,
            why_flagged=flagged,
            evidence_count=evidence_counts.get(c.id, 0),
            entity_count=entity_counts.get(c.id, 0),
        )
        result.append(item)

    return result


@router.get("/{case_id}", response_model=CaseDetail)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    c = db.query(Case).filter(Case.id == case_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    flagged = get_why_flagged(db, c.id)
    officer_name = c.officer.name if c.officer else None
    station = c.officer.station_name if c.officer else None

    return CaseDetail(
        id=c.id,
        case_number=c.case_number,
        victim_name=c.victim_name,
        scam_type=c.scam_type,
        status=c.status,
        risk_level=c.risk_level,
        risk_score=c.risk_score,
        registered_by=c.registered_by,
        registered_at=c.registered_at,
        district=c.district,
        why_flagged=flagged,
        registered_by_name=officer_name,
        station_name=station,
    )
