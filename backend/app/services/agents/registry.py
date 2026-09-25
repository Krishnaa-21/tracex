"""Agent registry and audited execution."""
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.db.models import AgentRun
from .base import AgentContext, BaseAgent
from .correlation_agent import CorrelationAgent
from .evidence_agent import DigitalEvidenceAgent
from .jurisdiction_agent import JurisdictionAgent
from .orchestrator import CaseOrchestratorAgent
from .report_agent import InvestigationReportAgent
from .threat_agent import ThreatAnalysisAgent

# Display order: orchestrator first, then the specialists in pipeline order.
_AGENTS: List[BaseAgent] = [
    CaseOrchestratorAgent(),
    DigitalEvidenceAgent(),
    CorrelationAgent(),
    ThreatAnalysisAgent(),
    JurisdictionAgent(),
    InvestigationReportAgent(),
]
REGISTRY: Dict[str, BaseAgent] = {a.definition.id: a for a in _AGENTS}


def list_definitions() -> List[Dict[str, Any]]:
    return [a.definition.to_dict() for a in _AGENTS]


def execute(
    agent_id: str,
    case_id: int,
    db: Session,
    officer_id: Optional[int] = None,
    parent_run_id: Optional[int] = None,
    options: Optional[Dict[str, Any]] = None,
) -> AgentRun:
    """Run an agent and persist an audit record. Raises KeyError for an unknown agent."""
    agent = REGISTRY[agent_id]
    run = AgentRun(case_id=case_id, agent_id=agent_id, status="running", triggered_by=officer_id, parent_run_id=parent_run_id)
    db.add(run)
    db.commit()
    db.refresh(run)

    def run_child(child_id: str, **child_options: Any) -> AgentRun:
        return execute(child_id, case_id, db, officer_id, parent_run_id=run.id, options=child_options)

    ctx = AgentContext(case_id=case_id, db=db, officer_id=officer_id, run_id=run.id, options=options or {}, run_child=run_child)
    result = agent.execute(ctx)

    run.status = result["status"]
    run.summary = result["summary"]
    run.duration_ms = result["duration_ms"]
    run.result = result
    db.commit()
    db.refresh(run)
    return run
