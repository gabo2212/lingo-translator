"""New-token slicing and label cleanup. The prompt tokens are not part of the answer."""

from __future__ import annotations

import pytest

from backend.app.cleaning import clean_generation, decode_new_tokens, slice_new_ids


class FakeTokenizer:
    def __init__(self) -> None:
        self.skip_flags: list[bool] = []

    def decode(self, ids: list[int], skip_special_tokens: bool = True) -> str:
        self.skip_flags.append(skip_special_tokens)
        words = {1: "Hello", 2: " world", 3: "<|im_end|>", 4: " there"}
        parts: list[str] = []
        for token_id in ids:
            if skip_special_tokens and token_id == 3:
                continue
            parts.append(words[int(token_id)])
        return "".join(parts)


def test_slice_keeps_only_new_ids() -> None:
    assert slice_new_ids([1, 2, 4, 3], 2) == [4, 3]
    with pytest.raises(ValueError):
        slice_new_ids([1, 2], 3)


def test_decode_skips_the_prompt_and_special_tokens() -> None:
    tokenizer = FakeTokenizer()
    text = decode_new_tokens(tokenizer, [1, 2, 4, 3], prompt_length=2)
    assert text == " there"
    assert tokenizer.skip_flags == [True]
    assert "Hello" not in text


def test_clean_strips_markers_labels_and_think_blocks() -> None:
    raw = "<think>planning</think>\nTranslation: A finished session. <|im_end|>"
    assert clean_generation(raw) == "A finished session."


def test_clean_leaves_a_normal_post_alone() -> None:
    post = "I closed the loop at 2 a.m.\n#NightOperations"
    assert clean_generation(post) == post
