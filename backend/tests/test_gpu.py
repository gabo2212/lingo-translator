"""One real CUDA generation. Run with: pytest -m gpu

Unit tests skip this mark. It loads the resident model and checks that a second
call does not load the weights again.
"""

from __future__ import annotations

import pytest

from backend.app.prompts import build_prompt
from backend.app.schemas import TranslateJob

pytestmark = pytest.mark.gpu


def test_cuda_generate_reuses_the_same_weights() -> None:
    import torch

    from backend.app.inference import InferenceService

    assert torch.cuda.is_available(), "CUDA is not available; the demo does not fall back to CPU."
    service = InferenceService()
    service.load()
    assert service.status == "ready"
    assert service.load_count == 1
    assert service.device == "cuda"
    resident = service.model
    service.load()
    assert service.load_count == 1
    assert service.model is resident

    built = build_prompt("I burned the rice.", "chatgpt")
    rendered = service.tokenizer.apply_chat_template(
        list(built.messages),
        tokenize=False,
        add_generation_prompt=True,
    )
    assert "I burned the rice." in rendered
    assert "massive dump" not in rendered

    job = TranslateJob(
        text="I burned the rice.",
        style="chatgpt",
        max_new_tokens=32,
        temperature=0.7,
        seed=1,
    )
    first = service.translate(job)
    second = service.translate(job)
    assert first.translation.strip()
    assert second.translation.strip()
    assert service.model is resident
    assert service.load_count == 1
    print("GPU_TRANSLATION_1", first.translation)
    print("GPU_TRANSLATION_2", second.translation)
