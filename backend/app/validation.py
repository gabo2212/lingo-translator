"""Sampling bounds and the text-length rule shared by the API and the benchmark."""

from __future__ import annotations

from dataclasses import dataclass

from backend.app.errors import InputError

TEXT_MIN_CHARS = 1
TEXT_MAX_CHARS = 4000
TEMPERATURE_MAX = 2.0
SEED_MAX = 2_147_483_647


@dataclass(frozen=True)
class SamplingDefaults:
    temperature: float
    top_p: float
    top_k: int
    max_new_tokens: int
    max_new_tokens_cap: int
    timeout_seconds: float


@dataclass(frozen=True)
class Sampling:
    temperature: float
    top_p: float
    top_k: int
    max_new_tokens: int
    seed: int | None


def normalize_text(text: str) -> str:
    if text is None or not str(text).strip():
        raise InputError("text must not be empty")
    if len(text) > TEXT_MAX_CHARS:
        raise InputError(f"text must be at most {TEXT_MAX_CHARS} characters")
    stripped = str(text).strip()
    if len(stripped) < TEXT_MIN_CHARS:
        raise InputError("text must not be empty")
    return stripped


def resolve_sampling(
    *,
    temperature: float | None,
    max_new_tokens: int | None,
    seed: int | None,
    defaults: SamplingDefaults,
) -> Sampling:
    """Fill official Qwen defaults. Cap a caller's token budget; do not raise it."""
    chosen_temperature = defaults.temperature if temperature is None else float(temperature)
    if not 0 < chosen_temperature <= TEMPERATURE_MAX:
        raise InputError(f"temperature must be greater than 0 and at most {TEMPERATURE_MAX}")
    if max_new_tokens is None:
        chosen_tokens = defaults.max_new_tokens
    else:
        if int(max_new_tokens) < 1:
            raise InputError("max_new_tokens must be at least 1")
        chosen_tokens = min(int(max_new_tokens), defaults.max_new_tokens_cap)
    chosen_seed: int | None
    if seed is None:
        chosen_seed = None
    else:
        chosen_seed = int(seed)
        if chosen_seed < 0 or chosen_seed > SEED_MAX:
            raise InputError(f"seed must be between 0 and {SEED_MAX}")
    return Sampling(
        temperature=chosen_temperature,
        top_p=defaults.top_p,
        top_k=defaults.top_k,
        max_new_tokens=chosen_tokens,
        seed=chosen_seed,
    )
