from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.utils.hashing import compute_sha256


def test_encrypted_pdf_reports():
    with TestClient(app) as client:
        # 1. Login
        res = client.post("/api/auth/login", json={"badge_id": "MP-IO-4471", "password": "demo1234"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Rejection with incorrect password
        wrong_res = client.post(
            "/api/cases/1/reports/investigative-brief",
            headers=headers,
            json={"password": "wrongpassword999"},
        )
        assert wrong_res.status_code == 401
        assert "Invalid officer credentials" in wrong_res.json()["detail"]

        # 3. Successful download with officer password -> PDF has /Encrypt dictionary
        ok_res = client.post(
            "/api/cases/1/reports/investigative-brief",
            headers=headers,
            json={"password": "demo1234"},
        )
        assert ok_res.status_code == 200
        assert ok_res.headers["content-type"] == "application/pdf"
        assert b"/Encrypt" in ok_res.content

        # 4. Takedown report encryption
        td_ok = client.post(
            "/api/cases/1/reports/takedown-request",
            headers=headers,
            json={"password": "demo1234"},
        )
        assert td_ok.status_code == 200
        assert td_ok.headers["content-type"] == "application/pdf"
        assert b"/Encrypt" in td_ok.content


def test_ai_chat_endpoint():
    with TestClient(app) as client:
        # 1. Login
        res = client.post("/api/auth/login", json={"badge_id": "MP-IO-4471", "password": "demo1234"})
        assert res.status_code == 200
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Cross-case query
        cross_res = client.post(
            "/api/chat",
            headers=headers,
            json={"message": "how many high risk cases are open?"},
        )
        assert cross_res.status_code == 200
        data = cross_res.json()
        assert "High-Risk Priority Cases" in data["response"] or "Total Active Investigations" in data["response"]

        # 3. Case-scoped query
        case_res = client.post(
            "/api/chat",
            headers=headers,
            json={"message": "what are the high risk entities?", "case_id": 1},
        )
        assert case_res.status_code == 200
        case_data = case_res.json()
        assert case_data["case_id"] == 1
        assert "High-Risk Indicators" in case_data["response"]
