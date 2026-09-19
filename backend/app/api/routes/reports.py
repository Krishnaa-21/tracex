from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Case, Officer
from app.api.routes.auth import get_current_officer
from app.core.security import verify_password
from app.services.reports.pdf_generator import (
    generate_investigative_brief,
    generate_takedown_request,
    get_report_preview_data,
)

router = APIRouter(prefix="/cases", tags=["reports"])


class ReportDownloadRequest(BaseModel):
    password: Optional[str] = None


@router.post("/{case_id}/reports/investigative-brief")
def create_investigative_brief(
    case_id: int,
    payload: Optional[ReportDownloadRequest] = Body(None),
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    enc_password = None
    if payload and payload.password:
        if not verify_password(payload.password, current_officer.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid officer credentials. Please enter your valid account password to unlock report encryption.",
            )
        enc_password = payload.password
    else:
        # Default encryption: file is protected, officer enters password only once when opening the PDF
        enc_password = "demo1234"

    pdf_bytes, file_path, sha256_hash = generate_investigative_brief(
        case_id, db, password=enc_password, owner_password=current_officer.badge_id
    )
    clean_num = case.case_number.replace("#", "").strip()
    filename = f"investigative_brief_{clean_num}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Document-SHA256": sha256_hash,
            "Access-Control-Expose-Headers": "Content-Disposition, X-Document-SHA256",
        },
    )


@router.post("/{case_id}/reports/takedown-request")
def create_takedown_request(
    case_id: int,
    payload: Optional[ReportDownloadRequest] = Body(None),
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    enc_password = None
    if payload and payload.password:
        if not verify_password(payload.password, current_officer.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid officer credentials. Please enter your valid account password to unlock report encryption.",
            )
        enc_password = payload.password
    else:
        # Default encryption: file is protected, officer enters password only once when opening the PDF
        enc_password = "demo1234"

    pdf_bytes, file_path, sha256_hash, matches = generate_takedown_request(
        case_id, db, password=enc_password, owner_password=current_officer.badge_id
    )
    clean_num = case.case_number.replace("#", "").strip()
    filename = f"takedown_request_{clean_num}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Document-SHA256": sha256_hash,
            "X-Matched-Count": str(len(matches)),
            "Access-Control-Expose-Headers": "Content-Disposition, X-Document-SHA256, X-Matched-Count",
        },
    )


@router.get("/{case_id}/reports/takedown-matches")
def get_takedown_matches(
    case_id: int,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    from app.db.models import Entity, EvidenceFile
    from app.services.reports.pdf_generator import load_known_bad_urls, load_known_apk_hashes

    entities = db.query(Entity).filter(Entity.case_id == case_id).all()
    evidence_files = db.query(EvidenceFile).filter(EvidenceFile.case_id == case_id).all()

    bad_urls = load_known_bad_urls()
    bad_hashes = load_known_apk_hashes()

    url_matches = 0
    case_urls = [e.value for e in entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "url"]
    for url in case_urls:
        clean_u = url.strip().lower()
        for bu in bad_urls:
            target_u = bu["url"].strip().lower()
            if clean_u == target_u or clean_u in target_u or target_u in clean_u:
                url_matches += 1
                break

    hash_matches = 0
    case_hashes = [ef.sha256_hash.lower() for ef in evidence_files if ef.sha256_hash]
    for ch in case_hashes:
        for bh in bad_hashes:
            if ch == bh["sha256"]:
                hash_matches += 1
                break

    return {
        "url_matches": url_matches,
        "apk_matches": hash_matches,
        "total_matches": url_matches + hash_matches,
    }


@router.get("/{case_id}/reports/preview")
def get_case_reports_preview(
    case_id: int,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    preview_data = get_report_preview_data(case_id, db)
    return preview_data

