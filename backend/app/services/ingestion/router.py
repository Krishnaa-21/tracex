from pathlib import Path
from typing import List, Dict, Any, Tuple, Union
from sqlalchemy.orm import Session

from app.db.models import EvidenceFile, Entity, UploadStatus, RiskLevel
from app.services.ingestion.telecom_parser import parse_telecom
from app.services.ingestion.bank_parser import parse_bank_upi
from app.services.ingestion.email_parser import parse_email
from app.services.ingestion.apk_parser import parse_apk_dump


def normalize_file(file_path: Union[str, Path], evidence_category: str) -> Tuple[List[Dict[str, Any]], int]:
    """Pick the right parser based on file extension and evidence_category.
    Always returns a tuple of (normalized_rows, row_count).
    """
    path = Path(file_path)
    suffix = path.suffix.lower()
    cat = (evidence_category or "").strip().lower()

    if suffix == ".eml":
        return parse_email(path)
    elif suffix == ".json":
        return parse_apk_dump(path)
    elif cat == "telecom":
        return parse_telecom(path)
    elif cat == "bank_upi":
        return parse_bank_upi(path)
    elif suffix in [".csv", ".xlsx", ".xls"]:
        # Try bank parsing first if columns match, else telecom
        try:
            rows, count = parse_bank_upi(path)
            if rows:
                return rows, count
        except Exception:
            pass
        return parse_telecom(path)
    else:
        # Default fallback
        return parse_telecom(path)


def process_evidence_file(db: Session, evidence_file: EvidenceFile) -> int:
    """Normalize evidence file, persist unique Entity rows, and update EvidenceFile status."""
    try:
        evidence_file.upload_status = UploadStatus.processing
        db.commit()

        category_str = (
            evidence_file.evidence_category.value
            if hasattr(evidence_file.evidence_category, "value")
            else str(evidence_file.evidence_category)
        )
        normalized_rows, row_count = normalize_file(evidence_file.file_path, category_str)

        # Retrieve existing entities for this evidence file to deduplicate within the file.
        # Fetch full objects (not just type/value) so we can merge in newly-seen row_indices
        # for values that were already persisted by an earlier processing pass.
        existing_entities = (
            db.query(Entity)
            .filter(
                Entity.case_id == evidence_file.case_id,
                Entity.evidence_file_id == evidence_file.id,
            )
            .all()
        )
        entity_by_pair: Dict[Any, Entity] = {}
        for e in existing_entities:
            type_str = e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)
            entity_by_pair[(type_str, str(e.value).strip())] = e

        new_entities = []
        for row in normalized_rows:
            ent_type = row["entity_type"]
            val = row["value"]
            if not val:
                continue

            pair = (ent_type, val)
            row_idx = row.get("row_index")
            existing = entity_by_pair.get(pair)

            if existing is not None:
                # Same value seen again (possibly on a different record) — merge the
                # row_index so correlation knows about every record this value appeared on.
                if row_idx is not None:
                    ext = dict(existing.extra or {})
                    indices = set(ext.get("row_indices") or [])
                    indices.add(row_idx)
                    ext["row_indices"] = sorted(indices)
                    existing.extra = ext
                continue

            # Check anomaly reason or flags in extra
            anomaly_reason = None
            risk = RiskLevel.low
            extra = dict(row.get("extra") or {})
            if "high_risk_permissions" in extra and extra["high_risk_permissions"]:
                anomaly_reason = f"High-risk permissions detected: {', '.join(extra['high_risk_permissions'])}"
                risk = RiskLevel.high
            elif extra.get("role") == "c2_server":
                anomaly_reason = "Identified Command & Control (C2) endpoint"
                risk = RiskLevel.high

            if row_idx is not None:
                extra["row_indices"] = [row_idx]

            new_entity = Entity(
                case_id=evidence_file.case_id,
                evidence_file_id=evidence_file.id,
                entity_type=ent_type,
                value=val,
                risk_level=risk,
                anomaly_reason=anomaly_reason,
                source_evidence_ids=[evidence_file.id],
                extra=extra,
            )
            new_entities.append(new_entity)
            entity_by_pair[pair] = new_entity

        if new_entities:
            db.add_all(new_entities)

        evidence_file.row_count = row_count
        evidence_file.upload_status = UploadStatus.processed
        db.commit()

        # Invalidate graph cache for this case
        from app.services.correlation.graph_builder import invalidate_graph_cache
        invalidate_graph_cache(evidence_file.case_id)

        return len(new_entities)

    except Exception:
        db.rollback()
        evidence_file.upload_status = UploadStatus.failed
        db.commit()
        raise
