"""Explicit errors for validation, configuration, and the single GPU."""

from __future__ import annotations


class LingoError(Exception):
    """Base error for the translator."""


class ConfigError(LingoError):
    """styles.yaml is missing a field or contradicts itself."""


class InputError(LingoError):
    """The request body is present but not usable."""


class UnknownStyleError(LingoError):
    """The style id or LinkedIn tone id is not in the catalog."""


class BusyError(LingoError):
    """One generation is already using the GPU."""

    def __init__(self, message: str = "A generation is already running on the single GPU.") -> None:
        super().__init__(message)


class ModelNotReadyError(LingoError):
    """Weights are still loading or CUDA failed. There is no CPU demo path."""


class GenerationFailedError(LingoError):
    """model.generate raised. The message is the underlying error."""
