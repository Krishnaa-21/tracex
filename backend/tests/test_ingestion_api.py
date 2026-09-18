import io
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app


def test_case_lifecycle_and_evidence_ingestion():
    with TestClient(app) as client:
        # Auth login
        res = client.post("/api/auth/login", json={"badge_id": "MP-IO-4471", "password": "demo1234"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a case
        case_res = client.post(
            "/api/cases",
            headers=headers,
            json={
                "victim_name": "R. K. Verma",
                "scam_type": "digital_scam",
                "district": "Bhopal North",
            },
        )
        assert case_res.status_code == 201
        case_data = case_res.json()
        assert case_data["case_number"].startswith("#")
        assert case_data["victim_name"] == "R. K. Verma"
        case_id = case_data["id"]

        # 2. Upload CDR evidence
        cdr_path = Path("data/sample/mock_cdr.csv")
        with open(cdr_path, "rb") as f:
            ev_res = client.post(
                f"/api/cases/{case_id}/evidence",
                headers=headers,
                data={"evidence_category": "telecom"},
                files={"file": ("mock_cdr.csv", f, "text/csv")},
            )
        assert ev_res.status_code == 201
        ev_data = ev_res.json()
        assert ev_data["upload_status"] == "processed"
        assert ev_data["row_count"] is not None and ev_data["row_count"] > 0
        assert ev_data["sha256_hash"] is not None

        # 3. Upload Bank evidence
        bank_path = Path("data/sample/mock_bank_upi.xlsx")
        with open(bank_path, "rb") as f:
            bank_res = client.post(
                f"/api/cases/{case_id}/evidence",
                headers=headers,
                data={"evidence_category": "bank_upi"},
                files={"file": ("mock_bank_upi.xlsx", f, "application/octet-stream")},
            )
        assert bank_res.status_code == 201
        assert bank_res.json()["upload_status"] == "processed"

        # 4. Upload EML evidence
        eml_path = Path("data/sample/mock_email.eml")
        with open(eml_path, "rb") as f:
            eml_res = client.post(
                f"/api/cases/{case_id}/evidence",
                headers=headers,
                data={"evidence_category": "other"},
                files={"file": ("mock_email.eml", f, "message/rfc822")},
            )
        assert eml_res.status_code == 201
        assert eml_res.json()["upload_status"] == "processed"

        # 5. Upload APK dump evidence
        apk_path = Path("data/sample/mock_apk_dump.json")
        with open(apk_path, "rb") as f:
            apk_res = client.post(
                f"/api/cases/{case_id}/evidence",
                headers=headers,
                data={"evidence_category": "other"},
                files={"file": ("mock_apk_dump.json", f, "application/json")},
            )
        assert apk_res.status_code == 201
        assert apk_res.json()["upload_status"] == "processed"

        # 6. List evidence for case
        list_ev = client.get(f"/api/cases/{case_id}/evidence", headers=headers)
        assert list_ev.status_code == 200
        assert len(list_ev.json()) == 4

        # 7. Get summary stats
        stats_res = client.get("/api/cases/summary-stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert "high_risk_cases" in stats
        assert "critical_cases" in stats
        assert "active_cases" in stats
        assert "awaiting_correlation" in stats
        assert "closed_this_month" in stats
        assert stats["active_cases"] >= 1

        # 8. List cases
        cases_res = client.get("/api/cases", headers=headers)
        assert cases_res.status_code == 200
        cases_list = cases_res.json()
        assert len(cases_list) >= 1
        found_case = next((c for c in cases_list if c["id"] == case_id), None)
        assert found_case is not None
        assert found_case["evidence_count"] == 4
        assert found_case["entity_count"] > 0

        # 9. Get case detail
        detail_res = client.get(f"/api/cases/{case_id}", headers=headers)
        assert detail_res.status_code == 200
        assert detail_res.json()["case_number"] == case_data["case_number"]
        assert detail_res.json()["registered_by_name"] == "A. Sharma"
