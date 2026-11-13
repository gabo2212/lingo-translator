# Source hygiene. The demo calls a local model only.

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_inference_module_does_not_call_a_cloud_model() -> None:
    text = (ROOT / "backend" / "app" / "inference.py").read_text(encoding="utf-8").lower()
    for banned in ("openai", "gemini", "groq", "anthropic", "generativelanguage"):
        assert banned not in text
    assert "inference_mode" in text
    assert "apply_chat_template" in text
    assert "does not fall back to cpu" in text
