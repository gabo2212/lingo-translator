"""HTTP contract with the generator mocked. These tests do not load the model."""

from __future__ import annotations

from backend.app.errors import BusyError, GenerationFailedError
from backend.app.inference import MODEL_ID
from backend.tests.conftest import FakeService


def test_host_reports_existing_health_fields(client) -> None:
    response = client.get("/api/host")
    assert response.headers["access-control-allow-private-network"] == "true"
    assert response.json() == {"role": "translator", "model": MODEL_ID, "device": "cuda"}


def test_cors_reflects_request_origin_without_credentials(client) -> None:
    origin = "https://lingo-class.vercel.app"
    response = client.get("/api/health", headers={"Origin": origin})
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-private-network"] == "true"
    assert response.headers.get("access-control-allow-credentials") != "true"

    preflight = client.options(
        "/api/translate",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
            "Access-Control-Request-Private-Network": "true",
        },
    )
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == origin
    assert preflight.headers["access-control-allow-private-network"] == "true"
    assert preflight.headers.get("access-control-allow-credentials") != "true"


def test_health_ready(client, fake_service: FakeService) -> None:
    body = client.get("/api/health").json()
    assert body["status"] == "ready"
    assert body["model"] == MODEL_ID
    assert body["device"] == "cuda"
    assert body["dtype"] == "bfloat16"
    assert body["gpu_name"] == "NVIDIA GeForce RTX 5080"
    assert body["detail"] is None


def test_health_error_and_loading(fake_service: FakeService) -> None:
    from fastapi.testclient import TestClient

    from backend.app.main import build_app

    fake_service.status = "error"
    fake_service.detail = "CUDA is not available."
    with TestClient(build_app(fake_service)) as client:
        body = client.get("/api/health").json()
    assert body["status"] == "error"
    assert body["device"] == "unavailable"
    assert "CUDA" in body["detail"]

    fake_service.status = "loading"
    fake_service.detail = "Loading weights onto CUDA."
    with TestClient(build_app(fake_service)) as client:
        loading = client.get("/api/health").json()
        denied = client.post("/api/translate", json={"text": "I burned the rice.", "style": "hr"})
    assert loading["status"] == "loading"
    assert denied.status_code == 503
    assert fake_service.calls == []


def test_styles_endpoint(client) -> None:
    body = client.get("/api/styles").json()
    assert body["styles"][0]["id"] == "linkedin"
    assert body["styles"][1]["substyles"] is None


def test_translate_uses_the_mock(client, fake_service: FakeService) -> None:
    response = client.post(
        "/api/translate",
        json={"text": "  I burned the rice.  ", "style": "chatgpt", "seed": 4},
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["translation"] == fake_service.translation
    assert body["style"] == "chatgpt"
    assert body["linkedin_tone"] is None
    assert body["device"] == "cuda"
    assert body["elapsed_ms"] == 15
    assert fake_service.calls[0].text == "I burned the rice."
    assert fake_service.calls[0].seed == 4
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_empty_text_is_422(client, fake_service: FakeService) -> None:
    assert client.post("/api/translate", json={"text": "", "style": "hr"}).status_code == 422
    assert client.post("/api/translate", json={"text": "   ", "style": "hr"}).status_code == 422
    assert client.post("/api/translate", json={"text": "a" * 4001, "style": "hr"}).status_code == 422
    assert fake_service.calls == []


def test_unknown_style_and_tone_are_422(client, fake_service: FakeService) -> None:
    unknown = client.post("/api/translate", json={"text": "I burned the rice.", "style": "pirate"})
    bad_tone = client.post(
        "/api/translate",
        json={"text": "I burned the rice.", "style": "linkedin", "linkedin_tone": "sarcastic"},
    )
    assert unknown.status_code == 422
    assert bad_tone.status_code == 422
    assert fake_service.calls == []


def test_token_cap_temperature_and_seed(client, fake_service: FakeService) -> None:
    ok = client.post(
        "/api/translate",
        json={"text": "I burned the rice.", "style": "hr", "max_new_tokens": 900, "temperature": 0.9},
    )
    assert ok.status_code == 200
    assert fake_service.calls[-1].max_new_tokens == 250
    assert fake_service.calls[-1].temperature == 0.9
    assert client.post(
        "/api/translate",
        json={"text": "I burned the rice.", "style": "hr", "temperature": 0},
    ).status_code == 422
    assert client.post(
        "/api/translate",
        json={"text": "I burned the rice.", "style": "hr", "max_new_tokens": 0},
    ).status_code == 422
    assert client.post(
        "/api/translate",
        json={"text": "I burned the rice.", "style": "hr", "seed": -1},
    ).status_code == 422


def test_busy_not_ready_and_generation_errors(client, fake_service: FakeService) -> None:
    fake_service.error = BusyError()
    busy = client.post("/api/translate", json={"text": "I burned the rice.", "style": "hr"})
    assert busy.status_code == 429

    fake_service.error = GenerationFailedError("CUDA out of memory")
    failed = client.post("/api/translate", json={"text": "I burned the rice.", "style": "hr"})
    assert failed.status_code == 500
    assert "CUDA" in failed.json()["detail"]


def test_timeout_returns_504(fake_service: FakeService) -> None:
    from fastapi.testclient import TestClient

    from backend.app.main import build_app

    fake_service.sleep_s = 0.4
    fake_service.timeout_seconds = 0.05
    with TestClient(build_app(fake_service)) as client:
        response = client.post("/api/translate", json={"text": "I burned the rice.", "style": "hr"})
    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()
