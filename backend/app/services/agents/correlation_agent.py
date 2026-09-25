from collections import defaultdict

from app.db.models import Entity
from app.services.correlation.entity_correlation import correlate_case
from app.services.correlation.graph_builder import build_case_graph
from .base import AgentContext, AgentDefinition, BaseAgent, Recorder


class CorrelationAgent(BaseAgent):
    definition = AgentDefinition(
        id="correlation",
        name="Correlation Agent",
        role="Links entities across evidence and across cases",
        description=(
            "Runs the entity-correlation engine, rebuilds the relationship graph, and reports hub entities "
            "(possible mule accounts or shared devices) and links to other investigations."
        ),
        category="analysis",
        access="updates_case",
        outputs=["Entity links", "Hub entities", "Cross-case matches", "Relationship graph"],
    )

    def run(self, ctx: AgentContext, rec: Recorder) -> str:
        db = ctx.db
        entity_count = db.query(Entity).filter(Entity.case_id == ctx.case_id).count()
        if entity_count == 0:
            with rec.step("Load entities") as s:
                s.status = "warn"
                s.detail = "No entities extracted yet"
            rec.finding("medium", "No entities to correlate", "Evidence has not produced any entities.")
            rec.recommend("Upload and process evidence before running correlation.")
            rec.metrics.update({"entities": 0, "links": 0, "cross_case_links": 0})
            return "No entities available; correlation skipped."

        with rec.step("Run entity correlation") as s:
            links = correlate_case(ctx.case_id, db)
            s.detail = f"{len(links)} link(s) now recorded for the case"

        with rec.step("Build relationship graph") as s:
            graph = build_case_graph(ctx.case_id, db, use_cache=False)
            nodes, edges = graph["nodes"], graph["edges"]
            s.detail = f"{len(nodes)} node(s), {len(edges)} edge(s)"

        with rec.step("Identify hub entities") as s:
            degree = defaultdict(int)
            for e in edges:
                degree[e["source"]] += 1
                degree[e["target"]] += 1
            by_id = {n["id"]: n for n in nodes}
            hubs = sorted(((by_id[i], d) for i, d in degree.items() if i in by_id and d >= 3), key=lambda x: -x[1])[:5]
            for node, d in hubs:
                sev = "high" if d >= 10 else "medium"
                rec.finding(sev, f"Hub entity: {node['label']}", f"{node['entity_type']} connected to {d} other entities.")
            s.detail = f"{len(hubs)} hub entit{'y' if len(hubs) == 1 else 'ies'} with 3+ connections"
            rec.data["hubs"] = [{"label": n["label"], "entity_type": n["entity_type"], "connections": d} for n, d in hubs]
            if hubs:
                rec.recommend("Prioritise hub entities for freeze/blocking requests; they connect the most activity.")

        with rec.step("Detect cross-case links") as s:
            cross = [e for e in edges if e["extra"].get("cross_case")]
            matched = sorted({e["extra"].get("matched_case_number") for e in cross if e["extra"].get("matched_case_number")})
            if matched:
                rec.finding("high", f"Linked to {len(matched)} other case(s)", "Shared entities with: " + ", ".join(matched))
                rec.recommend("Coordinate with the officers handling " + ", ".join(matched) + "; this may be one syndicate.")
            s.detail = f"{len(cross)} cross-case link(s)" + (f" to {', '.join(matched)}" if matched else "")
            rec.data["matched_cases"] = matched

        high_risk = sum(1 for n in nodes if n["risk_level"] == "high" and not n["is_cross_case"])
        rec.metrics.update(
            {"entities": entity_count, "links": len(edges), "cross_case_links": len(cross), "high_risk_entities": high_risk}
        )
        return f"{entity_count} entities correlated into {len(edges)} link(s); {high_risk} high-risk, {len(cross)} cross-case."
