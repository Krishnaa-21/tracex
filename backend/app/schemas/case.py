from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict
from app.db.models import ScamType, CaseStatus, RiskLevel


class CaseBase(BaseModel):
    victim_name: str
    scam_type: ScamType
    district: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class CaseRead(CaseBase):
    id: int
    case_number: str
    status: CaseStatus
    risk_level: Optional[RiskLevel] = None
    risk_score: Optional[float] = None
    registered_by: int
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseListItem(CaseRead):
    why_flagged: Optional[str] = None
    evidence_count: Optional[int] = 0
    entity_count: Optional[int] = 0


class CaseDetail(CaseRead):
    why_flagged: Optional[str] = None
    registered_by_name: Optional[str] = None
    station_name: Optional[str] = None


class CaseSummaryStats(BaseModel):
    high_risk_cases: int
    active_cases: int
    awaiting_correlation: int
    closed_this_month: int
    # Alias / backward compatibility field for high_risk_cases
    critical_cases: Optional[int] = None
