import enum
import random
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def generate_case_number() -> str:
    return f"#{random.randint(1000, 9999)}"


def utc_now() -> datetime:
    """Return naive UTC timestamp to replace deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ScamType(str, enum.Enum):
    digital_scam = "digital_scam"
    phishing_vishing = "phishing_vishing"
    malicious_apk = "malicious_apk"


class CaseStatus(str, enum.Enum):
    open = "open"
    correlating = "correlating"
    under_review = "under_review"
    closed = "closed"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class EvidenceCategory(str, enum.Enum):
    telecom = "telecom"
    bank_upi = "bank_upi"
    other = "other"


class UploadStatus(str, enum.Enum):
    queued = "queued"
    processing = "processing"
    processed = "processed"
    failed = "failed"


class EntityType(str, enum.Enum):
    phone = "phone"
    account = "account"
    upi_handle = "upi_handle"
    imei = "imei"
    imsi = "imsi"
    ip_address = "ip_address"
    email = "email"
    url = "url"


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    station_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    cases = relationship("Case", back_populates="officer")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, default=generate_case_number, nullable=False)
    victim_name = Column(String, nullable=False)
    scam_type = Column(Enum(ScamType), nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.open, nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=True)
    risk_score = Column(Float, nullable=True)
    registered_by = Column(Integer, ForeignKey("officers.id"), nullable=False)
    registered_at = Column(DateTime, default=utc_now, nullable=False)
    district = Column(String, nullable=True)
    why_flagged = Column(String, nullable=True)

    officer = relationship("Officer", back_populates="cases")
    evidence_files = relationship("EvidenceFile", back_populates="case", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    entity_links = relationship("EntityLink", back_populates="case", cascade="all, delete-orphan")
    summaries = relationship("CaseSummary", back_populates="case", cascade="all, delete-orphan")


class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    evidence_category = Column(Enum(EvidenceCategory), nullable=False)
    file_path = Column(String, nullable=False)
    sha256_hash = Column(String, nullable=False)
    row_count = Column(Integer, nullable=True)
    upload_status = Column(Enum(UploadStatus), default=UploadStatus.queued, nullable=False)
    uploaded_at = Column(DateTime, default=utc_now, nullable=False)

    case = relationship("Case", back_populates="evidence_files")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    evidence_file_id = Column(Integer, ForeignKey("evidence_files.id"), nullable=True)
    entity_type = Column(Enum(EntityType), nullable=False)
    value = Column(String, nullable=False, index=True)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.low, nullable=False)
    anomaly_reason = Column(String, nullable=True)
    source_evidence_ids = Column(JSON, default=list, nullable=True)
    extra = Column(JSON, default=dict, nullable=True)

    case = relationship("Case", back_populates="entities")
    evidence_file = relationship("EvidenceFile")


class EntityLink(Base):
    __tablename__ = "entity_links"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    entity_a_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    entity_b_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    basis = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    source_evidence_ids = Column(JSON, default=list, nullable=True)
    extra = Column(JSON, default=dict, nullable=True)

    case = relationship("Case", back_populates="entity_links")
    entity_a = relationship("Entity", foreign_keys=[entity_a_id])
    entity_b = relationship("Entity", foreign_keys=[entity_b_id])


class CaseSummary(Base):
    __tablename__ = "case_summaries"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    narrative_text = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=utc_now, nullable=False)

    case = relationship("Case", back_populates="summaries")


class AgentRun(Base):
    """Audit record of one AI-agent execution against a case (chain-of-custody trail)."""

    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    agent_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="running")  # running | completed | attention | failed | halted
    summary = Column(Text, nullable=True)
    result = Column(JSON, default=dict, nullable=True)  # steps, findings, recommendations, metrics, data
    duration_ms = Column(Integer, nullable=True)
    triggered_by = Column(Integer, ForeignKey("officers.id"), nullable=True)
    parent_run_id = Column(Integer, ForeignKey("agent_runs.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    case = relationship("Case")
