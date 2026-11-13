"""HTTP body and the internal job. variant is not part of the public contract."""

from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.app.errors import InputError
from backend.app.validation import (
    SEED_MAX,
    TEMPERATURE_MAX,
    TEXT_MAX_CHARS,
    normalize_text,
)


class TranslateIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text: str
    style: str
    linkedin_tone: str | None = None
    temperature: float | None = None
    max_new_tokens: int | None = None
    seed: int | None = None

    @field_validator("text")
    @classmethod
    def text_must_be_usable(cls, value: str) -> str:
        try:
            return normalize_text(value)
        except InputError as exc:
            raise ValueError(str(exc)) from exc

    @field_validator("style")
    @classmethod
    def style_must_be_present(cls, value: str) -> str:
        stripped = str(value).strip()
        if not stripped:
            raise ValueError("style is required")
        return stripped

    @field_validator("linkedin_tone")
    @classmethod
    def blank_tone_is_absent(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = str(value).strip()
        return stripped or None

    @field_validator("temperature")
    @classmethod
    def temperature_bounds(cls, value: float | None) -> float | None:
        if value is None:
            return None
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("temperature must be a number")
        number = float(value)
        if not 0 < number <= TEMPERATURE_MAX:
            raise ValueError(f"temperature must be greater than 0 and at most {TEMPERATURE_MAX}")
        return number

    @field_validator("max_new_tokens")
    @classmethod
    def token_budget_is_positive(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if isinstance(value, bool) or int(value) < 1:
            raise ValueError("max_new_tokens must be at least 1")
        return int(value)

    @field_validator("seed")
    @classmethod
    def seed_bounds(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if isinstance(value, bool) or int(value) < 0 or int(value) > SEED_MAX:
            raise ValueError(f"seed must be between 0 and {SEED_MAX}")
        return int(value)


class TranslateOut(BaseModel):
    translation: str
    style: str
    linkedin_tone: str | None
    model: str
    device: str
    elapsed_ms: int
    prompt_id: str


class HealthOut(BaseModel):
    status: str = Field(pattern="^(loading|ready|error)$")
    model: str
    device: str
    gpu_name: str | None
    dtype: str
    detail: str | None


class HostOut(BaseModel):
    role: str
    model: str
    device: str


class SubstyleOut(BaseModel):
    id: str
    label: str


class StyleOut(BaseModel):
    id: str
    label: str
    description: str
    substyles: list[SubstyleOut] | None


class StylesOut(BaseModel):
    styles: list[StyleOut]


@dataclass(frozen=True)
class TranslateJob:
    text: str
    style: str
    linkedin_tone: str | None = None
    temperature: float | None = None
    max_new_tokens: int | None = None
    seed: int | None = None
    variant: str | None = None


def assert_text_length(text: str) -> None:
    """Re-check the public limit. Field validators already ran for HTTP calls."""
    if len(text) > TEXT_MAX_CHARS:
        raise InputError(f"text must be at most {TEXT_MAX_CHARS} characters")
