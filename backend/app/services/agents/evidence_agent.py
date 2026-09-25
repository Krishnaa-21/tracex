from collections import Counter
from pathlib import Path

from app.db.models import EvidenceFile, UploadStatus
from app.utils.hashing import compute_sha256
from .base import AgentContext, AgentDefinition, BaseAgent, Recorder


class DigitalEvidenceAgent(BaseAgent):
    definition = AgentDefinition(
        id="digital_evidence",
        name="Digital Evidence Agent",
        role="Verifies the integrity and completeness of uploaded evidence",
        description=(
            "Re-computes SHA-256 hashes against the values recorded at upload, checks processing status, "
            "category coverage and duplicate files, and flags anything that could weaken chain of custody."
        ),
        category="evidence",
        access="read_only",
        outputs=["Integrity verdict", "Processing status", "Coverage gaps", "Duplicate evidence"],
    )

    def run(self, ctx: AgentContext, rec: Recorder) -> str:
        db = ctx.db
        files = db.query(EvidenceFile).filter(EvidenceFile.case_id == ctx.case_id).order_by(EvidenceFile.id).all()

        with rec.step("Inventory evidence files") as s:
            s.detail = f"{len(files)} file(s) registered for this case"
            if not files:
                s.status = "warn"
        if not files:
            rec.finding("medium", "No evidence uploaded", "The case has no evidence files, so nothing can be verified or correlated.")
            rec.recommend("Upload telecom (CDR/IPDR) and bank/UPI evidence to begin the investigation.")
            rec.metrics.update({"files": 0, "verified": 0, "missing": 0, "mismatched": 0, "total_rows": 0})
            return "No evidence files to verify."

        verified = missing = mismatched = 0
        with rec.step("Verify SHA-256 integrity") as s:
            for f in files:
                path = Path(f.file_path)
                if not path.is_file():
                    missing += 1
                    continue
                if compute_sha256(path).lower() == (f.sha256_hash or "").lower():
                    verified += 1
                else:
                    mismatched += 1
                    rec.finding(
                        "critical",
                        f"Hash mismatch: {f.original_filename}",
                        "The stored file no longer matches the SHA-256 recorded at upload. Treat it as altered.",
                    )
            s.detail = f"{verified} verified, {mismatched} mismatched, {missing} original file(s) not on this server"
            if mismatched:
                s.status = "fail"
            elif missing:
                s.status = "warn"
        if mismatched:
            rec.recommend("Do not rely on mismatched files. Re-acquire them from the source and record the discrepancy.")
        if missing:
            rec.finding(
                "info",
                f"{missing} original file(s) not available for re-hashing",
                "The recorded SHA-256 values remain on file, but integrity could not be re-checked on this server.",
            )

        with rec.step("Check processing status") as s:
            counts = Counter((f.upload_status.value if hasattr(f.upload_status, "value") else str(f.upload_status)) for f in files)
            s.detail = ", ".join(f"{n} {k}" for k, n in sorted(counts.items()))
            failed = [f for f in files if f.upload_status == UploadStatus.failed]
            pending = [f for f in files if f.upload_status in (UploadStatus.queued, UploadStatus.processing)]
            for f in failed:
                rec.finding("high", f"Processing failed: {f.original_filename}", "The file could not be parsed into entities.")
            if pending:
                rec.finding("medium", f"{len(pending)} file(s) not yet processed", "Correlation will miss these until processing finishes.")
            if failed:
                s.status = "fail"
                rec.recommend("Re-upload failed files in a supported format (CSV, XLSX, JSON, EML).")
            elif pending:
                s.status = "warn"

        with rec.step("Check category coverage") as s:
            cats = {f.evidence_category.value if hasattr(f.evidence_category, "value") else str(f.evidence_category) for f in files}
            missing_cats = [c for c in ("telecom", "bank_upi") if c not in cats]
            s.detail = "Covered: " + (", ".join(sorted(cats)) or "none")
            if missing_cats:
                s.status = "warn"
                rec.finding("info", "Coverage gap", "No evidence in: " + ", ".join(missing_cats) + ". Cross-source links need both telecom and bank/UPI data.")
                rec.recommend("Obtain " + " and ".join(missing_cats) + " evidence to enable cross-source correlation.")

        with rec.step("Detect duplicate evidence") as s:
            by_hash = {}
            for f in files:
                by_hash.setdefault(f.sha256_hash, []).append(f)
            dups = [v for v in by_hash.values() if len(v) > 1]
            for group in dups:
                rec.finding("medium", f"Duplicate file in this case: {group[0].original_filename}", f"{len(group)} uploads share the same SHA-256.")
            other = (
                db.query(EvidenceFile)
                .filter(EvidenceFile.case_id != ctx.case_id, EvidenceFile.sha256_hash.in_(list(by_hash.keys())))
                .all()
            )
            other_cases = sorted({o.case_id for o in other})
            if other_cases:
                rec.finding("medium", "Identical evidence filed in other case(s)", "Case IDs: " + ", ".join(str(c) for c in other_cases))
                rec.recommend("Review the other case(s) sharing identical evidence; the complaints may belong to one syndicate.")
            s.detail = f"{len(dups)} duplicate group(s); {len(other_cases)} other case(s) share a file"
            if dups or other_cases:
                s.status = "warn"

        total_rows = sum(f.row_count or 0 for f in files)
        rec.metrics.update(
            {"files": len(files), "verified": verified, "missing": missing, "mismatched": mismatched, "total_rows": total_rows, "categories": sorted(cats)}
        )
        if mismatched:
            return f"Integrity problem: {mismatched} of {len(files)} file(s) no longer match their recorded hash."
        return f"{len(files)} file(s) checked ({total_rows} records); {verified} hash(es) re-verified."
