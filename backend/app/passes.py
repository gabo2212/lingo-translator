"""Optional second rewrite. The flag exists so the path is real and defaults off."""

from __future__ import annotations

from collections.abc import Callable


def scheduled_passes(second_pass: bool) -> tuple[str, ...]:
    if second_pass:
        return ("draft", "second_pass")
    return ("draft",)


def run_passes(
    second_pass: bool,
    draft_fn: Callable[[], str],
    rewrite_fn: Callable[[str], str],
) -> str:
    """Call the draft generator once. Call the rewriter only when the flag is on."""
    draft = draft_fn()
    if not second_pass:
        return draft
    return rewrite_fn(draft)
