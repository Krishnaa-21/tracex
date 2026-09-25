from collections import Counter

from app.db.models import Case, Entity, EvidenceFile, RiskLevel
from app.services.reports.pdf_generator import load_known_apk_hashes, load_known_bad_urls
from app.services.risk.scoring import score_case
from .base import AgentContext, AgentDefinition, BaseAgent, Recorder


def _etype(e: Entity) -> str:
    return e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)


class ThreatAnalysisAgent(BaseAgent):
    definition = AgentDefinition(
        id="threat_analysis",
        name="Threat Analysis Agent",
        role="Scores risk and matches indicators against threat intelligence",
        description=(
            "Re-scores the case with the scam-type risk profile, profiles high-risk entities, and matches URLs and "
            "APK hashes against the bundled threat-intelligence feeds to recommend freeze and takedown actions."
        ),
        category="analysis",
        access="updates_case",
        outputs=["Risk score and level", "High-risk entities", "Threat-intel matches", "Action recommendations"],
    )

    def run(self, ctx: AgentContext, rec: Recorder) -> str:
        db = ctx.db
        case = db.query(Case).filter(Case.id == ctx.case_id).first()

        with rec.step("Re-score case") as s:
            score, level, why = score_case(ctx.case_id, db)
            level_s = level.value if hasattr(level, "value") else str(level)
            s.detail = f"Risk score {score:.0f}/100 ({level_s})" + (f" — {why}" if why else "")
        rec.metrics.update({"risk_score": score, "risk_level": level_s})
        if level == RiskLevel.high:
            rec.finding("high", f"Case rated HIGH risk ({score:.0f}/100)", why or "Multiple strong risk signals present.")
        elif level == RiskLevel.medium:
            rec.finding("medium", f"Case rated MEDIUM risk ({score:.0f}/100)", why or "")

        entities = db.query(Entity).filter(Entity.case_id == ctx.case_id).all()
        with rec.step("Profile high-risk entities") as s:
            high = [e for e in entities if e.risk_level == RiskLevel.high]
            by_type = Counter(_etype(e) for e in high)
            s.detail = f"{len(high)} high-risk of {len(entities)} entities" + (
                " (" + ", ".join(f"{n} {t}" for t, n in by_type.most_common(4)) + ")" if by_type else ""
            )
            for e in [x for x in high if x.anomaly_reason][:5]:
                rec.finding("medium", f"Anomaly on {_etype(e)} {e.value}", e.anomaly_reason)
            rec.data["high_risk_by_type"] = dict(by_type)
            freeze = [e for e in high if _etype(e) in ("upi_handle", "account")]
            if freeze:
                rec.recommend(f"Issue Section 91 CrPC debit-freeze requests for {len(freeze)} high-risk account/UPI handle(s).")
        rec.metrics["high_risk_entities"] = len(high)

        with rec.step("Match threat-intelligence feeds") as s:
            bad_urls = [b["url"].strip().lower() for b in load_known_bad_urls()]
            bad_hashes = {b["sha256"]: b.get("malware_family", "") for b in load_known_apk_hashes()}
            url_hits, hash_hits = [], []
            for e in entities:
                if _etype(e) == "url":
                    v = e.value.strip().lower()
                    if any(v == b or v in b or b in v for b in bad_urls):
                        url_hits.append(e.value)
            for f in db.query(EvidenceFile).filter(EvidenceFile.case_id == ctx.case_id).all():
                h = (f.sha256_hash or "").lower()
                if h in bad_hashes:
                    hash_hits.append((f.original_filename, bad_hashes[h]))
            for u in url_hits:
                rec.finding("high", "Known malicious URL", f"{u} matches the bundled threat-intelligence feed.")
            for name, fam in hash_hits:
                rec.finding("high", "Known malware sample", f"{name} matches a known APK hash" + (f" ({fam})" if fam else "") + ".")
            s.detail = f"{len(url_hits)} URL match(es), {len(hash_hits)} APK hash match(es)"
            if url_hits or hash_hits:
                s.status = "warn"
                rec.recommend("Serve a Section 69A IT Act takedown notice for the matched infrastructure.")
        rec.metrics.update({"url_matches": len(url_hits), "apk_matches": len(hash_hits)})

        if not entities:
            rec.recommend("Upload and process evidence so the case can be scored on real signals.")
            return "No entities yet; risk scored from an empty case."
        return f"Risk {score:.0f}/100 ({level_s}); {len(high)} high-risk entities; {len(url_hits) + len(hash_hits)} threat-intel match(es)."
