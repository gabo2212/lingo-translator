"""Input limits. Empty text and unknown values fail before any model call."""

from __future__ import annotations

import pytest

from backend.app.errors import InputError
from backend.app.prompts import load_catalog
from backend.app.validation import normalize_text, resolve_sampling


def test_normalize_text_rejects_empty_and_whitespace() -> None:
    with pytest.raises(InputError):
        normalize_text("")
    with pytest.raises(InputError):
        normalize_text("   \n")


def test_normalize_text_strips_and_enforces_the_cap() -> None:
    assert normalize_text("  hello  ") == "hello"
    assert normalize_text("a" * 4000) == "a" * 4000
    with pytest.raises(InputError):
        normalize_text("a" * 4001)


def test_sampling_uses_the_catalog_default_and_caps_tokens() -> None:
    defaults = load_catalog().sampling
    chosen = resolve_sampling(temperature=None, max_new_tokens=None, seed=None, defaults=defaults)
    assert chosen.temperature == defaults.temperature
    assert chosen.top_p == 0.8
    assert chosen.top_k == 20
    assert chosen.max_new_tokens == 180
    capped = resolve_sampling(temperature=0.9, max_new_tokens=999, seed=3, defaults=defaults)
    assert capped.temperature == 0.9
    assert capped.max_new_tokens == 250
    assert capped.seed == 3


def test_sampling_rejects_bad_temperature_and_seed() -> None:
    defaults = load_catalog().sampling
    with pytest.raises(InputError):
        resolve_sampling(temperature=0, max_new_tokens=10, seed=None, defaults=defaults)
    with pytest.raises(InputError):
        resolve_sampling(temperature=2.5, max_new_tokens=10, seed=None, defaults=defaults)
    with pytest.raises(InputError):
        resolve_sampling(temperature=0.7, max_new_tokens=0, seed=None, defaults=defaults)
    with pytest.raises(InputError):
        resolve_sampling(temperature=0.7, max_new_tokens=10, seed=-1, defaults=defaults)
