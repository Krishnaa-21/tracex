from app.db.models import Case
from app.services.geo.heatmap import get_district_heatmap, resolve_district
from .base import AgentContext, AgentDefinition, BaseAgent, Recorder


class JurisdictionAgent(BaseAgent):
    definition = AgentDefinition(
        id="jurisdiction",
        name="Jurisdiction Agent",
        role="Resolves the district and shows local fraud density",
        description=(
            "Resolves the case district from IFSC and PIN evidence using the bundled offline lookups, then places the "
            "case in the district-wise fraud-density picture so the right station can be looped in."
        ),
        category="analysis",
        access="updates_case",
        outputs=["Resolved district", "District density", "Coordination advice"],
    )

    def run(self, ctx: AgentContext, rec: Recorder) -> str:
        db = ctx.db
        case = db.query(Case).filter(Case.id == ctx.case_id).first()
        before = case.district

        with rec.step("Resolve district from evidence") as s:
            district = resolve_district(ctx.case_id, db)
            if district and district != before:
                s.detail = f"District resolved to {district}" + (f" (was {before})" if before else "")
            elif district:
                s.detail = f"District confirmed as {district}"
            else:
                s.status = "warn"
                s.detail = "No IFSC or PIN indicators found"
        if not district:
            rec.finding("info", "District not resolved", "No IFSC code or PIN code was found in the evidence.")
            rec.recommend("Add bank statements or documents containing IFSC/PIN details to resolve the jurisdiction.")
            rec.metrics.update({"district": None})
            return "District could not be resolved from the available evidence."

        with rec.step("Assess district fraud density") as s:
            row = next((r for r in get_district_heatmap(db) if r["district"] == district), None)
            count = row["case_count"] if row else 1
            level = row["level"] if row else "low"
            s.detail = f"{count} case(s) in {district}; density {level}"
        rec.metrics.update({"district": district, "cases_in_district": count, "density": level})
        if level == "high":
            rec.finding("medium", f"High fraud density in {district}", f"{count} cases are registered in this district.")
            rec.recommend(f"Brief the {district} cyber cell and consider a joint task force for the district cluster.")
        return f"Jurisdiction: {district} ({count} case(s), {level} density)."
