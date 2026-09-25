"""Shared building blocks for TraceX investigation agents.

An *agent* is a focused, auditable worker that inspects (and in some cases
advances) one case using the platform's existing services. Agents are
deterministic and work fully offline; they never send data to third parties.
Every run is recorded as a list of steps, findings and recommendations so an
officer can see exactly what the agent did and why.
"""
from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "info": 3}
ATTENTION_SEVERITIES = {"critical", "high", "medium"}


@dataclass
class AgentDefinition:
    id: str
    name: str
    role: str
    description: str
    category: str  # orchestration | evidence | analysis | reporting
    access: str  # "read_only" | "updates_case"
    outputs: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "description": self.description,
            "category": self.category,
            "access": self.access,
            "outputs": list(self.outputs),
        }


@dataclass
class AgentContext:
    case_id: int
    db: Session
    officer_id: Optional[int] = None
    run_id: Optional[int] = None
    options: Dict[str, Any] = field(default_factory=dict)
    # Provided by the registry so the orchestrator can run (and audit) child agents.
    run_child: Optional[Callable[..., Any]] = None


class Recorder:
    """Collects the audit trail of a single agent run."""

    def __init__(self) -> None:
        self.steps: List[Dict[str, Any]] = []
        self.findings: List[Dict[str, str]] = []
        self.recommendations: List[str] = []
        self.metrics: Dict[str, Any] = {}
        self.data: Dict[str, Any] = {}

    @contextmanager
    def step(self, name: str):
        """Time a named step. Set `.status` (ok|warn|fail|skipped) and `.detail` inside the block."""

        class _Step:
            status = "ok"
            detail = ""

        s = _Step()
        started = time.perf_counter()
        try:
            yield s
        except Exception as exc:  # record, then let the runner mark the run as failed
            s.status = "fail"
            s.detail = f"{type(exc).__name__}: {exc}"
            raise
        finally:
            self.steps.append(
                {
                    "name": name,
                    "status": s.status,
                    "detail": s.detail,
                    "duration_ms": int((time.perf_counter() - started) * 1000),
                }
            )

    def finding(self, severity: str, title: str, detail: str = "") -> None:
        self.findings.append({"severity": severity, "title": title, "detail": detail})

    def recommend(self, text: str) -> None:
        if text not in self.recommendations:
            self.recommendations.append(text)

    def sorted_findings(self) -> List[Dict[str, str]]:
        return sorted(self.findings, key=lambda f: SEVERITY_ORDER.get(f["severity"], 9))


class BaseAgent:
    definition: AgentDefinition

    def run(self, ctx: AgentContext, rec: Recorder) -> str:
        """Do the work, populate `rec`, and return a one-line summary."""
        raise NotImplementedError

    def execute(self, ctx: AgentContext) -> Dict[str, Any]:
        """Run the agent and return a JSON-serialisable result. Never raises."""
        rec = Recorder()
        started = time.perf_counter()
        status = "completed"
        try:
            summary = self.run(ctx, rec)
            if any(f["severity"] in ATTENTION_SEVERITIES for f in rec.findings):
                status = "attention"
            if rec.data.get("halted"):
                status = "halted"
        except Exception as exc:  # pragma: no cover - defensive
            ctx.db.rollback()
            status = "failed"
            summary = f"{self.definition.name} could not complete: {type(exc).__name__}: {exc}"
            rec.finding("high", "Agent run failed", str(exc))
        return {
            "status": status,
            "summary": summary,
            "steps": rec.steps,
            "findings": rec.sorted_findings(),
            "recommendations": rec.recommendations,
            "metrics": rec.metrics,
            "data": rec.data,
            "duration_ms": int((time.perf_counter() - started) * 1000),
        }
