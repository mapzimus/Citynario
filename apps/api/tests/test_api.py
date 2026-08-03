import json
from pathlib import Path

from citynario_api.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
FIXTURE = (
    Path(__file__).parents[3] / "city-packs" / "us-ma-lynn" / "fixtures" / "downtown-housing-a.json"
)


def test_liveness_and_request_id() -> None:
    response = client.get("/health/live", headers={"X-Request-ID": "test-request"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"] == "test-request"


def test_city_pack_catalog() -> None:
    response = client.get("/v1/city-packs")
    assert response.status_code == 200
    assert response.json()[0]["id"] == "us-ma-lynn"


def test_run_scenario() -> None:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))
    response = client.post("/v1/scenarios/run", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["city_pack"] == "us-ma-lynn@0.1.0"
    assert len(body["indicators"]) == 5
    assert len(body["traces"]) == 5
    assert "decision support" in body["disclaimer"]


def test_assistant_is_disabled_by_default() -> None:
    response = client.post(
        "/v1/assistant/draft",
        json={"prompt": "Add 200 apartments", "city_pack": "us-ma-lynn@0.1.0"},
    )
    assert response.status_code == 404
