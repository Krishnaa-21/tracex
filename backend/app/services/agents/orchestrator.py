from app.db.models import Case, CaseSummary, EntityLink, EvidenceFile, UploadStatus
from .base import AgentContext, AgentDefinition, BaseAgent, Recorder

PIPELINE = [
    ("digital_evidence", "Verify evidence"),
    ("correlation", "Correlate entities"),
    ("threat_analysis", "Analyse threats"),
    ("jurisdiction", "Resolve jurisdiction"),
    ("investigation_report", "Prepare reports"),
]


class CaseOrchestratorAgent(BaseAgent):
    definition = AgentDefinition(
        id="case_orchestrator",
        name="Case Orchestrator Agent",
        role="Plans and runs the full investigation pipeline",
        description=(
            "Inspects the case, decides which specialist agents are needed, runs them in order "
            "(evidence, correlation, threat, jurisdiction, report), halts if evidence integrity is compromised, "
            "and returns one consolidated status with the next best action."
        ),
        category="orchestration",
        access="updates_case",
        outputs=["Pipeline plan", "Consolidated findings", "Case readiness", "Next best action"],
    )

    def run(self, ctx: AgentContext, rec: Recorder) -> str:
        db = ctx.db
        case = db.query(Case).filter(Case.id == ctx.case_id).first()

        with rec.step("Assess case state") as s:
            files = db.query(EvidenceFile).filter(EvidenceFile.case_id == ctx.case_id).all()
            processed = [f for f in files if f.upload_status == UploadStatus.processed]
            links = db.query(EntityLink).filter(EntityLink.case_id == ctx.case_id).count()
            has_summary = db.query(CaseSummary).filter(CaseSummary.case_id == ctx.case_id).count() > 0
            status_v = case.status.value if hasattr(case.status, "value") else str(case.status)
            s.detail = f"Status {status_v}; {len(files)} file(s), {len(processed)} processed; {links} link(s); narrative {'present' if has_summary else 'missing'}"
            rec.data["state"] = {
                "status": status_v,
                "files": len(files),
                "processed_files": len(processed),
                "links": links,
                "has_narrative": has_summary,
            }

        children, halted_reason = [], None
        for index, (agent_id, label) in enumerate(PIPELINE):
            if halted_reason:
                children.append({"agent_id": agent_id, "label": label, "status": "skipped", "summary": halted_reason})
                continue
            if agent_id != "digital_evidence" and not processed:
                halted_reason = "Skipped: no processed evidence."
                children.append({"agent_id": agent_id, "label": label, "status": "skipped", "summary": halted_reason})
                continue

            options = {"refresh_narrative": True} if agent_id == "investigation_report" else {}
            with rec.step(label) as s:
                run = ctx.run_child(agent_id, **options)
                result = run.result or {}
                s.detail = result.get("summary", "")
                s.status = {"completed": "ok", "attention": "warn", "failed": "fail"}.get(run.status, "ok")
            children.append(
                {
                    "agent_id": agent_id,
                    "label": label,
                    "status": run.status,
                    "summary": result.get("summary", ""),
                    "duration_ms": run.duration_ms,
                    "run_id": run.id,
                }
            )
            for f in result.get("findings", []):
                if f["severity"] in ("critical", "high", "medium"):
                    rec.finding(f["severity"], f["title"], f["detail"])
            for r in result.get("recommendations", []):
                rec.recommend(r)
            rec.metrics.update({f"{agent_id}.{k}": v for k, v in (result.get("metrics") or {}).items() if isinstance(v, (int, float, str, bool))})

            # Evidence integrity is non-negotiable: stop before analysing tampered material.
            if agent_id == "digital_evidence" and any(f["severity"] == "critical" for f in result.get("findings", [])):
                halted_reason = "Halted: evidence integrity problem detected."
                rec.data["halted"] = True
            if agent_id == "digital_evidence" and not processed and not halted_reason:
                pass

        if not processed and not rec.data.get("halted"):
            rec.finding("medium", "Pipeline stopped: no processed evidence", "Specialist agents were skipped.")
            rec.recommend("Upload and process evidence, then run the Case Orchestrator again.")

        rec.data["children"] = children
        ran = [c for c in children if c["status"] != "skipped"]
        readiness = rec.metrics.get("investigation_report.readiness")
        rec.metrics.update({"agents_run": len(ran), "agents_skipped": len(children) - len(ran)})
        if readiness is not None:
            rec.metrics["readiness"] = readiness

        if rec.data.get("halted"):
            return "Pipeline halted: evidence integrity problem. Downstream agents were not run."
        if not processed:
            return "Pipeline stopped: no processed evidence yet."
        attention = sum(1 for c in ran if c["status"] in ("attention", "failed"))
        return f"Ran {len(ran)} agent(s); {attention} need attention. Case readiness {readiness if readiness is not None else 'n/a'}%."
