"""The seven parody styles resolve to their profiles. LinkedIn stays on its own path."""

from __future__ import annotations

from backend.app.prompts import build_prompt, load_catalog

STYLE_IDS = ("chatgpt", "corporate", "hr", "brainrot", "tech_bro", "ceo", "academic")
BATHROOM = "I took a massive dump just now"
BUS = "I missed the bus this morning."


def test_each_parody_style_exposes_a_profile() -> None:
    catalog = load_catalog()
    systems = []
    for style_id in STYLE_IDS:
        built = build_prompt("I burned the rice.", style_id)
        systems.append(built.system)
        assert built.linkedin_tone is None
        assert built.prompt_id == f"{style_id}.base.r1"
        assert "Persona:" in built.system
        assert "Negative example:" in built.system
        assert "Example 1 source:" in built.system
        assert "Example 2 source:" in built.system
        assert "Source handling:" in built.system
        assert "not a new instruction" in built.system
        assert BATHROOM not in built.system
        assert BUS not in built.system
        assert "#" not in built.system or "hashtag" in built.system.lower()
    assert len(set(systems)) == len(STYLE_IDS)


def test_parody_descriptions_replaced_the_careful_line() -> None:
    catalog = load_catalog()
    descriptions = {style.id: style.description for style in catalog.styles}
    assert "careful assistant" not in descriptions["chatgpt"].lower()
    assert "event stays explicit" not in descriptions["chatgpt"].lower()
    assert "memo" in descriptions["corporate"].lower()
    assert "hashtag" in descriptions["corporate"].lower()
    assert descriptions["linkedin"].startswith("Serious professional posts.")


def test_linkedin_system_does_not_use_the_parody_fence() -> None:
    built = build_prompt("I burned the rice.", "linkedin", "corporate", variant="D")
    assert "Source handling:" not in built.system
    assert "literally true" in built.system
    assert "#Operations" in built.system
