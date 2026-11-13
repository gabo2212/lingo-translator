"""Call the already-loaded local API. Does not load a second model."""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.metrics import numeric_fact_retention
from backend.app.prompts import build_prompt
INPUTS = ROOT / "benchmarks" / "lingo_upgrade_inputs.json"
STYLES = ("chatgpt", "corporate", "hr", "brainrot", "tech_bro", "ceo", "academic")


def _post(url: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", required=True)
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/translate")
    parser.add_argument("--styles", nargs="*", default=list(STYLES))
    parser.add_argument("--ids", nargs="*", default=None)
    parser.add_argument("--temperature", type=float, default=None)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args()
    spec = json.loads(INPUTS.read_text(encoding="utf-8"))
    temperature = spec["temperature"] if args.temperature is None else args.temperature
    seed = spec["seed"] if args.seed is None else args.seed
    wanted = set(args.ids) if args.ids else None
    sentences = [row for row in spec["sentences"] if wanted is None or row["id"] in wanted]
    out = args.out or (ROOT / "benchmarks" / "results" / f"lingo_upgrade_{args.phase}.json")
    rows: list[dict] = []
    if out.exists():
        prior = json.loads(out.read_text(encoding="utf-8"))
        rows = list(prior.get("rows") or [])
    done = {(row["id"], row["style"], row["temperature"]) for row in rows}
    started = time.perf_counter()
    for sentence in sentences:
        for style in args.styles:
            key = (sentence["id"], style, temperature)
            if key in done:
                continue
            payload = {
                "text": sentence["text"],
                "style": style,
                "temperature": temperature,
                "seed": seed,
                "max_new_tokens": 180,
            }
            attempt = 0
            while True:
                attempt += 1
                try:
                    body = _post(args.url, payload)
                    break
                except urllib.error.HTTPError as exc:
                    if exc.code == 429 and attempt < 6:
                        time.sleep(1.5)
                        continue
                    detail = exc.read().decode("utf-8", errors="replace")
                    raise SystemExit(f"{sentence['id']} {style} HTTP {exc.code}: {detail}") from exc
            built = build_prompt(sentence["text"], style)
            numbers = numeric_fact_retention(sentence["text"], body["translation"])
            rows.append(
                {
                    "id": sentence["id"],
                    "split": sentence["split"],
                    "tags": sentence["tags"],
                    "source": sentence["text"],
                    "style": style,
                    "temperature": temperature,
                    "seed": seed,
                    "translation": body["translation"],
                    "elapsed_ms": body["elapsed_ms"],
                    "prompt_id": body["prompt_id"],
                    "model": body["model"],
                    "non_empty": bool(str(body["translation"]).strip()),
                    "digit_ratio": numbers["ratio"],
                    "digit_missing": numbers["missing"],
                    "system_sha256_prefix": _prefix(built.system),
                }
            )
            done.add(key)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(
                json.dumps(
                    {
                        "phase": args.phase,
                        "model": body["model"],
                        "temperature": temperature,
                        "seed": seed,
                        "rows": rows,
                    },
                    indent=2,
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            print(
                f"{sentence['id']} {style} {body['elapsed_ms']}ms digits={numbers['ratio']:.2f} chars={len(body['translation'])}",
                flush=True,
            )
    elapsed = time.perf_counter() - started
    print(f"wrote {out} rows={len(rows)} wall_s={elapsed:.1f}", flush=True)


def _prefix(text: str) -> str:
    import hashlib

    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


if __name__ == "__main__":
    main()
