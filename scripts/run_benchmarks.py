# Compare prompt variants on the dev split, then run the frozen prompt on other styles and the test split.
# From the repo root:
#   .\.venv\Scripts\python.exe scripts\run_benchmarks.py --phase dev
#   .\.venv\Scripts\python.exe scripts\run_benchmarks.py --phase final

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("HF_HOME", str(Path.home() / ".cache" / "huggingface"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

RESULTS = ROOT / "benchmarks" / "results"
SEED = 13
DEV_TEMPERATURES = (0.7, 0.9, 1.1)
HUMAN_SCORES = {"meaning": None, "style_fidelity": None, "metaphorical_humor": None}


def _load(name: str) -> dict:
    return json.loads((ROOT / "benchmarks" / name).read_text(encoding="utf-8"))


def _median(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


def _mean(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def _summary(rows: list[dict]) -> dict:
    ok = [row for row in rows if not row.get("error")]
    numbered = [row for row in ok if row["fact_retention"]["total"] > 0]
    latencies = [row["elapsed_s"] for row in ok]
    return {
        "n": len(ok),
        "errors": len(rows) - len(ok),
        "mean_latency_s": _mean(latencies),
        "median_latency_s": _median(latencies),
        "max_latency_s": max(latencies) if latencies else None,
        "mean_fact_retention_all": _mean([row["fact_retention"]["ratio"] for row in ok]),
        "mean_fact_retention_numbered": _mean([row["fact_retention"]["ratio"] for row in numbered]),
        "numbered_rows": len(numbered),
        "numbered_rows_with_a_miss": sum(1 for row in numbered if row["fact_retention"]["missing"]),
        "mean_peak_mib": _mean([row["peak_memory_mib"] for row in ok]),
    }


def _write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {path}")


def _by_key(rows: list[dict], key: str) -> dict[str, dict]:
    grouped: dict[str, list[dict]] = {}
    for row in rows:
        grouped.setdefault(str(row.get(key)), []).append(row)
    return {name: _summary(group) for name, group in grouped.items()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=("dev", "confirm", "final"), required=True)
    args = parser.parse_args()

    import torch

    from backend.app.inference import InferenceService
    from backend.app.metrics import numeric_fact_retention
    from backend.app.prompts import build_prompt, load_catalog
    from backend.app.schemas import TranslateJob

    if not torch.cuda.is_available():
        print("CUDA is not available. Benchmarks were not invented.")
        return 1

    catalog = load_catalog()
    service = InferenceService()
    started = time.perf_counter()
    service.load()
    load_s = time.perf_counter() - started
    header = {
        "model": service.model_id,
        "torch": torch.__version__,
        "cuda_build": torch.version.cuda,
        "gpu_name": service.gpu_name,
        "capability": list(torch.cuda.get_device_capability(0)),
        "dtype": service.dtype,
        "load_count": service.load_count,
        "load_seconds": round(load_s, 3),
        "allocated_after_load_mib": round(torch.cuda.memory_allocated() / (1024 * 1024), 1),
        "seed": SEED,
        "top_p": catalog.sampling.top_p,
        "top_k": catalog.sampling.top_k,
        "max_new_tokens": catalog.sampling.max_new_tokens,
        "production_variant": catalog.production_variant,
        "prompt_revision": catalog.prompt_revision,
        "default_temperature": catalog.sampling.temperature,
        "second_pass": catalog.second_pass_enabled,
        "human_score_legend": (
            "meaning, style_fidelity, and metaphorical_humor are 1-5 human scores. "
            "They are left null on purpose. Do not fill them in without a person scoring the text."
        ),
    }
    print(
        f"loaded {service.gpu_name} in {load_s:.1f}s, "
        f"weights {header['allocated_after_load_mib']} MiB, load_count={service.load_count}"
    )

    if args.phase == "dev":
        return _phase_dev(service, catalog, header, torch)
    if args.phase == "confirm":
        return _phase_confirm(service, catalog, header, torch)
    return _phase_final(service, catalog, header, torch)


def _run_one(service, torch_module, job, source: str, temperature: float, variant: str | None) -> dict:
    from backend.app.metrics import numeric_fact_retention

    torch_module.cuda.reset_peak_memory_stats()
    try:
        result = service.translate(job)
    except Exception as exc:
        return {
            "source": source,
            "style": job.style,
            "linkedin_tone": job.linkedin_tone,
            "variant": variant,
            "temperature": temperature,
            "seed": job.seed,
            "error": str(exc),
            "translation": "",
            "elapsed_s": None,
            "peak_memory_mib": None,
            "fact_retention": numeric_fact_retention(source, ""),
            "human_scores": dict(HUMAN_SCORES),
            "prompt_id": None,
        }
    return {
        "source": source,
        "style": result.style,
        "linkedin_tone": result.linkedin_tone,
        "variant": variant,
        "temperature": temperature,
        "seed": job.seed,
        "error": None,
        "translation": result.translation,
        "elapsed_s": round(result.elapsed_ms / 1000, 3),
        "peak_memory_mib": round(torch_module.cuda.max_memory_allocated() / (1024 * 1024), 1),
        "fact_retention": numeric_fact_retention(source, result.translation),
        "human_scores": dict(HUMAN_SCORES),
        "prompt_id": result.prompt_id,
    }


def _phase_dev(service, catalog, header, torch_module) -> int:
    from backend.app.prompts import build_prompt
    from backend.app.schemas import TranslateJob

    dev = _load("dev_sentences.json")["sentences"]
    prompts = {}
    for variant in ("A", "B", "C", "D"):
        prompts[variant] = build_prompt(dev[0]["text"], "linkedin", "motivational", variant).system
    rows: list[dict] = []
    for variant in ("A", "B", "C", "D"):
        for sentence in dev:
            job = TranslateJob(
                text=sentence["text"],
                style="linkedin",
                linkedin_tone="motivational",
                temperature=0.7,
                max_new_tokens=catalog.sampling.max_new_tokens,
                seed=SEED,
                variant=variant,
            )
            row = _run_one(service, torch_module, job, sentence["text"], 0.7, variant)
            row["id"] = sentence["id"]
            rows.append(row)
            print(f"dev {sentence['id']} {variant} {row['elapsed_s']}s miss={row['fact_retention']['missing']}")
    temperature_rows: list[dict] = []
    # 0.7 for variant D is already in `rows`. Extra temperatures are a smaller slice.
    subset = dev[:4]
    for temperature in (0.9, 1.1):
        for sentence in subset:
            job = TranslateJob(
                text=sentence["text"],
                style="linkedin",
                linkedin_tone="motivational",
                temperature=temperature,
                max_new_tokens=catalog.sampling.max_new_tokens,
                seed=SEED,
                variant="D",
            )
            row = _run_one(service, torch_module, job, sentence["text"], temperature, "D")
            row["id"] = sentence["id"]
            temperature_rows.append(row)
            print(f"temp {sentence['id']} D t={temperature} {row['elapsed_s']}s")
    reused = [row for row in rows if row["variant"] == "D" and row["id"] in {item["id"] for item in subset}]
    _write(
        RESULTS / "dev_variants.json",
        {
            **header,
            "phase": "dev_variants",
            "temperature": 0.7,
            "style": "linkedin",
            "linkedin_tone": "motivational",
            "system_prompts": prompts,
            "summary_overall": _summary(rows),
            "summary_by_variant": _by_key(rows, "variant"),
            "rows": rows,
        },
    )
    _write(
        RESULTS / "dev_temperature.json",
        {
            **header,
            "phase": "dev_temperature",
            "variant": "D",
            "style": "linkedin",
            "linkedin_tone": "motivational",
            "note": "Temperature 0.7 rows are the variant D rows from dev_variants.json. 0.9 and 1.1 were generated here on the first four dev sentences, same seed.",
            "summary_by_temperature": _by_key(reused + temperature_rows, "temperature"),
            "rows_0_7_reused_ids": [row["id"] for row in reused],
            "rows": temperature_rows,
        },
    )
    return 0 if all(not row.get("error") for row in rows + temperature_rows) else 1


def _phase_confirm(service, catalog, header, torch_module) -> int:
    """Re-run the dev split on the production prompt after a yaml edit."""
    from backend.app.schemas import TranslateJob

    dev = _load("dev_sentences.json")["sentences"]
    temperature = catalog.sampling.temperature
    rows: list[dict] = []
    for sentence in dev:
        job = TranslateJob(
            text=sentence["text"],
            style="linkedin",
            linkedin_tone="motivational",
            temperature=temperature,
            max_new_tokens=catalog.sampling.max_new_tokens,
            seed=SEED,
            variant=None,
        )
        row = _run_one(
            service,
            torch_module,
            job,
            sentence["text"],
            temperature,
            catalog.production_variant,
        )
        row["id"] = sentence["id"]
        rows.append(row)
        print(f"confirm {sentence['id']} {row['elapsed_s']}s miss={row['fact_retention']['missing']}")
    _write(
        RESULTS / "dev_refined.json",
        {
            **header,
            "phase": "dev_refined",
            "temperature": temperature,
            "style": "linkedin",
            "linkedin_tone": "motivational",
            "note": "Production prompt after the dev-set prompt edit. The A/B/C/D comparison in dev_variants.json was revision r1 and is not overwritten.",
            "summary": _summary(rows),
            "rows": rows,
        },
    )
    return 0 if all(not row.get("error") for row in rows) else 1


def _phase_final(service, catalog, header, torch_module) -> int:
    from backend.app.schemas import TranslateJob

    test = _load("test_sentences.json")
    by_id = {item["id"]: item for item in test["sentences"]}
    spot = test["spotcheck"]
    temperature = catalog.sampling.temperature
    style_rows: list[dict] = []

    def run_style(style: str, tone: str | None, sentence_ids: list[str]) -> None:
        for sentence_id in sentence_ids:
            sentence = by_id[sentence_id]
            job = TranslateJob(
                text=sentence["text"],
                style=style,
                linkedin_tone=tone,
                temperature=temperature,
                max_new_tokens=catalog.sampling.max_new_tokens,
                seed=SEED,
                variant=None,
            )
            row = _run_one(service, torch_module, job, sentence["text"], temperature, catalog.production_variant if style == "linkedin" else "base")
            row["id"] = sentence_id
            style_rows.append(row)
            print(f"style {style} {tone or '-'} {sentence_id} {row['elapsed_s']}s")

    for style in ("chatgpt", "corporate", "hr", "brainrot"):
        run_style(style, None, spot["register_styles"])
    for tone in ("humble_brag", "thought_leader", "inspirational", "corporate"):
        run_style("linkedin", tone, spot["other_linkedin"])
    for style in ("tech_bro", "ceo", "academic"):
        run_style(style, None, spot["optional_styles"])

    test_rows: list[dict] = []
    for sentence in test["sentences"]:
        job = TranslateJob(
            text=sentence["text"],
            style="linkedin",
            linkedin_tone="motivational",
            temperature=temperature,
            max_new_tokens=catalog.sampling.max_new_tokens,
            seed=SEED,
            variant=None,
        )
        row = _run_one(
            service,
            torch_module,
            job,
            sentence["text"],
            temperature,
            catalog.production_variant,
        )
        row["id"] = sentence["id"]
        row["tags"] = sentence["tags"]
        test_rows.append(row)
        print(f"test {sentence['id']} {row['elapsed_s']}s miss={row['fact_retention']['missing']}")

    _write(
        RESULTS / "final_styles.json",
        {
            **header,
            "phase": "final_styles",
            "temperature": temperature,
            "summary_by_style": _by_key(style_rows, "style"),
            "rows": style_rows,
        },
    )
    _write(
        RESULTS / "final_testset.json",
        {
            **header,
            "phase": "final_testset",
            "temperature": temperature,
            "style": "linkedin",
            "linkedin_tone": "motivational",
            "summary": _summary(test_rows),
            "rows": test_rows,
        },
    )
    failed = [row for row in style_rows + test_rows if row.get("error")]
    return 1 if failed else 0


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    raise SystemExit(main())
