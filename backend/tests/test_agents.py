from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.db.models import AgentRun, Case
from app.main import app

_created_case_ids = []


@pytest.fixture(autouse=True)
def cleanup_created_cases():
    """The suite shares one SQLite file; remove cases these tests create so other tests are unaffected."""
    _created_case_ids.clear()
    yield
    db = SessionLocal()
    try:
        for cid in _created_case_ids:
            db.query(AgentRun).filter(AgentRun.case_id == cid).update({"parent_run_id": None})
            db.query(AgentRun).filter(AgentRun.case_id == cid).delete()
            case = db.query(Case).filter(Case.id == cid).first()
            if case:
                db.delete(case)
        db.commit()
    finally:
        db.close()


def _login(client):
    res = client.post("/api/auth/login", json={"badge_id": "MP-IO-4471", "password": "demo1234"})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _new_case(client, headers, name="Agent Test Victim"):
    res = client.post("/api/cases", headers=headers, json={"victim_name": name, "scam_type": "digital_scam"})
    assert res.status_code == 201
    _created_case_ids.append(res.json()["id"])
    return res.json()["id"]


def test_agent_catalogue_lists_all_agents():
    with TestClient(app) as client:
        headers = _login(client)
        res = client.get("/api/agents", headers=headers)
        assert res.status_code == 200
        ids = [a["id"] for a in res.json()]
        assert ids == [
            "case_orchestrator", "digital_evidence", "correlation",
            "threat_analysis", "jurisdiction", "investigation_report",
        ]


def test_agents_require_auth_and_valid_targets():
    with TestClient(app) as client:
        assert client.get("/api/agents").status_code == 401
        headers = _login(client)
        case_id = _new_case(client, headers)
        assert client.post(f"/api/cases/{case_id}/agents/nope/run", headers=headers).status_code == 404
        assert client.post("/api/cases/999999/agents/correlation/run", headers=headers).status_code == 404
        assert client.get("/api/cases/999999/agents/runs", headers=headers).status_code == 404


def test_evidence_agent_flags_empty_case():
    with TestClient(app) as client:
        headers = _login(client)
        case_id = _new_case(client, headers)
        res = client.post(f"/api/cases/{case_id}/agents/digital_evidence/run", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "attention"
        assert any(f["title"] == "No evidence uploaded" for f in body["result"]["findings"])


def test_orchestrator_stops_without_evidence():
    with TestClient(app) as client:
        headers = _login(client)
        case_id = _new_case(client, headers)
        body = client.post(f"/api/cases/{case_id}/agents/case_orchestrator/run", headers=headers).json()
        assert "no processed evidence" in body["summary"].lower()
        children = body["result"]["data"]["children"]
        assert children[0]["agent_id"] == "digital_evidence"
        assert all(c["status"] == "skipped" for c in children[1:])


def test_orchestrator_full_pipeline_and_audit_trail():
    with TestClient(app) as client:
        headers = _login(client)
        case_id = _new_case(client, headers, "Pipeline Victim")
        for fname, cat in (("mock_bank_upi.xlsx", "bank_upi"), ("mock_cdr.csv", "telecom")):
            path = Path("data/sample") / fname
            if not path.exists():
                continue
            with open(path, "rb") as f:
                r = client.post(f"/api/cases/{case_id}/evidence", headers=headers,
                                files={"file": (fname, f)}, data={"evidence_category": cat})
            assert r.status_code in (200, 201)

        res = client.post(f"/api/cases/{case_id}/agents/case_orchestrator/run", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["status"] in ("completed", "attention")
        children = body["result"]["data"]["children"]
        assert [c["agent_id"] for c in children] == [
            "digital_evidence", "correlation", "threat_analysis", "jurisdiction", "investigation_report"
        ]
        assert all(c["status"] != "skipped" for c in children)
        assert body["result"]["metrics"]["readiness"] >= 60

        runs = client.get(f"/api/cases/{case_id}/agents/runs", headers=headers).json()
        assert len(runs) == 6  # orchestrator + 5 child runs
        assert sum(1 for r in runs if r["parent_run_id"] == body["id"]) == 5
        # every step carries name/status/duration for the audit trail
        for step in body["result"]["steps"]:
            assert {"name", "status", "detail", "duration_ms"} <= set(step)
