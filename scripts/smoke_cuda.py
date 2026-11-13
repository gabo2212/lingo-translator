# Print CUDA facts and one short generation from the real local model.
# Run from the repo root: .\.venv\Scripts\python.exe scripts\smoke_cuda.py

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault("HF_HOME", str(Path.home() / ".cache" / "huggingface"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")


def main() -> int:
    import torch

    from backend.app.inference import InferenceService
    from backend.app.schemas import TranslateJob

    print("torch", torch.__version__)
    print("cuda_build", torch.version.cuda)
    print("cuda_available", torch.cuda.is_available())
    if not torch.cuda.is_available():
        print("SMOKE_FAIL CUDA is not available. Refusing a CPU fallback.")
        return 1
    print("device_name", torch.cuda.get_device_name(0))
    print("capability", torch.cuda.get_device_capability(0))
    print("arch_list", torch.cuda.get_arch_list())
    probe = torch.ones((2, 2), device="cuda", dtype=torch.bfloat16)
    product = probe @ probe
    print("bf16_matmul", product.detach().float().cpu().tolist())
    print("allocated_before_load_bytes", torch.cuda.memory_allocated())

    service = InferenceService()
    service.load()
    allocated_mib = torch.cuda.memory_allocated() / (1024 * 1024)
    print("status", service.status)
    print("gpu_name", service.gpu_name)
    print("dtype", service.dtype)
    print("load_count", service.load_count)
    print("allocated_after_load_mib", round(allocated_mib, 1))

    # Dev reference sentence. It is the user turn only; it is not baked into the style prompt.
    job = TranslateJob(
        text="I took a massive dump just now",
        style="linkedin",
        linkedin_tone="motivational",
        temperature=0.7,
        max_new_tokens=180,
        seed=13,
    )
    torch.cuda.reset_peak_memory_stats()
    result = service.translate(job)
    print("prompt_id", result.prompt_id)
    print("elapsed_ms", result.elapsed_ms)
    print("peak_mib", round(torch.cuda.max_memory_allocated() / (1024 * 1024), 1))
    print("TRANSLATION_START")
    print(result.translation)
    print("TRANSLATION_END")
    if not result.translation.strip():
        print("SMOKE_FAIL empty generation")
        return 1
    print("SMOKE_OK")
    return 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    raise SystemExit(main())
