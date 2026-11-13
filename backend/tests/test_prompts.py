"""Prompt catalog: rules in the system turn, source text in the user turn."""

from __future__ import annotations

from pathlib import Path

import pytest

from backend.app.errors import UnknownStyleError
from backend.app.passes import run_passes, scheduled_passes
from backend.app.prompts import build_prompt, load_catalog, public_styles, second_pass_messages

ROOT = Path(__file__).resolve().parents[2]
BATHROOM = "I took a massive dump just now"
README_SAMPLE = "high-volume output optimization"
APP_DIR = ROOT / "backend" / "app"


def test_system_has_rules_and_user_turn_is_the_source() -> None:
    built = build_prompt("I burned the rice.", "linkedin", "motivational")
    assert "literally true" in built.system
    assert "personal task" in built.system
    assert built.user == "I burned the rice."
    assert built.messages[0]["role"] == "system"
    assert built.messages[1] == {"role": "user", "content": "I burned the rice."}
    assert "I burned the rice." in built.combined
    assert "literally true" in built.combined


def test_bathroom_sentence_is_not_in_the_template() -> None:
    built = build_prompt(BATHROOM, "linkedin", "motivational")
    assert BATHROOM not in built.system
    assert built.user == BATHROOM
    for path in APP_DIR.rglob("*"):
        if path.suffix not in {".py", ".yaml", ".yml"}:
            continue
        text = path.read_text(encoding="utf-8")
        assert BATHROOM not in text
        assert README_SAMPLE not in text


def test_variant_d_has_original_demos_and_c_does_not() -> None:
    drafted = build_prompt("I burned the rice.", "linkedin", "motivational", variant="D")
    compact = build_prompt("I burned the rice.", "linkedin", "motivational", variant="C")
    basic = build_prompt("I burned the rice.", "linkedin", "motivational", variant="A")
    behavior = build_prompt("I burned the rice.", "linkedin", "motivational", variant="B")
    assert "leftover pizza" in drafted.system
    assert "Example 1 source:" in drafted.system
    assert "leftover pizza" not in compact.system
    assert "Example 1 source:" not in compact.system
    assert "leftover pizza" not in basic.system
    assert "leftover pizza" not in behavior.system
    assert drafted.prompt_id.startswith("linkedin.motivational.D.")


def test_missing_tone_defaults_to_motivational() -> None:
    built = build_prompt("I burned the rice.", "linkedin", None)
    assert built.linkedin_tone == "motivational"


def test_unknown_style_and_tone_are_rejected() -> None:
    with pytest.raises(UnknownStyleError):
        build_prompt("I burned the rice.", "not-a-style")
    with pytest.raises(UnknownStyleError):
        build_prompt("I burned the rice.", "linkedin", "sarcastic")


def test_non_linkedin_style_drops_the_tone() -> None:
    built = build_prompt("I burned the rice.", "chatgpt", "motivational")
    assert built.linkedin_tone is None
    assert built.user == "I burned the rice."
    assert "assistant" in built.system.lower()
    assert "leftover pizza" not in built.system


def test_each_linkedin_substyle_has_its_own_demos() -> None:
    catalog = load_catalog()
    linkedin = catalog.require_style("linkedin")
    for sub in linkedin.substyles:
        built = build_prompt("I burned the rice.", "linkedin", sub.id, variant="D")
        assert sub.demonstrations[0].source in built.system
        assert len(sub.demonstrations) >= 2


def test_public_style_contract() -> None:
    styles = public_styles()
    assert [item["id"] for item in styles] == [
        "linkedin",
        "chatgpt",
        "corporate",
        "hr",
        "brainrot",
        "tech_bro",
        "ceo",
        "academic",
    ]
    linkedin = styles[0]
    assert [item["id"] for item in linkedin["substyles"]] == [
        "motivational",
        "humble_brag",
        "thought_leader",
        "inspirational",
        "corporate",
    ]
    assert styles[1]["substyles"] is None
    assert styles[2]["id"] == "corporate"


def test_second_pass_is_off_and_still_buildable() -> None:
    catalog = load_catalog()
    assert catalog.second_pass_enabled is False
    assert scheduled_passes(False) == ("draft",)
    assert scheduled_passes(True) == ("draft", "second_pass")
    messages = second_pass_messages("I burned the rice.", "A proud post.")
    assert messages[0]["role"] == "system"
    assert "I burned the rice." in messages[1]["content"]
    assert "A proud post." in messages[1]["content"]
    assert BATHROOM not in messages[0]["content"]


def test_second_pass_flag_controls_how_many_generators_run() -> None:
    calls: list[str] = []

    def draft() -> str:
        calls.append("draft")
        return "draft text"

    def rewrite(text: str) -> str:
        calls.append(text)
        return "rewritten"

    assert run_passes(False, draft, rewrite) == "draft text"
    assert calls == ["draft"]
    assert run_passes(True, draft, rewrite) == "rewritten"
    assert calls == ["draft", "draft", "draft text"]


def test_sampling_defaults_match_the_qwen_card() -> None:
    sampling = load_catalog().sampling
    assert sampling.temperature == 0.7
    assert sampling.top_p == 0.8
    assert sampling.top_k == 20
    assert sampling.max_new_tokens == 180
    assert sampling.max_new_tokens_cap == 250
