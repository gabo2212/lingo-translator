"""Pytest setup. Unit tests must not load CUDA weights."""

from __future__ import annotations

import os

os.environ["LINGO_TESTING"] = "1"

import time

import pytest
from fastapi.testclient import TestClient

from backend.app.errors import BusyError, GenerationFailedError, ModelNotReadyError
from backend.app.inference import MODEL_ID
from backend.app.main import build_app
from backend.app.schemas import TranslateJob


class FakeService:
    """Stand-in generator. It records the job and never touches a GPU."""

    autoload = False

    def __init__(self) -> None:
        self.status = "ready"
        self.detail: str | None = None
        self.timeout_seconds = 120.0
        self.calls: list[TranslateJob] = []
        self.translation = "Mocked rewrite of the same event."
        self.error: Exception | None = None
        self.sleep_s = 0.0

    def health(self) -> dict[str, object]:
        return {
            "status": self.status,
            "model": MODEL_ID,
            "device": "cuda" if self.status != "error" else "unavailable",
            "gpu_name": "NVIDIA GeForce RTX 5080" if self.status == "ready" else None,
            "dtype": "bfloat16",
            "detail": self.detail,
        }

    def translate(self, job: TranslateJob) -> dict[str, object]:
        if self.sleep_s:
            time.sleep(self.sleep_s)
        self.calls.append(job)
        if self.error is not None:
            raise self.error
        return {
            "translation": self.translation,
            "style": job.style,
            "linkedin_tone": job.linkedin_tone,
            "model": MODEL_ID,
            "device": "cuda",
            "elapsed_ms": 15,
            "prompt_id": "mock",
        }


@pytest.fixture
def fake_service() -> FakeService:
    return FakeService()


@pytest.fixture
def client(fake_service: FakeService):
    app = build_app(fake_service)
    with TestClient(app) as test_client:
        yield test_client


__all__ = [
    "BusyError",
    "FakeService",
    "GenerationFailedError",
    "ModelNotReadyError",
    "client",
    "fake_service",
]
