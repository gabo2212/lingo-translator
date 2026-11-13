"""LinkedIn prompt text and sampling stay pinned to the pre-upgrade snapshot."""

from __future__ import annotations

import json
from pathlib import Path

from backend.app.prompts import build_prompt, load_catalog

SNAPSHOT_PATH = Path(__file__).resolve().parent / "fixtures" / "linkedin_snapshot.json"
PROBE = "I burned the rice."


def _live_snapshot() -> dict:
    catalog = load_catalog()
    linkedin = catalog.require_style("linkedin")
    systems: dict[str, str] = {}
    for sub in linkedin.substyles:
        for variant in ("A", "B", "C", "D"):
            built = build_prompt(PROBE, "linkedin", sub.id, variant=variant)
            systems[f"{sub.id}.{variant}"] = built.system
    return {
        "model_id": catalog.model_id,
        "prompt_revision": catalog.prompt_revision,
        "production_variant": catalog.production_variant,
        "default_linkedin_tone": catalog.default_linkedin_tone,
        "sampling": {
            "temperature": catalog.sampling.temperature,
            "top_p": catalog.sampling.top_p,
            "top_k": catalog.sampling.top_k,
            "max_new_tokens": catalog.sampling.max_new_tokens,
            "max_new_tokens_cap": catalog.sampling.max_new_tokens_cap,
            "timeout_seconds": catalog.sampling.timeout_seconds,
        },
        "linkedin_label": linkedin.label,
        "linkedin_description": linkedin.description,
        "linkedin_rules": catalog.linkedin_rules,
        "closing_reminder": catalog.closing_reminder,
        "variant_a": catalog.variant_a,
        "variant_b": catalog.variant_b,
        "substyles": [
            {
                "id": sub.id,
                "label": sub.label,
                "voice": sub.voice,
                "demonstrations": [
                    {"source": demo.source, "post": demo.post} for demo in sub.demonstrations
                ],
            }
            for sub in linkedin.substyles
        ],
        "systems": systems,
    }


def test_linkedin_prompt_strings_and_sampling_match_snapshot() -> None:
    frozen = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    live = _live_snapshot()
    assert live["sampling"] == frozen["sampling"]
    assert live["linkedin_description"] == frozen["linkedin_description"]
    assert live["linkedin_rules"] == frozen["linkedin_rules"]
    assert live["closing_reminder"] == frozen["closing_reminder"]
    assert live["variant_a"] == frozen["variant_a"]
    assert live["variant_b"] == frozen["variant_b"]
    assert live["substyles"] == frozen["substyles"]
    assert live["systems"] == frozen["systems"]
    assert live["model_id"] == frozen["model_id"]
    assert live["prompt_revision"] == frozen["prompt_revision"]
    assert live["production_variant"] == frozen["production_variant"]
    assert live["default_linkedin_tone"] == frozen["default_linkedin_tone"]
    assert live["linkedin_label"] == frozen["linkedin_label"]
    motivational = live["systems"]["motivational.D"]
    assert "literally true" in motivational
    assert "#NightOperations" in motivational
