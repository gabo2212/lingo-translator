"""Turn generated ids into the text the caller should see."""

from __future__ import annotations

import re
from collections.abc import Sequence

_SPECIAL_FRAGMENTS = (
    "<|im_end|>",
    "<|im_start|>",
    "<|endoftext|>",
    "<|im_start|>assistant",
    "<|im_start|>user",
    "<|im_start|>system",
)

# Labels a model sometimes adds even when told to output only the rewrite.
_PREFIXES = (
    "translation:",
    "linkedin post:",
    "rewritten:",
    "rewrite:",
    "output:",
    "post:",
    "here is the rewrite:",
    "here's the rewrite:",
    "here is the post:",
    "here's the post:",
)

_THINK_BLOCK = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


def slice_new_ids(generated_ids: Sequence[int], prompt_length: int) -> list[int]:
    """Keep only ids produced after the prompt. The prompt is not part of the answer."""
    if prompt_length < 0:
        raise ValueError("prompt_length must be >= 0")
    if prompt_length > len(generated_ids):
        raise ValueError("prompt_length exceeds the generated sequence")
    return [int(token_id) for token_id in generated_ids[prompt_length:]]


def decode_new_tokens(tokenizer: object, generated_row: object, prompt_length: int) -> str:
    """Decode the continuation only, with special tokens removed by the tokenizer."""
    if hasattr(generated_row, "tolist"):
        ids = generated_row.tolist()
    else:
        ids = list(generated_row)
    new_ids = slice_new_ids(ids, prompt_length)
    return tokenizer.decode(new_ids, skip_special_tokens=True)


def clean_generation(text: str) -> str:
    """Strip chat markers, a leaked think block, and a single leading label."""
    cleaned = text.replace("\r\n", "\n")
    cleaned = _THINK_BLOCK.sub("", cleaned)
    for fragment in _SPECIAL_FRAGMENTS:
        cleaned = cleaned.replace(fragment, "")
    cleaned = cleaned.strip()
    lowered = cleaned.lower()
    for prefix in _PREFIXES:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix) :].lstrip(" \n:-")
            break
    return cleaned.strip()
