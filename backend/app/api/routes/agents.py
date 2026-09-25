from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_officer
from app.db.database import get_db
from app.db.models import AgentRun, Case, Officer
from app.schemas.agent import AgentDefinitionRead, AgentRunRead
from app.services import agents as agent_service

router = APIRouter(tags=["agents"])


def _to_read(run: AgentRun) -> AgentRunRead:
    agent = agent_service.REGISTRY.get(run.agent_id)
    return AgentRunRead(
        id=run.id,
        case_id=run.case_id,
        agent_id=run.agent_id,
        agent_name=agent.definition.name if agent else run.agent_id,
        status=run.status,
        summary=run.summary,
        duration_ms=run.duration_ms,
        created_at=run.created_at,
        parent_run_id=run.parent_run_id,
        result=run.result or {},
    )


def _require_case(case_id: int, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.get("/agents", response_model=List[AgentDefinitionRead])
def list_agents(current_officer: Officer = Depends(get_current_officer)):
    """Catalogue of available investigation agents."""
    return agent_service.list_definitions()


@router.post("/cases/{case_id}/agents/{agent_id}/run", response_model=AgentRunRead)
def run_agent(
    case_id: int,
    agent_id: str,
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    """Run one agent (or the orchestrator) against a case and return its audited result."""
    if agent_id not in agent_service.REGISTRY:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown agent")
    _require_case(case_id, db)
    run = agent_service.execute(agent_id, case_id, db, officer_id=current_officer.id)
    return _to_read(run)


@router.get("/cases/{case_id}/agents/runs", response_model=List[AgentRunRead])
def list_runs(
    case_id: int,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_officer: Officer = Depends(get_current_officer),
):
    """Recent agent runs for a case, newest first (audit trail)."""
    _require_case(case_id, db)
    runs = (
        db.query(AgentRun)
        .filter(AgentRun.case_id == case_id)
        .order_by(AgentRun.id.desc())
        .limit(limit)
        .all()
    )
    return [_to_read(r) for r in runs]
