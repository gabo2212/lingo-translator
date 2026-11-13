"""The bathroom sentence is a dev fixture. It is not a test item and not a prompt."""

from __future__ import annotations

import json
from pathlib import Path

from backend.app.prompts import load_catalog

ROOT = Path(__file__).resolve().parents[2]
BATHROOM = "I took a massive dump just now"
REQUIRED_TAGS = {
    "daily",
    "mundane",
    "embarrassing",
    "ridiculous",
    "slang",
    "professional",
    "short",
    "long",
    "numbers",
}


def _load(name: str) -> dict:
    return json.loads((ROOT / "benchmarks" / name).read_text(encoding="utf-8"))


def test_splits_and_the_golden_sentence() -> None:
    dev = _load("dev_sentences.json")
    test = _load("test_sentences.json")
    dev_texts = [item["text"] for item in dev["sentences"]]
    test_texts = [item["text"] for item in test["sentences"]]
    assert dev_texts.count(BATHROOM) == 1
    assert BATHROOM not in test_texts
    assert len(test_texts) >= 30
    assert len(dev_texts) >= 8
    assert set(dev_texts).isdisjoint(test_texts)


def test_test_set_covers_the_requested_kinds() -> None:
    test = _load("test_sentences.json")
    found: set[str] = set()
    for item in test["sentences"]:
        found.update(item["tags"])
    assert REQUIRED_TAGS <= found


def test_demos_are_not_copied_into_the_splits() -> None:
    dev = _load("dev_sentences.json")
    test = _load("test_sentences.json")
    used = {item["text"] for item in dev["sentences"]} | {item["text"] for item in test["sentences"]}
    linkedin = load_catalog().require_style("linkedin")
    demos = {demo.source for sub in linkedin.substyles for demo in sub.demonstrations}
    assert demos.isdisjoint(used)
    assert BATHROOM not in demos
